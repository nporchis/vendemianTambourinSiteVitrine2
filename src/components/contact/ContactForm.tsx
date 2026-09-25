"use client";

// Formulaire de contact (T049, FR-006, FR-007, FR-012, FR-017, FR-020, FR-023) :
// validation côté client avant envoi (la validation serveur fait foi), erreurs par champ
// liées par aria-describedby, retours d'envoi explicites — les champs saisis ne sont
// jamais perdus en cas d'erreur.
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { buttonClass } from "@/components/ui/Button";
import {
  CONTACT_SUBJECT_LABELS,
  CONTACT_SUBJECTS,
  isContactSubject,
  type ContactSubject,
} from "@/lib/contact-subjects";
import { EMAIL_PATTERN } from "@/lib/email-pattern";
import { Turnstile } from "./Turnstile";

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  subject: ContactSubject | "";
  message: string;
  rgpdNoticeAcknowledged: boolean;
};

type FieldName = keyof Fields | "captchaToken";
type Errors = Partial<Record<FieldName, string>>;

type Outcome =
  | { kind: "success"; message: string }
  | { kind: "error"; title: string; message: string; icon: "alert" | "clock" }
  | null;

const EMPTY: Omit<Fields, "subject"> = {
  firstName: "",
  lastName: "",
  email: "",
  message: "",
  rgpdNoticeAcknowledged: false,
};

const FIELD_ORDER: FieldName[] = [
  "firstName",
  "lastName",
  "email",
  "subject",
  "message",
  "captchaToken",
  "rgpdNoticeAcknowledged",
];

function validate(fields: Fields, captchaToken: string): Errors {
  const errors: Errors = {};
  if (!fields.firstName.trim()) errors.firstName = "Indiquez votre prénom.";
  if (!fields.lastName.trim()) errors.lastName = "Indiquez votre nom.";
  if (!EMAIL_PATTERN.test(fields.email.trim()))
    errors.email = "Saisissez une adresse email valide (ex. nom@exemple.fr).";
  if (!isContactSubject(fields.subject)) errors.subject = "Choisissez un sujet.";
  if (!fields.message.trim()) errors.message = "Écrivez votre message.";
  if (!captchaToken) errors.captchaToken = "Validez la vérification anti-robot.";
  if (!fields.rgpdNoticeAcknowledged)
    errors.rgpdNoticeAcknowledged =
      "Merci d'accepter l'utilisation de vos données pour répondre à votre demande.";
  return errors;
}

const inputClass = (invalid: boolean) =>
  `h-12 w-full rounded-control border bg-vt-surface px-3.5 text-ui font-normal text-vt-ink focus-visible:border-vt-ink ${
    invalid ? "border-vt-terracotta" : "border-vt-ink/25"
  }`;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="flex items-center gap-1.5 text-small font-semibold text-[#a33a31]">
      <AlertCircle aria-hidden="true" size={14} strokeWidth={2.4} className="shrink-0" />
      {message}
    </span>
  );
}

type ContactFormProps = {
  initialSubject: ContactSubject | null;
  turnstileSiteKey: string;
  rgpdNotice: ReactNode;
};

export function ContactForm({ initialSubject, turnstileSiteKey, rgpdNotice }: ContactFormProps) {
  const [fields, setFields] = useState<Fields>({ ...EMPTY, subject: initialSubject ?? "" });
  const [errors, setErrors] = useState<Errors>({});
  const [captchaToken, setCaptchaToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);

  const set =
    <K extends keyof Fields>(name: K) =>
    (value: Fields[K]) => {
      setFields((f) => ({ ...f, [name]: value }));
      if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
    };

  function focusFirstError(found: Errors) {
    const first = FIELD_ORDER.find((name) => found[name]);
    if (!first) return;
    const target =
      first === "captchaToken"
        ? formRef.current?.querySelector<HTMLElement>("#captcha-error")
        : formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
    target?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setOutcome(null);

    const found = validate(fields, captchaToken);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstError(found);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, captchaToken }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        confirmation?: string;
        errors?: Record<string, string>;
      };

      if (response.status === 201) {
        setFields({ ...EMPTY, subject: initialSubject ?? "" });
        setOutcome({
          kind: "success",
          message:
            body.confirmation ??
            "Votre demande a bien été envoyée. Le club vous répondra par email dans les meilleurs délais.",
        });
      } else if (response.status === 400 && body.errors) {
        setErrors(body.errors as Errors);
        focusFirstError(body.errors as Errors);
      } else if (response.status === 429) {
        setOutcome({
          kind: "error",
          icon: "clock",
          title: "Trop de messages envoyés",
          message:
            body.errors?.rateLimit ??
            "Vous avez atteint la limite d'envois. Merci de réessayer plus tard — votre message est conservé.",
        });
      } else if (response.status === 403) {
        setErrors({ captchaToken: body.errors?.captchaToken ?? "Vérification anti-bot échouée" });
      } else {
        setOutcome({
          kind: "error",
          icon: "alert",
          title: "Envoi impossible",
          message:
            "Votre message n'a pas pu être transmis au club. Vos informations sont conservées dans le formulaire : réessayez dans quelques minutes.",
        });
      }
    } catch {
      setOutcome({
        kind: "error",
        icon: "alert",
        title: "Envoi impossible",
        message:
          "La connexion a échoué. Vos informations sont conservées dans le formulaire : réessayez dans quelques minutes.",
      });
    } finally {
      setSubmitting(false);
      // Le jeton Turnstile est à usage unique.
      setTurnstileReset((n) => n + 1);
      requestAnimationFrame(() => outcomeRef.current?.focus());
    }
  }

  const describedBy = (name: FieldName) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      aria-labelledby="form-title"
      aria-busy={submitting}
      className="flex flex-col gap-5 rounded-card border border-vt-border bg-vt-surface p-5 md:p-9"
    >
      <h2 id="form-title" className="text-[2rem] font-extrabold md:text-[2.5rem]">
        Votre message
      </h2>
      <p className="-mt-2 text-small text-vt-text-secondary">
        Tous les champs marqués d&apos;un astérisque (<span aria-hidden="true">*</span>
        <span className="sr-only">astérisque</span>) sont obligatoires.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["firstName", "Prénom", "given-name"],
            ["lastName", "Nom", "family-name"],
          ] as const
        ).map(([name, label, autoComplete]) => (
          <div key={name} className="flex flex-col gap-1.5">
            <label htmlFor={name} className="text-meta font-bold">
              {label}{" "}
              <span aria-hidden="true" className="text-vt-terracotta">
                *
              </span>
            </label>
            <input
              id={name}
              name={name}
              autoComplete={autoComplete}
              maxLength={80}
              required
              value={fields[name]}
              onChange={(e) => set(name)(e.target.value)}
              aria-invalid={Boolean(errors[name])}
              aria-describedby={describedBy(name)}
              className={inputClass(Boolean(errors[name]))}
            />
            <FieldError id={`${name}-error`} message={errors[name]} />
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-meta font-bold">
            Email{" "}
            <span aria-hidden="true" className="text-vt-terracotta">
              *
            </span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={fields.email}
            onChange={(e) => set("email")(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
            className={inputClass(Boolean(errors.email))}
          />
          <FieldError id="email-error" message={errors.email} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="subject" className="text-meta font-bold">
            Sujet{" "}
            <span aria-hidden="true" className="text-vt-terracotta">
              *
            </span>
          </label>
          <select
            id="subject"
            name="subject"
            required
            value={fields.subject}
            onChange={(e) => set("subject")(e.target.value as ContactSubject | "")}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={describedBy("subject")}
            className={inputClass(Boolean(errors.subject))}
          >
            <option value="" disabled>
              Choisissez un sujet
            </option>
            {CONTACT_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {CONTACT_SUBJECT_LABELS[subject]}
              </option>
            ))}
          </select>
          <FieldError id="subject-error" message={errors.subject} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-meta font-bold">
          Message{" "}
          <span aria-hidden="true" className="text-vt-terracotta">
            *
          </span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          maxLength={5000}
          required
          value={fields.message}
          onChange={(e) => set("message")(e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy("message")}
          className={`${inputClass(Boolean(errors.message))} h-auto resize-y py-3`}
        />
        <FieldError id="message-error" message={errors.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="self-start rounded-control border border-dashed border-vt-ink/25 bg-vt-surface-muted p-2 sm:p-4">
          <Turnstile
            siteKey={turnstileSiteKey}
            resetKey={turnstileReset}
            onToken={(token) => {
              setCaptchaToken(token);
              if (token) setErrors((e) => ({ ...e, captchaToken: undefined }));
            }}
          />
        </div>
        <span id="captcha-error" tabIndex={-1}>
          <FieldError id="captchaToken-error" message={errors.captchaToken} />
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2.5">
          <input
            id="rgpdNoticeAcknowledged"
            name="rgpdNoticeAcknowledged"
            type="checkbox"
            checked={fields.rgpdNoticeAcknowledged}
            onChange={(e) => set("rgpdNoticeAcknowledged")(e.target.checked)}
            aria-invalid={Boolean(errors.rgpdNoticeAcknowledged)}
            aria-describedby={describedBy("rgpdNoticeAcknowledged")}
            className="mt-0.5 size-5 shrink-0 accent-vt-terracotta"
          />
          <label
            htmlFor="rgpdNoticeAcknowledged"
            className="text-meta leading-normal text-vt-text-prose"
          >
            {rgpdNotice}
          </label>
        </div>
        <FieldError id="rgpdNoticeAcknowledged-error" message={errors.rgpdNoticeAcknowledged} />
      </div>

      <div>
        <button type="submit" disabled={submitting} className={buttonClass("primary")}>
          {submitting ? "Envoi…" : "Envoyer le message"}
        </button>
      </div>

      <div ref={outcomeRef} tabIndex={-1} className="outline-none">
        {outcome?.kind === "success" && (
          <div
            role="status"
            className="flex flex-col gap-2.5 rounded-card border border-l-4 border-vt-border border-l-vt-yellow bg-vt-surface p-6"
          >
            <CheckCircle2 aria-hidden="true" size={28} strokeWidth={2.2} />
            <h3 className="text-[1.625rem] font-extrabold">Message envoyé</h3>
            <p className="text-vt-text-prose">{outcome.message}</p>
          </div>
        )}
        {outcome?.kind === "error" && (
          <div
            role="alert"
            className="flex flex-col gap-2.5 rounded-card border border-l-4 border-vt-terracotta/35 border-l-vt-terracotta bg-[#fbedeb] p-6"
          >
            {outcome.icon === "clock" ? (
              <Clock aria-hidden="true" size={28} className="text-vt-terracotta" />
            ) : (
              <AlertCircle aria-hidden="true" size={28} className="text-vt-terracotta" />
            )}
            <h3 className="text-[1.625rem] font-extrabold">{outcome.title}</h3>
            <p className="text-vt-text-prose">{outcome.message}</p>
          </div>
        )}
      </div>
    </form>
  );
}
