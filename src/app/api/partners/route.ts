// GET /api/partners (T042) — triés par niveau puis ordre, [] si aucun partenaire.
import { jsonOk } from "@/lib/api-response";
import { getDb } from "@/lib/db";
import { listPartners } from "@/lib/partners";

export const dynamic = "force-dynamic";

export async function GET() {
  return jsonOk(await listPartners(await getDb()));
}
