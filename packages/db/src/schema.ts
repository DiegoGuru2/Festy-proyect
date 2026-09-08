import {
  mysqlTable,
  varchar,
  datetime,
  boolean,
  int,
  tinyint,
  smallint,
  text,
  time,
  mysqlEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// -----------------------------------------------------------------------------
// 1. USERS
// -----------------------------------------------------------------------------
export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
    emailVerifiedAt: datetime('email_verified_at', { mode: 'date' }),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
    deletedAt: datetime('deleted_at', { mode: 'date' }),
  },
  (table) => ({
    emailUq: uniqueIndex('uq_users_email').on(table.email),
    tzActiveIdx: index('idx_users_tz_active').on(table.timezone, table.deletedAt),
  })
);

// -----------------------------------------------------------------------------
// 2. USER_DEVICE_TOKENS
// -----------------------------------------------------------------------------
export const userDeviceTokens = mysqlTable(
  'user_device_tokens',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    fcmToken: varchar('fcm_token', { length: 500 }).notNull(),
    platform: mysqlEnum('platform', ['ios', 'android', 'web']).notNull(),
    deviceName: varchar('device_name', { length: 100 }),
    isActive: boolean('is_active').notNull().default(true),
    lastUsedAt: datetime('last_used_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userLookupIdx: index('idx_device_tokens_lookup').on(table.userId, table.isActive),
  })
);

// -----------------------------------------------------------------------------
// 3. USER_NOTIFICATION_PREFS
// -----------------------------------------------------------------------------
export const userNotificationPrefs = mysqlTable(
  'user_notification_prefs',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    enablePush: boolean('enable_push').notNull().default(true),
    enableEmail: boolean('enable_email').notNull().default(true),
    enableWhatsapp: boolean('enable_whatsapp').notNull().default(false),
    daysBefore: int('days_before').notNull().default(1),
    preferredTime: time('preferred_time').notNull().default('09:00:00'),
    updatedAt: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userUq: uniqueIndex('uq_user_prefs').on(table.userId),
  })
);

// -----------------------------------------------------------------------------
// 4. CIRCLES
// -----------------------------------------------------------------------------
export const circles = mysqlTable(
  'circles',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    createdBy: varchar('created_by', { length: 36 }).notNull().references(() => users.id),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
    deletedAt: datetime('deleted_at', { mode: 'date' }),
  }
);

// -----------------------------------------------------------------------------
// 5. CIRCLE_MEMBERS
// -----------------------------------------------------------------------------
export const circleMembers = mysqlTable(
  'circle_members',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    circleId: varchar('circle_id', { length: 36 }).notNull().references(() => circles.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: mysqlEnum('role', ['owner', 'admin', 'member', 'viewer']).notNull().default('member'),
    joinedAt: datetime('joined_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    memberUq: uniqueIndex('uq_circle_member').on(table.circleId, table.userId),
  })
);

// -----------------------------------------------------------------------------
// 6. CIRCLE_INVITATIONS
// -----------------------------------------------------------------------------
export const circleInvitations = mysqlTable(
  'circle_invitations',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    circleId: varchar('circle_id', { length: 36 }).notNull().references(() => circles.id, { onDelete: 'cascade' }),
    invitedBy: varchar('invited_by', { length: 36 }).notNull().references(() => users.id),
    inviteType: mysqlEnum('invite_type', ['universal_link', 'direct_code', 'direct_email']).notNull(),
    inviteeEmail: varchar('invitee_email', { length: 255 }),
    inviteCode: varchar('invite_code', { length: 12 }).notNull(),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    role: mysqlEnum('role', ['admin', 'member', 'viewer']).notNull().default('member'),
    maxUses: int('max_uses').notNull().default(1),
    usesCount: int('uses_count').notNull().default(0),
    expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
    status: mysqlEnum('status', ['active', 'exhausted', 'revoked', 'expired']).notNull().default('active'),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => ({
    codeUq: uniqueIndex('uq_invitation_code').on(table.inviteCode),
    tokenUq: uniqueIndex('uq_invitation_token').on(table.tokenHash),
  })
);

// -----------------------------------------------------------------------------
// 7. BIRTHDAYS
// -----------------------------------------------------------------------------
export const birthdays = mysqlTable(
  'birthdays',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    circleId: varchar('circle_id', { length: 36 }).notNull().references(() => circles.id, { onDelete: 'cascade' }),
    createdBy: varchar('created_by', { length: 36 }).notNull().references(() => users.id),
    linkedUserId: varchar('linked_user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    isClaimed: boolean('is_claimed').notNull().default(false),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    contactEmail: varchar('contact_email', { length: 255 }),
    birthDay: tinyint('birth_day').notNull(),
    birthMonth: tinyint('birth_month').notNull(),
    birthYear: smallint('birth_year'),
    isMinor: boolean('is_minor').notNull().default(false),
    notes: text('notes'),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
    deletedAt: datetime('deleted_at', { mode: 'date' }),
  },
  (table) => ({
    upcomingIdx: index('idx_birthdays_upcoming').on(table.birthMonth, table.birthDay, table.deletedAt),
    circleIdx: index('idx_birthdays_circle').on(table.circleId, table.deletedAt),
    contactEmailIdx: index('idx_birthdays_contact_email').on(table.contactEmail),
    syncIdx: index('idx_birthdays_sync').on(table.circleId, table.updatedAt, table.deletedAt),
  })
);

// -----------------------------------------------------------------------------
// 8. BIRTHDAY_CLAIM_REQUESTS
// -----------------------------------------------------------------------------
export const birthdayClaimRequests = mysqlTable(
  'birthday_claim_requests',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    birthdayId: varchar('birthday_id', { length: 36 }).notNull().references(() => birthdays.id, { onDelete: 'cascade' }),
    claimantUserId: varchar('claimant_user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    reviewedByAdminId: varchar('reviewed_by_admin_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    status: mysqlEnum('status', ['pending', 'approved', 'rejected']).notNull().default('pending'),
    rejectionReason: text('rejection_reason'),
    reviewedAt: datetime('reviewed_at', { mode: 'date' }),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  }
);

// -----------------------------------------------------------------------------
// 9. CELEBRATIONS
// -----------------------------------------------------------------------------
export const celebrations = mysqlTable(
  'celebrations',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    birthdayId: varchar('birthday_id', { length: 36 }).notNull().references(() => birthdays.id, { onDelete: 'cascade' }),
    celebrationYear: smallint('celebration_year').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    eventDate: datetime('event_date', { mode: 'date' }).notNull(),
    location: varchar('location', { length: 255 }),
    visibility: mysqlEnum('visibility', ['circle_public', 'admins_only', 'private']).notNull().default('circle_public'),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
    deletedAt: datetime('deleted_at', { mode: 'date' }),
  },
  (table) => ({
    syncIdx: index('idx_celebrations_sync').on(table.birthdayId, table.updatedAt, table.deletedAt),
  })
);

// -----------------------------------------------------------------------------
// 10. EVENT_PHOTOS
// -----------------------------------------------------------------------------
export const eventPhotos = mysqlTable(
  'event_photos',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    celebrationId: varchar('celebration_id', { length: 36 }).notNull().references(() => celebrations.id, { onDelete: 'cascade' }),
    uploadedBy: varchar('uploaded_by', { length: 36 }).notNull().references(() => users.id),
    cloudinaryPublicId: varchar('cloudinary_public_id', { length: 255 }).notNull(),
    secureUrl: varchar('secure_url', { length: 500 }).notNull(),
    caption: varchar('caption', { length: 255 }),
    width: int('width'),
    height: int('height'),
    format: varchar('format', { length: 10 }),
    sizeBytes: int('size_bytes'),
    containsMinors: boolean('contains_minors').notNull().default(false),
    visibility: mysqlEnum('visibility', ['inherit_celebration', 'private', 'circle_public']).notNull().default('inherit_celebration'),
    moderationStatus: mysqlEnum('moderation_status', ['approved', 'pending_review', 'rejected', 'hidden']).notNull().default('approved'),
    reportsCount: int('reports_count').notNull().default(0),
    likesCount: int('likes_count').notNull().default(0),
    commentsCount: int('comments_count').notNull().default(0),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
    deletedAt: datetime('deleted_at', { mode: 'date' }),
  },
  (table) => ({
    syncIdx: index('idx_photos_sync').on(table.celebrationId, table.updatedAt, table.deletedAt),
  })
);

// -----------------------------------------------------------------------------
// 11. PHOTO_LIKES
// -----------------------------------------------------------------------------
export const photoLikes = mysqlTable(
  'photo_likes',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    photoId: varchar('photo_id', { length: 36 }).notNull().references(() => eventPhotos.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userLikeUq: uniqueIndex('uq_photo_user_like').on(table.photoId, table.userId),
  })
);

// -----------------------------------------------------------------------------
// 12. PHOTO_COMMENTS
// -----------------------------------------------------------------------------
export const photoComments = mysqlTable(
  'photo_comments',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    photoId: varchar('photo_id', { length: 36 }).notNull().references(() => eventPhotos.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
    deletedAt: datetime('deleted_at', { mode: 'date' }),
  }
);

// -----------------------------------------------------------------------------
// 13. PHOTO_REPORTS
// -----------------------------------------------------------------------------
export const photoReports = mysqlTable(
  'photo_reports',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    photoId: varchar('photo_id', { length: 36 }).notNull().references(() => eventPhotos.id, { onDelete: 'cascade' }),
    reportedBy: varchar('reported_by', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    reason: varchar('reason', { length: 100 }).notNull(),
    status: mysqlEnum('status', ['open', 'resolved', 'dismissed']).notNull().default('open'),
    resolvedBy: varchar('resolved_by', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    resolvedAt: datetime('resolved_at', { mode: 'date' }),
  }
);

// -----------------------------------------------------------------------------
// 14. REMINDER_DISPATCH_LOGS
// -----------------------------------------------------------------------------
export const reminderDispatchLogs = mysqlTable(
  'reminder_dispatch_logs',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    birthdayId: varchar('birthday_id', { length: 36 }).notNull().references(() => birthdays.id, { onDelete: 'cascade' }),
    celebrationId: varchar('celebration_id', { length: 36 }).notNull().default('none'),
    year: smallint('year').notNull(),
    daysBefore: tinyint('days_before').notNull(),
    channel: mysqlEnum('channel', ['push', 'email', 'whatsapp']).notNull(),
    status: mysqlEnum('status', ['sent', 'failed']).notNull().default('sent'),
    sentAt: datetime('sent_at', { mode: 'date' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    dedupUq: uniqueIndex('uq_reminder_dispatch').on(
      table.userId,
      table.birthdayId,
      table.celebrationId,
      table.year,
      table.daysBefore,
      table.channel
    ),
  })
);
