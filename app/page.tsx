import { ProjectDemo } from "@/components/project-demo";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-none flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 xl:px-8 2xl:px-10">
      <ProjectDemo />
    </main>
  );
}
