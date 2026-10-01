// /admin/club (T037).
import type { Metadata } from "next";
import { getClubInfo } from "@/lib/club-info";
import { getDb } from "@/lib/db";
import { BoardMembersManager } from "./BoardMembersManager";
import { ClubInfoForm } from "./ClubInfoForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Le club" };

export default async function AdminClubPage() {
  const clubInfo = await getClubInfo(await getDb());
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[1.75rem] font-extrabold">Le club</h1>
      <ClubInfoForm clubInfo={clubInfo} />
      <BoardMembersManager members={clubInfo?.boardMembers ?? []} />
    </div>
  );
}
