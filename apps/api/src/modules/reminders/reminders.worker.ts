import { DateTime } from 'luxon';
import crypto from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import {
  getDbConnection,
  users,
  userNotificationPrefs,
  circleMembers,
  birthdays,
  reminderDispatchLogs,
  userDeviceTokens,
} from '@festy/db';

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
          // Evaluar si la hora coincide (ej: 09:00:00)
          sql`HOUR(${userNotificationPrefs.preferredTime}) = ${currentHour}`
        )
      );

    evaluatedUsers += candidateUsers.length;

    for (const candidate of candidateUsers) {
      // Calcular la fecha objetivo de cumpleaños (hoy + daysBefore)
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
        })
        .from(circleMembers)
        .innerJoin(birthdays, eq(birthdays.circleId, circleMembers.circleId))
        .where(
          and(
            eq(circleMembers.userId, candidate.userId),
            eq(birthdays.birthDay, targetDay),
            eq(birthdays.birthMonth, targetMonth),
            sql`${birthdays.deletedAt} IS NULL`
          )
        );

      for (const bday of upcomingBirthdays) {
        // 4. Comprobar deduplicación para evitar envíos duplicados en reminder_dispatch_logs
        const alreadySent = await db.query.reminderDispatchLogs.findFirst({
          where: and(
            eq(reminderDispatchLogs.userId, candidate.userId),
            eq(reminderDispatchLogs.birthdayId, bday.birthdayId),
            eq(reminderDispatchLogs.year, targetYear),
            eq(reminderDispatchLogs.daysBefore, candidate.daysBefore),
            eq(reminderDispatchLogs.channel, 'push')
          ),
        });

        if (!alreadySent) {
          // Registrar despacho y encolar notificación
          await db.insert(reminderDispatchLogs).values({
            id: crypto.randomUUID(),
            userId: candidate.userId,
            birthdayId: bday.birthdayId,
            celebrationId: null,
            celebrationIdNorm: 'none',
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

  return { evaluatedUsers, queuedReminders };
}
