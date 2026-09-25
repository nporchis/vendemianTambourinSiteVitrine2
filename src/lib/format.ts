// Formatage des dates affichées, toujours dans le fuseau du club (le rendu serveur sur
// Workers est en UTC).
const TIME_ZONE = "Europe/Paris";

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: TIME_ZONE, ...options });

const dayMonth = fmt({ weekday: "long", day: "numeric", month: "long" });
const dayMonthYear = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const hourMinute = fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const monthShort = fmt({ month: "short" });
const dayOfMonth = fmt({ day: "2-digit" });
const yearOnly = fmt({ year: "numeric" });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Dimanche 12 octobre » (année ajoutée si différente de l'année de `now`). */
export function formatDay(date: Date, now = new Date()): string {
  const sameYear = yearOnly.format(date) === yearOnly.format(now);
  return capitalize((sameYear ? dayMonth : dayMonthYear).format(date));
}

/** « 15h00 », « 9h30 ». */
export function formatTime(date: Date): string {
  const [h, m] = hourMinute.format(date).split(":");
  return `${Number(h)}h${m}`;
}

/** Un horaire a été renseigné (minuit heure de Paris = date seule). */
export function hasTime(date: Date): boolean {
  return hourMinute.format(date) !== "00:00";
}

/** « Oct », « Juin » — libellé de mois court, sans point final. */
export function formatMonthShort(date: Date): string {
  return capitalize(monthShort.format(date).replace(/\.$/, ""));
}

/** « 02 », « 12 ». */
export function formatDayOfMonth(date: Date): string {
  return dayOfMonth.format(date);
}

/** « Dimanche 12 octobre, 15h00 » — ou sans l'heure si elle n'est pas renseignée. */
export function formatDateTime(date: Date, now = new Date()): string {
  return hasTime(date) ? `${formatDay(date, now)}, ${formatTime(date)}` : formatDay(date, now);
}
