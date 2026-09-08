import { DateTime } from 'luxon';
import crypto from 'crypto';
import { eq, and, sql, inArray } from 'drizzle-orm';
import {
  getDbConnection,
  users,
  userNotificationPrefs,
  circleMembers,
  circles,
  birthdays,
  reminderDispatchLogs,
} from '@festy/db';
import { sendBirthdayReminderEmail } from '../email/email.service';

/**
 * 1. Despacho horario basado en zona horaria y preferencias del usuario
 */
export async function dispatchHourlyReminders(): Promise<{ evaluatedUsers: number; queuedReminders: number }> {
  const db = getDbConnection();
  const nowUtc = DateTime.utc();

  // 1. Obtener todas las zonas horarias distintas de los usuarios activos
  const activeTimezones = await db
    .selectDistinct({ timezone: users.timezone })
    .from(users)
    .where(sql`${users.deletedAt} IS NULL`);

  let queuedReminders = 0;
  let evaluatedUsers = 0;

  for (const { timezone } of activeTimezones) {
    if (!timezone || !DateTime.now().setZone(timezone).isValid) continue;

    // Calcular la hora local actual en esa zona IANA
    const userLocalTime = nowUtc.setZone(timezone);
    const currentHour = userLocalTime.hour; // 0..23

    // 2. Buscar usuarios en esta zona cuya hora preferida coincida con esta hora
    const candidateUsers = await db
      .select({
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
        preferredTime: userNotificationPrefs.preferredTime,
        daysBefore: userNotificationPrefs.daysBefore,
        enablePush: userNotificationPrefs.enablePush,
        enableEmail: userNotificationPrefs.enableEmail,
      })
      .from(users)
      .innerJoin(userNotificationPrefs, eq(userNotificationPrefs.userId, users.id))
      .where(
        and(
          eq(users.timezone, timezone),
          sql`${users.deletedAt} IS NULL`,
          sql`HOUR(${userNotificationPrefs.preferredTime}) = ${currentHour}`
        )
      );

    evaluatedUsers += candidateUsers.length;

    for (const candidate of candidateUsers) {
      const targetDate = userLocalTime.plus({ days: candidate.daysBefore });
      const targetDay = targetDate.day;
      const targetMonth = targetDate.month;
      const targetYear = targetDate.year;

      // 3. Buscar cumpleaños en los círculos a los que pertenece el usuario
      const upcomingBirthdays = await db
        .select({
          birthdayId: birthdays.id,
          fullName: birthdays.fullName,
          birthDay: birthdays.birthDay,
          birthMonth: birthdays.birthMonth,
          circleId: birthdays.circleId,
          circleName: circles.name,
        })
        .from(circleMembers)
        .innerJoin(birthdays, eq(birthdays.circleId, circleMembers.circleId))
        .innerJoin(circles, eq(circles.id, circleMembers.circleId))
        .where(
          and(
            eq(circleMembers.userId, candidate.userId),
            eq(birthdays.birthDay, targetDay),
            eq(birthdays.birthMonth, targetMonth),
            sql`${birthdays.deletedAt} IS NULL`
          )
        );

      for (const bday of upcomingBirthdays) {
        // Despacho por Correo si está habilitado
        if (candidate.enableEmail && candidate.email) {
          const emailSent = await db.query.reminderDispatchLogs.findFirst({
            where: and(
              eq(reminderDispatchLogs.userId, candidate.userId),
              eq(reminderDispatchLogs.birthdayId, bday.birthdayId),
              eq(reminderDispatchLogs.year, targetYear),
              eq(reminderDispatchLogs.daysBefore, candidate.daysBefore),
              eq(reminderDispatchLogs.channel, 'email')
            ),
          });

          if (!emailSent) {
            try {
              await sendBirthdayReminderEmail({
                to: candidate.email,
                recipientName: candidate.fullName,
                birthdayPersonName: bday.fullName,
                birthDay: bday.birthDay,
                birthMonth: bday.birthMonth,
                daysRemaining: candidate.daysBefore,
                circleName: bday.circleName || 'Familia',
              });

              await db.insert(reminderDispatchLogs).values({
                id: crypto.randomUUID(),
                userId: candidate.userId,
                birthdayId: bday.birthdayId,
                celebrationId: 'none',
                year: targetYear,
                daysBefore: candidate.daysBefore,
                channel: 'email',
                status: 'sent',
                sentAt: new Date(),
              });

              queuedReminders++;
            } catch (err: any) {
              console.error(`[Reminder Error] Falló envío de correo a ${candidate.email}:`, err.message);
            }
          }
        }

        // Despacho por Push
        if (candidate.enablePush) {
          const pushSent = await db.query.reminderDispatchLogs.findFirst({
            where: and(
              eq(reminderDispatchLogs.userId, candidate.userId),
              eq(reminderDispatchLogs.birthdayId, bday.birthdayId),
              eq(reminderDispatchLogs.year, targetYear),
              eq(reminderDispatchLogs.daysBefore, candidate.daysBefore),
              eq(reminderDispatchLogs.channel, 'push')
            ),
          });

          if (!pushSent) {
            await db.insert(reminderDispatchLogs).values({
              id: crypto.randomUUID(),
              userId: candidate.userId,
              birthdayId: bday.birthdayId,
              celebrationId: 'none',
              year: targetYear,
              daysBefore: candidate.daysBefore,
              channel: 'push',
              status: 'sent',
              sentAt: new Date(),
            });
            queuedReminders++;
          }
        }
      }
    }
  }

  return { evaluatedUsers, queuedReminders };
}

/**
 * 2. Despacho global inteligente: evalúa cumpleaños que ocurren en los próximos X días (0..7 días)
 * para todos los usuarios activos y envía correos recordatorios automáticamente.
 */
export async function checkAndDispatchUpcomingBirthdayEmails(daysAheadList: number[] = [0, 1, 3, 7]): Promise<{
  checkedUsers: number;
  emailsSent: number;
  details: any[];
}> {
  const db = getDbConnection();
  const now = DateTime.now();
  const currentYear = now.year;

  let emailsSent = 0;
  const details: any[] = [];

  // Obtener usuarios activos con sus círculos
  const members = await db
    .select({
      userId: users.id,
      email: users.email,
      fullName: users.fullName,
      circleId: circleMembers.circleId,
      circleName: circles.name,
      enableEmail: userNotificationPrefs.enableEmail,
    })
    .from(circleMembers)
    .innerJoin(users, eq(users.id, circleMembers.userId))
    .innerJoin(circles, eq(circles.id, circleMembers.circleId))
    .leftJoin(userNotificationPrefs, eq(userNotificationPrefs.userId, users.id))
    .where(sql`${users.deletedAt} IS NULL`);

  for (const daysAhead of daysAheadList) {
    const targetDate = now.plus({ days: daysAhead });
    const targetDay = targetDate.day;
    const targetMonth = targetDate.month;

    for (const member of members) {
      // Si el usuario no tiene desactivado el correo (null o true = true)
      const emailAllowed = member.enableEmail !== false;
      if (!emailAllowed || !member.email) continue;

      // Buscar cumpleaños en el círculo del usuario para la fecha objetivo
      const bdays = await db
        .select({
          birthdayId: birthdays.id,
          fullName: birthdays.fullName,
          birthDay: birthdays.birthDay,
          birthMonth: birthdays.birthMonth,
        })
        .from(birthdays)
        .where(
          and(
            eq(birthdays.circleId, member.circleId),
            eq(birthdays.birthDay, targetDay),
            eq(birthdays.birthMonth, targetMonth),
            sql`${birthdays.deletedAt} IS NULL`
          )
        );

      for (const bday of bdays) {
        // Evitar enviar recordatorio al mismo cumpleañero sobre sí mismo si es el mismo nombre/usuario
        // Verificar si ya se envió el recordatorio para este año y daysAhead
        const alreadySent = await db.query.reminderDispatchLogs.findFirst({
          where: and(
            eq(reminderDispatchLogs.userId, member.userId),
            eq(reminderDispatchLogs.birthdayId, bday.birthdayId),
            eq(reminderDispatchLogs.year, currentYear),
            eq(reminderDispatchLogs.daysBefore, daysAhead),
            eq(reminderDispatchLogs.channel, 'email')
          ),
        });

        if (!alreadySent) {
          try {
            await sendBirthdayReminderEmail({
              to: member.email,
              recipientName: member.fullName,
              birthdayPersonName: bday.fullName,
              birthDay: bday.birthDay,
              birthMonth: bday.birthMonth,
              daysRemaining: daysAhead,
              circleName: member.circleName || 'Familia',
            });

            await db.insert(reminderDispatchLogs).values({
              id: crypto.randomUUID(),
              userId: member.userId,
              birthdayId: bday.birthdayId,
              celebrationId: 'none',
              year: currentYear,
              daysBefore: daysAhead,
              channel: 'email',
              status: 'sent',
              sentAt: new Date(),
            });

            emailsSent++;
            details.push({
              to: member.email,
              birthdayPerson: bday.fullName,
              daysAhead,
              circle: member.circleName,
            });
          } catch (err: any) {
            console.error(`[Reminder Error] Falló envío de recordatorio a ${member.email}:`, err.message);
          }
        }
      }
    }
  }

  return { checkedUsers: members.length, emailsSent, details };
}
