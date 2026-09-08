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
