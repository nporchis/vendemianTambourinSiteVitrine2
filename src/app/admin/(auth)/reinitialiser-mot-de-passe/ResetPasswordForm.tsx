"use client";

// T017 — POST /api/admin/auth/password-reset/confirm ; jeton lu depuis l'URL.
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AdminField, FormMessage, inputClass } from "@/components/admin/AdminField";
import { buttonClass } from "@/components/ui/Button";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (response.ok) {
        setDone(true);
      } else {
        const body = (await response.json().catch(() => ({}))) as {
          errors?: Record<string, string>;
        };
        setError(Object.values(body.errors ?? {})[0] ?? "Réinitialisation impossible.");
      }
    } catch {
      setError("La connexion a échoué. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <FormMessage kind="success" message="Mot de passe modifié. Vous pouvez vous reconnecter." />
        <Link href="/admin/login" className={buttonClass("primary")}>
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex w-full max-w-sm flex-col gap-4 rounded-card border border-vt-border bg-vt-surface p-8"
    >
      <h1 className="text-[1.75rem] font-extrabold">Nouveau mot de passe</h1>
      <AdminField id="password" label="Mot de passe (12 caractères minimum)" required>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </AdminField>
      {error && <FormMessage kind="error" message={error} />}
      <button type="submit" disabled={submitting} className={buttonClass("primary")}>
        {submitting ? "Enregistrement…" : "Réinitialiser le mot de passe"}
      </button>
    </form>
  );
}
