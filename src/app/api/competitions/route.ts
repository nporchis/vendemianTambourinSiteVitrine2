// GET /api/competitions (T026) — liste vide si aucune compétition (FR-011).
import { jsonOk } from "@/lib/api-response";
import { listCompetitions } from "@/lib/competitions";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return jsonOk(await listCompetitions(await getDb()));
}
