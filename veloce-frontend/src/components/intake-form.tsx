"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BUDGET_TIERS,
  TIMELINE_URGENCY,
  budgetTierLabel,
  intakeFormSchema,
  type IntakeFormValues,
} from "@/types/veloce";
import { useVeloce } from "@/lib/veloce-store";

const defaultValues: IntakeFormValues = {
  title: "",
  descriptionRich: "",
  budgetTier: "10k_25k",
  timelineUrgency: "standard",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

export function IntakeForm() {
  const router = useRouter();
  const { addIntakeBrief } = useVeloce();
  const [values, setValues] = useState<IntakeFormValues>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof IntakeFormValues, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setApiError(null);
    const parsed = intakeFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof IntakeFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof IntakeFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await addIntakeBrief(parsed.data);
      setValues(defaultValues);
      router.push("/dashboard/pipeline?welcome=1");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      noValidate
    >
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Project title <span className="text-red-600 dark:text-red-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          autoComplete="organization-title"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title ? (
          <p id="title-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Description <span className="text-red-600 dark:text-red-400">*</span>
        </label>
        <p id="description-hint" className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Rich text (Markdown-style) is supported: headings, lists, and emphasis.
        </p>
        <textarea
          id="description"
          name="description"
          rows={8}
          value={values.descriptionRich}
          onChange={(e) =>
            setValues((v) => ({ ...v, descriptionRich: e.target.value }))
          }
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          aria-invalid={!!errors.descriptionRich}
          aria-describedby="description-hint description-error"
        />
        {errors.descriptionRich ? (
          <p id="description-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.descriptionRich}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="budget" className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Budget range <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <select
            id="budget"
            name="budget"
            value={values.budgetTier}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                budgetTier: e.target.value as IntakeFormValues["budgetTier"],
              }))
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {BUDGET_TIERS.map((t) => (
              <option key={t} value={t}>
                {budgetTierLabel(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="urgency" className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Timeline urgency <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <select
            id="urgency"
            name="urgency"
            value={values.timelineUrgency}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                timelineUrgency: e.target.value as IntakeFormValues["timelineUrgency"],
              }))
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {TIMELINE_URGENCY.map((u) => (
              <option key={u} value={u}>
                {u.charAt(0).toUpperCase() + u.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="space-y-4 border-0 p-0">
        <legend className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Contact
        </legend>
        <div>
          <label htmlFor="contactName" className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">
            Full name <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            id="contactName"
            name="contactName"
            type="text"
            autoComplete="name"
            value={values.contactName}
            onChange={(e) =>
              setValues((v) => ({ ...v, contactName: e.target.value }))
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            aria-invalid={!!errors.contactName}
            aria-describedby={errors.contactName ? "contactName-error" : undefined}
          />
          {errors.contactName ? (
            <p id="contactName-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.contactName}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="contactEmail" className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">
            Email <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            autoComplete="email"
            value={values.contactEmail}
            onChange={(e) =>
              setValues((v) => ({ ...v, contactEmail: e.target.value }))
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            aria-invalid={!!errors.contactEmail}
            aria-describedby={errors.contactEmail ? "contactEmail-error" : undefined}
          />
          {errors.contactEmail ? (
            <p id="contactEmail-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.contactEmail}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="contactPhone" className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">
            Phone <span className="text-zinc-400">(optional)</span>
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            autoComplete="tel"
            value={values.contactPhone ?? ""}
            onChange={(e) =>
              setValues((v) => ({ ...v, contactPhone: e.target.value }))
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </fieldset>

      {apiError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {apiError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-zinc-950"
      >
        {submitting ? "Submitting…" : "Submit brief"}
      </button>
    </form>
  );
}
