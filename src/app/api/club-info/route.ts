// GET /api/club-info (T019) — contracts/api.md
import { jsonError, jsonOk } from "@/lib/api-response";
import { getClubInfo } from "@/lib/club-info";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const info = await getClubInfo(await getDb());
  if (!info) return jsonError({ clubInfo: "Informations du club non renseignées." }, 404);
  return jsonOk(info);
}
