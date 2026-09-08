import { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import {
  getDbConnection,
  circles,
  circleMembers,
  circleInvitations,
  users,
} from '@festy/db';
import {
  CreateCircleSchema,
  CreateInvitationSchema,
  AcceptInvitationSchema,
} from '@festy/shared';

export const circleRoutes: FastifyPluginAsync = async (fastify) => {
  const db = getDbConnection();

  // ---------------------------------------------------------------------------
  // LISTAR MIS CÍRCULOS
  // ---------------------------------------------------------------------------
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;

    const userCircles = await db
      .select({
        id: circles.id,
        name: circles.name,
        role: circleMembers.role,
        joinedAt: circleMembers.joinedAt,
        createdAt: circles.createdAt,
      })
      .from(circleMembers)
      .innerJoin(circles, eq(circles.id, circleMembers.circleId))
      .where(and(eq(circleMembers.userId, userId), sql`${circles.deletedAt} IS NULL`));

    return reply.send({ circles: userCircles });
  });

  // ---------------------------------------------------------------------------
  // CREAR CÍRCULO
  // ---------------------------------------------------------------------------
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parseResult = CreateCircleSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const userId = request.user.id;
    const circleId = crypto.randomUUID();
    const { name } = parseResult.data;

    await db.transaction(async (tx) => {
      // 1. Crear Círculo
      await tx.insert(circles).values({
        id: circleId,
        name,
        createdBy: userId,
      });

      // 2. Asignar al creador como 'owner'
      await tx.insert(circleMembers).values({
        id: crypto.randomUUID(),
        circleId,
        userId,
        role: 'owner',
      });
    });

    return reply.status(201).send({
      message: 'Círculo creado exitosamente',
      circle: { id: circleId, name, role: 'owner' },
    });
  });

  // ---------------------------------------------------------------------------
  // GENERAR INVITACIÓN (URL SEGURA CON TOKEN O CÓDIGO CORTO)
  // ---------------------------------------------------------------------------
  fastify.post('/:id/invitations', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: circleId } = request.params as { id: string };
    const userId = request.user.id;

    // Verificar que el usuario sea admin u owner
    const membership = await db.query.circleMembers.findFirst({
      where: and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)),
    });

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Se requieren permisos de administrador' });
    }

    const parseResult = CreateInvitationSchema.safeParse({ ...request.body as object, circleId });
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { inviteType, inviteeEmail, role, maxUses, expiresInDays } = parseResult.data;

    // 1. Generar token criptográfico para link
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 2. Generar código corto de tipeo manual: ej. FESTY-8K92
    const shortRandom = crypto.randomBytes(4).toString('hex').toUpperCase();
    const inviteCode = `FESTY-${shortRandom}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitationId = crypto.randomUUID();

    await db.insert(circleInvitations).values({
      id: invitationId,
      circleId,
      invitedBy: userId,
      inviteType,
      inviteeEmail: inviteeEmail || null,
      inviteCode,
      tokenHash,
      role,
      maxUses,
      usesCount: 0,
      expiresAt,
      status: 'active',
    });

    return reply.status(201).send({
      message: 'Invitación creada exitosamente',
      invitation: {
        id: invitationId,
        inviteCode,
        joinUrl: `https://festy.app/join?token=${rawToken}`,
        role,
        maxUses,
        expiresAt,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // ACEPTAR INVITACIÓN (POR LINK TOKEN O CÓDIGO CORTO)
  // ---------------------------------------------------------------------------
  fastify.post('/invitations/accept', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parseResult = AcceptInvitationSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { token, code } = parseResult.data;
    const userId = request.user.id;

    if (!token && !code) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Debes proporcionar un token o un código' });
    }

    let invitation;
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      invitation = await db.query.circleInvitations.findFirst({
        where: eq(circleInvitations.tokenHash, tokenHash),
      });
    } else if (code) {
      invitation = await db.query.circleInvitations.findFirst({
        where: eq(circleInvitations.inviteCode, code.trim().toUpperCase()),
      });
    }

    if (!invitation) {
      return reply.status(404).send({ error: 'Not Found', message: 'Invitación no encontrada' });
    }

    if (invitation.status !== 'active' || invitation.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Invalid Invitation', message: 'Esta invitación ya expiró o no está activa' });
    }

    if (invitation.usesCount >= invitation.maxUses) {
      return reply.status(400).send({ error: 'Exhausted', message: 'Esta invitación ha alcanzado su límite de usos' });
    }

    // Verificar si ya es miembro
    const existingMember = await db.query.circleMembers.findFirst({
      where: and(eq(circleMembers.circleId, invitation.circleId), eq(circleMembers.userId, userId)),
    });

    if (existingMember) {
      return reply.status(409).send({ error: 'Conflict', message: 'Ya eres miembro de este círculo' });
    }

    // Ejecutar alta de membresía y actualización de cupos atómicamente
    await db.transaction(async (tx) => {
      await tx.insert(circleMembers).values({
        id: crypto.randomUUID(),
        circleId: invitation.circleId,
        userId,
        role: invitation.role,
      });

      const nextUsesCount = invitation.usesCount + 1;
      const nextStatus = nextUsesCount >= invitation.maxUses ? 'exhausted' : 'active';

      await tx
        .update(circleInvitations)
        .set({
          usesCount: nextUsesCount,
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(circleInvitations.id, invitation.id));
    });

    return reply.send({
      message: 'Te has unido exitosamente al círculo',
      circleId: invitation.circleId,
      role: invitation.role,
    });
  });
};
