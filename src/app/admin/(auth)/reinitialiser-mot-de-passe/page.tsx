// /admin/reinitialiser-mot-de-passe?token=... (T017) — hors garde du proxy.
import type { Metadata } from "next";
import { FormMessage } from "@/components/admin/AdminField";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Réinitialiser le mot de passe" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = (await searchParams).token;
  const tokenValue = typeof token === "string" ? token : null;

  return (
    <main id="contenu" tabIndex={-1} className="flex flex-1 items-center justify-center p-6">
      {tokenValue ? (
        <ResetPasswordForm token={tokenValue} />
      ) : (
        <FormMessage kind="error" message="Lien de réinitialisation invalide." />
      )}
    </main>
  );
}
