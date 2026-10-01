// /admin/mot-de-passe-oublie (T017) — hors garde du proxy.
import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <main id="contenu" tabIndex={-1} className="flex flex-1 items-center justify-center p-6">
      <ForgotPasswordForm />
    </main>
  );
}
