// /admin/competitions (T023) — liste triée à venir/passées, gérée par CompetitionsManager.
import type { Metadata } from "next";
import { listCompetitions } from "@/lib/competitions";
import { getDb } from "@/lib/db";
import { CompetitionsManager } from "./CompetitionsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Compétitions" };

export default async function AdminCompetitionsPage() {
  const competitions = await listCompetitions(await getDb());
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[1.75rem] font-extrabold">Compétitions</h1>
      <CompetitionsManager competitions={competitions} />
    </div>
  );
}
