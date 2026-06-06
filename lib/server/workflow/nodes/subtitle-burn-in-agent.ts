import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { burnAssSubtitles, probeMediaFile } from "@/lib/server/media/ffmpeg";
import { writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function formatAssTime(milliseconds: number) {
  const totalCentiseconds = Math.floor(milliseconds / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}.${String(centiseconds).padStart(2, "0")}`;
}

function escapeAssText(value: string) {
  return value.replace(/\n/g, "\\N");
}

function buildAssSubtitle(projectState: ProjectState, variantId: string) {
  const variant = projectState.variants.find((item) => item.id === variantId);
  const fontName = projectState.brandKit.fontFamily ?? "Arial";
  const isSquare = projectState.brief.aspectRatio === "1:1";
  const is720 = projectState.brief.resolution === "720p";
  const playResX = is720 ? 720 : 1080;
  const playResY = isSquare ? playResX : (is720 ? 1280 : 1920);
  const fontSize = isSquare ? (is720 ? 36 : 52) : (is720 ? 44 : 64);
  const marginV = isSquare ? (is720 ? 80 : 120) : (is720 ? 150 : 220);
  const dialogue = (variant?.script ?? [])
    .map(
      (beat) =>
        `Dialogue: 0,${formatAssTime(beat.startMs)},${formatAssTime(beat.endMs)},Default,,0,0,0,,${escapeAssText(
          beat.narration,
        )}`,
    )
    .join("\n");

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},&H00FFFFFF,&H00000000,&H66000000,1,0,0,0,100,100,0,0,1,3,1,2,60,60,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${dialogue}
`;
}

async function createSubtitleArtifacts(input: {
  projectId: string;
  variantId: string;
  assSubtitle: string;
  sourceVideoPath?: string;
  isSquare?: boolean;
}) {
  const subtitlePath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "subtitle-burn-in-agent",
    fileName: "subtitle.ass",
  });

  const finalVideoPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "subtitle-burn-in-agent",
    fileName: input.isSquare ? "final_1x1.mp4" : "final_9x16.mp4",
  });

  await writeTextArtifact(subtitlePath, input.assSubtitle);

  if (!input.sourceVideoPath) {
    throw new Error("Source video is required before subtitle burn-in.");
  }

  await burnAssSubtitles(input.sourceVideoPath, subtitlePath, finalVideoPath);

  return { subtitlePath, finalVideoPath };
}

export const subtitleBurnInAgentNode: WorkflowNode = {
  id: "subtitle-burn-in-agent",
  async run(projectState: ProjectState) {
    const nextVariants = await Promise.all(
      projectState.variants.map(async (variant) => {
        const assSubtitle = buildAssSubtitle(projectState, variant.id);
        const mixedVideoPath = variant.artifacts.find(
          (artifact) => artifact.kind === "voiceover-mixed-video",
        )?.path;
        const draftVideoPath = variant.artifacts.find(
          (artifact) => artifact.kind === "draft-video",
        )?.path;

        const usableSourceVideoPath =
          mixedVideoPath && (await probeMediaFile(mixedVideoPath))
            ? mixedVideoPath
            : draftVideoPath && (await probeMediaFile(draftVideoPath))
              ? draftVideoPath
              : undefined;

        const isSquare = projectState.brief.aspectRatio === "1:1";
        const { subtitlePath, finalVideoPath } = await createSubtitleArtifacts({
          projectId: projectState.projectId,
          variantId: variant.id,
          assSubtitle,
          sourceVideoPath: usableSourceVideoPath,
          isSquare,
        });

        const ratioLabel = isSquare ? "1:1" : "9:16";
        const nextArtifacts: VariantArtifact[] = [
          {
            kind: "subtitle-file",
            label: `${variant.id} subtitles`,
            path: subtitlePath,
          },
          {
            kind: "final-video",
            label: `${variant.id} final ${ratioLabel}`,
            path: finalVideoPath,
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
      "subtitle-burn-in-agent",
      "Created ASS subtitle files and burned subtitles into the voiceover-mixed video when available, otherwise the silent draft video.",
    );
  },
};
