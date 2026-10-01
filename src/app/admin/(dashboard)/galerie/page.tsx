// /admin/galerie (T032).
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { listAllPhotos, listPhotoCategories } from "@/lib/photos";
import { PhotoGrid } from "./PhotoGrid";
import { PhotoUploadForm } from "./PhotoUploadForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Galerie" };

export default async function AdminGaleriePage() {
  const db = await getDb();
  const [photos, categories] = await Promise.all([listAllPhotos(db), listPhotoCategories(db)]);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[1.75rem] font-extrabold">Galerie</h1>
      <PhotoUploadForm categories={categories} />
      <PhotoGrid photos={photos} categories={categories} />
    </div>
  );
}
