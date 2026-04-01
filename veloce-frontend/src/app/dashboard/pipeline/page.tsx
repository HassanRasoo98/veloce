import { Suspense } from "react";
import { PipelineBoard } from "@/components/pipeline-board";
import { PipelineWelcome } from "@/components/pipeline-welcome";

export default function PipelinePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Pipeline
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Drag briefs between stages. Reviewer role only sees assigned briefs.
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <PipelineWelcome />
        </Suspense>
        <PipelineBoard />
      </div>
    </div>
  );
}
