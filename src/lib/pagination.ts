// Curseur opaque de la galerie (T031a, FR-018, research.md §9) : encode le dernier
// `(createdAt, id)` reçu ; ordre de référence `createdAt DESC, id DESC`.
export type PhotoCursor = { createdAt: number; id: string };

export function encodeCursor(cursor: PhotoCursor): string {
  return btoa(JSON.stringify([cursor.createdAt, cursor.id]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** `null` si le curseur est absent, mal formé ou falsifié. */
export function decodeCursor(value: string | null | undefined): PhotoCursor | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(atob(value.replace(/-/g, "+").replace(/_/g, "/")));
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      Number.isSafeInteger(parsed[0]) &&
      typeof parsed[1] === "string" &&
      parsed[1].length > 0 &&
      parsed[1].length <= 64
    ) {
      return { createdAt: parsed[0], id: parsed[1] };
    }
  } catch {
    // curseur invalide : traité comme absent
  }
  return null;
}
