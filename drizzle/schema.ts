// Schéma Drizzle de la base D1 (T008) — voir specs/001-front-public-club/data-model.md.
// Conventions SQLite/D1 : dates en entier (ms epoch, mode "timestamp_ms"), booléens en 0/1,
// tableaux en texte JSON.
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { CONTACT_SUBJECTS } from "../src/lib/contact-subjects";

const uuid = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const competition = sqliteTable(
  "competition",
  {
    id: uuid(),
    name: text("name").notNull(),
    date: integer("date", { mode: "timestamp_ms" }).notNull(),
    location: text("location").notNull(),
    description: text("description"),
    // Affiché uniquement pour une compétition passée (FR-016).
    result: text("result"),
  },
  (t) => [index("competition_date_idx").on(t.date)],
);

export const photoCategory = sqliteTable("photo_category", {
  id: uuid(),
  name: text("name").notNull().unique(),
});

export const photo = sqliteTable(
  "photo",
  {
    id: uuid(),
    imageUrl: text("image_url").notNull(),
    caption: text("caption"),
    categoryId: text("category_id")
      .notNull()
      .references(() => photoCategory.id),
    takenOrEventDate: integer("taken_or_event_date", { mode: "timestamp_ms" }),
    // Clé de tri de la pagination par curseur (FR-018), générée à l'insertion.
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
  },
  (t) => [
    index("photo_created_at_idx").on(t.createdAt, t.id),
    index("photo_category_created_at_idx").on(t.categoryId, t.createdAt, t.id),
  ],
);

export type SocialLink = { label: string; url: string };
export type KeyFigure = { value: string; label: string };

export const CLUB_INFO_ID = "club";

// Singleton : une seule ligne, d'identifiant fixe CLUB_INFO_ID.
export const clubInfo = sqliteTable("club_info", {
  id: text("id").primaryKey().default(CLUB_INFO_ID),
  historyText: text("history_text").notNull(),
  values: text("values").notNull(),
  teamInfo: text("team_info"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  socialLinks: text("social_links", { mode: "json" })
    .$type<SocialLink[]>()
    .notNull()
    .default(sql`'[]'`),
  // 4 au plus, affichés dans l'ordre du tableau (FR-024).
  keyFigures: text("key_figures", { mode: "json" })
    .$type<KeyFigure[]>()
    .notNull()
    .default(sql`'[]'`),
});

export const boardMember = sqliteTable("board_member", {
  id: uuid(),
  firstName: text("first_name").notNull(),
  lastNameInitial: text("last_name_initial").notNull(),
  role: text("role").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const PARTNER_LEVELS = ["principal", "soutien", "institutionnel"] as const;
export type PartnerLevel = (typeof PARTNER_LEVELS)[number];

export const partner = sqliteTable("partner", {
  id: uuid(),
  name: text("name").notNull(),
  level: text("level", { enum: PARTNER_LEVELS }).notNull(),
  websiteUrl: text("website_url"),
  description: text("description"),
  logoUrl: text("logo_url"),
  sortOrder: integer("sort_order").notNull(),
});


export const contactRequest = sqliteTable(
  "contact_request",
  {
    id: uuid(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    subject: text("subject", { enum: CONTACT_SUBJECTS }).notNull(),
    message: text("message").notNull(),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull(),
    captchaVerified: integer("captcha_verified", { mode: "boolean" }).notNull(),
    rgpdNoticeAcknowledged: integer("rgpd_notice_acknowledged", { mode: "boolean" }).notNull(),
    // submittedAt + 12 mois (FR-014) ; lu par la purge planifiée.
    purgeAt: integer("purge_at", { mode: "timestamp_ms" }).notNull(),
    // null si l'envoi de l'email de notification a échoué (FR-017).
    notificationSentAt: integer("notification_sent_at", { mode: "timestamp_ms" }),
    // null = non traitée (FR-014, feature 002).
    processedAt: integer("processed_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("contact_request_purge_at_idx").on(t.purgeAt)],
);

// ------------------------------------------------------------------ Backoffice (feature 002)

export const admin = sqliteTable("admin", {
  id: uuid(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
});

export const adminSession = sqliteTable(
  "admin_session",
  {
    id: uuid(),
    adminId: text("admin_id")
      .notNull()
      .references(() => admin.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
  },
  (t) => [index("admin_session_admin_id_idx").on(t.adminId)],
);

export const passwordResetToken = sqliteTable(
  "password_reset_token",
  {
    id: uuid(),
    adminId: text("admin_id")
      .notNull()
      .references(() => admin.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("password_reset_token_admin_id_idx").on(t.adminId)],
);

export const ADMIN_AUDIT_ACTIONS = [
  "admin_created",
  "admin_updated",
  "admin_deactivated",
  "admin_reactivated",
  "admin_deleted",
] as const;
export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

// `actorAdminId`/`targetAdminId` passent à `null` (`ON DELETE SET NULL`) si le compte
// correspondant est supprimé : le journal reste consultable au-delà de la suppression (append-only).
export const adminAuditLog = sqliteTable("admin_audit_log", {
  id: uuid(),
  actorAdminId: text("actor_admin_id").references(() => admin.id, { onDelete: "set null" }),
  action: text("action", { enum: ADMIN_AUDIT_ACTIONS }).notNull(),
  targetAdminId: text("target_admin_id").references(() => admin.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
});
