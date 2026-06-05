import { env } from "@/lib/config/env";
import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { writeTextArtifact } from "@/lib/server/storage/files";

export type SeedanceGenerationMode = "T2V" | "I2V" | "R2V";

export interface SeedanceCreateTaskInput {
  projectId: string;
  variantId: string;
  segmentId: string;
  prompt: string;
  durationSeconds: number;
  generationMode: SeedanceGenerationMode;
}

export interface SeedanceTaskResult {
  taskId: string;
  provider: "mock" | "modelark";
  status: "completed";
  rawVideoPath: string;
  videoUrl?: string;
}

function createMockTaskId(segmentId: string) {
  return `mock-${segmentId.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`;
}

async function createMockSeedanceTask(
  input: SeedanceCreateTaskInput,
): Promise<SeedanceTaskResult> {
  const rawVideoPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "seedance-segment-generator",
    fileName: `${input.segmentId}_raw.mp4`,
  });

  const taskId = createMockTaskId(input.segmentId);

  await writeTextArtifact(
    rawVideoPath,
    JSON.stringify(
      {
        mock: true,
        provider: "mock",
        taskId,
        segmentId: input.segmentId,
        durationSeconds: input.durationSeconds,
        generationMode: input.generationMode,
        prompt: input.prompt,
      },
      null,
      2,
    ),
  );

  return {
    taskId,
    provider: "mock",
    status: "completed",
    rawVideoPath,
  };
}

export async function createSeedanceTask(
  input: SeedanceCreateTaskInput,
): Promise<SeedanceTaskResult> {
  if (env.SEEDANCE_PROVIDER === "mock") {
    return createMockSeedanceTask(input);
  }

  return createMockSeedanceTask(input);
}
