import { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { eq, and, sql, inArray } from 'drizzle-orm';
import {
  getDbConnection,
  eventPhotos,
  celebrations,
  birthdays,
  circleMembers,
  photoLikes,
  photoComments,
  photoReports,
  users,
} from '@festy/db';
import {
  SignUploadSchema,
  RegisterPhotoSchema,
  CreateCommentSchema,
  ReportPhotoSchema,
} from '@festy/shared';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'festy_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || '1234567890',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'secret_sample',
  secure: true,
});

export const mediaRoutes: FastifyPluginAsync = async (fastify) => {
  const db = getDbConnection();

  // ---------------------------------------------------------------------------
  // OBTENER O CREAR CELEBRACIÓN ANUAL DE UN CUMPLEAÑOS
  // ---------------------------------------------------------------------------
  fastify.post('/celebrations/get-or-create', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { birthdayId, year = new Date().getFullYear() } = request.body as { birthdayId: string; year?: number };
    const userId = request.user.id;

    const birthday = await db.query.birthdays.findFirst({
      where: and(eq(birthdays.id, birthdayId), sql`${birthdays.deletedAt} IS NULL`),
    });

    if (!birthday) {
      return reply.status(404).send({ error: 'Not Found', message: 'Cumpleaños no encontrado' });
    }

    // Validar membresía en el círculo
    const membership = await db.query.circleMembers.findFirst({
      where: and(eq(circleMembers.circleId, birthday.circleId), eq(circleMembers.userId, userId)),
    });

    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'No perteneces a este círculo' });
    }

    let celebration = await db.query.celebrations.findFirst({
      where: and(
        eq(celebrations.birthdayId, birthdayId),
        eq(celebrations.celebrationYear, year),
        sql`${celebrations.deletedAt} IS NULL`
      ),
    });

    if (!celebration) {
      const celebrationId = crypto.randomUUID();
      const eventDate = new Date(year, birthday.birthMonth - 1, birthday.birthDay);
      const title = `Cumpleaños de ${birthday.fullName} (${year})`;

      await db.insert(celebrations).values({
        id: celebrationId,
        birthdayId,
        celebrationYear: year,
        title,
        eventDate,
        visibility: 'circle_public',
      });

      celebration = {
        id: celebrationId,
        birthdayId,
        celebrationYear: year,
        title,
        eventDate,
        location: null,
        visibility: 'circle_public',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
    }

    // Listar fotos activas de esta celebración
    const photos = await db
      .select({
        id: eventPhotos.id,
        celebrationId: eventPhotos.celebrationId,
        secureUrl: eventPhotos.secureUrl,
        caption: eventPhotos.caption,
        uploadedBy: eventPhotos.uploadedBy,
        uploaderName: users.fullName,
        likesCount: eventPhotos.likesCount,
        commentsCount: eventPhotos.commentsCount,
        createdAt: eventPhotos.createdAt,
      })
      .from(eventPhotos)
      .innerJoin(users, eq(users.id, eventPhotos.uploadedBy))
      .where(
        and(
          eq(eventPhotos.celebrationId, celebration.id),
          eq(eventPhotos.moderationStatus, 'approved'),
          sql`${eventPhotos.deletedAt} IS NULL`
        )
      )
      .orderBy(sql`${eventPhotos.createdAt} DESC`);

    return reply.send({
      celebration,
      birthday,
      photos,
    });
  });

  // ---------------------------------------------------------------------------
  // FEED GLOBAL DE FOTOS DE RECUERDOS (DE TODOS LOS CÍRCULOS DEL USUARIO)
  // ---------------------------------------------------------------------------
  fastify.get('/photos/feed', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;

    const userCircles = await db
      .select({ circleId: circleMembers.circleId })
      .from(circleMembers)
      .where(eq(circleMembers.userId, userId));

    if (userCircles.length === 0) {
      return reply.send({ photos: [] });
    }

    const circleIds = userCircles.map((c) => c.circleId);

    const photos = await db
      .select({
        id: eventPhotos.id,
        celebrationId: eventPhotos.celebrationId,
        celebrationTitle: celebrations.title,
        secureUrl: eventPhotos.secureUrl,
        caption: eventPhotos.caption,
        uploadedBy: eventPhotos.uploadedBy,
        uploaderName: users.fullName,
        likesCount: eventPhotos.likesCount,
        commentsCount: eventPhotos.commentsCount,
        createdAt: eventPhotos.createdAt,
      })
      .from(eventPhotos)
      .innerJoin(celebrations, eq(celebrations.id, eventPhotos.celebrationId))
      .innerJoin(birthdays, eq(birthdays.id, celebrations.birthdayId))
      .innerJoin(users, eq(users.id, eventPhotos.uploadedBy))
      .where(
        and(
          inArray(birthdays.circleId, circleIds),
          eq(eventPhotos.moderationStatus, 'approved'),
          sql`${eventPhotos.deletedAt} IS NULL`
        )
      )
      .orderBy(sql`${eventPhotos.createdAt} DESC`)
      .limit(30);

    return reply.send({ photos });
  });

  // ---------------------------------------------------------------------------
  // GENERAR FIRMA CRIPTOGRÁFICA PARA SUBIDA DIRECTA A CLOUDINARY
  // ---------------------------------------------------------------------------
  fastify.post('/sign-upload', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parseResult = SignUploadSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { celebrationId } = parseResult.data;
    const userId = request.user.id;

    // 1. Obtener la celebración y su círculo
    const celebration = await db
      .select({
        id: celebrations.id,
        circleId: birthdays.circleId,
      })
      .from(celebrations)
      .innerJoin(birthdays, eq(birthdays.id, celebrations.birthdayId))
      .where(and(eq(celebrations.id, celebrationId), sql`${celebrations.deletedAt} IS NULL`))
      .then((rows) => rows[0]);

    if (!celebration) {
      return reply.status(404).send({ error: 'Not Found', message: 'Celebración no encontrada' });
    }

    // 2. Validar que el usuario sea miembro del círculo
    const membership = await db.query.circleMembers.findFirst({
      where: and(eq(circleMembers.circleId, celebration.circleId), eq(circleMembers.userId, userId)),
    });

    if (!membership || membership.role === 'viewer') {
      return reply.status(403).send({ error: 'Forbidden', message: 'No tienes permiso para subir fotos a este evento' });
    }

    // 3. Generar parámetros y firma Cloudinary
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `festy/celebrations/${celebrationId}`;

    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET || 'sample_secret'
    );

    return reply.send({
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY || 'sample_key',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'sample_cloud',
    });
  });

  // ---------------------------------------------------------------------------
  // REGISTRAR METADATOS DE FOTO SUBIDA
  // ---------------------------------------------------------------------------
  fastify.post('/photos', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parseResult = RegisterPhotoSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const {
      celebrationId,
      cloudinaryPublicId,
      secureUrl,
      caption,
      width,
      height,
      format,
      sizeBytes,
      containsMinors,
      visibility,
    } = parseResult.data;

    const photoId = crypto.randomUUID();
    const userId = request.user.id;

    await db.insert(eventPhotos).values({
      id: photoId,
      celebrationId,
      uploadedBy: userId,
      cloudinaryPublicId,
      secureUrl,
      caption: caption || null,
      width: width || null,
      height: height || null,
      format: format || null,
      sizeBytes: sizeBytes || null,
      containsMinors,
      visibility,
      moderationStatus: 'approved',
      reportsCount: 0,
      likesCount: 0,
      commentsCount: 0,
    });

    return reply.status(201).send({
      message: 'Foto registrada exitosamente',
      photo: {
        id: photoId,
        secureUrl,
        cloudinaryPublicId,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // LIKE ATÓMICO (TRANSACCIÓN ORM CON DEDICATED INCREMENT)
  // ---------------------------------------------------------------------------
  fastify.post('/photos/:id/like', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: photoId } = request.params as { id: string };
    const userId = request.user.id;

    try {
      await db.transaction(async (tx) => {
        // 1. Insertar el like relacional (falla por UQ si ya existe)
        await tx.insert(photoLikes).values({
          id: crypto.randomUUID(),
          photoId,
          userId,
        });

        // 2. Incrementar atómicamente a nivel de BD
        await tx
          .update(eventPhotos)
          .set({
            likesCount: sql`${eventPhotos.likesCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(eventPhotos.id, photoId));
      });

      return reply.send({ message: 'Like registrado' });
    } catch (err: any) {
      // Si el like ya existía, removerlo (Toggle Like)
      if (err.code === 'ER_DUP_ENTRY' || err.message?.includes('duplicate')) {
        await db.transaction(async (tx) => {
          await tx
            .delete(photoLikes)
            .where(and(eq(photoLikes.photoId, photoId), eq(photoLikes.userId, userId)));

          await tx
            .update(eventPhotos)
            .set({
              likesCount: sql`GREATEST(0, ${eventPhotos.likesCount} - 1)`,
              updatedAt: new Date(),
            })
            .where(eq(eventPhotos.id, photoId));
        });

        return reply.send({ message: 'Like removido' });
      }
      throw err;
    }
  });

  // ---------------------------------------------------------------------------
  // COMENTARIO ATÓMICO
  // ---------------------------------------------------------------------------
  fastify.post('/photos/:id/comments', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: photoId } = request.params as { id: string };
    const userId = request.user.id;

    const parseResult = CreateCommentSchema.safeParse({ ...request.body as object, photoId });
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { content } = parseResult.data;
    const commentId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(photoComments).values({
        id: commentId,
        photoId,
        userId,
        content,
      });

      await tx
        .update(eventPhotos)
        .set({
          commentsCount: sql`${eventPhotos.commentsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(eventPhotos.id, photoId));
    });

    return reply.status(201).send({
      message: 'Comentario agregado',
      commentId,
    });
  });

  // ---------------------------------------------------------------------------
  // REPORTE DE FOTO CON OCULTAMIENTO PREVENTIVO AUTOMÁTICO (AUTO-HIDING)
  // ---------------------------------------------------------------------------
  fastify.post('/photos/:id/report', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: photoId } = request.params as { id: string };
    const userId = request.user.id;

    const parseResult = ReportPhotoSchema.safeParse({ ...request.body as object, photoId });
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { reason } = parseResult.data;
    const reportId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      // 1. Guardar el reporte
      await tx.insert(photoReports).values({
        id: reportId,
        photoId,
        reportedBy: userId,
        reason,
        status: 'open',
      });

      // 2. Incrementar reports_count
      await tx
        .update(eventPhotos)
        .set({
          reportsCount: sql`${eventPhotos.reportsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(eventPhotos.id, photoId));

      // 3. Evaluar umbral de auto-ocultamiento preventivo:
      // Si el reporte es por seguridad de menores (child_safety) O si llega a >= 3 reportes
      const photo = await tx.query.eventPhotos.findFirst({
        where: eq(eventPhotos.id, photoId),
      });

      if (photo && (reason === 'child_safety' || photo.reportsCount >= 3)) {
        await tx
          .update(eventPhotos)
          .set({
            moderationStatus: 'hidden',
            updatedAt: new Date(),
          })
          .where(eq(eventPhotos.id, photoId));
      }
    });

    return reply.status(201).send({
      message: 'Reporte registrado. Se ha tomado acción preventiva de moderación.',
      reportId,
    });
  });
};
