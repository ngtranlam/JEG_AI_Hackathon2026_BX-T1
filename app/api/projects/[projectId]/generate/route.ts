import { NextResponse } from "next/server";

import { enqueueProjectGeneration } from "@/lib/server/queue/project-generation";
import {
  getProjectRecord,
  updateProjectState,
} from "@/lib/server/repositories/project-repository";
import { setProjectStatus } from "@/lib/server/state/project-state";

interface RouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function POST(_: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const projectRecord = await getProjectRecord(projectId);

  if (!projectRecord?.projectState) {
    return NextResponse.json(
      {
        error: "Project not found.",
      },
      { status: 404 },
    );
  }

  if (
    projectRecord.projectState.status === "queued" ||
    projectRecord.projectState.status === "running"
  ) {
    return NextResponse.json(
      {
        error: "Project generation is already queued or running.",
        project: projectRecord.projectState,
      },
      { status: 409 },
    );
  }

  const queuedState = setProjectStatus(projectRecord.projectState, "queued");
  await updateProjectState(projectId, queuedState);

  try {
    const job = await enqueueProjectGeneration({ projectId });

    return NextResponse.json({
      project: queuedState,
      job: {
        id: job.id,
        name: job.name,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to enqueue generation job.";
    const revertedState = setProjectStatus(projectRecord.projectState, "draft");

    await updateProjectState(projectId, revertedState);

    return NextResponse.json(
      {
        error: message,
      },
      { status: 503 },
    );
  }
}
