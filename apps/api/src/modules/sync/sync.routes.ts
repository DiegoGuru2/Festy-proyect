import { FastifyPluginAsync } from 'fastify';
import { eq, and, sql, inArray } from 'drizzle-orm';
import {
  getDbConnection,
  circleMembers,
  birthdays,
  celebrations,
  eventPhotos,
} from '@festy/db';
import { SyncDeltaSchema } from '@festy/shared';

export const syncRoutes: FastifyPluginAsync = async (fastify) => {
  const db = getDbConnection();

  // ---------------------------------------------------------------------------
  // PROTOCOLO DE SINCRONIZACIÓN DELTA PAGINADA (OFFLINE-FIRST)
  // ---------------------------------------------------------------------------
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parseResult = SyncDeltaSchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { since, cursor, limit } = parseResult.data;
    const userId = request.user.id;

    // 1. Obtener los círculos a los que pertenece el usuario
    const userMemberships = await db
      .select({ circleId: circleMembers.circleId })
      .from(circleMembers)
      .where(eq(circleMembers.userId, userId));

    const circleIds = userMemberships.map((m) => m.circleId);

    if (circleIds.length === 0) {
      return reply.send({
        syncTimestamp: new Date().toISOString(),
        data: { birthdays: [], celebrations: [], photos: [] },
        pagination: { limit, hasMore: false, nextCursor: null },
      });
    }

    const sinceDate = since ? new Date(since) : new Date(0);

    // 2. Consultar cumpleaños modificados o dados de baja desde 'since'
    const modifiedBirthdays = await db
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
        updatedAt: birthdays.updatedAt,
        deletedAt: birthdays.deletedAt,
      })
      .from(birthdays)
      .where(
        and(
          inArray(birthdays.circleId, circleIds),
          sql`${birthdays.updatedAt} > ${sinceDate}`
        )
      )
      .orderBy(birthdays.updatedAt, birthdays.id)
      .limit(limit + 1);

    const hasMore = modifiedBirthdays.length > limit;
    const items = hasMore ? modifiedBirthdays.slice(0, limit) : modifiedBirthdays;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    return reply.send({
      syncTimestamp: new Date().toISOString(),
      data: {
        birthdays: items,
        celebrations: [],
        photos: [],
      },
      pagination: {
        limit,
        hasMore,
        nextCursor,
      },
    });
  });
};
