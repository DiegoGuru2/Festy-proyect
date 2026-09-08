import nodemailer from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER || 'dismardxy@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'rxojtshhbkgetzyz';
const SMTP_FROM = process.env.SMTP_FROM || '"Festy" <dismardxy@gmail.com>';

// Configuración de transporte Gmail SMTP
export const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Plantilla base para correos con la identidad visual pastel de Festy
 */
function buildHtmlEmail(contentHtml: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Festy</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #F8F6FB; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #231936;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F6FB; padding: 32px 12px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 36px rgba(144, 97, 249, 0.12); border: 1px solid #E9E0F3;">
            <!-- Header con Gradiente y Logo -->
            <tr>
              <td align="center" style="padding: 36px 24px 24px; background: linear-gradient(135deg, #7E49F6 0%, #EC4899 100%);">
                <div style="display: inline-block; background: #ffffff; padding: 12px 24px; border-radius: 999px; box-shadow: 0 6px 18px rgba(0,0,0,0.15);">
                  <span style="font-size: 26px; font-weight: 800; color: #7E49F6; letter-spacing: -0.5px; font-family: sans-serif;">🎂 Festy</span>
                </div>
                <div style="margin-top: 10px; color: #ffffff; font-size: 14px; font-weight: 500; opacity: 0.95;">
                  Calendario Familiar & Recuerdos Colaborativos
                </div>
              </td>
            </tr>

            <!-- Contenido Principal -->
            <tr>
              <td style="padding: 36px 32px 28px;">
                ${contentHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 32px; background-color: #FAF5FF; border-top: 1px solid #E9E0F3; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #5C5272;">
                  © ${new Date().getFullYear()} Festy. Todos los derechos reservados.
                </p>
                <p style="margin: 0; font-size: 12px; font-weight: 700; color: #7E49F6;">
                  Creado por Design Develops ❤️
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * 1. Correo de Bienvenida al Registrarse
 */
export async function sendWelcomeEmail(options: {
  to: string;
  fullName: string;
  circleName?: string;
  inviteCode?: string;
}) {
  const { to, fullName, circleName, inviteCode } = options;

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 800; color: #231936;">
      ¡Hola ${fullName}, bienvenido a la familia Festy! 🎉
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #5C5272;">
      Tu cuenta ha sido creada exitosamente. A partir de hoy, nunca más olvidarás el cumpleaños de alguien importante y podrás compartir recuerdos fotográficos de cada fiesta en la nube.
    </p>

    <div style="background: #FAF5FF; border: 1px solid #DDD6FE; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 14px; font-weight: 700; color: #7E49F6; margin-bottom: 6px;">
        🏠 Círculo Familiar Asignado:
      </div>
      <div style="font-size: 18px; font-weight: 800; color: #231936; margin-bottom: 12px;">
        ${circleName || 'Familia'}
      </div>
      ${
        inviteCode
          ? `
        <div style="font-size: 13px; color: #5C5272;">
          Código de invitación para tus familiares: <strong style="color: #EC4899; background: #FCE7F3; padding: 3px 8px; border-radius: 6px;">${inviteCode}</strong>
        </div>
      `
          : ''
      }
    </div>

    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="http://localhost:3000" style="display: inline-block; background: linear-gradient(135deg, #7E49F6 0%, #EC4899 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 999px; box-shadow: 0 8px 20px rgba(126, 73, 246, 0.35);">
        Ir a mi Calendario Familiar →
      </a>
    </div>
  `;

  return emailTransporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: '🎉 ¡Bienvenido a Festy! Tu calendario familiar está listo',
    html: buildHtmlEmail(content),
  });
}

/**
 * 2. Correo de Notificación de Cambio de Contraseña
 */
export async function sendPasswordChangedEmail(options: {
  to: string;
  fullName: string;
}) {
  const { to, fullName } = options;
  const nowStr = new Date().toLocaleString('es-ES', { timeZone: 'America/Guayaquil', dateStyle: 'long', timeStyle: 'short' });

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background: #FEF3C7; color: #D97706; font-size: 32px; padding: 12px 18px; border-radius: 50%;">
        🔐
      </span>
    </div>
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #231936; text-align: center;">
      Actualización de Seguridad en tu Cuenta
    </h2>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #5C5272;">
      Hola <strong>${fullName}</strong>, te informamos que la contraseña de tu cuenta de <strong>Festy</strong> asociada a <strong>${to}</strong> acaba de ser actualizada con éxito.
    </p>

    <div style="background: #F3F4F6; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; color: #4B5563;">
      📅 <strong>Fecha y hora:</strong> ${nowStr}
    </div>

    <div style="background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #991B1B;">
        <strong>¿No reconoces esta actividad?</strong> Si tú no realizaste este cambio, por favor contáctanos de inmediato para asegurar tu cuenta.
      </p>
    </div>

    <div style="text-align: center; margin: 24px 0 12px;">
      <a href="http://localhost:3000/profile" style="display: inline-block; background: #7E49F6; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 999px;">
        Ver mi Perfil en Festy
      </a>
    </div>
  `;

  return emailTransporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: '🔐 Festy: Tu contraseña ha sido actualizada',
    html: buildHtmlEmail(content),
  });
}

/**
 * 3. Correo de Recordatorio de Cumpleaños Cercano
 */
export async function sendBirthdayReminderEmail(options: {
  to: string;
  recipientName: string;
  birthdayPersonName: string;
  birthDay: number;
  birthMonth: number;
  daysRemaining: number;
  circleName: string;
}) {
  const { to, recipientName, birthdayPersonName, birthDay, birthMonth, daysRemaining, circleName } = options;

  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const dateFormatted = `${birthDay} de ${monthNames[birthMonth - 1]}`;

  let daysText = `en ${daysRemaining} días`;
  if (daysRemaining === 0) daysText = '¡HOY!';
  else if (daysRemaining === 1) daysText = '¡MAÑANA!';

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; font-size: 40px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.1));">
        🎂
      </span>
    </div>
    <h2 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #231936; text-align: center;">
      ¡Se acerca un cumpleaños especial!
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #5C5272; text-align: center;">
      Hola <strong>${recipientName}</strong>, este es un recordatorio de tu círculo familiar <strong>${circleName}</strong>.
    </p>

    <div style="background: linear-gradient(135deg, #FAF5FF 0%, #FCE7F3 100%); border: 1px solid #DDD6FE; border-radius: 20px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #7E49F6; margin-bottom: 6px;">
        Cumpleañero / Cumpleañera
      </div>
      <div style="font-size: 26px; font-weight: 800; color: #231936; margin-bottom: 10px;">
        ${birthdayPersonName}
      </div>
      <div style="display: inline-block; background: #ffffff; padding: 6px 16px; border-radius: 999px; font-size: 15px; font-weight: 700; color: #BE185D; box-shadow: 0 2px 8px rgba(190, 24, 93, 0.15);">
        📅 ${dateFormatted} (${daysText})
      </div>
    </div>

    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #5C5272; text-align: center;">
      ¡Prepárate con tu felicitación o regalo, y no olvides tomar muchas fotos para subirlas al álbum colaborativo de Festy!
    </p>

    <div style="text-align: center; margin: 28px 0 12px;">
      <a href="http://localhost:3000" style="display: inline-block; background: linear-gradient(135deg, #7E49F6 0%, #EC4899 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 999px; box-shadow: 0 8px 20px rgba(126, 73, 246, 0.35);">
        Ver en Festy y Subir Fotos →
      </a>
    </div>
  `;

  return emailTransporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: `🎂 ¡Recordatorio: Se acerca el cumpleaños de ${birthdayPersonName}! (${daysText})`,
    html: buildHtmlEmail(content),
  });
}
