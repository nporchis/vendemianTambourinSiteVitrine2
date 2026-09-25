// Page 404 personnalisée (T056b, FR-021, research.md §13) — « Balle hors du fronton ».
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { LinkButton } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Page introuvable",
};

export default function NotFound() {
  return (
    <>
      <Header current={null} />
      <main id="contenu" tabIndex={-1} className="vt-on-dark flex flex-1 flex-col bg-vt-ink">
        <section className="vt-container vt-gutter relative flex min-h-[480px] flex-1 flex-col justify-center gap-5 overflow-hidden py-16 lg:min-h-[560px]">
          <span
            aria-hidden="true"
            data-deco="404"
            className="pointer-events-none absolute -bottom-10 right-5 font-display text-[10rem] leading-none font-extrabold text-vt-terracotta opacity-35 md:text-[16rem] lg:right-10 lg:-bottom-16 lg:text-[22.5rem]"
          />
          <div className="relative">
            <Eyebrow>Erreur 404</Eyebrow>
          </div>
          <h1 className="relative max-w-[640px] text-[2.75rem] leading-[0.95] font-extrabold text-vt-cream md:text-[3.75rem]">
            Balle hors du fronton
          </h1>
          <p className="relative max-w-[520px] text-lg leading-[1.6] text-vt-text-on-dark">
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
          </p>
          <div className="relative mt-2.5 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
            <LinkButton href="/">Retour à l&apos;accueil</LinkButton>
            <LinkButton href="/calendrier" variant="outline-dark">
              Voir le calendrier
            </LinkButton>
          </div>
        </section>
      </main>
    </>
  );
}
