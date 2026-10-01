// /admin/comptes (T027) — comptes administrateur + journal d'audit en lecture seule.
import type { Metadata } from "next";
import { listAdmins } from "@/lib/admins";
import { listAuditLog } from "@/lib/audit-log";
import { getDb } from "@/lib/db";
import { AccountsManager } from "./AccountsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Comptes administrateur" };

export default async function AdminAccountsPage() {
  const db = await getDb();
  const [admins, auditLog] = await Promise.all([listAdmins(db), listAuditLog(db)]);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[1.75rem] font-extrabold">Comptes administrateur</h1>
      <AccountsManager admins={admins} auditLog={auditLog} />
    </div>
  );
}
