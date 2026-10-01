"use client";

// T017 — POST /api/admin/auth/password-reset/request, 200 identique que l'email existe ou non.
import { useState, type FormEvent } from "react";
import { AdminField, FormMessage, inputClass } from "@/components/admin/AdminField";
import { buttonClass } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setSent(true);
      } else {
        const body = (await response.json().catch(() => ({}))) as {
          errors?: Record<string, string>;
        };
        setError(Object.values(body.errors ?? {})[0] ?? "Demande impossible.");
      }
    } catch {
      setError("La connexion a échoué. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <FormMessage
        kind="success"
        message="Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé."
      />
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex w-full max-w-sm flex-col gap-4 rounded-card border border-vt-border bg-vt-surface p-8"
    >
      <h1 className="text-[1.75rem] font-extrabold">Mot de passe oublié</h1>
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
      {error && <FormMessage kind="error" message={error} />}
      <button type="submit" disabled={submitting} className={buttonClass("primary")}>
        {submitting ? "Envoi…" : "Envoyer le lien de réinitialisation"}
      </button>
    </form>
  );
}
