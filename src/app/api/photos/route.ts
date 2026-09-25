// GET /api/photos?categoryId=&cursor=&limit= (T032, FR-018) — pagination par curseur.
import type { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api-response";
import { getDb } from "@/lib/db";
import { listPhotos, parseLimit } from "@/lib/photos";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = await listPhotos(await getDb(), {
    categoryId: params.get("categoryId"),
    cursor: params.get("cursor"),
    limit: parseLimit(params.get("limit")),
  });
  return jsonOk(page);
}
