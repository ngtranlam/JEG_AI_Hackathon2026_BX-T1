import { buildArtifactPath } from "@/lib/server/storage/artifacts";
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
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},64,&H00FFFFFF,&H00000000,&H66000000,1,0,0,0,100,100,0,0,1,3,1,2,60,60,220,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${dialogue}
`;
}

async function createSubtitleArtifacts(input: {
  projectId: string;
  variantId: string;
  assSubtitle: string;
  draftVideoPath?: string;
  voiceoverPath?: string;
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
    fileName: "final_9x16.mp4",
  });

  await writeTextArtifact(subtitlePath, input.assSubtitle);
  await writeTextArtifact(
    finalVideoPath,
    JSON.stringify(
      {
        mock: true,
        sourceDraft: input.draftVideoPath ?? null,
        voiceover: input.voiceoverPath ?? null,
        subtitle: subtitlePath,
        output: "final_9x16",
      },
      null,
      2,
    ),
  );

  return { subtitlePath, finalVideoPath };
}

export const subtitleBurnInAgentNode: WorkflowNode = {
  id: "subtitle-burn-in-agent",
  async run(projectState: ProjectState) {
    const nextVariants = await Promise.all(
      projectState.variants.map(async (variant) => {
        const assSubtitle = buildAssSubtitle(projectState, variant.id);
        const draftVideoPath = variant.artifacts.find(
          (artifact) => artifact.kind === "draft-video",
        )?.path;
        const voiceoverPath = variant.artifacts.find(
          (artifact) => artifact.kind === "voiceover-audio",
        )?.path;

        const { subtitlePath, finalVideoPath } = await createSubtitleArtifacts({
          projectId: projectState.projectId,
          variantId: variant.id,
          assSubtitle,
          draftVideoPath,
          voiceoverPath,
        });

        const nextArtifacts: VariantArtifact[] = [
          {
            kind: "subtitle-file",
            label: `${variant.id} subtitles`,
            path: subtitlePath,
          },
          {
            kind: "final-video",
            label: `${variant.id} final 9:16`,
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
      "Created mock ASS subtitle files and final 9:16 video artifacts for both variants.",
    );
  },
};
