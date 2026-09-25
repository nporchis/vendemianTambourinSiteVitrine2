// Lecture de la galerie : catégories et photos paginées par curseur (FR-015, FR-018).
import { and, asc, desc, eq, lt, or, type SQL } from "drizzle-orm";
import { photo, photoCategory } from "../../drizzle/schema";
import type { Db } from "./db";
import { decodeCursor, encodeCursor } from "./pagination";

export const PHOTO_PAGE_SIZE = 12;

export type PhotoCategoryDto = { id: string; name: string };

export type PhotoDto = {
  id: string;
  imageUrl: string;
  caption: string | null;
  categoryId: string;
  takenOrEventDate: string | null;
};

export type PhotoPage = { items: PhotoDto[]; nextCursor: string | null };

export async function listPhotoCategories(db: Db): Promise<PhotoCategoryDto[]> {
  return db
    .select({ id: photoCategory.id, name: photoCategory.name })
    .from(photoCategory)
    .orderBy(asc(photoCategory.name));
}

/** Taille de page : défaut et maximum 12 (contracts/api.md). */
export function parseLimit(value: string | null | undefined): number {
  const n = Number(value);
  if (!value || !Number.isInteger(n) || n < 1) return PHOTO_PAGE_SIZE;
  return Math.min(n, PHOTO_PAGE_SIZE);
}

export async function listPhotos(
  db: Db,
  options: { categoryId?: string | null; cursor?: string | null; limit?: number } = {},
): Promise<PhotoPage> {
  const limit = Math.min(options.limit ?? PHOTO_PAGE_SIZE, PHOTO_PAGE_SIZE);
  const cursor = decodeCursor(options.cursor);

  const conditions: (SQL | undefined)[] = [];
  if (options.categoryId) conditions.push(eq(photo.categoryId, options.categoryId));
  if (cursor) {
    const at = new Date(cursor.createdAt);
    conditions.push(
      or(lt(photo.createdAt, at), and(eq(photo.createdAt, at), lt(photo.id, cursor.id))),
    );
  }

  // Une ligne de plus que la page pour savoir s'il reste des photos à charger.
  const rows = await db
    .select()
    .from(photo)
    .where(and(...conditions))
    .orderBy(desc(photo.createdAt), desc(photo.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    items: page.map((row) => ({
      id: row.id,
      imageUrl: row.imageUrl,
      caption: row.caption ?? null,
      categoryId: row.categoryId,
      takenOrEventDate: row.takenOrEventDate?.toISOString() ?? null,
    })),
    nextCursor:
      rows.length > limit && last
        ? encodeCursor({ createdAt: last.createdAt.getTime(), id: last.id })
        : null,
  };
}
