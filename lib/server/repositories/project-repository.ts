import { prisma } from "@/lib/server/db";
import type {
  BrandKit,
  Brief,
  ProjectState,
  ProjectStatus,
} from "@/lib/types/project";

interface CreateProjectRecordInput {
  projectId: string;
  brief: Brief;
  brandKit: BrandKit;
  projectState: ProjectState;
}

export async function createProjectRecord(input: CreateProjectRecordInput) {
  return prisma.project.create({
    data: {
      id: input.projectId,
      status: input.projectState.status,
      briefJson: JSON.stringify(input.brief),
      brandKitJson: JSON.stringify(input.brandKit),
      projectStateJson: JSON.stringify(input.projectState),
    },
  });
}

export async function getProjectRecord(projectId: string) {
  const record = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!record) {
    return null;
  }

  return {
    ...record,
    brief: JSON.parse(record.briefJson) as Brief,
    brandKit: JSON.parse(record.brandKitJson) as BrandKit,
    projectState: record.projectStateJson
      ? (JSON.parse(record.projectStateJson) as ProjectState)
      : null,
  };
}

export async function updateProjectState(
  projectId: string,
  projectState: ProjectState,
) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      status: projectState.status,
      projectStateJson: JSON.stringify(projectState),
    },
  });
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
) {
  return prisma.project.update({
    where: { id: projectId },
    data: { status },
  });
}
