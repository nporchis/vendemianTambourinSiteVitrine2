// Stockage des fichiers image dans le bucket R2 `MEDIA_BUCKET` (T009, data-model.md « Fichiers
// média », contracts/media.md). Seule une URL `/media/{clé}` est persistée en D1.
export const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const EXTENSION_BY_TYPE: Record<(typeof ALLOWED_MEDIA_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type MediaValidationError = "too-large" | "unsupported-type";

export function validateMediaFile(file: File): MediaValidationError | null {
  if (file.size > MAX_MEDIA_SIZE_BYTES) return "too-large";
  if (!ALLOWED_MEDIA_TYPES.includes(file.type as (typeof ALLOWED_MEDIA_TYPES)[number])) {
    return "unsupported-type";
  }
  return null;
}

/**
 * Écrit le fichier dans R2 sous `{prefix}/{uuid}.{ext}` et retourne l'URL publique
 * `/media/{clé}` à stocker en D1. Le fichier doit avoir déjà été validé par
 * {@link validateMediaFile}.
 */
export async function putMediaObject(
  bucket: R2Bucket,
  prefix: string,
  file: File,
): Promise<string> {
  const extension = EXTENSION_BY_TYPE[file.type as (typeof ALLOWED_MEDIA_TYPES)[number]];
  const key = `${prefix}/${crypto.randomUUID()}.${extension}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  return `/media/${key}`;
}

/** Accepte une URL `/media/{clé}` ou une clé nue ; ignore silencieusement une URL externe. */
export async function deleteMediaObject(bucket: R2Bucket, urlOrKey: string): Promise<void> {
  const key = urlOrKey.startsWith("/media/") ? urlOrKey.slice("/media/".length) : urlOrKey;
  if (!key || key.startsWith("http://") || key.startsWith("https://")) return;
  await bucket.delete(key);
}
