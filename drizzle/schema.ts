// Schéma Drizzle de la base D1 (T008) — voir specs/001-front-public-club/data-model.md.
// Conventions SQLite/D1 : dates en entier (ms epoch, mode "timestamp_ms"), booléens en 0/1,
// tableaux en texte JSON.
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const CONTACT_SUBJECTS = ["adhesion", "partenariat", "galerie", "presse", "autre"] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

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
  },
  (t) => [index("contact_request_purge_at_idx").on(t.purgeAt)],
);
