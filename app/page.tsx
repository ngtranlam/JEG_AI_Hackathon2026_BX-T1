import { ProjectDemo } from "@/components/project-demo";

export const dynamic = "force-dynamic";

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
            Create a project, enqueue generation, and watch TRAE-style orchestration run
            node by node. Text planning nodes populate A/B variants before the video
            pipeline is integrated.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
        <h2 className="text-lg font-semibold text-white">Local Commands</h2>
        <p className="mt-2 text-sm text-slate-300">
          Run Redis, the worker, and the web app in separate terminals.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Redis
            </div>
            <pre className="mt-2 overflow-x-auto text-xs text-slate-200">
              <code>redis-server</code>
            </pre>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Worker
            </div>
            <pre className="mt-2 overflow-x-auto text-xs text-slate-200">
              <code>npm run worker</code>
            </pre>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Web
            </div>
            <pre className="mt-2 overflow-x-auto text-xs text-slate-200">
              <code>npm run dev</code>
            </pre>
          </div>
        </div>
      </section>

      <ProjectDemo />
    </main>
  );
}
