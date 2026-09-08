-- =============================================================================
-- FESTY: SCRIPT DDL COMPLETO PARA TIDB CLOUD
-- =============================================================================

CREATE DATABASE IF NOT EXISTS festy_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE festy_db;

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  email_verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_tz_active (timezone, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USER_DEVICE_TOKENS
CREATE TABLE IF NOT EXISTS user_device_tokens (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  fcm_token VARCHAR(500) NOT NULL,
  platform ENUM('ios', 'android', 'web') NOT NULL,
  device_name VARCHAR(100) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_device_token (fcm_token(255)),
  INDEX idx_device_tokens_lookup (user_id, is_active),
  CONSTRAINT fk_device_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. USER_NOTIFICATION_PREFS
CREATE TABLE IF NOT EXISTS user_notification_prefs (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  enable_push BOOLEAN NOT NULL DEFAULT TRUE,
  enable_email BOOLEAN NOT NULL DEFAULT TRUE,
  enable_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  days_before INT NOT NULL DEFAULT 1,
  preferred_time TIME NOT NULL DEFAULT '09:00:00',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_prefs (user_id),
  CONSTRAINT fk_notif_prefs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CIRCLES
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

-- 5. CIRCLE_MEMBERS
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

-- 6. CIRCLE_INVITATIONS
CREATE TABLE IF NOT EXISTS circle_invitations (
  id VARCHAR(36) NOT NULL,
  circle_id VARCHAR(36) NOT NULL,
  invited_by VARCHAR(36) NOT NULL,
  invite_type ENUM('universal_link', 'direct_code', 'direct_email') NOT NULL,
  invitee_email VARCHAR(255) NULL,
  invite_code VARCHAR(12) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'member', 'viewer') NOT NULL DEFAULT 'member',
  max_uses INT NOT NULL DEFAULT 1,
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

-- 7. BIRTHDAYS
CREATE TABLE IF NOT EXISTS birthdays (
  id VARCHAR(36) NOT NULL,
  circle_id VARCHAR(36) NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  linked_user_id VARCHAR(36) NULL,
  is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  full_name VARCHAR(150) NOT NULL,
  contact_email VARCHAR(255) NULL,
  birth_day TINYINT UNSIGNED NOT NULL,
  birth_month TINYINT UNSIGNED NOT NULL,
  birth_year SMALLINT UNSIGNED NULL,
  is_minor BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  INDEX idx_birthdays_upcoming (birth_month, birth_day, deleted_at),
  INDEX idx_birthdays_circle (circle_id, deleted_at),
  INDEX idx_birthdays_contact_email (contact_email),
  INDEX idx_birthdays_sync (circle_id, updated_at, deleted_at),
  CONSTRAINT fk_birthdays_circle FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE,
  CONSTRAINT fk_birthdays_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_birthdays_linked_user FOREIGN KEY (linked_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BIRTHDAY_CLAIM_REQUESTS
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

-- 9. CELEBRATIONS
CREATE TABLE IF NOT EXISTS celebrations (
  id VARCHAR(36) NOT NULL,
  birthday_id VARCHAR(36) NOT NULL,
  celebration_year SMALLINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  event_date DATETIME NOT NULL,
  location VARCHAR(255) NULL,
  visibility ENUM('circle_public', 'admins_only', 'private') NOT NULL DEFAULT 'circle_public',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  INDEX idx_celebrations_sync (birthday_id, updated_at, deleted_at),
  CONSTRAINT fk_celebrations_birthday FOREIGN KEY (birthday_id) REFERENCES birthdays(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. EVENT_PHOTOS
CREATE TABLE IF NOT EXISTS event_photos (
  id VARCHAR(36) NOT NULL,
  celebration_id VARCHAR(36) NOT NULL,
  uploaded_by VARCHAR(36) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  secure_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255) NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  format VARCHAR(10) NULL,
  size_bytes INT UNSIGNED NULL,
  contains_minors BOOLEAN NOT NULL DEFAULT FALSE,
  visibility ENUM('inherit_celebration', 'private', 'circle_public') NOT NULL DEFAULT 'inherit_celebration',
  moderation_status ENUM('approved', 'pending_review', 'rejected', 'hidden') NOT NULL DEFAULT 'approved',
  reports_count INT UNSIGNED NOT NULL DEFAULT 0,
  likes_count INT UNSIGNED NOT NULL DEFAULT 0,
  comments_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  INDEX idx_photos_sync (celebration_id, updated_at, deleted_at),
  CONSTRAINT fk_photos_celebration FOREIGN KEY (celebration_id) REFERENCES celebrations(id) ON DELETE CASCADE,
  CONSTRAINT fk_photos_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. PHOTO_LIKES
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

-- 12. PHOTO_COMMENTS
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

-- 13. PHOTO_REPORTS
CREATE TABLE IF NOT EXISTS photo_reports (
  id VARCHAR(36) NOT NULL,
  photo_id VARCHAR(36) NOT NULL,
  reported_by VARCHAR(36) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  status ENUM('open', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
  resolved_by VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_reports_photo FOREIGN KEY (photo_id) REFERENCES event_photos(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_resolver FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. REMINDER_DISPATCH_LOGS
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
