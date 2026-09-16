import { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { eq, and, or, sql, inArray, desc } from 'drizzle-orm';
import {
  getDbConnection,
  circles,
  circleMembers,
  users,
  directMessages,
} from '@festy/db';
import { SendMessageSchema, MarkAsReadSchema } from '@festy/shared';

export const messageRoutes: FastifyPluginAsync = async (fastify) => {
  const db = getDbConnection();

  // ---------------------------------------------------------------------------
  // HELPER: Obtener IDs de usuarios que comparten al menos un círculo conmigo
  // ---------------------------------------------------------------------------
  async function getCircleMateIds(userId: string): Promise<string[]> {
    const myCircles = await db
      .select({ circleId: circleMembers.circleId })
      .from(circleMembers)
      .innerJoin(circles, eq(circles.id, circleMembers.circleId))
      .where(and(eq(circleMembers.userId, userId), sql`${circles.deletedAt} IS NULL`));

    if (myCircles.length === 0) return [];

    const circleIds = myCircles.map((c) => c.circleId);

    const mates = await db
      .select({ userId: circleMembers.userId })
      .from(circleMembers)
      .where(and(inArray(circleMembers.circleId, circleIds)));

    const uniqueIds = [...new Set(mates.map((m) => m.userId))].filter((id) => id !== userId);
    return uniqueIds;
  }

  // ---------------------------------------------------------------------------
  // HELPER: Obtener los círculos compartidos entre dos usuarios
  // ---------------------------------------------------------------------------
  async function getSharedCircles(userId1: string, userId2: string) {
    const user1Circles = await db
      .select({ circleId: circleMembers.circleId })
      .from(circleMembers)
      .innerJoin(circles, eq(circles.id, circleMembers.circleId))
      .where(and(eq(circleMembers.userId, userId1), sql`${circles.deletedAt} IS NULL`));

    const user2Circles = await db
      .select({ circleId: circleMembers.circleId })
      .from(circleMembers)
      .innerJoin(circles, eq(circles.id, circleMembers.circleId))
      .where(and(eq(circleMembers.userId, userId2), sql`${circles.deletedAt} IS NULL`));

    const user1Ids = new Set(user1Circles.map((c) => c.circleId));
    const sharedIds = user2Circles.map((c) => c.circleId).filter((id) => user1Ids.has(id));

    if (sharedIds.length === 0) return [];

    const sharedCircleDetails = await db
      .select({ id: circles.id, name: circles.name })
      .from(circles)
      .where(inArray(circles.id, sharedIds));

    return sharedCircleDetails;
  }

  // ---------------------------------------------------------------------------
  // GET /contacts — Lista de contactos (miembros de mis círculos) con último msg
  // ---------------------------------------------------------------------------
  fastify.get('/contacts', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;

    const mateIds = await getCircleMateIds(userId);
    if (mateIds.length === 0) {
      return reply.send({ contacts: [] });
    }

    // Obtener info de cada contacto
    const contactUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(and(inArray(users.id, mateIds), sql`${users.deletedAt} IS NULL`));

    // Para cada contacto, obtener último mensaje y conteo de no leídos
    const contacts = [];
    for (const contact of contactUsers) {
      // Último mensaje (enviado o recibido)
      const lastMsgRows = await db
        .select({
          id: directMessages.id,
          senderId: directMessages.senderId,
          content: directMessages.content,
          createdAt: directMessages.createdAt,
          isRead: directMessages.isRead,
        })
        .from(directMessages)
        .where(
          and(
            or(
              and(eq(directMessages.senderId, userId), eq(directMessages.receiverId, contact.id)),
              and(eq(directMessages.senderId, contact.id), eq(directMessages.receiverId, userId))
            ),
            sql`${directMessages.deletedAt} IS NULL`
          )
        )
        .orderBy(desc(directMessages.createdAt))
        .limit(1);

      // Conteo de no leídos (mensajes que me envió este contacto y no he leído)
      const unreadRows = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(directMessages)
        .where(
          and(
            eq(directMessages.senderId, contact.id),
            eq(directMessages.receiverId, userId),
            eq(directMessages.isRead, false),
            sql`${directMessages.deletedAt} IS NULL`
          )
        );

      // Círculos compartidos
      const shared = await getSharedCircles(userId, contact.id);

      contacts.push({
        ...contact,
        sharedCircles: shared,
        lastMessage: lastMsgRows[0] || null,
        unreadCount: Number(unreadRows[0]?.count || 0),
      });
    }

    // Ordenar: primero los que tienen mensajes no leídos, luego por último mensaje más reciente
    contacts.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return reply.send({ contacts });
  });

  // ---------------------------------------------------------------------------
  // GET /history/:contactId — Historial de mensajes con un contacto
  // ---------------------------------------------------------------------------
  fastify.get('/history/:contactId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const { contactId } = request.params as { contactId: string };

    // Verificar que comparten círculo
    const shared = await getSharedCircles(userId, contactId);
    if (shared.length === 0) {
      return reply.status(403).send({ message: 'No compartes ningún círculo con este usuario' });
    }

    const query = request.query as { limit?: string; before?: string };
    const limit = Math.min(Math.max(parseInt(query.limit || '50', 10), 1), 100);

    let messages;
    if (query.before) {
      messages = await db
        .select({
          id: directMessages.id,
          senderId: directMessages.senderId,
          receiverId: directMessages.receiverId,
          content: directMessages.content,
          isRead: directMessages.isRead,
          readAt: directMessages.readAt,
          createdAt: directMessages.createdAt,
          circleId: directMessages.circleId,
        })
        .from(directMessages)
        .where(
          and(
            or(
              and(eq(directMessages.senderId, userId), eq(directMessages.receiverId, contactId)),
              and(eq(directMessages.senderId, contactId), eq(directMessages.receiverId, userId))
            ),
            sql`${directMessages.deletedAt} IS NULL`,
            sql`${directMessages.createdAt} < ${query.before}`
          )
        )
        .orderBy(desc(directMessages.createdAt))
        .limit(limit);
    } else {
      messages = await db
        .select({
          id: directMessages.id,
          senderId: directMessages.senderId,
          receiverId: directMessages.receiverId,
          content: directMessages.content,
          isRead: directMessages.isRead,
          readAt: directMessages.readAt,
          createdAt: directMessages.createdAt,
          circleId: directMessages.circleId,
        })
        .from(directMessages)
        .where(
          and(
            or(
              and(eq(directMessages.senderId, userId), eq(directMessages.receiverId, contactId)),
              and(eq(directMessages.senderId, contactId), eq(directMessages.receiverId, userId))
            ),
            sql`${directMessages.deletedAt} IS NULL`
          )
        )
        .orderBy(desc(directMessages.createdAt))
        .limit(limit);
    }

    // Devolver en orden cronológico (más antiguos primero)
    return reply.send({ messages: messages.reverse() });
  });

  // ---------------------------------------------------------------------------
  // POST /send — Enviar un mensaje
  // ---------------------------------------------------------------------------
  fastify.post('/send', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const parsed = SendMessageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Datos inválidos', errors: parsed.error.flatten() });
    }

    const { receiverId, content, circleId } = parsed.data;

    if (receiverId === userId) {
      return reply.status(400).send({ message: 'No puedes enviarte mensajes a ti mismo' });
    }

    // Verificar que comparten al menos un círculo
    const shared = await getSharedCircles(userId, receiverId);
    if (shared.length === 0) {
      return reply.status(403).send({ message: 'No compartes ningún círculo con este usuario' });
    }

    // Si se especifica circleId, verificar que ambos pertenecen a ese círculo
    if (circleId) {
      const validCircle = shared.find((c) => c.id === circleId);
      if (!validCircle) {
        return reply.status(403).send({ message: 'Ambos usuarios deben pertenecer al círculo especificado' });
      }
    }

    const messageId = crypto.randomUUID();
    const now = new Date();

    await db.insert(directMessages).values({
      id: messageId,
      senderId: userId,
      receiverId,
      circleId: circleId || null,
      content,
      isRead: false,
      readAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    const newMessage = {
      id: messageId,
      senderId: userId,
      receiverId,
      circleId: circleId || null,
      content,
      isRead: false,
      readAt: null,
      createdAt: now,
    };

    return reply.status(201).send({ message: newMessage });
  });

  // ---------------------------------------------------------------------------
  // PATCH /read/:contactId — Marcar como leídos todos los msgs de un contacto
  // ---------------------------------------------------------------------------
  fastify.patch('/read/:contactId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const { contactId } = request.params as { contactId: string };

    const now = new Date();

    await db
      .update(directMessages)
      .set({ isRead: true, readAt: now })
      .where(
        and(
          eq(directMessages.senderId, contactId),
          eq(directMessages.receiverId, userId),
          eq(directMessages.isRead, false),
          sql`${directMessages.deletedAt} IS NULL`
        )
      );

    return reply.send({ success: true });
  });

  // ---------------------------------------------------------------------------
  // GET /unread-count — Conteo global de mensajes no leídos
  // ---------------------------------------------------------------------------
  fastify.get('/unread-count', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;

    const rows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(directMessages)
      .where(
        and(
          eq(directMessages.receiverId, userId),
          eq(directMessages.isRead, false),
          sql`${directMessages.deletedAt} IS NULL`
        )
      );

    return reply.send({ unreadCount: Number(rows[0]?.count || 0) });
  });
};
