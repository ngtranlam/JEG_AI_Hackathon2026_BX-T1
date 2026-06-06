import { buildAudioStrategy, pickDefaultAudioType } from "@/lib/server/audio/strategy";
import { generateStructuredJsonWithGemini } from "@/lib/server/text/gemini";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, ScriptBeat, SegmentPlan } from "@/lib/types/project";
import { z } from "zod";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const MAX_SEGMENT_DURATION_SECONDS = 8;
const MIN_SEGMENT_DURATION_SECONDS = 2;

const segmentPlannerResponseSchema = z.object({
  variantId: z.enum(["A", "B"]),
  segments: z.array(
    z.object({
      segmentId: z.string().min(1),
      sceneId: z.string().min(1),
      duration: z.number().positive().max(15),
      role: z.enum(["hook", "body", "cta"]),
      generationMode: z.enum(["T2V", "I2V", "R2V"]),
      needsProductReference: z.boolean(),
      audioType: z.enum(["narration_voiceover", "character_dialogue", "no_voice"]),
      requiresLipSync: z.boolean(),
    }),
  ).min(1),
});

const segmentPlannerResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["variantId", "segments"],
  properties: {
    variantId: { type: "string", enum: ["A", "B"] },
    segments: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "segmentId",
          "sceneId",
          "duration",
          "role",
          "generationMode",
          "needsProductReference",
          "audioType",
          "requiresLipSync",
        ],
        properties: {
          segmentId: { type: "string" },
          sceneId: { type: "string" },
          duration: { type: "number" },
          role: { type: "string", enum: ["hook", "body", "cta"] },
          generationMode: { type: "string", enum: ["T2V", "I2V", "R2V"] },
          needsProductReference: { type: "boolean" },
          audioType: {
            type: "string",
            enum: ["narration_voiceover", "character_dialogue", "no_voice"],
          },
          requiresLipSync: { type: "boolean" },
        },
      },
    },
  },
} as const;

function chunkScriptBeats(script: ScriptBeat[]) {
  const groups: ScriptBeat[][] = [];
  let currentGroup: ScriptBeat[] = [];
  let currentDurationMs = 0;

  for (const beat of script) {
    const beatDurationMs = beat.endMs - beat.startMs;

    if (
      currentGroup.length > 0 &&
      currentDurationMs + beatDurationMs > MAX_SEGMENT_DURATION_SECONDS * 1000
    ) {
      groups.push(currentGroup);
      currentGroup = [];
      currentDurationMs = 0;
    }

    currentGroup.push(beat);
    currentDurationMs += beatDurationMs;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

function clampSegmentDuration(durationSeconds: number) {
  return Number(
    Math.min(15, Math.max(MIN_SEGMENT_DURATION_SECONDS, durationSeconds)).toFixed(1),
  );
}

function summarizePurpose(beats: ScriptBeat[]) {
  const intents = new Set(beats.map((beat) => beat.intent));

  if (intents.has("hook")) return "hook";
  if (intents.has("cta")) return "cta";
  return "body";
}

function buildSegmentPlan(
  variantId: string,
  script: ScriptBeat[],
  toneOfVoice: string,
) {
  const groups = chunkScriptBeats(script);

  return groups.map((beats, index) => {
    const firstBeat = beats[0];
    const lastBeat = beats[beats.length - 1];
    const durationSeconds = Number(
      (((lastBeat?.endMs ?? 0) - (firstBeat?.startMs ?? 0)) / 1000).toFixed(1),
    );
    const purpose = summarizePurpose(beats);
    const audioType = pickDefaultAudioType({
      beat: firstBeat,
      purpose,
    });
    const audioStrategy = buildAudioStrategy({
      toneOfVoice,
      audioType,
    });
    const narrationText = beats.map((beat) => beat.narration).join(" ");

    return {
      id: `${variantId}_SEG_${String(index + 1).padStart(2, "0")}`,
      order: index + 1,
      durationSeconds: clampSegmentDuration(durationSeconds),
      purpose,
      generationMode: beats.some((beat) => beat.intent === "cta") ? "I2V" : "T2V",
      needsProductReference: beats.some((beat) => beat.intent === "cta"),
      sourceScene: `${variantId}_S${String(index + 1).padStart(2, "0")}`,
      status: "pending",
      promptSummary: narrationText,
      audioStrategy,
      dialogueText: audioType === "character_dialogue" ? narrationText : undefined,
      narrationText: audioType === "no_voice" ? undefined : narrationText,
    } satisfies SegmentPlan;
  });
}

function buildSegmentPlannerPrompt(projectState: ProjectState, variantId: "A" | "B") {
  const variant = projectState.variants.find((item) => item.id === variantId);

  return [
    "Split the short-form ad into Seedance-safe segments.",
    "Return valid JSON only. Do not include markdown. Do not include explanations.",
    "No segment may exceed 15 seconds. Recommended segment length is 3-8 seconds.",
    "Keep a strong hook in the first segment and a CTA in the final segment.",
    "Use code-safe semantics: product demo or CTA scenes may use I2V and product references.",
    "",
    "Input JSON:",
    JSON.stringify(
      {
        variantId,
        targetDuration: projectState.brief.targetDuration,
        aspectRatio: projectState.brief.aspectRatio,
        strategy: variant?.strategy,
        script: variant?.script ?? [],
        storyboard: variant?.storyboard ?? [],
      },
      null,
      2,
    ),
  ].join("\n");
}

function mapGeminiSegmentsToPlan(input: {
  projectState: ProjectState;
  variantId: "A" | "B";
  segments: z.output<typeof segmentPlannerResponseSchema>["segments"];
}) {
  const variant = input.projectState.variants.find((item) => item.id === input.variantId);
  const script = variant?.script ?? [];
  const storyboard = variant?.storyboard ?? [];

  return input.segments.map((segment, index) => {
    const matchedBeat =
      script.find((beat) => beat.intent === segment.role) ?? script[index] ?? script[0];
    const matchedScene =
      storyboard.find((frame) => frame.sceneId === segment.sceneId) ?? storyboard[index] ?? storyboard[0];
    const narrationText =
      matchedScene?.voiceover ??
      matchedBeat?.narration ??
      variant?.selectedHook?.text ??
      input.projectState.brief.callToAction;
    const audioType = segment.audioType ?? pickDefaultAudioType({
      beat: matchedBeat,
      purpose: segment.role,
      shotType: matchedScene?.shotType,
    });

    return {
      id: `${input.variantId}_SEG_${String(index + 1).padStart(2, "0")}`,
      order: index + 1,
      durationSeconds: clampSegmentDuration(segment.duration),
      purpose: segment.role,
      generationMode: segment.generationMode,
      needsProductReference: segment.needsProductReference,
      sourceScene: segment.sceneId,
      status: "pending" as const,
      promptSummary: narrationText,
      audioStrategy: buildAudioStrategy({
        toneOfVoice: input.projectState.brief.brandTone,
        audioType,
      }),
      dialogueText: audioType === "character_dialogue" ? narrationText : undefined,
      narrationText: audioType === "no_voice" ? undefined : narrationText,
    } satisfies SegmentPlan;
  });
}

export const segmentPlannerNode: WorkflowNode = {
  id: "segment-planner",
  async run(projectState: ProjectState) {
    const generatedResults = await Promise.all(
      (["A", "B"] as const).map(async (variantId) => {
        try {
          const generated = await generateStructuredJsonWithGemini({
            systemPrompt:
              "You are a video planning agent that splits short-form ad scripts into Seedance-safe segments. Return valid JSON only.",
            userPrompt: buildSegmentPlannerPrompt(projectState, variantId),
            validator: segmentPlannerResponseSchema,
            responseJsonSchema: segmentPlannerResponseJsonSchema,
          });

          return {
            variantId,
            segmentPlan: mapGeminiSegmentsToPlan({
              projectState,
              variantId,
              segments: generated.json.segments,
            }),
            usedGemini: true,
            model: generated.model,
          };
        } catch {
          const variant = projectState.variants.find((item) => item.id === variantId);
          return {
            variantId,
            segmentPlan: buildSegmentPlan(
              variantId,
              variant?.script ?? [],
              projectState.brief.brandTone,
            ),
            usedGemini: false,
            model: undefined,
          };
        }
      }),
    );
    const resultByVariant = new Map(
      generatedResults.map((result) => [result.variantId, result]),
    );

    const nextVariants = projectState.variants.map((variant) => ({
      ...variant,
      segmentPlan:
        resultByVariant.get(variant.id as "A" | "B")?.segmentPlan ??
        buildSegmentPlan(variant.id, variant.script ?? [], projectState.brief.brandTone),
    }));

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "segment-planner",
      generatedResults.every((result) => result.usedGemini)
        ? `Split storyboard/script into Seedance-safe segments with Gemini semantic planning (${generatedResults[0]?.model}).`
        : "Split storyboard/script into Seedance-safe segments with Gemini when available and code fallback otherwise.",
    );
  },
};
