import { NextResponse } from "next/server";

import { getProjectRecord } from "@/lib/server/repositories/project-repository";

interface RouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const projectRecord = await getProjectRecord(projectId);

  if (!projectRecord) {
    return NextResponse.json(
      {
        error: "Project not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    project: projectRecord.projectState,
  });
}
