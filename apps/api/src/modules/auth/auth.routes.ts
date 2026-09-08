import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import {
  getDbConnection,
  users,
  userNotificationPrefs,
  userDeviceTokens,
  circles,
  circleMembers,
  circleInvitations,
  birthdays,
} from '@festy/db';
import { RegisterUserSchema, LoginUserSchema, LogoutSchema } from '@festy/shared';
import { sendWelcomeEmail, sendPasswordChangedEmail } from '../email/email.service';

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

    const { email, password, fullName, timezone, birthDay, birthMonth, birthYear, inviteCode } = parseResult.data;

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

    let assignedCircleId: string;
    let assignedCircleName = 'Familia';

    // Crear usuario, preferencias de notificación, círculo y cumpleaños dentro de una transacción
    await db.transaction(async (tx) => {
      // 1. Crear Usuario
      await tx.insert(users).values({
        id: userId,
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        timezone,
        emailVerifiedAt: null,
      });

      // 2. Preferencias de notificación
      await tx.insert(userNotificationPrefs).values({
        id: crypto.randomUUID(),
        userId,
        enablePush: true,
        enableEmail: true,
        enableWhatsapp: false,
        daysBefore: 1,
        preferredTime: '09:00:00',
      });

      // 3. Resolución de Círculo Familiar
      if (inviteCode) {
        const cleanCode = inviteCode.trim().toUpperCase();
        const invitation = await tx.query.circleInvitations.findFirst({
          where: and(
            eq(circleInvitations.inviteCode, cleanCode),
            eq(circleInvitations.status, 'active')
          ),
        });

        if (invitation && invitation.expiresAt > new Date() && invitation.usesCount < invitation.maxUses) {
          assignedCircleId = invitation.circleId;
          await tx.insert(circleMembers).values({
            id: crypto.randomUUID(),
            circleId: assignedCircleId,
            userId,
            role: invitation.role,
          });

          await tx
            .update(circleInvitations)
            .set({ usesCount: sql`${circleInvitations.usesCount} + 1` })
            .where(eq(circleInvitations.id, invitation.id));

          const circleRecord = await tx.query.circles.findFirst({
            where: eq(circles.id, assignedCircleId),
          });
          if (circleRecord) assignedCircleName = circleRecord.name;
        } else {
          // Si el código no es válido, crea su propio círculo Familia
          assignedCircleId = crypto.randomUUID();
          await tx.insert(circles).values({
            id: assignedCircleId,
            name: 'Familia',
            createdBy: userId,
          });
          await tx.insert(circleMembers).values({
            id: crypto.randomUUID(),
            circleId: assignedCircleId,
            userId,
            role: 'owner',
          });
        }
      } else {
        // Crear círculo Familia por defecto
        assignedCircleId = crypto.randomUUID();
        await tx.insert(circles).values({
          id: assignedCircleId,
          name: 'Familia',
          createdBy: userId,
        });
        await tx.insert(circleMembers).values({
          id: crypto.randomUUID(),
          circleId: assignedCircleId,
          userId,
          role: 'owner',
        });
      }

      // 4. Agregar cumpleaños del usuario vinculado a su círculo familiar
      if (birthDay && birthMonth) {
        const isMinor = birthYear ? new Date().getFullYear() - birthYear < 18 : false;
        await tx.insert(birthdays).values({
          id: crypto.randomUUID(),
          circleId: assignedCircleId,
          createdBy: userId,
          linkedUserId: userId,
          isClaimed: true,
          fullName,
          contactEmail: email.toLowerCase().trim(),
          birthDay,
          birthMonth,
          birthYear: birthYear || null,
          isMinor,
          notes: 'Cumpleaños agregado al registrar la cuenta',
        });
      }
    });

    const token = fastify.jwt.sign({
      id: userId,
      email: email.toLowerCase().trim(),
      fullName,
      emailVerified: false,
    });

    // Enviar correo de bienvenida en segundo plano
    sendWelcomeEmail({
      to: email.toLowerCase().trim(),
      fullName,
      circleName: assignedCircleName,
      inviteCode,
    }).catch((err) => {
      fastify.log.error(`[Email Error] Error enviando bienvenida a ${email}: ${err.message}`);
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
  // PERFIL ACTUAL (CON PREFERENCIAS Y FECHA DE CUMPLEAÑOS)
  // ---------------------------------------------------------------------------
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
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

    const prefs = await db.query.userNotificationPrefs.findFirst({
      where: eq(userNotificationPrefs.userId, userId),
    });

    const userBirthday = await db.query.birthdays.findFirst({
      where: and(
        sql`(${birthdays.linkedUserId} = ${userId} OR ${birthdays.createdBy} = ${userId})`,
        sql`${birthdays.deletedAt} IS NULL`
      ),
      orderBy: [sql`${birthdays.createdAt} ASC`],
    });

    return reply.send({
      user,
      birthday: userBirthday
        ? {
            id: userBirthday.id,
            birthDay: userBirthday.birthDay,
            birthMonth: userBirthday.birthMonth,
            birthYear: userBirthday.birthYear,
            circleId: userBirthday.circleId,
          }
        : null,
      preferences: prefs || {
        enablePush: true,
        enableEmail: true,
        daysBefore: 1,
        preferredTime: '09:00:00',
      },
    });
  });

  // ---------------------------------------------------------------------------
  // ACTUALIZAR DATOS DE PERFIL (NOMBRE, ZONA HORARIA Y FECHA DE CUMPLEAÑOS)
  // ---------------------------------------------------------------------------
  fastify.patch('/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const { fullName, timezone, birthDay, birthMonth, birthYear } = request.body as {
      fullName?: string;
      timezone?: string;
      birthDay?: number;
      birthMonth?: number;
      birthYear?: number;
    };

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (fullName && fullName.trim().length >= 2) {
      updateData.fullName = fullName.trim();
    }
    if (timezone && timezone.trim().length > 0) {
      updateData.timezone = timezone.trim();
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        fullName: true,
        timezone: true,
      },
    });

    // Actualizar o crear registro de cumpleaños personal
    let updatedBirthday = null;
    if (birthDay && birthMonth) {
      const existingBday = await db.query.birthdays.findFirst({
        where: and(
          sql`(${birthdays.linkedUserId} = ${userId} OR ${birthdays.createdBy} = ${userId})`,
          sql`${birthdays.deletedAt} IS NULL`
        ),
      });

      if (existingBday) {
        await db
          .update(birthdays)
          .set({
            birthDay: Number(birthDay),
            birthMonth: Number(birthMonth),
            birthYear: birthYear ? Number(birthYear) : null,
            fullName: fullName ? fullName.trim() : existingBday.fullName,
            updatedAt: new Date(),
          })
          .where(eq(birthdays.id, existingBday.id));

        updatedBirthday = {
          id: existingBday.id,
          birthDay: Number(birthDay),
          birthMonth: Number(birthMonth),
          birthYear: birthYear ? Number(birthYear) : null,
        };
      } else {
        const member = await db.query.circleMembers.findFirst({
          where: eq(circleMembers.userId, userId),
        });

        if (member) {
          const newBdayId = crypto.randomUUID();
          await db.insert(birthdays).values({
            id: newBdayId,
            circleId: member.circleId,
            createdBy: userId,
            linkedUserId: userId,
            isClaimed: true,
            fullName: fullName ? fullName.trim() : updatedUser!.fullName,
            contactEmail: updatedUser!.email,
            birthDay: Number(birthDay),
            birthMonth: Number(birthMonth),
            birthYear: birthYear ? Number(birthYear) : null,
            isMinor: birthYear ? new Date().getFullYear() - birthYear < 18 : false,
            notes: 'Cumpleaños personal',
          });

          updatedBirthday = {
            id: newBdayId,
            birthDay: Number(birthDay),
            birthMonth: Number(birthMonth),
            birthYear: birthYear ? Number(birthYear) : null,
          };
        }
      }
    }

    return reply.send({
      message: 'Perfil y fecha de cumpleaños actualizados exitosamente',
      user: updatedUser,
      birthday: updatedBirthday,
    });
  });

  // ---------------------------------------------------------------------------
  // CAMBIAR CONTRASEÑA
  // ---------------------------------------------------------------------------
  fastify.post('/change-password', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const { currentPassword, newPassword } = request.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Debes ingresar la contraseña actual y la nueva contraseña',
      });
    }

    if (newPassword.length < 8) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'La nueva contraseña debe tener al menos 8 caracteres',
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.passwordHash) {
      return reply.status(404).send({ error: 'Not Found', message: 'Usuario no encontrado' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'La contraseña actual no es correcta',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    const newToken = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      emailVerified: Boolean(user.emailVerifiedAt),
    });

    // Enviar notificación de cambio de contraseña por correo
    sendPasswordChangedEmail({
      to: user.email,
      fullName: user.fullName,
    }).catch((err) => {
      fastify.log.error(`[Email Error] Error enviando alerta de cambio de contraseña a ${user.email}: ${err.message}`);
    });

    return reply.send({
      message: 'Contraseña actualizada exitosamente',
      token: newToken,
    });
  });

  // ---------------------------------------------------------------------------
  // ACTUALIZAR PREFERENCIAS DE NOTIFICACIÓN
  // ---------------------------------------------------------------------------
  fastify.patch('/notifications', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const { enablePush, enableEmail, daysBefore } = request.body as {
      enablePush?: boolean;
      enableEmail?: boolean;
      daysBefore?: number;
    };

    const existing = await db.query.userNotificationPrefs.findFirst({
      where: eq(userNotificationPrefs.userId, userId),
    });

    if (existing) {
      await db
        .update(userNotificationPrefs)
        .set({
          enablePush: enablePush !== undefined ? enablePush : existing.enablePush,
          enableEmail: enableEmail !== undefined ? enableEmail : existing.enableEmail,
          daysBefore: daysBefore !== undefined ? daysBefore : existing.daysBefore,
          updatedAt: new Date(),
        })
        .where(eq(userNotificationPrefs.userId, userId));
    } else {
      await db.insert(userNotificationPrefs).values({
        id: crypto.randomUUID(),
        userId,
        enablePush: enablePush !== undefined ? enablePush : true,
        enableEmail: enableEmail !== undefined ? enableEmail : true,
        daysBefore: daysBefore !== undefined ? daysBefore : 1,
      });
    }

    return reply.send({ message: 'Preferencias guardadas exitosamente' });
  });
};
