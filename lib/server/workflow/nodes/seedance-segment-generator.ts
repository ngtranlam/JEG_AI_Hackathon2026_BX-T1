import { createSeedanceTask } from "@/lib/server/modelark/seedance-client";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

export const seedanceSegmentGeneratorNode: WorkflowNode = {
  id: "seedance-segment-generator",
  async run(projectState: ProjectState) {
    const nextVariants = await Promise.all(
      projectState.variants.map(async (variant) => {
        const nextArtifacts: VariantArtifact[] = [];
        const nextSegments = await Promise.all(
          (variant.segmentPlan ?? []).map(async (segment) => {
            const result = await createSeedanceTask({
              projectId: projectState.projectId,
              variantId: variant.id,
              segmentId: segment.id,
              prompt: segment.promptSummary ?? "",
              durationSeconds: segment.durationSeconds,
              generationMode: segment.generationMode ?? "T2V",
            });

            nextArtifacts.push({
              kind: "raw-segment-video",
              label: `${segment.id} raw segment`,
              path: result.rawVideoPath,
            });

            return {
              ...segment,
              seedanceTaskId: result.taskId,
              rawVideoPath: result.rawVideoPath,
              status: "completed" as const,
            };
          }),
        );

        return {
          ...variant,
          segmentPlan: nextSegments,
          artifacts: [...variant.artifacts, ...nextArtifacts],
        };
      }),
    );

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "seedance-segment-generator",
      "Generated mock Seedance raw segment artifacts for every planned segment.",
    );
  },
};
