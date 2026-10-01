// Garde commune aux Route Handlers `/api/admin/**` (T011, contracts/admin-api.md) : 401 si session
// absente/invalide, sinon l'administrateur authentifié.
import { jsonError } from "@/lib/api-response";
import type { Db } from "@/lib/db";
import { requireAdmin } from "./require-admin";
import { type AuthenticatedAdmin } from "./session";

export async function requireAdminOrResponse(
  db: Db,
  request: Request,
): Promise<{ admin: AuthenticatedAdmin } | { response: Response }> {
  const admin = await requireAdmin(db, request);
  if (!admin) {
    return { response: jsonError({ form: "Authentification requise." }, 401) };
  }
  return { admin };
}

export async function parseJsonBody(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
