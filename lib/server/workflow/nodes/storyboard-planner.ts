import { buildAudioStrategy, pickDefaultAudioType } from "@/lib/server/audio/strategy";
import { formatGeminiFallbackLog } from "@/lib/server/text/gemini-error";
import { getConfiguredGeminiAdvancedModel, generateStructuredJsonWithGemini } from "@/lib/server/text/gemini";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, StoryboardFrame } from "@/lib/types/project";
import { z } from "zod";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const storyboardSceneSchema = z.object({
  sceneId: z.string().min(1),
  startMs: z.number().int().min(0),
  endMs: z.number().int().positive(),
  role: z.enum(["hook", "body", "cta"]),
  visual: z.string().min(1),
  camera: z.string().min(1),
  motion: z.string().min(1),
  textOverlay: z.string().default(""),
  voiceover: z.string().default(""),
  productReferenceRequired: z.boolean(),
  audioType: z.enum(["narration_voiceover", "character_dialogue", "no_voice"]),
  requiresLipSync: z.boolean(),
});

const storyboardResponseSchema = z.object({
  variantId: z.enum(["A", "B"]),
  storyboard: z.array(storyboardSceneSchema).min(3),
});

type StoryboardScene = z.output<typeof storyboardSceneSchema>;

const storyboardResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["variantId", "storyboard"],
  properties: {
    variantId: { type: "string", enum: ["A", "B"] },
    storyboard: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sceneId",
          "startMs",
          "endMs",
          "role",
          "visual",
          "camera",
          "motion",
          "textOverlay",
          "voiceover",
          "productReferenceRequired",
          "audioType",
          "requiresLipSync",
        ],
        properties: {
          sceneId: { type: "string" },
          startMs: { type: "integer" },
          endMs: { type: "integer" },
          role: { type: "string", enum: ["hook", "body", "cta"] },
          visual: { type: "string" },
          camera: { type: "string" },
          motion: { type: "string" },
          textOverlay: { type: "string" },
          voiceover: { type: "string" },
          productReferenceRequired: { type: "boolean" },
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

function buildStoryboardPrompt(projectState: ProjectState, variantId: "A" | "B") {
  const variant = projectState.variants.find((item) => item.id === variantId);
  return [
    `Convert the timestamped script into storyboard scenes for a ${projectState.brief.aspectRatio} short-form ad.`,
    "Return valid JSON only. Do not include markdown. Do not include explanations.",
    "Use narration_voiceover by default. Use character_dialogue only when an on-screen speaker is clearly required.",
    "For product demo scenes or CTA/product shots, set productReferenceRequired to true.",
    "",
    "Input JSON:",
    JSON.stringify(
      {
        variantId,
        brief: projectState.brief,
        brandDna: projectState.brandDna,
        strategy: variant?.strategy,
        script: variant?.script ?? [],
      },
      null,
      2,
    ),
  ].join("\n");
}

function mapStoryboardFrames(projectState: ProjectState, frames: StoryboardScene[]) {
  return frames.map((frame, index) => {
    const audioType = pickDefaultAudioType({
      purpose: frame.role,
      shotType: frame.camera,
      beat: {
        startMs: frame.startMs,
        endMs: frame.endMs,
        narration: frame.voiceover,
        intent: frame.role,
      },
    });
    const resolvedAudioType =
      frame.audioType === "character_dialogue" || frame.audioType === "no_voice"
        ? frame.audioType
        : audioType;
    const audioStrategy = buildAudioStrategy({
      toneOfVoice: projectState.brief.brandTone,
      audioType: resolvedAudioType,
    });

    return {
      order: index + 1,
      sceneId: frame.sceneId,
      role: frame.role,
      startMs: frame.startMs,
      endMs: frame.endMs,
      shotType: frame.camera,
      subject: frame.visual,
      motion: frame.motion,
      notes: `Visual: ${frame.visual}. Overlay: ${frame.textOverlay || "none"}. Aspect ratio: ${projectState.brief.aspectRatio}. Keep subtitles safe area.`,
      textOverlay: frame.textOverlay || undefined,
      voiceover: frame.voiceover || undefined,
      productReferenceRequired: frame.productReferenceRequired,
      audioType: audioStrategy.audioType,
      requiresLipSync: frame.requiresLipSync || audioStrategy.requiresLipSync,
    } satisfies StoryboardFrame;
  });
}

function buildFallbackStoryboard(projectState: ProjectState, variantId: "A" | "B") {
  const product = projectState.brief.productName;
  const beats = projectState.variants.find((variant) => variant.id === variantId)?.script ?? [];

  return beats.map((beat, index) => {
    const shotType = index === 0 ? "tight close-up" : "medium shot";
    const audioType = pickDefaultAudioType({
      beat,
      shotType,
    });
    const audioStrategy = buildAudioStrategy({
      toneOfVoice: projectState.brief.brandTone,
      audioType,
    });

    return {
      order: index + 1,
      sceneId: `${variantId}_S${String(index + 1).padStart(2, "0")}`,
      role: beat.intent,
      startMs: beat.startMs,
      endMs: beat.endMs,
      shotType,
      subject: index === 0 ? "human face reaction" : product,
      motion: index === 0 ? "quick snap zoom" : "smooth handheld move",
      notes: `Tone: ${projectState.brief.brandTone}. Beat intent: ${beat.intent}. Aspect ratio: ${projectState.brief.aspectRatio}. Keep subtitles safe area.`,
      voiceover: beat.narration,
      productReferenceRequired: beat.intent === "cta",
      audioType: audioStrategy.audioType,
      requiresLipSync: audioStrategy.requiresLipSync,
    } satisfies StoryboardFrame;
  });
}

export const storyboardPlannerNode: WorkflowNode = {
  id: "storyboard-planner",
  async run(projectState: ProjectState) {
    let usedGemini = false;
    let model: string | undefined;
    let fallbackReason: unknown;
    let storyboardByVariant: Map<"A" | "B", StoryboardFrame[]>;

    try {
      const generatedStoryboards = await Promise.all(
        (["A", "B"] as const).map((variantId) =>
          generateStructuredJsonWithGemini({
            systemPrompt:
              "You are a storyboard planner for performance marketing videos. Return structured storyboard scenes in valid JSON.",
            userPrompt: buildStoryboardPrompt(projectState, variantId),
            validator: storyboardResponseSchema,
            responseJsonSchema: storyboardResponseJsonSchema,
            model: getConfiguredGeminiAdvancedModel(),
          }),
        ),
      );
      usedGemini = true;
      model = generatedStoryboards[0]?.model;
      storyboardByVariant = new Map(
        generatedStoryboards.map((result) => [
          result.json.variantId,
          mapStoryboardFrames(projectState, result.json.storyboard as StoryboardScene[]),
        ]),
      );
    } catch (error) {
      fallbackReason = error;
      storyboardByVariant = new Map(
        (["A", "B"] as const).map((variantId) => [
          variantId,
          buildFallbackStoryboard(projectState, variantId),
        ]),
      );
    }

    const nextVariants = projectState.variants.map((variant) => ({
      ...variant,
      storyboard: storyboardByVariant.get(variant.id as "A" | "B") ?? [],
    }));

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "storyboard-planner",
      usedGemini
        ? `Generated storyboard scenes for both variants with Gemini (${model}).`
        : formatGeminiFallbackLog("storyboard-planner", fallbackReason),
    );
  },
};
