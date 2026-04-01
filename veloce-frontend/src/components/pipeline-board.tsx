"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Link from "next/link";
import { useVeloce } from "@/lib/veloce-store";
import type { Brief, PipelineStage } from "@/types/veloce";
import { budgetTierLabel, stageLabel } from "@/types/veloce";

function BriefCard({ brief }: { brief: Brief }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: brief.id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <Link
        href={`/dashboard/briefs/${brief.id}`}
        className={`block rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-emerald-700 ${
          isDragging ? "opacity-60 ring-2 ring-emerald-500" : ""
        }`}
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
      >
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing"
          role="button"
          tabIndex={0}
          aria-label={`Drag ${brief.title}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
            }
          }}
        >
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {brief.title}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {budgetTierLabel(brief.budgetTier)} · {brief.timelineUrgency}
          </p>
        </div>
      </Link>
    </div>
  );
}

function StageColumn({
  stage,
  briefs,
}: {
  stage: PipelineStage;
  briefs: Brief[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex min-h-[320px] min-w-[220px] flex-1 flex-col rounded-xl border border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {stageLabel(stage)}
        </h2>
        <p className="text-xs text-zinc-500">{briefs.length} briefs</p>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 p-2 ${
          isOver ? "bg-emerald-50/80 ring-2 ring-inset ring-emerald-400 dark:bg-emerald-950/30" : ""
        }`}
        data-stage={stage}
      >
        {briefs.map((b) => (
          <BriefCard key={b.id} brief={b} />
        ))}
      </div>
    </div>
  );
}

export function PipelineBoard() {
  const { visibleBriefs, moveBriefToStage, PIPELINE_STAGES: stages } =
    useVeloce();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const briefId = String(active.id);
    const overId = String(over.id) as PipelineStage;
    if (!stages.includes(overId)) return;
    void moveBriefToStage(briefId, overId).catch((err) => {
      console.error(err);
      window.alert(
        err instanceof Error ? err.message : "Could not update stage. Try again.",
      );
    });
  }

  const byStage = (stage: PipelineStage) =>
    visibleBriefs.filter((b) => b.stage === stage);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <StageColumn key={stage} stage={stage} briefs={byStage(stage)} />
        ))}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Drag cards between columns. Each move is saved to the API and logged on
        the brief timeline.
      </p>
    </DndContext>
  );
}
