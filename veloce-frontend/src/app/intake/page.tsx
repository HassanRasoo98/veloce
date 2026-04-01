import { IntakeForm } from "@/components/intake-form";

export default function IntakePage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Project brief
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Tell us about your initiative. Fields marked with * are required.
      </p>
      <div className="mt-8">
        <IntakeForm />
      </div>
    </div>
  );
}
