import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { normalizeVerticalVideo, normalizeSquareVideo } from "@/lib/server/media/ffmpeg";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, SupportedAspectRatio, SupportedResolution, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

async function createNormalizedArtifact(input: {
  projectId: string;
  variantId: string;
  segmentId: string;
  rawVideoPath: string;
  aspectRatio: SupportedAspectRatio;
  resolution: SupportedResolution;
}) {
  const normalizedVideoPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "segment-normalizer",
    fileName: `${input.segmentId}_norm.mp4`,
  });

  if (input.aspectRatio === "1:1") {
    await normalizeSquareVideo(input.rawVideoPath, normalizedVideoPath, input.resolution);
  } else {
    await normalizeVerticalVideo(input.rawVideoPath, normalizedVideoPath, input.resolution);
  }

  return normalizedVideoPath;
}

export const segmentNormalizerNode: WorkflowNode = {
  id: "segment-normalizer",
  async run(projectState: ProjectState) {
    const aspectRatio = projectState.brief.aspectRatio;
    const resolution = projectState.brief.resolution;

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
              aspectRatio,
              resolution,
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

    const dimMap: Record<string, Record<string, string>> = {
      "9:16": { "720p": "720x1280", "1080p": "1080x1920" },
      "1:1": { "720p": "720x720", "1080p": "1080x1080" },
    };
    const dims = dimMap[aspectRatio]?.[resolution] ?? "1080x1920";

    return appendNodeLog(
      nextState,
      "segment-normalizer",
      `Normalized Seedance segment videos to ${dims} (${resolution}) / 30fps / H.264 using FFmpeg.`,
    );
  },
};
