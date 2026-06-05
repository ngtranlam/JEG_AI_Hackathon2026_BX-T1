import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

async function createDraftArtifacts(input: {
  projectId: string;
  variantId: string;
  normalizedVideoPaths: string[];
}) {
  const manifestPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "video-stitching-agent",
    fileName: "files.txt",
  });

  const draftVideoPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "video-stitching-agent",
    fileName: `${input.variantId}_draft_9x16.mp4`,
  });

  await writeTextArtifact(
    manifestPath,
    input.normalizedVideoPaths.map((filePath) => `file '${filePath}'`).join("\n"),
  );

  await writeTextArtifact(
    draftVideoPath,
    JSON.stringify(
      {
        mock: true,
        stitchedFrom: input.normalizedVideoPaths,
        profile: "concat / hard cuts / 1080x1920 / 30fps",
      },
      null,
      2,
    ),
  );

  return { manifestPath, draftVideoPath };
}

export const videoStitchingAgentNode: WorkflowNode = {
  id: "video-stitching-agent",
  async run(projectState: ProjectState) {
    const nextVariants = await Promise.all(
      projectState.variants.map(async (variant) => {
        const normalizedVideoPaths = (variant.segmentPlan ?? [])
          .map((segment) => segment.normalizedVideoPath)
          .filter(Boolean) as string[];

        if (normalizedVideoPaths.length === 0) {
          return variant;
        }

        const { manifestPath, draftVideoPath } = await createDraftArtifacts({
          projectId: projectState.projectId,
          variantId: variant.id,
          normalizedVideoPaths,
        });

        const nextArtifacts: VariantArtifact[] = [
          {
            kind: "stitch-manifest",
            label: `${variant.id} concat manifest`,
            path: manifestPath,
          },
          {
            kind: "draft-video",
            label: `${variant.id} draft 9:16`,
            path: draftVideoPath,
          },
        ];

        return {
          ...variant,
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
      "video-stitching-agent",
      "Created mock concat manifests and stitched draft video artifacts for both variants.",
    );
  },
};
