// GET /api/photo-categories (T031)
import { jsonOk } from "@/lib/api-response";
import { getDb } from "@/lib/db";
import { listPhotoCategories } from "@/lib/photos";

export const dynamic = "force-dynamic";

export async function GET() {
  return jsonOk(await listPhotoCategories(await getDb()));
}
