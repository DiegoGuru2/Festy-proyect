import nodemailer from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER || 'dismardxy@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'rxoj tshh bkge tzyz';
const SMTP_FROM = process.env.SMTP_FROM || 'Festy <dismardxy@gmail.com>';
const APP_URL = process.env.APP_URL || 'https://festy-web.vercel.app';

// Configuración de transporte Gmail SMTP
export const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER.replace(/\s+/g, ''),
    pass: SMTP_PASS.replace(/\s+/g, ''),
  },
});

/**
 * Plantilla base para correos con la identidad visual pastel y profesional de Festy
 */
function buildHtmlEmail(contentHtml: string): string {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Festy</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #FAF8FD; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C1E4A;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8FD; padding: 36px 12px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 14px 40px rgba(139, 92, 246, 0.09); border: 1px solid #EBE5F5;">
            <!-- Header con Suave Gradiente Pastel y Logo Festy -->
            <tr>
              <td align="center" style="padding: 34px 24px 26px; background: linear-gradient(135deg, #F5F0FF 0%, #FDF2F8 50%, #FEF9C3 100%); border-bottom: 1px solid #EFE8FA;">
                <div style="display: inline-block; background: #ffffff; padding: 10px 24px; border-radius: 999px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.1); border: 1px solid rgba(221, 214, 254, 0.7);">
                  <span style="font-size: 22px; font-weight: 800; color: #7E49F6; letter-spacing: -0.5px;">🎂 Festy</span>
                </div>
                <div style="margin-top: 10px; color: #6D5D80; font-size: 13px; font-weight: 600; letter-spacing: 0.2px;">
                  Calendario Familiar & Galería de Cumpleaños
                </div>
              </td>
            </tr>

            <!-- Contenido Principal -->
            <tr>
              <td style="padding: 38px 36px 30px;">
                ${contentHtml}
              </td>
            </tr>

            <!-- Footer Pastel -->
            <tr>
              <td style="padding: 24px 32px; background-color: #FAF8FD; border-top: 1px solid #EFE8FA; text-align: center;">
                <p style="margin: 0 0 6px; font-size: 13px; color: #6D5D80;">
                  © ${new Date().getFullYear()} Festy. Todos los derechos reservados.
                </p>
                <p style="margin: 0; font-size: 12px; font-weight: 700; color: #7E49F6; letter-spacing: 0.2px;">
                  Creado con ❤️ por Design Develops
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
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background: #F3E8FF; padding: 12px; border-radius: 50%; font-size: 28px;">
        🎉
      </span>
    </div>

    <h2 style="margin: 0 0 14px; font-size: 23px; font-weight: 800; color: #2C1E4A; text-align: center;">
      ¡Hola ${fullName}, bienvenido/a a Festy!
    </h2>
    <p style="margin: 0 0 22px; font-size: 15px; line-height: 1.65; color: #605274; text-align: center;">
      Tu cuenta familiar ha sido creada con éxito. A partir de hoy, nunca más olvidarás una fecha especial y podrás revivir los mejores recuerdos en tu galería colaborativa.
    </p>

    <!-- Tarjeta Suave Pastel de Círculo Familiar -->
    <div style="background: linear-gradient(135deg, #FAF5FF 0%, #FDF4FF 100%); border: 1px solid #E9D5FF; border-radius: 20px; padding: 22px; margin-bottom: 26px;">
      <div style="font-size: 13px; font-weight: 700; color: #7E49F6; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
        🏠 Círculo Familiar Inicial:
      </div>
      <div style="font-size: 19px; font-weight: 800; color: #2C1E4A; margin-bottom: 12px;">
        ${circleName || 'Familia'}
      </div>
      ${
        inviteCode
          ? `
        <div style="font-size: 13px; color: #605274;">
          Código de invitación para tus familiares: 
          <strong style="color: #BE185D; background: #FCE7F3; border: 1px solid #FBCFE8; padding: 4px 10px; border-radius: 8px; font-family: monospace; font-size: 14px; margin-left: 4px;">${inviteCode}</strong>
        </div>
      `
          : ''
      }
    </div>

    <div style="text-align: center; margin: 30px 0 12px;">
      <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 34px; border-radius: 999px; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.28);">
        Ir a mi Calendario Familiar →
      </a>
    </div>
  `;

  return emailTransporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: '🎉 ¡Bienvenido/a a Festy! Tu calendario familiar está listo',
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
    <div style="text-align: center; margin-bottom: 22px;">
      <span style="display: inline-block; background: #FEF3C7; color: #B45309; font-size: 30px; padding: 12px 18px; border-radius: 50%;">
        🔐
      </span>
    </div>
    <h2 style="margin: 0 0 14px; font-size: 22px; font-weight: 800; color: #2C1E4A; text-align: center;">
      Tu contraseña ha sido actualizada
    </h2>
    <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.65; color: #605274;">
      Hola <strong>${fullName}</strong>, te confirmamos que la contraseña de tu cuenta de <strong>Festy</strong> asociada a <strong>${to}</strong> acaba de ser modificada exitosamente.
    </p>

    <!-- Detalle de hora y fecha en tarjeta pastel suave -->
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 14px 18px; margin-bottom: 22px; font-size: 13px; color: #475569;">
      📅 <strong>Fecha y hora del cambio:</strong> ${nowStr}
    </div>

    <!-- Alerta de seguridad suave -->
    <div style="background: #FFF1F2; border-left: 4px solid #FB7185; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #9F1239;">
        <strong>¿No fuiste tú?</strong> Si no realizaste esta acción, te recomendamos restablecer tu acceso inmediatamente o responder a este correo para proteger tu cuenta.
      </p>
    </div>

    <div style="text-align: center; margin: 26px 0 10px;">
      <a href="${APP_URL}/profile" style="display: inline-block; background: #7E49F6; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 30px; border-radius: 999px; box-shadow: 0 4px 14px rgba(126, 73, 246, 0.25);">
        Ver mi Perfil en Festy
      </a>
    </div>
  `;

  return emailTransporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: '🔐 Festy: Notificación de seguridad - Contraseña actualizada',
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
  if (daysRemaining === 0) daysText = '¡HOY ES EL DÍA!';
  else if (daysRemaining === 1) daysText = '¡ES MAÑANA!';

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; font-size: 38px;">
        🎂
      </span>
    </div>
    <h2 style="margin: 0 0 10px; font-size: 23px; font-weight: 800; color: #2C1E4A; text-align: center;">
      ¡Se acerca un festejo especial!
    </h2>
    <p style="margin: 0 0 22px; font-size: 15px; line-height: 1.65; color: #605274; text-align: center;">
      Hola <strong>${recipientName}</strong>, recordatorio amistoso de tu círculo familiar <strong>${circleName}</strong>:
    </p>

    <!-- Tarjeta Pastel Festiva -->
    <div style="background: linear-gradient(135deg, #FDF2F8 0%, #FFF7ED 50%, #FAF5FF 100%); border: 1px solid #FBCFE8; border-radius: 22px; padding: 26px; text-align: center; margin-bottom: 24px; box-shadow: 0 6px 18px rgba(244, 114, 182, 0.08);">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #BE185D; margin-bottom: 8px;">
        Celebración de Cumpleaños
      </div>
      <div style="font-size: 26px; font-weight: 800; color: #2C1E4A; margin-bottom: 12px;">
        ${birthdayPersonName}
      </div>
      <div style="display: inline-block; background: #ffffff; padding: 8px 22px; border-radius: 999px; font-size: 15px; font-weight: 700; color: #BE185D; border: 1px solid #FCE7F3; box-shadow: 0 4px 12px rgba(244, 114, 182, 0.12);">
        📅 ${dateFormatted} · <span style="color: #7E49F6;">${daysText}</span>
      </div>
    </div>

    <p style="margin: 0 0 26px; font-size: 14px; line-height: 1.65; color: #605274; text-align: center;">
      ¡Prepara tu saludo, coordina con la familia y toma muchas fotos para subirlas al álbum compartido de Festy!
    </p>

    <div style="text-align: center; margin: 28px 0 12px;">
      <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 34px; border-radius: 999px; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.28);">
        Ver en Festy y Ver Álbum →
      </a>
    </div>
  `;

  return emailTransporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: `🎂 ¡Recordatorio: Cumpleaños de ${birthdayPersonName}! (${daysText})`,
    html: buildHtmlEmail(content),
  });
}
