import {
  generateVoiceoverWithElevenLabs,
  getConfiguredElevenLabsModelId,
  getConfiguredElevenLabsVoiceId,
  hasElevenLabsRuntimeConfig,
} from "@/lib/server/audio/elevenlabs";
import { mixBackgroundMusic, mixVoiceoverWithVideo, probeMediaFile } from "@/lib/server/media/ffmpeg";
import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { AudioStrategy, ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function buildVoiceScript(projectState: ProjectState, variantId: string) {
  const variant = projectState.variants.find((item) => item.id === variantId);
  return (variant?.script ?? []).map((beat) => beat.narration).join(" ");
}

function buildAudioStrategyPayload(projectState: ProjectState, variantId: string) {
  const variant = projectState.variants.find((item) => item.id === variantId);
  const segmentPlan = variant?.segmentPlan ?? [];

  return {
    projectId: projectState.projectId,
    variantId,
    provider: "elevenlabs" as const,
    mode: "voiceover_audio_strategy_agent" as const,
    defaultMode: "narration_voiceover" as const,
    voiceId: getConfiguredElevenLabsVoiceId(projectState.brief.voiceGender) ?? "ELEVENLABS_VOICE_ID",
    toneOfVoice: projectState.brief.brandTone,
    targetDuration: projectState.brief.targetDuration,
    segments: segmentPlan.map((segment) => ({
      segmentId: segment.id,
      sceneId: segment.sourceScene,
      audioType: segment.audioStrategy?.audioType ?? "narration_voiceover",
      requiresLipSync: segment.audioStrategy?.requiresLipSync ?? false,
      narrationText: segment.narrationText,
      dialogueText: segment.dialogueText,
      seedanceMode: segment.generationMode ?? "T2V",
    })),
  };
}

function getDraftVideoPath(projectState: ProjectState, variantId: string) {
  const variant = projectState.variants.find((item) => item.id === variantId);
  return variant?.artifacts.find((artifact) => artifact.kind === "draft-video")?.path;
}

async function createVoiceoverArtifact(input: {
  projectId: string;
  variantId: string;
}) {
  const voiceoverPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "voiceover-generator",
    fileName: "voiceover.mp3",
  });
  const requestPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "voiceover-generator",
    fileName: "elevenlabs-request.json",
  });
  const strategyPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "voiceover-generator",
    fileName: "audio-strategy.json",
  });
  const mixPlanPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "voiceover-generator",
    fileName: "audio-mix-plan.json",
  });
  const mixedVideoPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "voiceover-generator",
    fileName: `${input.variantId}_with_voice_9x16.mp4`,
  });

  return { voiceoverPath, requestPath, strategyPath, mixPlanPath, mixedVideoPath };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const voiceoverGeneratorNode: WorkflowNode = {
  id: "voiceover-generator",
  async run(projectState: ProjectState) {
    const nextVariants: typeof projectState.variants = [];
    for (let vi = 0; vi < projectState.variants.length; vi++) {
      if (vi > 0) await sleep(3000);
      const variant = projectState.variants[vi];
      const script = buildVoiceScript(projectState, variant.id);
      const { voiceoverPath, requestPath, strategyPath, mixPlanPath, mixedVideoPath } =
        await createVoiceoverArtifact({
          projectId: projectState.projectId,
          variantId: variant.id,
        });
      const strategyPayload = buildAudioStrategyPayload(projectState, variant.id);
      const voiceId = strategyPayload.voiceId;
      const draftVideoPath = getDraftVideoPath(projectState, variant.id);

      await writeTextArtifact(strategyPath, JSON.stringify(strategyPayload, null, 2));
      await writeTextArtifact(
        requestPath,
        JSON.stringify(
          {
            provider: "elevenlabs",
            text: script,
            language: "vi-VN",
            voiceId,
            modelId: getConfiguredElevenLabsModelId(),
            outputFormat: "mp3_44100_128",
            voiceStyle: projectState.brief.brandTone,
            outputPath: voiceoverPath,
          },
          null,
          2,
        ),
      );
      await writeTextArtifact(
        mixPlanPath,
        JSON.stringify(
          {
            provider: "ffmpeg",
            mode: "voiceover_mix",
            draftVideoArtifactKind: "draft-video",
            voiceoverArtifactKind: "voiceover-audio",
            outputPath: mixedVideoPath,
            nextStep: "mix_voiceover_then_burn_subtitles",
          },
          null,
          2,
        ),
      );
      if (hasElevenLabsRuntimeConfig()) {
        await generateVoiceoverWithElevenLabs({
          projectId: projectState.projectId,
          variantId: variant.id,
          text: script,
          language: "vi-VN",
          voiceId,
          voiceStyle: projectState.brief.brandTone,
          outputPath: voiceoverPath,
        });
      } else {
        await writeTextArtifact(
          voiceoverPath,
          JSON.stringify(
            {
              mock: true,
              provider: "elevenlabs-scaffold",
              durationSeconds: projectState.brief.targetDuration,
              voiceStyle: projectState.brief.brandTone,
              script,
              reason: "Missing ElevenLabs runtime config.",
            },
            null,
            2,
          ),
        );
      }

      const canMixVoiceover =
        Boolean(draftVideoPath) &&
        (await probeMediaFile(draftVideoPath as string)) &&
        (await probeMediaFile(voiceoverPath));

      if (canMixVoiceover) {
        const backgroundMusicPath = projectState.brandKit.backgroundMusicPath;
        if (backgroundMusicPath && (await probeMediaFile(backgroundMusicPath))) {
          const withVoicePath = mixedVideoPath.replace(".mp4", "_vox.mp4");
          await mixVoiceoverWithVideo(draftVideoPath as string, voiceoverPath, withVoicePath);
          await mixBackgroundMusic(withVoicePath, backgroundMusicPath, mixedVideoPath);
        } else {
          await mixVoiceoverWithVideo(draftVideoPath as string, voiceoverPath, mixedVideoPath);
        }
      } else if (draftVideoPath && (await probeMediaFile(draftVideoPath as string))) {
        const backgroundMusicPath = projectState.brandKit.backgroundMusicPath;
        if (backgroundMusicPath && (await probeMediaFile(backgroundMusicPath))) {
          await mixBackgroundMusic(draftVideoPath as string, backgroundMusicPath, mixedVideoPath);
        }
      }

      const nextArtifacts: VariantArtifact[] = [
        {
          kind: "audio-strategy-plan",
          label: `${variant.id} audio strategy`,
          path: strategyPath,
        },
        {
          kind: "audio-mix-plan",
          label: `${variant.id} audio mix plan`,
          path: mixPlanPath,
        },
        {
          kind: "voiceover-request",
          label: `${variant.id} elevenlabs request`,
          path: requestPath,
        },
        {
          kind: "voiceover-audio",
          label: `${variant.id} voiceover`,
          path: voiceoverPath,
        },
        ...(canMixVoiceover
          ? [
              {
                kind: "voiceover-mixed-video",
                label: `${variant.id} draft with voiceover`,
                path: mixedVideoPath,
              } satisfies VariantArtifact,
            ]
          : []),
      ];
      const audioStrategySummary: AudioStrategy =
        variant.segmentPlan?.[0]?.audioStrategy ?? {
          audioType: "narration_voiceover",
          requiresLipSync: false,
          provider: "elevenlabs",
          language: "vi-VN",
          voiceIdEnvKey: "ELEVENLABS_VOICE_ID",
          voiceStyle: projectState.brief.brandTone,
        };

      nextVariants.push({
        ...variant,
        audioStrategySummary,
        artifacts: [...variant.artifacts, ...nextArtifacts],
      });
    }

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "voiceover-generator",
      hasElevenLabsRuntimeConfig()
        ? "Generated ElevenLabs voiceover audio, created FFmpeg mix artifacts, and produced a voiceover-mixed draft whenever valid draft video and audio were available."
        : "Created ElevenLabs-ready audio strategy, request, and mix-plan artifacts while keeping voice generation in scaffold mode because runtime config is incomplete.",
    );
  },
};
