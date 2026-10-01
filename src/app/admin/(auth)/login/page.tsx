// /admin/login (T016) — hors garde du proxy (src/proxy.ts).
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion administrateur" };

export default function AdminLoginPage() {
  return (
    <main id="contenu" tabIndex={-1} className="flex flex-1 items-center justify-center p-6">
      <LoginForm />
    </main>
  );
}
