// GET /media/{key} (T010, contracts/media.md) — route PUBLIQUE, aucune session requise : sert un
// objet du bucket R2 `MEDIA_BUCKET`. Les clés incluent un UUID, jamais réutilisées après
// suppression → cache immuable sûr.
import { getEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const env = await getEnv();
  const object = await env.MEDIA_BUCKET.get(key.join("/"));
  if (!object) return new Response(null, { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
