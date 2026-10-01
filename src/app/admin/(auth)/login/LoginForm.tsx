"use client";

// Formulaire de connexion (T016, contracts/admin-api.md POST /api/admin/auth/login).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminField, FormMessage, inputClass } from "@/components/admin/AdminField";
import { buttonClass } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json().catch(() => ({}))) as { errors?: Record<string, string> };
      if (response.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      setError(
        body.errors?.rateLimit ?? body.errors?.form ?? Object.values(body.errors ?? {})[0] ??
          "Connexion impossible.",
      );
    } catch {
      setError("La connexion a échoué. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex w-full max-w-sm flex-col gap-4 rounded-card border border-vt-border bg-vt-surface p-8"
    >
      <h1 className="text-[1.75rem] font-extrabold">Connexion administrateur</h1>

      <AdminField id="email" label="Email" required>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </AdminField>

      <AdminField id="password" label="Mot de passe" required>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </AdminField>

      {error && <FormMessage kind="error" message={error} />}

      <button type="submit" disabled={submitting} className={buttonClass("primary")}>
        {submitting ? "Connexion…" : "Se connecter"}
      </button>

      <Link href="/admin/mot-de-passe-oublie" className="text-small underline">
        Mot de passe oublié ?
      </Link>
    </form>
  );
}
