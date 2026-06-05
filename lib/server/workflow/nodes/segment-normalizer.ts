import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

async function createNormalizedArtifact(input: {
  projectId: string;
  variantId: string;
  segmentId: string;
  rawVideoPath: string;
}) {
  const normalizedVideoPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "segment-normalizer",
    fileName: `${input.segmentId}_norm.mp4`,
  });

  await writeTextArtifact(
    normalizedVideoPath,
    JSON.stringify(
      {
        mock: true,
        source: input.rawVideoPath,
        normalized: true,
        ffmpegProfile: "1080x1920 / 30fps / H.264 / yuv420p / no-audio",
      },
      null,
      2,
    ),
  );

  return normalizedVideoPath;
}

export const segmentNormalizerNode: WorkflowNode = {
  id: "segment-normalizer",
  async run(projectState: ProjectState) {
    const nextVariants = await Promise.all(
      projectState.variants.map(async (variant) => {
        const nextArtifacts: VariantArtifact[] = [];

        const nextSegments = await Promise.all(
          (variant.segmentPlan ?? []).map(async (segment) => {
            if (!segment.rawVideoPath) {
              return {
                ...segment,
                status: "failed" as const,
              };
            }

            const normalizedVideoPath = await createNormalizedArtifact({
              projectId: projectState.projectId,
              variantId: variant.id,
              segmentId: segment.id,
              rawVideoPath: segment.rawVideoPath,
            });

            nextArtifacts.push({
              kind: "normalized-segment-video",
              label: `${segment.id} normalized segment`,
              path: normalizedVideoPath,
            });

            return {
              ...segment,
              normalizedVideoPath,
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
      "segment-normalizer",
      "Created mock normalized segment artifacts using the planned FFmpeg profile.",
    );
  },
};
