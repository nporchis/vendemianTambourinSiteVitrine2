// PATCH /api/admin/club-info (T035, contracts/admin-api.md) — singleton existant, pas de
// create/delete.
import { eq } from "drizzle-orm";
import { CLUB_INFO_ID, clubInfo } from "../../../../../drizzle/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAdminOrResponse } from "@/lib/auth/admin-route";
import { createDb, getEnv } from "@/lib/db";
import { ClubInfoSchema, fieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const parsed = ClubInfoSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const [existing] = await db.select().from(clubInfo).limit(1);
  const values = {
    historyText: parsed.data.historyText,
    values: parsed.data.values,
    teamInfo: parsed.data.teamInfo ?? null,
    contactEmail: parsed.data.contactEmail,
    contactPhone: parsed.data.contactPhone ?? null,
    socialLinks: parsed.data.socialLinks,
    keyFigures: parsed.data.keyFigures,
  };

  const [row] = existing
    ? await db.update(clubInfo).set(values).where(eq(clubInfo.id, CLUB_INFO_ID)).returning()
    : await db.insert(clubInfo).values({ id: CLUB_INFO_ID, ...values }).returning();

  return jsonOk(row);
}
