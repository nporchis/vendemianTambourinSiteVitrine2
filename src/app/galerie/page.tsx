// Galerie (T036, FR-004, FR-011, FR-015, FR-018, FR-023) — première page rendue côté
// serveur à chaque requête (research.md §20), pages suivantes chargées au défilement.
import type { Metadata } from "next";
import { GalleryBrowser } from "@/components/gallery/GalleryBrowser";
import { Header } from "@/components/layout/Header";
import { LinkButton } from "@/components/ui/Button";
import { Highlight, PageHero } from "@/components/ui/PageHero";
import { getDb } from "@/lib/db";
import { listPhotoCategories, listPhotos } from "@/lib/photos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "Matchs, entraînements, tournois et moments de club : la vie du Vendémian Tambourin en images.",
};

export default async function GaleriePage() {
  const db = await getDb();
  const [categories, firstPage] = await Promise.all([listPhotoCategories(db), listPhotos(db)]);

  return (
    <>
      <Header current="/galerie" />
      <main id="contenu" tabIndex={-1} className="flex-1">
        <PageHero
          eyebrow="Galerie"
          title={
            <>
              Ce que ça
              <br />
              <Highlight>donne</Highlight>.
            </>
          }
          lead="Matchs, entraînements, tournois et moments de club : la vie du Vendémian Tambourin en images."
        />

        <section aria-label="Photos" className="vt-container vt-gutter pt-10 pb-14">
          <GalleryBrowser categories={categories} initialPage={firstPage} />
        </section>

        {/* Appel : partager ses photos → formulaire, sujet Galerie / photos (FR-023) */}
        <section
          aria-labelledby="partager-photos"
          className="vt-container vt-gutter pb-16 lg:pb-[88px]"
        >
          <div className="vt-on-dark flex flex-col items-start gap-6 rounded-card bg-vt-ink px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10 md:py-9">
            <h2
              id="partager-photos"
              className="text-[2rem] leading-[0.95] font-extrabold text-vt-cream md:text-[2.75rem]"
            >
              Tu as pris des photos&nbsp;?
              <br />
              <span className="text-vt-yellow">Partage-les avec le club.</span>
            </h2>
            <LinkButton href="/contact?sujet=galerie">Envoyer mes photos</LinkButton>
          </div>
        </section>
      </main>
    </>
  );
}
