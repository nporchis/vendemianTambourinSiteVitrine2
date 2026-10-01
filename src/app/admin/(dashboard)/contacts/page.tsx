// /admin/contacts (T045).
import type { Metadata } from "next";
import { listContactRequests } from "@/lib/contact-requests";
import { getDb } from "@/lib/db";
import { ContactRequestsManager } from "./ContactRequestsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Demandes de contact" };

export default async function AdminContactsPage() {
  const requests = await listContactRequests(await getDb());
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[1.75rem] font-extrabold">Demandes de contact</h1>
      <ContactRequestsManager requests={requests} />
    </div>
  );
}
