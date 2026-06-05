import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function buildVoiceScript(projectState: ProjectState, variantId: string) {
  const variant = projectState.variants.find((item) => item.id === variantId);
  return (variant?.script ?? []).map((beat) => beat.narration).join(" ");
}

async function createVoiceoverArtifact(input: {
  projectId: string;
  variantId: string;
  script: string;
  durationSeconds: number;
  toneOfVoice: string;
}) {
  const voiceoverPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "voiceover-generator",
    fileName: "voiceover.mp3",
  });

  await writeTextArtifact(
    voiceoverPath,
    JSON.stringify(
      {
        mock: true,
        provider: "mock-tts",
        durationSeconds: input.durationSeconds,
        voiceStyle: input.toneOfVoice,
        script: input.script,
      },
      null,
      2,
    ),
  );

  return voiceoverPath;
}

export const voiceoverGeneratorNode: WorkflowNode = {
  id: "voiceover-generator",
  async run(projectState: ProjectState) {
    const nextVariants = await Promise.all(
      projectState.variants.map(async (variant) => {
        const script = buildVoiceScript(projectState, variant.id);
        const voiceoverPath = await createVoiceoverArtifact({
          projectId: projectState.projectId,
          variantId: variant.id,
          script,
          durationSeconds: projectState.brief.durationSeconds,
          toneOfVoice: projectState.brief.toneOfVoice,
        });

        const nextArtifacts: VariantArtifact[] = [
          {
            kind: "voiceover-audio",
            label: `${variant.id} voiceover`,
            path: voiceoverPath,
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
      "voiceover-generator",
      "Created mock full-length voiceover artifacts for both variants.",
    );
  },
};
