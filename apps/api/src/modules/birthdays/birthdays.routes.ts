import { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { eq, and, sql, inArray } from 'drizzle-orm';
import {
  getDbConnection,
  birthdays,
  circles,
  circleMembers,
  birthdayClaimRequests,
  users,
} from '@festy/db';
import {
  CreateBirthdaySchema,
  ClaimBirthdaySchema,
  ReviewClaimSchema,
} from '@festy/shared';

export const birthdayRoutes: FastifyPluginAsync = async (fastify) => {
  const db = getDbConnection();

  // ---------------------------------------------------------------------------
  // FEED GLOBAL: TODOS LOS CUMPLEAÑOS DE LOS CÍRCULOS DEL USUARIO
  // ---------------------------------------------------------------------------
  fastify.get('/feed', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;

    const userCircles = await db
      .select({
        circleId: circleMembers.circleId,
        circleName: circles.name,
      })
      .from(circleMembers)
      .innerJoin(circles, eq(circles.id, circleMembers.circleId))
      .where(and(eq(circleMembers.userId, userId), sql`${circles.deletedAt} IS NULL`));

    if (userCircles.length === 0) {
      return reply.send({ birthdays: [] });
    }

    const circleIds = userCircles.map((c) => c.circleId);
    const circleMap = new Map(userCircles.map((c) => [c.circleId, c.circleName]));

    const allBirthdays = await db
      .select({
        id: birthdays.id,
        circleId: birthdays.circleId,
        fullName: birthdays.fullName,
        contactEmail: birthdays.contactEmail,
        birthDay: birthdays.birthDay,
        birthMonth: birthdays.birthMonth,
        birthYear: birthdays.birthYear,
        isMinor: birthdays.isMinor,
        isClaimed: birthdays.isClaimed,
        linkedUserId: birthdays.linkedUserId,
        notes: birthdays.notes,
        createdAt: birthdays.createdAt,
      })
      .from(birthdays)
      .where(and(inArray(birthdays.circleId, circleIds), sql`${birthdays.deletedAt} IS NULL`))
      .orderBy(birthdays.birthMonth, birthdays.birthDay);

    const enriched = allBirthdays.map((b) => ({
      ...b,
      circleName: circleMap.get(b.circleId) || 'Círculo',
    }));

    return reply.send({ birthdays: enriched });
  });

  // ---------------------------------------------------------------------------
  // LISTAR CUMPLEAÑOS DE UN CÍRCULO ESPECÍFICO
  // ---------------------------------------------------------------------------
  fastify.get('/circle/:circleId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { circleId } = request.params as { circleId: string };
    const userId = request.user.id;

    // Validar membresía
    const membership = await db.query.circleMembers.findFirst({
      where: and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)),
    });

    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'No perteneces a este círculo' });
    }

    const circleBirthdays = await db
      .select({
        id: birthdays.id,
        circleId: birthdays.circleId,
        fullName: birthdays.fullName,
        contactEmail: birthdays.contactEmail,
        birthDay: birthdays.birthDay,
        birthMonth: birthdays.birthMonth,
        birthYear: birthdays.birthYear,
        isMinor: birthdays.isMinor,
        isClaimed: birthdays.isClaimed,
        linkedUserId: birthdays.linkedUserId,
        notes: birthdays.notes,
        createdAt: birthdays.createdAt,
      })
      .from(birthdays)
      .where(and(eq(birthdays.circleId, circleId), sql`${birthdays.deletedAt} IS NULL`))
      .orderBy(birthdays.birthMonth, birthdays.birthDay);

    return reply.send({ birthdays: circleBirthdays });
  });

  // ---------------------------------------------------------------------------
  // CREAR CUMPLEAÑOS
  // ---------------------------------------------------------------------------
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parseResult = CreateBirthdaySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { circleId, fullName, contactEmail, birthDay, birthMonth, birthYear, isMinor, notes } = parseResult.data;
    const userId = request.user.id;

    // Verificar que el usuario sea al menos miembro
    const membership = await db.query.circleMembers.findFirst({
      where: and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)),
    });

    if (!membership || membership.role === 'viewer') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Los observadores no pueden crear cumpleaños' });
    }

    const birthdayId = crypto.randomUUID();

    await db.insert(birthdays).values({
      id: birthdayId,
      circleId,
      createdBy: userId,
      fullName,
      contactEmail: contactEmail ? contactEmail.toLowerCase().trim() : null,
      birthDay,
      birthMonth,
      birthYear: birthYear || null,
      isMinor,
      notes: notes || null,
      isClaimed: false,
      linkedUserId: null,
    });

    return reply.status(201).send({
      message: 'Cumpleaños registrado exitosamente',
      birthday: {
        id: birthdayId,
        circleId,
        fullName,
        birthDay,
        birthMonth,
        birthYear,
        isMinor,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // SOLICITAR VINCULACIÓN ("CLAIM") DE PERFIL DE CUMPLEAÑOS
  // ---------------------------------------------------------------------------
  fastify.post('/:id/claim-request', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: birthdayId } = request.params as { id: string };
    const userId = request.user.id;

    const birthday = await db.query.birthdays.findFirst({
      where: and(eq(birthdays.id, birthdayId), sql`${birthdays.deletedAt} IS NULL`),
    });

    if (!birthday) {
      return reply.status(404).send({ error: 'Not Found', message: 'Cumpleaños no encontrado' });
    }

    if (birthday.isClaimed) {
      return reply.status(409).send({ error: 'Conflict', message: 'Este perfil de cumpleaños ya está vinculado a un usuario' });
    }

    // Verificar si ya existe solicitud pendiente
    const existingReq = await db.query.birthdayClaimRequests.findFirst({
      where: and(
        eq(birthdayClaimRequests.birthdayId, birthdayId),
        eq(birthdayClaimRequests.claimantUserId, userId),
        eq(birthdayClaimRequests.status, 'pending')
      ),
    });

    if (existingReq) {
      return reply.status(409).send({ error: 'Conflict', message: 'Ya tienes una solicitud de vinculación pendiente para este perfil' });
    }

    const requestId = crypto.randomUUID();

    await db.insert(birthdayClaimRequests).values({
      id: requestId,
      birthdayId,
      claimantUserId: userId,
      status: 'pending',
    });

    return reply.status(201).send({
      message: 'Solicitud de vinculación enviada. Un administrador del círculo revisará tu petición.',
      claimRequestId: requestId,
    });
  });

  // ---------------------------------------------------------------------------
  // REVISAR SOLICITUD DE VINCULACIÓN (ADMIN/OWNER DEL CÍRCULO)
  // ---------------------------------------------------------------------------
  fastify.post('/claims/review', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parseResult = ReviewClaimSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { claimRequestId, approved, rejectionReason } = parseResult.data;
    const reviewerId = request.user.id;

    const claim = await db.query.birthdayClaimRequests.findFirst({
      where: eq(birthdayClaimRequests.id, claimRequestId),
    });

    if (!claim || claim.status !== 'pending') {
      return reply.status(404).send({ error: 'Not Found', message: 'Solicitud no encontrada o ya procesada' });
    }

    const birthday = await db.query.birthdays.findFirst({
      where: eq(birthdays.id, claim.birthdayId),
    });

    if (!birthday) {
      return reply.status(404).send({ error: 'Not Found', message: 'Cumpleaños no encontrado' });
    }

    // Validar que el revisor sea admin u owner del círculo
    const reviewerMembership = await db.query.circleMembers.findFirst({
      where: and(eq(circleMembers.circleId, birthday.circleId), eq(circleMembers.userId, reviewerId)),
    });

    if (!reviewerMembership || (reviewerMembership.role !== 'owner' && reviewerMembership.role !== 'admin')) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Solo administradores del círculo pueden aprobar claims' });
    }

    // Ejecutar la aprobación o rechazo en transacción atómica
    await db.transaction(async (tx) => {
      if (approved) {
        // 1. Vincular el perfil al usuario real
        await tx
          .update(birthdays)
          .set({
            linkedUserId: claim.claimantUserId,
            isClaimed: true,
            updatedAt: new Date(),
          })
          .where(eq(birthdays.id, birthday.id));

        // 2. Marcar solicitud como aprobada
        await tx
          .update(birthdayClaimRequests)
          .set({
            status: 'approved',
            reviewedByAdminId: reviewerId,
            reviewedAt: new Date(),
          })
          .where(eq(birthdayClaimRequests.id, claimRequestId));
      } else {
        // Rechazar
        await tx
          .update(birthdayClaimRequests)
          .set({
            status: 'rejected',
            rejectionReason: rejectionReason || 'Rechazado por el administrador',
            reviewedByAdminId: reviewerId,
            reviewedAt: new Date(),
          })
          .where(eq(birthdayClaimRequests.id, claimRequestId));
      }
    });

    return reply.send({
      message: approved ? 'Perfil de cumpleaños vinculado exitosamente' : 'Solicitud rechazada',
      status: approved ? 'approved' : 'rejected',
    });
  });
};
