import { WORKFLOW_NODE_SEQUENCE } from "@/lib/server/state/project-state";

const foundationChecklist = [
  "Next.js + TypeScript application shell",
  "Prisma + SQLite persistence baseline",
  "BullMQ + Redis dependency baseline",
  "Project state and workflow node contracts",
  "Artifact storage path conventions",
  "Environment configuration template",
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="space-y-4">
        <span className="inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
          Phase 0 Foundation
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            AI Video Content Factory
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            This repository now includes the initial application shell, project
            contracts, storage conventions, and persistence baseline required to
            start the workflow runner, APIs, and media generation pipeline.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">Foundation Scope</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {foundationChecklist.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <h2 className="text-xl font-semibold text-white">Workflow Nodes</h2>
          <ol className="mt-4 space-y-2 text-sm text-slate-300">
            {WORKFLOW_NODE_SEQUENCE.map((nodeId, index) => (
              <li key={nodeId} className="flex gap-3">
                <span className="w-5 text-right text-slate-500">{index + 1}.</span>
                <span>{nodeId}</span>
              </li>
            ))}
          </ol>
        </article>
      </section>
    </main>
  );
}
