import { z } from "zod";

import { formatGeminiFallbackLog } from "@/lib/server/text/gemini-error";
import { generateStructuredJsonWithGemini } from "@/lib/server/text/gemini";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, SegmentPlan } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const promptItemSchema = z.object({
  segmentId: z.string().min(1),
  generationMode: z.enum(["T2V", "I2V", "R2V"]),
  prompt: z.string().min(1),
  ratio: z.string().min(1),
  resolution: z.string().min(1),
  duration: z.number().positive(),
  generateAudio: z.boolean(),
  watermark: z.boolean(),
});

const promptResponseSchema = z.object({
  variantId: z.enum(["A", "B"]),
  prompts: z.array(promptItemSchema).min(1),
});

const promptResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["variantId", "prompts"],
  properties: {
    variantId: { type: "string", enum: ["A", "B"] },
    prompts: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "segmentId",
          "generationMode",
          "prompt",
          "ratio",
          "resolution",
          "duration",
          "generateAudio",
          "watermark",
        ],
        properties: {
          segmentId: { type: "string" },
          generationMode: { type: "string", enum: ["T2V", "I2V", "R2V"] },
          prompt: { type: "string" },
          ratio: { type: "string" },
          resolution: { type: "string" },
          duration: { type: "number" },
          generateAudio: { type: "boolean" },
          watermark: { type: "boolean" },
        },
      },
    },
  },
} as const;

function buildSeedancePromptPrompt(projectState: ProjectState, variantId: "A" | "B") {
  const variant = projectState.variants.find((item) => item.id === variantId);

  const orientation = projectState.brief.aspectRatio === "1:1" ? "square (1:1)" : "vertical (9:16)";

  return [
    `Generate Seedance 2.0 prompts for each segment. Target aspect ratio: ${orientation}. Each prompt must follow the formula: Subject + Action + Camera Language + Style & Aesthetics + Constraints.`,
    "Return valid JSON only. Do not include markdown. Do not include explanations.",
    "Include at least one camera language term per prompt (e.g. close-up, push-in, orbit shot, slow motion).",
    "Match the brand tone and visual style to the storyboard notes.",
    "For segments with character_dialogue audio strategy, put dialogue lines in double quotes and set generateAudio=true.",
    "For all other segments, set generateAudio=false (voiceover mixed separately via ElevenLabs).",
    "Add negative constraints where appropriate (e.g. avoid facial distortion, no watermark text).",
    "",
    "Input JSON:",
    JSON.stringify(
      {
        variantId,
        brief: projectState.brief,
        brandDna: projectState.brandDna,
        strategy: variant?.strategy,
        storyboard: variant?.storyboard ?? [],
        segmentPlan: variant?.segmentPlan ?? [],
      },
      null,
      2,
    ),
  ].join("\n");
}

function mergePromptResults(
  segments: SegmentPlan[],
  prompts: z.infer<typeof promptItemSchema>[],
) {
  const promptMap = new Map(prompts.map((item) => [item.segmentId, item]));

  return segments.map((segment) => {
    const generated = promptMap.get(segment.id);

    return {
      ...segment,
      generationMode: generated?.generationMode ?? segment.generationMode,
      promptSummary: generated?.prompt ?? segment.promptSummary,
    };
  });
}

function buildFallbackPromptSummary(input: {
  brandName: string;
  productName: string;
  strategyAngle: string;
  toneOfVoice: string;
  aspectRatio: string;
  segment: SegmentPlan;
  complianceNotes: string[];
  visualAnchors: string[];
}) {
  const compliance = input.complianceNotes.length
    ? `Constraints: ${input.complianceNotes.join("; ")}. Avoid facial distortion.`
    : "Constraints: Avoid facial distortion, no text overlays.";
  const visualStyle = input.visualAnchors.length
    ? `Style & Aesthetics: ${input.visualAnchors.join(", ")}, ${input.toneOfVoice} mood.`
    : `Style & Aesthetics: Clean, brand-safe composition, ${input.toneOfVoice} mood.`;

  const cameraByPurpose: Record<string, string> = {
    hook: "Close-up, fast push-in",
    body: "Medium Shot, slow dolly/track",
    demo: "Close-up, orbit shot, shallow depth of field",
    cta: "Medium Shot, pull-out",
    transition: "Pan, time-lapse",
  };
  const camera = cameraByPurpose[input.segment.purpose] ?? "Eye-level Shot, steady";

  return [
    `Subject: ${input.productName} by ${input.brandName}.`,
    `Action: ${input.segment.promptSummary ?? "Showcase the product with natural motion"}.`,
    `Camera Language: ${camera}.`,
    visualStyle,
    compliance,
    `Segment purpose: ${input.segment.purpose}. Duration: ~${input.segment.durationSeconds}s. Aspect ratio: ${input.aspectRatio}.`,
  ].join(" ");
}

export const seedancePromptBuilderNode: WorkflowNode = {
  id: "seedance-prompt-builder",
  async run(projectState: ProjectState) {
    const complianceNotes = [
      projectState.brief.complianceConstraints,
      ...(projectState.brief.prohibitedClaims ?? []),
    ].filter(Boolean);
    const visualAnchors = projectState.brandDna?.visualAnchors ?? [];

    let usedGemini = false;
    let model: string | undefined;
    let fallbackReason: unknown;
    let nextVariants;

    try {
      const generatedPrompts = await Promise.all(
        (["A", "B"] as const).map((variantId) =>
          generateStructuredJsonWithGemini({
            systemPrompt: [
              "You are an expert prompt engineer for BytePlus Seedance 2.0 video generation.",
              "Follow the Seedance 2.0 prompt formula: Subject + Action + Camera Language + @Reference Assets + Style & Aesthetics + Audio & SFX + Constraints.",
              "",
              "Camera language vocabulary:",
              "- Shot scale: Close-up, Near Shot, Medium Shot, Full Shot, Long Shot",
              "- Camera angle: Low Angle, High Angle, Eye-level Shot, Over-the-shoulder Shot",
              "- Camera movement: Push-in, Pull-out, Pan, Dolly/Track, Following Shot, Orbit Shot",
              "- Others: Slow Motion, Time-lapse, Shallow Depth of Field, Handheld Feel",
              "",
              "Rules:",
              "- Keep each prompt under 200 words. Natural language, sequential descriptions.",
              "- Put any dialogue in double quotes to optimize audio generation.",
              "- Never mix I2V (first_frame) and R2V (reference_image) modes in the same segment.",
              "- For narration/voiceover segments, set generateAudio=false (ElevenLabs voice is mixed separately).",
              "- For character_dialogue segments, set generateAudio=true.",
              "- Include negative constraints (e.g. avoid facial distortion, no text overlays) when relevant.",
              "- Reference assets by order: [Image 1], [Image 2] etc. matching upload order.",
              "",
              "Return prompt payloads in valid JSON.",
            ].join("\n"),
            userPrompt: buildSeedancePromptPrompt(projectState, variantId),
            validator: promptResponseSchema,
            responseJsonSchema: promptResponseJsonSchema,
          }),
        ),
      );
      usedGemini = true;
      model = generatedPrompts[0]?.model;
      const promptsByVariant = new Map(
        generatedPrompts.map((result) => [result.json.variantId, result.json.prompts]),
      );

      nextVariants = projectState.variants.map((variant) => ({
        ...variant,
        segmentPlan: mergePromptResults(
          variant.segmentPlan ?? [],
          promptsByVariant.get(variant.id as "A" | "B") ?? [],
        ),
      }));
    } catch (error) {
      fallbackReason = error;
      nextVariants = projectState.variants.map((variant) => ({
        ...variant,
        segmentPlan: (variant.segmentPlan ?? []).map((segment) => ({
          ...segment,
          promptSummary: buildFallbackPromptSummary({
            brandName: projectState.brief.brandName,
            productName: projectState.brief.productName,
            strategyAngle: variant.strategy.angle,
            toneOfVoice: projectState.brief.brandTone,
            aspectRatio: projectState.brief.aspectRatio,
            segment,
            complianceNotes,
            visualAnchors,
          }),
        })),
      }));
    }

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "seedance-prompt-builder",
      usedGemini
        ? `Built Seedance-ready prompts for all segments with Gemini (${model}).`
        : formatGeminiFallbackLog("seedance-prompt-builder", fallbackReason),
    );
  },
};
