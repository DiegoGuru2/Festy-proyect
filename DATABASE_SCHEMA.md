# Diccionario y Esquema de Base de Datos: Festy (v2.3)

Documento técnico de referencia para la base de datos **TiDB Cloud / MySQL 8.0** de la plataforma Festy. Incluye el script DDL completo, diccionario de datos de todas las entidades, índices de alto rendimiento, código TypeScript para **Drizzle ORM** y patrones de consulta optimizados.

---

## 1. Convenciones Generales
- **Motor / Compatibilidad**: TiDB Cloud Serverless / MySQL 8.0 InnoDB.
- **Charset & Collation**: `utf8mb4` con `utf8mb4_unicode_ci` (soporte completo de emojis para captions, nombres y comentarios).
- **Identificadores (PK)**: `VARCHAR(36)` almacenando UUID v4 o UUID v7 para ordenamiento temporal.
- **Auditoría Estándar**: Todas las tablas transaccionales incluyen:
  - `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
  - `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  - `deleted_at DATETIME NULL` (Soft Delete)
- **Zonas Horarias**: Fechas y horas registradas en **UTC estricto** en el motor; la visualización y disparo de recordatorios se adaptan a la zona horaria IANA del usuario.

---

## 2. Script DDL Completo para TiDB / MySQL

```sql
-- =============================================================================
-- BASE DE DATOS: FESTY
-- =============================================================================
CREATE DATABASE IF NOT EXISTS festy_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE festy_db;

-- -----------------------------------------------------------------------------
-- 1. TABLA: USERS (Usuarios del sistema)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL COMMENT 'NULL si el usuario se registró por Google OAuth',
  full_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC' COMMENT 'Zona horaria IANA: ej. America/Guayaquil, America/New_York',
  email_verified_at DATETIME NULL COMMENT 'NULL si el usuario no ha verificado su correo',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLA: USER_DEVICE_TOKENS (Dispositivos registrados para Push FCM)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_device_tokens (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  fcm_token VARCHAR(500) NOT NULL,
  platform ENUM('ios', 'android', 'web') NOT NULL,
  device_name VARCHAR(100) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Pasa a FALSE en logout o fallo FCM',
  last_used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_device_token (fcm_token(255)),
  CONSTRAINT fk_device_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: USER_NOTIFICATION_PREFS (Preferencias de recordatorios)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_notification_prefs (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  enable_push BOOLEAN NOT NULL DEFAULT TRUE,
  enable_email BOOLEAN NOT NULL DEFAULT TRUE,
  enable_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  days_before INT NOT NULL DEFAULT 1 COMMENT '0=mismo día, 1=1 día antes, 7=semana antes',
  preferred_time TIME NOT NULL DEFAULT '09:00:00' COMMENT 'Hora local en la zona horaria del usuario',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_prefs (user_id),
  CONSTRAINT fk_notif_prefs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLA: CIRCLES (Grupos de cumpleaños: Familia, Trabajo, Amigos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS circles (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_circles_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA: CIRCLE_MEMBERS (Membresías y Roles dentro del Círculo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS circle_members (
  id VARCHAR(36) NOT NULL,
  circle_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('owner', 'admin', 'member', 'viewer') NOT NULL DEFAULT 'member',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_circle_member (circle_id, user_id),
  CONSTRAINT fk_members_circle FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE,
  CONSTRAINT fk_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA: CIRCLE_INVITATIONS (Invitaciones por enlace seguro o código manual)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS circle_invitations (
  id VARCHAR(36) NOT NULL,
  circle_id VARCHAR(36) NOT NULL,
  invited_by VARCHAR(36) NOT NULL,
  invite_type ENUM('universal_link', 'direct_code', 'direct_email') NOT NULL,
  invitee_email VARCHAR(255) NULL COMMENT 'NULL si es enlace grupal abierto',
  invite_code VARCHAR(12) NOT NULL COMMENT 'Código corto manual: ej. FESTY-8K92',
  token_hash VARCHAR(255) NOT NULL COMMENT 'SHA-256 del token para links universales',
  role ENUM('admin', 'member', 'viewer') NOT NULL DEFAULT 'member',
  max_uses INT NOT NULL DEFAULT 1 COMMENT '1 para uso único, >1 para enlaces grupales',
  uses_count INT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  status ENUM('active', 'exhausted', 'revoked', 'expired') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invitation_code (invite_code),
  UNIQUE KEY uq_invitation_token (token_hash),
  CONSTRAINT fk_invitations_circle FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE,
  CONSTRAINT fk_invitations_inviter FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. TABLA: BIRTHDAYS (Cumpleaños registrados en un círculo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS birthdays (
  id VARCHAR(36) NOT NULL,
  circle_id VARCHAR(36) NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  linked_user_id VARCHAR(36) NULL COMMENT 'Usuario real tras proceso de Claim',
  is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  full_name VARCHAR(150) NOT NULL,
  contact_email VARCHAR(255) NULL COMMENT 'Email de contacto para matching de claim',
  birth_day TINYINT UNSIGNED NOT NULL COMMENT 'Día 1-31',
  birth_month TINYINT UNSIGNED NOT NULL COMMENT 'Mes 1-12',
  birth_year SMALLINT UNSIGNED NULL COMMENT 'Año opcional para cálculo de edad',
  is_minor BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Protección y moderación infantil estricta',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_birthdays_circle FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE,
  CONSTRAINT fk_birthdays_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_birthdays_linked_user FOREIGN KEY (linked_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. TABLA: BIRTHDAY_CLAIM_REQUESTS (Solicitudes de vinculación de perfil)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS birthday_claim_requests (
  id VARCHAR(36) NOT NULL,
  birthday_id VARCHAR(36) NOT NULL,
  claimant_user_id VARCHAR(36) NOT NULL,
  reviewed_by_admin_id VARCHAR(36) NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_claim_birthday FOREIGN KEY (birthday_id) REFERENCES birthdays(id) ON DELETE CASCADE,
  CONSTRAINT fk_claim_claimant FOREIGN KEY (claimant_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_claim_reviewer FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. TABLA: CELEBRATIONS (Fiestas y eventos asociados a un cumpleaños)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS celebrations (
  id VARCHAR(36) NOT NULL,
  birthday_id VARCHAR(36) NOT NULL,
  celebration_year SMALLINT UNSIGNED NOT NULL COMMENT 'Año del evento (ej. 2026)',
  title VARCHAR(200) NOT NULL,
  event_date DATETIME NOT NULL,
  location VARCHAR(255) NULL,
  visibility ENUM('circle_public', 'admins_only', 'private') NOT NULL DEFAULT 'circle_public',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_celebrations_birthday FOREIGN KEY (birthday_id) REFERENCES birthdays(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. TABLA: EVENT_PHOTOS (Galería multimedia con Cloudinary)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_photos (
  id VARCHAR(36) NOT NULL,
  celebration_id VARCHAR(36) NOT NULL,
  uploaded_by VARCHAR(36) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  secure_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255) NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  format VARCHAR(10) NULL COMMENT 'webp, jpg, png, heic',
  size_bytes INT UNSIGNED NULL,
  contains_minors BOOLEAN NOT NULL DEFAULT FALSE,
  visibility ENUM('inherit_celebration', 'private', 'circle_public') NOT NULL DEFAULT 'inherit_celebration',
  moderation_status ENUM('approved', 'pending_review', 'rejected', 'hidden') NOT NULL DEFAULT 'approved',
  reports_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Auto-oculta si >= 3',
  likes_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Denormalizado atómicamente',
  comments_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Denormalizado atómicamente',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_photos_celebration FOREIGN KEY (celebration_id) REFERENCES celebrations(id) ON DELETE CASCADE,
  CONSTRAINT fk_photos_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. TABLA: PHOTO_LIKES (Likes de usuarios en fotos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS photo_likes (
  id VARCHAR(36) NOT NULL,
  photo_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_photo_user_like (photo_id, user_id),
  CONSTRAINT fk_likes_photo FOREIGN KEY (photo_id) REFERENCES event_photos(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. TABLA: PHOTO_COMMENTS (Comentarios sociales en fotos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS photo_comments (
  id VARCHAR(36) NOT NULL,
  photo_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_comments_photo FOREIGN KEY (photo_id) REFERENCES event_photos(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. TABLA: PHOTO_REPORTS (Reportes comunitarios de moderación)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS photo_reports (
  id VARCHAR(36) NOT NULL,
  photo_id VARCHAR(36) NOT NULL,
  reported_by VARCHAR(36) NOT NULL,
  reason VARCHAR(100) NOT NULL COMMENT 'inappropriate, child_safety, copyright, other',
  status ENUM('open', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
  resolved_by VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_reports_photo FOREIGN KEY (photo_id) REFERENCES event_photos(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_resolver FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. TABLA: REMINDER_DISPATCH_LOGS (Trazabilidad y Deduplicación de Recordatorios)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminder_dispatch_logs (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  birthday_id VARCHAR(36) NOT NULL,
  celebration_id VARCHAR(36) NOT NULL DEFAULT 'none' COMMENT 'ID de celebración o "none" para natalicio',
  year SMALLINT UNSIGNED NOT NULL,
  days_before TINYINT NOT NULL,
  channel ENUM('push', 'email', 'whatsapp') NOT NULL,
  status ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reminder_dispatch (user_id, birthday_id, celebration_id, year, days_before, channel),
  CONSTRAINT fk_reminder_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reminder_birthday FOREIGN KEY (birthday_id) REFERENCES birthdays(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ÍNDICES DE RENDIMIENTO ADICIONALES
-- =============================================================================

-- Despacho de cron: usuarios por zona horaria
CREATE INDEX idx_users_tz_active ON users (timezone, deleted_at);

-- Búsqueda de cumpleaños próximos sin full-scan
CREATE INDEX idx_birthdays_upcoming ON birthdays (birth_month, birth_day, deleted_at);
CREATE INDEX idx_birthdays_circle ON birthdays (circle_id, deleted_at);
CREATE INDEX idx_birthdays_contact_email ON birthdays (contact_email);

-- Dispositivos Push activos
CREATE INDEX idx_device_tokens_lookup ON user_device_tokens (user_id, is_active);

-- Sincronización Delta paginada (Offline-first Flutter)
CREATE INDEX idx_birthdays_sync ON birthdays (circle_id, updated_at, deleted_at);
CREATE INDEX idx_celebrations_sync ON celebrations (birthday_id, updated_at, deleted_at);
CREATE INDEX idx_photos_sync ON event_photos (celebration_id, updated_at, deleted_at);
```

---

## 3. Diccionario de Datos por Entidad

### 3.1. `users`
| Columna | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | NO | Clave primaria (UUID v4). |
| `email` | VARCHAR(255) | NO | Correo electrónico único del usuario. |
| `password_hash` | VARCHAR(255) | SÍ | Hash bcrypt/argon2. NULL si se registró con Google. |
| `full_name` | VARCHAR(100) | NO | Nombre público del usuario. |
| `avatar_url` | VARCHAR(500) | SÍ | URL de avatar en Cloudinary o Google. |
| `timezone` | VARCHAR(50) | NO | Identificador IANA (ej: `America/Guayaquil`). Base para el cron. |
| `email_verified_at` | DATETIME | SÍ | Timestamp de verificación de email. Obligatorio para invitar. |

### 3.2. `user_device_tokens`
| Columna | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | NO | Clave primaria. |
| `user_id` | VARCHAR(36) | NO | FK hacia `users.id`. |
| `fcm_token` | VARCHAR(500) | NO | Token de registro de Firebase Cloud Messaging. |
| `platform` | ENUM | NO | `ios`, `android`, `web`. |
| `is_active` | BOOLEAN | NO | Se conmuta a `FALSE` en logout o fallo `NotRegistered`. |

### 3.3. `circle_invitations`
| Columna | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `invite_type` | ENUM | NO | `universal_link`, `direct_code`, `direct_email`. |
| `invite_code` | VARCHAR(12) | NO | Código corto legible (ej: `FESTY-8K92`). |
| `token_hash` | VARCHAR(255) | NO | Hash SHA-256 del token criptográfico de URL. |
| `status` | ENUM | NO | `active` (usable), `exhausted` (cupos llenos), `revoked`, `expired`. |

### 3.4. `birthdays`
| Columna | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `circle_id` | VARCHAR(36) | NO | Círculo propietario del cumpleaños. |
| `linked_user_id` | VARCHAR(36) | SÍ | FK a `users.id` tras completar el proceso de claim. |
| `is_claimed` | BOOLEAN | NO | `TRUE` si el perfil ya fue reclamado por su usuario real. |
| `contact_email` | VARCHAR(255) | SÍ | Correo sugerido para matching automático. |
| `birth_day` / `month` | TINYINT | NO | Componentes de fecha para consultas anuales. |
| `is_minor` | BOOLEAN | NO | Protección reforzada de privacidad y moderación infantil. |

### 3.5. `event_photos`
| Columna | Tipo | Nulo | Descripción |
| :--- | :--- | :--- | :--- |
| `cloudinary_public_id` | VARCHAR(255) | NO | ID de Cloudinary para transformaciones al vuelo (`c_thumb,g_face`). |
| `secure_url` | VARCHAR(500) | NO | URL HTTPS de entrega CDN. |
| `reports_count` | INT | NO | Conteo de reportes. Si >= 3 pasa a `hidden` automáticamente. |
| `likes_count` / `comments_count` | INT | NO | Contadores denormalizados mediante transacciones atómicas. |

---

## 4. Patrones de Consulta Críticos

### 4.1. Cron Horario de Cumpleaños Próximos (Timezone-Aware)
```sql
-- Ejecutado a minuto :00 UTC
-- Busca usuarios donde ahora son las 09:00 AM y tienen cumpleaños en N días
SELECT 
  u.id AS user_id,
  u.email,
  u.full_name,
  b.id AS birthday_id,
  b.full_name AS birthday_name,
  b.birth_day,
  b.birth_month
FROM users u
INNER JOIN user_notification_prefs p ON p.user_id = u.id
INNER JOIN circle_members cm ON cm.user_id = u.id
INNER JOIN birthdays b ON b.circle_id = cm.circle_id AND b.deleted_at IS NULL
WHERE u.deleted_at IS NULL
  -- Compara hora local del usuario en su zona IANA
  AND HOUR(CONVERT_TZ(NOW(), 'UTC', u.timezone)) = HOUR(p.preferred_time)
  -- Cumpleaños de hoy (days_before = 0)
  AND b.birth_month = MONTH(CONVERT_TZ(NOW(), 'UTC', u.timezone))
  AND b.birth_day = DAY(CONVERT_TZ(NOW(), 'UTC', u.timezone))
  -- Excluye envíos ya realizados hoy
  AND NOT EXISTS (
    SELECT 1 FROM reminder_dispatch_logs r
    WHERE r.user_id = u.id 
      AND r.birthday_id = b.id 
      AND r.year = YEAR(CONVERT_TZ(NOW(), 'UTC', u.timezone))
      AND r.days_before = 0
  );
```

### 4.2. Sincronización Delta Paginada (Flutter Offline)
```sql
SELECT id, circle_id, full_name, birth_day, birth_month, birth_year, is_claimed, updated_at, deleted_at
FROM birthdays
WHERE circle_id IN (SELECT circle_id FROM circle_members WHERE user_id = :userId)
  AND updated_at > :since
ORDER BY updated_at ASC, id ASC
LIMIT :limit;
```
