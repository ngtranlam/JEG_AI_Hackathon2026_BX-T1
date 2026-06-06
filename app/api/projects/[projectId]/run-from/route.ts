import { NextResponse } from "next/server";

import { enqueueProjectGeneration } from "@/lib/server/queue/project-generation";
import {
  getProjectRecord,
  updateProjectState,
} from "@/lib/server/repositories/project-repository";
import { setProjectStatus } from "@/lib/server/state/project-state";
import type { WorkflowNodeId } from "@/lib/types/project";

interface RouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const body = await request.json();
  const startFromNode = body.startFromNode as WorkflowNodeId | undefined;

  if (!startFromNode) {
    return NextResponse.json(
      { error: "startFromNode is required." },
      { status: 400 },
    );
  }

  const projectRecord = await getProjectRecord(projectId);

  if (!projectRecord?.projectState) {
    return NextResponse.json(
      { error: "Project not found." },
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
    const job = await enqueueProjectGeneration({ projectId, startFromNode });

    return NextResponse.json({
      project: queuedState,
      job: { id: job.id, name: job.name },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to enqueue generation job.";
    const revertedState = setProjectStatus(projectRecord.projectState, "draft");
    await updateProjectState(projectId, revertedState);

    return NextResponse.json({ error: message }, { status: 503 });
  }
}
