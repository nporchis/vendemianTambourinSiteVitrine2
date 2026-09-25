// Jeu de données de démonstration (T015, quickstart.md) — textes des maquettes v11, à
// remplacer par le contenu validé par le club. Les dates sont relatives à `now` pour que le
// « Prochain match » reste toujours à venir.
//
// Conventions de saisie reprises par les pages :
// - `history_text` : paragraphes séparés par une ligne vide ; le premier est l'accroche.
// - `values` : un paragraphe par valeur, « Titre : texte ».

type SqlValue = string | number | boolean | null;

const q = (value: SqlValue): string => {
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${value.replace(/'/g, "''")}'`;
};

const insert = (table: string, rows: Record<string, SqlValue>[]) =>
  rows.map((row) => {
    const columns = Object.keys(row);
    return `INSERT INTO ${table} (${columns.map((c) => `\`${c}\``).join(", ")}) VALUES (${columns
      .map((c) => q(row[c]))
      .join(", ")});`;
  });

const DAY = 86_400_000;

/** Date à `days` jours de `now`, à l'heure UTC donnée (13h UTC ≈ 15h à Vendémian). */
function at(now: Date, days: number, utcHour = 13): number {
  const date = new Date(now.getTime() + days * DAY);
  date.setUTCHours(utcHour, 0, 0, 0);
  return date.getTime();
}

export const CONTENT_TABLES = [
  "photo",
  "photo_category",
  "competition",
  "board_member",
  "partner",
  "club_info",
] as const;

export function clearSql(tables: readonly string[] = CONTENT_TABLES): string[] {
  return tables.map((table) => `DELETE FROM ${table};`);
}

export function competitionsSql(now: Date): string[] {
  return insert("competition", [
    {
      id: "c-upcoming-1",
      name: "Championnat régional · J12",
      date: at(now, 18),
      location: "Fronton Vendémianais — Vendémian",
      description: "Phase de poule du championnat régional, face à Cournonterral.",
      result: null,
    },
    {
      id: "c-upcoming-2",
      name: "Tournoi amical inter-clubs",
      date: at(now, 39, 12),
      location: "Fronton de Saint-Bauzille",
      description: null,
      result: null,
    },
    {
      id: "c-past-1",
      name: "Coupe départementale — 1er tour",
      date: at(now, -4),
      location: "Fronton Vendémianais",
      description: null,
      result: "Victoire 13–7",
    },
    {
      id: "c-past-2",
      name: "Finale régionale",
      date: at(now, -109),
      location: "Fronton de Cazouls",
      description: null,
      result: "Défaite 9–13",
    },
  ]);
}

const PHOTO_CAPTIONS = [
  "Match contre Gignac",
  "Entraînement du mercredi",
  "Tournoi d'été",
  "École de tambourin",
  "Remise des trophées",
  "Le fronton au coucher du soleil",
  "Finale régionale",
  "Fête de fin de saison",
  "Échauffement avant le match",
  "Les cordiers au filet",
  "Victoire en coupe départementale",
  "Les jeunes à l'entraînement",
  "Supporters au bord du terrain",
  "Photo d'équipe 2025",
];

export function photosSql(now: Date): string[] {
  const categories = [
    { id: "cat-matchs", name: "Matchs 2025-26" },
    { id: "cat-vie-club", name: "Vie du club" },
  ];
  // 14 photos (> 12) pour exercer la pagination sur deux pages (FR-018).
  const photos = PHOTO_CAPTIONS.map((caption, i) => ({
    id: `p-${String(i + 1).padStart(2, "0")}`,
    image_url: "/images/fronton.jpg",
    caption,
    category_id: i % 2 === 0 ? "cat-matchs" : "cat-vie-club",
    taken_or_event_date: at(now, -7 * (i + 1), 0),
    created_at: now.getTime() - i * 60_000,
  }));
  return [...insert("photo_category", categories), ...insert("photo", photos)];
}

export function clubInfoSql(): string[] {
  return [
    ...insert("club_info", [
      {
        id: "club",
        history_text: [
          "Cent ans de matchs sur la place, puis sur le fronton du village.",
          "Le club est né en 1923 de la passion d'un groupe de joueurs pour ce sport traditionnel occitan. Depuis, il a formé des générations de joueurs et pris part aux compétitions régionales, en gardant l'esprit convivial qui l'a fondé.",
          "Aujourd'hui encore, chaque match rassemble joueurs, familles et habitants autour du fronton.",
        ].join("\n\n"),
        values: [
          "Transmettre : Former les jeunes dès 8 ans et faire vivre une tradition occitane propre à notre village.",
          "Représenter : Porter les couleurs de Vendémian sur tous les terrains de l'Hérault et au-delà.",
          "Rassembler : Un club ouvert à tous les âges et tous les niveaux, où l'on vient autant pour jouer que pour se retrouver.",
        ].join("\n\n"),
        team_info: null,
        contact_email: "contact@vendemian-tambourin.fr",
        contact_phone: "06 12 34 56 78",
        social_links: JSON.stringify([
          { label: "Instagram", url: "https://www.instagram.com/" },
          { label: "Facebook", url: "https://www.facebook.com/" },
        ]),
        key_figures: JSON.stringify([
          { value: "1923", label: "Fondation" },
          { value: "6", label: "Équipes engagées" },
          { value: "+80", label: "Licenciés" },
          { value: "N1", label: "Plus haut niveau" },
        ]),
      },
    ]),
    ...insert(
      "board_member",
      [
        ["Jean-Marc", "R", "Président"],
        ["Sylvie", "B", "Vice-présidente"],
        ["Patrick", "L", "Trésorier"],
        ["Clara", "M", "Secrétaire"],
      ].map(([first_name, last_name_initial, role], i) => ({
        id: `b-${i + 1}`,
        first_name,
        last_name_initial,
        role,
        sort_order: i + 1,
      })),
    ),
  ];
}

export function partnersSql(): string[] {
  return insert(
    "partner",
    [
      [
        "Cave coopérative de Vendémian",
        "principal",
        "https://example.org/cave",
        "Partenaire historique depuis 1998",
      ],
      [
        "Domaine des Figuiers",
        "principal",
        "https://example.org/figuiers",
        "Maillots de la saison",
      ],
      ["Boulangerie du village", "soutien", null, null],
      ["Le Pressoir", "soutien", "https://example.org/pressoir", null],
      ["Mairie de Vendémian", "institutionnel", "https://example.org/mairie", null],
    ].map(([name, level, website_url, description], i) => ({
      id: `pa-${i + 1}`,
      name,
      level,
      website_url,
      description,
      logo_url: null,
      sort_order: i + 1,
    })),
  );
}

export function seedSql(now: Date = new Date()): string {
  return [
    ...clearSql(),
    ...clubInfoSql(),
    ...competitionsSql(now),
    ...photosSql(now),
    ...partnersSql(),
  ].join("\n");
}
