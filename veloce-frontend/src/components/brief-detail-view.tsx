"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useVeloce } from "@/lib/veloce-store";
import {
  budgetTierLabel,
  stageLabel,
  type Note,
} from "@/types/veloce";

const overrideSchema = z
  .object({
    minHours: z.coerce.number().positive("Min hours must be positive"),
    maxHours: z.coerce.number().positive("Max hours must be positive"),
    reason: z.string().trim().min(3, "Please add a short reason"),
  })
  .refine((d) => d.maxHours >= d.minHours, {
    message: "Max must be ≥ min",
    path: ["maxHours"],
  });

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function NoteTree({
  notes,
  briefId,
  parentId,
  depth,
  onReply,
}: {
  notes: Note[];
  briefId: string;
  parentId: string | null;
  depth: number;
  onReply: (parentId: string) => void;
}) {
  const { role, isReviewerAssignedTo } = useVeloce();
  const canComment =
    role === "admin" || isReviewerAssignedTo(briefId);
  const children = notes.filter((n) => n.parentId === parentId);
  if (children.length === 0 && parentId !== null) return null;

  return (
    <ul className={`space-y-3 ${depth > 0 ? "ml-4 border-l border-zinc-200 pl-4 dark:border-zinc-700" : ""}`}>
      {children.map((n) => (
        <li key={n.id}>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-900 dark:text-zinc-100">{n.body}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {n.authorName} · {formatWhen(n.at)}
            </p>
            {canComment ? (
              <button
                type="button"
                onClick={() => onReply(n.id)}
                className="mt-2 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Reply
              </button>
            ) : null}
          </div>
          <NoteTree
            notes={notes}
            briefId={briefId}
            parentId={n.id}
            depth={depth + 1}
            onReply={onReply}
          />
        </li>
      ))}
    </ul>
  );
}

export function BriefDetailView({ briefId }: { briefId: string }) {
  const {
    briefs,
    analyses,
    stageEvents,
    notes,
    assignments,
    estimateOverrides,
    role,
    isReviewerAssignedTo,
    addNote,
    overrideEstimate,
    assignToReviewer,
  } = useVeloce();

  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState("");
  const [overrideMin, setOverrideMin] = useState("");
  const [overrideMax, setOverrideMax] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const brief = briefs.find((b) => b.id === briefId);
  const analysis = brief ? analyses.get(brief.id) : undefined;
  const override = brief ? estimateOverrides.get(brief.id) : undefined;

  const timeline = useMemo(
    () =>
      stageEvents
        .filter((e) => e.briefId === briefId)
        .sort(
          (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
        ),
    [stageEvents, briefId],
  );

  const briefNotes = useMemo(
    () => notes.filter((n) => n.briefId === briefId),
    [notes, briefId],
  );

  const briefAssignments = useMemo(
    () =>
      assignments
        .filter((a) => a.briefId === briefId)
        .sort(
          (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
        ),
    [assignments, briefId],
  );

  if (!brief) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">Brief not found.</p>
        <Link
          href="/dashboard/briefs"
          className="mt-4 inline-block text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          ← Back to briefs
        </Link>
      </div>
    );
  }

  const reviewerAllowed = role === "admin" || isReviewerAssignedTo(briefId);

  if (!reviewerAllowed) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 dark:border-amber-900 dark:bg-amber-950/40">
        <p className="font-medium text-amber-900 dark:text-amber-100">
          Access restricted
        </p>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
          As a reviewer you can only open briefs assigned to you. Switch to Admin
          in the mock role control to see all briefs.
        </p>
        <Link
          href="/dashboard/briefs"
          className="mt-4 inline-block text-sm font-medium text-amber-900 underline dark:text-amber-100"
        >
          ← Back to briefs
        </Link>
      </div>
    );
  }

  const displayMin = override?.minHours ?? analysis?.effortHoursMin;
  const displayMax = override?.maxHours ?? analysis?.effortHoursMax;

  function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    addNote({
      briefId,
      parentId: replyTo,
      body: noteBody,
    });
    setNoteBody("");
    setReplyTo(null);
  }

  function submitOverride(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});
    const parsed = overrideSchema.safeParse({
      minHours: overrideMin,
      maxHours: overrideMax,
      reason: overrideReason,
    });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "form");
        if (!err[k]) err[k] = issue.message;
      }
      setFormErrors(err);
      return;
    }
    overrideEstimate({ briefId, ...parsed.data });
    setOverrideMin("");
    setOverrideMax("");
    setOverrideReason("");
  }

  const assignedToReviewer = isReviewerAssignedTo(briefId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/briefs"
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← All briefs
        </Link>
        {role === "admin" ? (
          <button
            type="button"
            onClick={() => assignToReviewer(briefId)}
            disabled={assignedToReviewer}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {assignedToReviewer ? "Already assigned to reviewer" : "Assign to reviewer"}
          </button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Original submission
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Submitted {formatWhen(brief.submittedAt)} · Stage:{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {stageLabel(brief.stage)}
            </span>
          </p>
          <h3 className="mt-4 font-medium text-zinc-800 dark:text-zinc-200">
            {brief.title}
          </h3>
          <div className="mt-3 whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {brief.descriptionRich}
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Budget</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {budgetTierLabel(brief.budgetTier)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Urgency</dt>
              <dd className="font-medium capitalize text-zinc-900 dark:text-zinc-100">
                {brief.timelineUrgency}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Contact</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                {brief.contactName}
                <br />
                <a
                  className="text-emerald-700 hover:underline dark:text-emerald-400"
                  href={`mailto:${brief.contactEmail}`}
                >
                  {brief.contactEmail}
                </a>
                {brief.contactPhone ? (
                  <>
                    <br />
                    {brief.contactPhone}
                  </>
                ) : null}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            AI analysis
          </h2>
          {analysis ? (
            <>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Category:{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {analysis.category}
                </span>
                {" · "}
                Complexity:{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {analysis.complexity} / 5
                </span>
              </p>
              <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                Effort (hours):{" "}
                <strong>
                  {displayMin} – {displayMax}
                </strong>
                {override ? (
                  <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">
                    (overridden)
                  </span>
                ) : null}
              </p>
              {override ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Reason: {override.reason} · {override.byName} ·{" "}
                  {formatWhen(override.at)}
                </p>
              ) : null}
              <h3 className="mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Features
              </h3>
              <ul className="mt-2 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
                {analysis.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <h3 className="mt-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Suggested stack
              </h3>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                {analysis.techStack.join(", ")}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">No analysis (mock).</p>
          )}

          <form onSubmit={submitOverride} className="mt-6 space-y-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Override estimates
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="omin" className="text-xs text-zinc-500">
                  Min hours
                </label>
                <input
                  id="omin"
                  type="number"
                  value={overrideMin}
                  onChange={(e) => setOverrideMin(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                />
                {formErrors.minHours ? (
                  <p className="text-xs text-red-600">{formErrors.minHours}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="omax" className="text-xs text-zinc-500">
                  Max hours
                </label>
                <input
                  id="omax"
                  type="number"
                  value={overrideMax}
                  onChange={(e) => setOverrideMax(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                />
                {formErrors.maxHours ? (
                  <p className="text-xs text-red-600">{formErrors.maxHours}</p>
                ) : null}
              </div>
            </div>
            <div>
              <label htmlFor="oreason" className="text-xs text-zinc-500">
                Reason
              </label>
              <textarea
                id="oreason"
                rows={2}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              />
              {formErrors.reason ? (
                <p className="text-xs text-red-600">{formErrors.reason}</p>
              ) : null}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Save override
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Assignment history
        </h2>
        {briefAssignments.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No assignments yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {briefAssignments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800"
              >
                <span className="text-zinc-800 dark:text-zinc-200">
                  {a.assignedToName}
                </span>
                <span className="text-zinc-500">
                  by {a.assignedByName} · {formatWhen(a.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stage timeline
        </h2>
        <ol className="mt-4 space-y-3">
          {timeline.map((ev) => (
            <li
              key={ev.id}
              className="flex flex-wrap gap-2 border-l-2 border-emerald-500 pl-4 text-sm"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {ev.fromStage ? stageLabel(ev.fromStage) : "Created"} →{" "}
                {stageLabel(ev.toStage)}
              </span>
              <span className="text-zinc-500">
                {formatWhen(ev.at)} · {ev.actorName}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Internal notes
        </h2>
        <NoteTree
          notes={briefNotes}
          briefId={briefId}
          parentId={null}
          depth={0}
          onReply={setReplyTo}
        />
        <form onSubmit={submitNote} className="mt-6 space-y-2">
          {replyTo ? (
            <p className="text-xs text-zinc-500">
              Replying to thread ·{" "}
              <button
                type="button"
                className="text-emerald-700 underline dark:text-emerald-400"
                onClick={() => setReplyTo(null)}
              >
                Cancel
              </button>
            </p>
          ) : null}
          <textarea
            rows={3}
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Add a note for the team…"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Post note
          </button>
        </form>
      </section>
    </div>
  );
}
