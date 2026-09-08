import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { getDbConnection, users, userNotificationPrefs, userDeviceTokens } from '@festy/db';
import { RegisterUserSchema, LoginUserSchema, LogoutSchema } from '@festy/shared';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const db = getDbConnection();

  // ---------------------------------------------------------------------------
  // REGISTRO DE USUARIOS
  // ---------------------------------------------------------------------------
  fastify.post('/register', async (request, reply) => {
    const parseResult = RegisterUserSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { email, password, fullName, timezone } = parseResult.data;

    // Verificar si el correo ya existe
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (existing) {
      return reply.status(409).send({ error: 'Conflict', message: 'El correo electrónico ya se encuentra registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = crypto.randomUUID();

    // Crear usuario y preferencias de notificación por defecto dentro de una transacción
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        timezone,
        emailVerifiedAt: null, // Requiere verificación
      });

      await tx.insert(userNotificationPrefs).values({
        id: crypto.randomUUID(),
        userId,
        enablePush: true,
        enableEmail: true,
        enableWhatsapp: false,
        daysBefore: 1,
        preferredTime: '09:00:00',
      });
    });

    const token = fastify.jwt.sign({
      id: userId,
      email: email.toLowerCase().trim(),
      fullName,
      emailVerified: false,
    });

    return reply.status(201).send({
      message: 'Usuario registrado exitosamente. Por favor verifica tu correo.',
      user: {
        id: userId,
        email,
        fullName,
        timezone,
        emailVerified: false,
      },
      token,
    });
  });

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------
  fastify.post('/login', async (request, reply) => {
    const parseResult = LoginUserSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parseResult.error.errors });
    }

    const { email, password } = parseResult.data;

    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email.toLowerCase().trim())),
    });

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Credenciales incorrectas' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Credenciales incorrectas' });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      emailVerified: Boolean(user.emailVerifiedAt),
    });

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        timezone: user.timezone,
        emailVerified: Boolean(user.emailVerifiedAt),
      },
      token,
    });
  });

  // ---------------------------------------------------------------------------
  // LOGOUT (CON DESACTIVACIÓN EXPLÍCITA DE DEVICE TOKENS)
  // ---------------------------------------------------------------------------
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parseResult = LogoutSchema.safeParse(request.body);
    const fcmToken = parseResult.success ? parseResult.data.fcmToken : undefined;
    const userId = request.user.id;

    if (fcmToken) {
      // Desactivar token para este dispositivo
      await db
        .update(userDeviceTokens)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(userDeviceTokens.userId, userId), eq(userDeviceTokens.fcmToken, fcmToken)));
    }

    return reply.send({ message: 'Sesión cerrada exitosamente' });
  });

  // ---------------------------------------------------------------------------
  // PERFIL ACTUAL
  // ---------------------------------------------------------------------------
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user.id),
      columns: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        timezone: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'Not Found', message: 'Usuario no encontrado' });
    }

    return reply.send({ user });
  });
};
