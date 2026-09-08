import { z } from 'zod';

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export const CircleRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;
export type CircleRole = (typeof CircleRole)[keyof typeof CircleRole];

export const InvitationType = {
  UNIVERSAL_LINK: 'universal_link',
  DIRECT_CODE: 'direct_code',
  DIRECT_EMAIL: 'direct_email',
} as const;
export type InvitationType = (typeof InvitationType)[keyof typeof InvitationType];

export const InvitationStatus = {
  ACTIVE: 'active',
  EXHAUSTED: 'exhausted',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
} as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const ClaimStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type ClaimStatus = (typeof ClaimStatus)[keyof typeof ClaimStatus];

export const CelebrationVisibility = {
  CIRCLE_PUBLIC: 'circle_public',
  ADMINS_ONLY: 'admins_only',
  PRIVATE: 'private',
} as const;
export type CelebrationVisibility = (typeof CelebrationVisibility)[keyof typeof CelebrationVisibility];

export const PhotoVisibility = {
  INHERIT: 'inherit_celebration',
  PRIVATE: 'private',
  CIRCLE_PUBLIC: 'circle_public',
} as const;
export type PhotoVisibility = (typeof PhotoVisibility)[keyof typeof PhotoVisibility];

export const ModerationStatus = {
  APPROVED: 'approved',
  PENDING_REVIEW: 'pending_review',
  REJECTED: 'rejected',
  HIDDEN: 'hidden',
} as const;
export type ModerationStatus = (typeof ModerationStatus)[keyof typeof ModerationStatus];

export const NotificationChannel = {
  PUSH: 'push',
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const DevicePlatform = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
} as const;
export type DevicePlatform = (typeof DevicePlatform)[keyof typeof DevicePlatform];

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  timezone: z.string().default('UTC'),
});
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginUserInput = z.infer<typeof LoginUserSchema>;

export const LogoutSchema = z.object({
  fcmToken: z.string().optional(),
});
export type LogoutInput = z.infer<typeof LogoutSchema>;

export const CreateCircleSchema = z.object({
  name: z.string().min(2).max(100),
});
export type CreateCircleInput = z.infer<typeof CreateCircleSchema>;

export const CreateInvitationSchema = z.object({
  circleId: z.string().uuid(),
  inviteType: z.enum(['universal_link', 'direct_code', 'direct_email']),
  inviteeEmail: z.string().email().optional(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
  maxUses: z.number().int().min(1).default(1),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;

export const AcceptInvitationSchema = z.object({
  token: z.string().optional(),
  code: z.string().optional(),
});
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;

export const CreateBirthdaySchema = z.object({
  circleId: z.string().uuid(),
  fullName: z.string().min(2).max(150),
  contactEmail: z.string().email().optional(),
  birthDay: z.number().int().min(1).max(31),
  birthMonth: z.number().int().min(1).max(12),
  birthYear: z.number().int().min(1900).max(2100).optional(),
  isMinor: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});
export type CreateBirthdayInput = z.infer<typeof CreateBirthdaySchema>;

export const ClaimBirthdaySchema = z.object({
  birthdayId: z.string().uuid(),
});
export type ClaimBirthdayInput = z.infer<typeof ClaimBirthdaySchema>;

export const ReviewClaimSchema = z.object({
  claimRequestId: z.string().uuid(),
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});
export type ReviewClaimInput = z.infer<typeof ReviewClaimSchema>;

export const CreateCelebrationSchema = z.object({
  birthdayId: z.string().uuid(),
  celebrationYear: z.number().int().min(1900).max(2100),
  title: z.string().min(2).max(200),
  eventDate: z.string().datetime(),
  location: z.string().max(255).optional(),
  visibility: z.enum(['circle_public', 'admins_only', 'private']).default('circle_public'),
});
export type CreateCelebrationInput = z.infer<typeof CreateCelebrationSchema>;

export const SignUploadSchema = z.object({
  celebrationId: z.string().uuid(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  fileSizeBytes: z.number().int().max(10 * 1024 * 1024, 'Máximo 10 MB permitido'),
  containsMinors: z.boolean().default(false),
});
export type SignUploadInput = z.infer<typeof SignUploadSchema>;

export const RegisterPhotoSchema = z.object({
  celebrationId: z.string().uuid(),
  cloudinaryPublicId: z.string(),
  secureUrl: z.string().url(),
  caption: z.string().max(255).optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  format: z.string().optional(),
  sizeBytes: z.number().int().optional(),
  containsMinors: z.boolean().default(false),
  visibility: z.enum(['inherit_celebration', 'private', 'circle_public']).default('inherit_celebration'),
});
export type RegisterPhotoInput = z.infer<typeof RegisterPhotoSchema>;

export const CreateCommentSchema = z.object({
  photoId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

export const ReportPhotoSchema = z.object({
  photoId: z.string().uuid(),
  reason: z.enum(['inappropriate', 'child_safety', 'copyright', 'other']),
});
export type ReportPhotoInput = z.infer<typeof ReportPhotoSchema>;

export const SyncDeltaSchema = z.object({
  since: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type SyncDeltaInput = z.infer<typeof SyncDeltaSchema>;
