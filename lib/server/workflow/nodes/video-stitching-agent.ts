import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { concatVideos, mixBackgroundMusic, probeMediaFile } from "@/lib/server/media/ffmpeg";
import { writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

async function createDraftArtifacts(input: {
  projectId: string;
  variantId: string;
  normalizedVideoPaths: string[];
  isSquare?: boolean;
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
    fileName: input.isSquare ? `${input.variantId}_draft_1x1.mp4` : `${input.variantId}_draft_9x16.mp4`,
  });

  await writeTextArtifact(
    manifestPath,
    input.normalizedVideoPaths.map((filePath) => `file '${filePath}'`).join("\n"),
  );

  await concatVideos(manifestPath, draftVideoPath);

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

        const isSquare = projectState.brief.aspectRatio === "1:1";
        const { manifestPath, draftVideoPath } = await createDraftArtifacts({
          projectId: projectState.projectId,
          variantId: variant.id,
          normalizedVideoPaths,
          isSquare,
        });

        const ratioLabel = isSquare ? "1:1" : "9:16";
        const nextArtifacts: VariantArtifact[] = [
          {
            kind: "stitch-manifest",
            label: `${variant.id} concat manifest`,
            path: manifestPath,
          },
          {
            kind: "draft-video",
            label: `${variant.id} draft ${ratioLabel}`,
            path: draftVideoPath,
          },
        ];

        const backgroundMusicPath = projectState.brandKit.backgroundMusicPath;
        if (
          !projectState.brief.enableVoice &&
          backgroundMusicPath &&
          (await probeMediaFile(backgroundMusicPath))
        ) {
          const musicMixPath = buildArtifactPath({
            projectId: projectState.projectId,
            variantId: variant.id,
            nodeId: "video-stitching-agent",
            fileName: isSquare ? `${variant.id}_draft_bgm_1x1.mp4` : `${variant.id}_draft_bgm_9x16.mp4`,
          });
          await mixBackgroundMusic(draftVideoPath, backgroundMusicPath, musicMixPath);
          nextArtifacts.push({
            kind: "voiceover-mixed-video",
            label: `${variant.id} draft with BGM`,
            path: musicMixPath,
          });
        }

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
      "Created concat manifests and stitched normalized Seedance segments into draft videos with FFmpeg.",
    );
  },
};
