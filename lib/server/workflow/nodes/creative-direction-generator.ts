import { z } from "zod";

import { appendNodeLog } from "@/lib/server/state/project-state";
import { formatGeminiFallbackLog } from "@/lib/server/text/gemini-error";
import { generateStructuredJsonWithGemini } from "@/lib/server/text/gemini";
import type { CreativeDirection, ProjectState, Variant } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const creativeDirectionSchema = z.object({
  variants: z.tuple([
    z.object({
      variantId: z.literal("A"),
      name: z.string().min(1),
      angle: z.string().min(1),
      hypothesis: z.string().min(1),
      style: z.string().min(1),
      targetEmotion: z.string().min(1),
      ctaStrategy: z.string().min(1),
      differentiators: z.array(z.string()).min(2),
      summary: z.string().min(1),
    }),
    z.object({
      variantId: z.literal("B"),
      name: z.string().min(1),
      angle: z.string().min(1),
      hypothesis: z.string().min(1),
      style: z.string().min(1),
      targetEmotion: z.string().min(1),
      ctaStrategy: z.string().min(1),
      differentiators: z.array(z.string()).min(2),
      summary: z.string().min(1),
    }),
  ]),
});

const creativeDirectionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["variants"],
  properties: {
    variants: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "variantId",
          "name",
          "angle",
          "hypothesis",
          "style",
          "targetEmotion",
          "ctaStrategy",
          "differentiators",
          "summary",
        ],
        properties: {
          variantId: { type: "string", enum: ["A", "B"] },
          name: { type: "string" },
          angle: { type: "string" },
          hypothesis: { type: "string" },
          style: { type: "string" },
          targetEmotion: { type: "string" },
          ctaStrategy: { type: "string" },
          differentiators: { type: "array", items: { type: "string" } },
          summary: { type: "string" },
        },
      },
    },
  },
} as const;

function buildVariant(input: {
  id: "A" | "B";
  name: string;
  strategy: CreativeDirection;
}): Variant {
  return {
    id: input.id,
    name: input.name,
    strategy: input.strategy,
    artifacts: [],
  };
}

function buildCreativeDirectionPrompt(projectState: ProjectState) {
  return [
    "Generate exactly 2 meaningfully different creative directions for short-form video A/B testing.",
    "Return valid JSON only. Do not include markdown. Do not include explanations.",
    "Variant A should lean emotional storytelling. Variant B should lean product-led demo.",
    "The 2 variants must differ in creative angle, hypothesis, emotional target, and CTA strategy.",
    "",
    "Input JSON:",
    JSON.stringify(
      {
        brief: projectState.brief,
        analysis: projectState.analysis,
        brandDna: projectState.brandDna,
      },
      null,
      2,
    ),
  ].join("\n");
}

export const creativeDirectionGeneratorNode: WorkflowNode = {
  id: "creative-direction-generator",
  async run(projectState: ProjectState) {
    let usedGemini = false;
    let model: string | undefined;
    let fallbackReason: unknown;
    let variantA: Variant;
    let variantB: Variant;

    try {
      const generated = await generateStructuredJsonWithGemini({
        systemPrompt:
          "You are a creative strategist for performance marketing videos. Return exactly two A/B variants in valid JSON.",
        userPrompt: buildCreativeDirectionPrompt(projectState),
        validator: creativeDirectionSchema,
        responseJsonSchema: creativeDirectionJsonSchema,
      });
      usedGemini = true;
      model = generated.model;

      const [variantAResponse, variantBResponse] = generated.json.variants;

      variantA = buildVariant({
        id: "A",
        name: variantAResponse.name,
        strategy: {
          angle: variantAResponse.angle,
          summary: variantAResponse.summary,
          differentiators: variantAResponse.differentiators,
          hypothesis: variantAResponse.hypothesis,
          style: variantAResponse.style,
          targetEmotion: variantAResponse.targetEmotion,
          ctaStrategy: variantAResponse.ctaStrategy,
        },
      });

      variantB = buildVariant({
        id: "B",
        name: variantBResponse.name,
        strategy: {
          angle: variantBResponse.angle,
          summary: variantBResponse.summary,
          differentiators: variantBResponse.differentiators,
          hypothesis: variantBResponse.hypothesis,
          style: variantBResponse.style,
          targetEmotion: variantBResponse.targetEmotion,
          ctaStrategy: variantBResponse.ctaStrategy,
        },
      });
    } catch (error) {
      fallbackReason = error;
      variantA = buildVariant({
        id: "A",
        name: "Emotional Storytelling",
        strategy: {
          angle: "emotion-led transformation",
          summary: `Lead with a relatable before/after feeling for ${projectState.brief.audience}.`,
          differentiators: ["human-first framing", "emotional hook", "soft CTA"],
          hypothesis: "A more emotional opening will increase hold rate in the first 3 seconds.",
          style: "warm, human, fast-cut",
          targetEmotion: "relief",
          ctaStrategy: "Invite viewers to try the easier path now.",
        },
      });
      variantB = buildVariant({
        id: "B",
        name: "Product-led Demo",
        strategy: {
          angle: "clear demo and payoff",
          summary: `Show how ${projectState.brief.productName} works quickly and clearly.`,
          differentiators: ["feature-first framing", "step demo", "direct CTA"],
          hypothesis: "A product-first demo will improve clarity and conversion intent.",
          style: "clean, direct, practical",
          targetEmotion: "confidence",
          ctaStrategy: "End with a direct action-focused CTA.",
        },
      });
    }

    const nextState: ProjectState = {
      ...projectState,
      variants: [variantA, variantB],
    };

    return appendNodeLog(
      nextState,
      "creative-direction-generator",
      usedGemini
        ? `Generated two A/B creative directions with Gemini (${model}).`
        : formatGeminiFallbackLog("creative-direction-generator", fallbackReason),
    );
  },
};
