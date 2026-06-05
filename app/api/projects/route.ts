import { NextResponse } from "next/server";

import { createProjectRecord } from "@/lib/server/repositories/project-repository";
import { createProjectState } from "@/lib/server/state/project-state";
import { generateProjectId } from "@/lib/server/utils/project-id";
import { createProjectRequestSchema } from "@/lib/server/validation/project";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = createProjectRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid project payload.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { brief, brandKit } = parsed.data;
    const projectId =
      parsed.data.projectId ?? generateProjectId(parsed.data.brief.brandName);
    const projectState = createProjectState({
      projectId,
      brief,
      brandKit,
    });

    await createProjectRecord({
      projectId,
      brief,
      brandKit,
      projectState,
    });

    return NextResponse.json(
      {
        project: projectState,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create project.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
