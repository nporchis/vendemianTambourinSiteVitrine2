// /admin/partenaires (T041).
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { listPartners } from "@/lib/partners";
import { PartnersManager } from "./PartnersManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Partenaires" };

export default async function AdminPartenairesPage() {
  const partners = await listPartners(await getDb());
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[1.75rem] font-extrabold">Partenaires</h1>
      <PartnersManager partners={partners} />
    </div>
  );
}
