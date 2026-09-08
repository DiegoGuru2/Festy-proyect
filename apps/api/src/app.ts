import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import authPlugin from './plugins/auth';
import { authRoutes } from './modules/auth/auth.routes';
import { circleRoutes } from './modules/circles/circles.routes';
import { birthdayRoutes } from './modules/birthdays/birthdays.routes';
import { mediaRoutes } from './modules/media/media.routes';
import { syncRoutes } from './modules/sync/sync.routes';
import {
  dispatchHourlyReminders,
  checkAndDispatchUpcomingBirthdayEmails,
} from './modules/reminders/reminders.worker';
import { getDbConnection, users } from '@festy/db';
import { sql } from 'drizzle-orm';

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Rate Limiter
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // JWT Auth Plugin
  await app.register(authPlugin);

  // Healthcheck con ping a BD
  app.get('/health', async (request, reply) => {
    try {
      const db = getDbConnection();
      await db.execute(sql`SELECT 1`);
      return reply.send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
      });
    } catch (err: any) {
      return reply.status(503).send({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: err.message,
      });
    }
  });

  // Dispatcher manual y automático de recordatorios
  app.post('/api/reminders/dispatch', async (request, reply) => {
    const hourly = await dispatchHourlyReminders();
    const upcoming = await checkAndDispatchUpcomingBirthdayEmails();
    return reply.send({
      message: 'Proceso de recordatorios y correos ejecutado con éxito',
      hourly,
      upcoming,
    });
  });

  app.post('/api/reminders/check-upcoming', async (request, reply) => {
    const result = await checkAndDispatchUpcomingBirthdayEmails([0, 1, 3, 7]);
    return reply.send({
      message: 'Verificación de cumpleaños cercanos completada',
      ...result,
    });
  });

  // Ejecutar verificación periódica en segundo plano cada 60 minutos
  setInterval(() => {
    app.log.info('[Scheduler] Ejecutando verificación periódica de cumpleaños...');
    checkAndDispatchUpcomingBirthdayEmails([0, 1, 3, 7]).catch((err) => {
      app.log.error(`[Scheduler Error] ${err.message}`);
    });
  }, 60 * 60 * 1000);

  // Registro de módulos
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(circleRoutes, { prefix: '/api/circles' });
  await app.register(birthdayRoutes, { prefix: '/api/birthdays' });
  await app.register(mediaRoutes, { prefix: '/api/media' });
  await app.register(syncRoutes, { prefix: '/api/sync' });

  return app;
}
