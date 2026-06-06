import { z } from "zod";

import { formatGeminiFallbackLog } from "@/lib/server/text/gemini-error";
import { generateStructuredJsonWithGemini } from "@/lib/server/text/gemini";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { HookCandidate, ProjectState } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const hookCandidateSchema = z.object({
  text: z.string().min(1),
  score: z.number().int().min(0).max(100),
  rationale: z.string().min(1),
});

const hookResponseSchema = z.object({
  hooks: z.object({
    A: z.array(hookCandidateSchema).min(3).max(5),
    B: z.array(hookCandidateSchema).min(3).max(5),
  }),
  selectedHooks: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
  }),
});

const hookResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["hooks", "selectedHooks"],
  properties: {
    hooks: {
      type: "object",
      additionalProperties: false,
      required: ["A", "B"],
      properties: {
        A: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["text", "score", "rationale"],
            properties: {
              text: { type: "string" },
              score: { type: "integer" },
              rationale: { type: "string" },
            },
          },
        },
        B: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["text", "score", "rationale"],
            properties: {
              text: { type: "string" },
              score: { type: "integer" },
              rationale: { type: "string" },
            },
          },
        },
      },
    },
    selectedHooks: {
      type: "object",
      additionalProperties: false,
      required: ["A", "B"],
      properties: {
        A: { type: "string" },
        B: { type: "string" },
      },
    },
  },
} as const;

function buildHookPrompt(projectState: ProjectState) {
  return [
    "Generate 3 to 5 short-form ad hooks for each variant and score them.",
    "Return valid JSON only. Do not include markdown. Do not include explanations.",
    "Use scores from 0 to 100 based on clarity, curiosity, pain-point fit, platform fit, and brand fit.",
    "Variant A must match the emotional storytelling direction. Variant B must match the product-led demo direction.",
    "Hooks should be concise, punchy, and appropriate for the first 0-3 seconds.",
    "",
    "Input JSON:",
    JSON.stringify(
      {
        brief: projectState.brief,
        analysis: projectState.analysis,
        brandDna: projectState.brandDna,
        variants: projectState.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          strategy: variant.strategy,
        })),
      },
      null,
      2,
    ),
  ].join("\n");
}

function buildFallbackHooks(projectState: ProjectState, variantId: "A" | "B"): HookCandidate[] {
  const product = projectState.brief.productName;
  const audience = projectState.brief.audience;
  const cta = projectState.brief.callToAction;
  const hooks =
    variantId === "A"
      ? [
          `Ever felt like ${audience} life moves too fast to take care of yourself?`,
          `This is the moment ${audience} finally stops settling for good enough.`,
          `${product} is what I wish I had when I was exhausted and overwhelmed.`,
          `You have 15 seconds, here is the simplest upgrade for your day.`,
        ]
      : [
          `${product} in action. Here is why it works in under 10 seconds.`,
          `Stop scrolling. Watch what happens when you use ${product}.`,
          `One product, one routine, one clear result. ${cta}.`,
          `If you want results without the chaos, this is the demo to watch.`,
        ];

  return hooks.map((text, index) => ({
    text,
    score: 92 - index * 4,
    rationale: index === 0 ? "Best balance of clarity and platform hook speed." : "Fallback ranked option.",
  }));
}

export const hookGeneratorScorerNode: WorkflowNode = {
  id: "hook-generator-scorer",
  async run(projectState: ProjectState) {
    let usedGemini = false;
    let model: string | undefined;
    let fallbackReason: unknown;
    let nextVariants;

    try {
      const generated = await generateStructuredJsonWithGemini({
        systemPrompt:
          "You are a performance creative strategist. Return high-performing hooks in valid JSON.",
        userPrompt: buildHookPrompt(projectState),
        validator: hookResponseSchema,
        responseJsonSchema: hookResponseJsonSchema,
      });
      usedGemini = true;
      model = generated.model;

      nextVariants = projectState.variants.map((variant) => {
        const variantId = variant.id as "A" | "B";
        const ranked = [...generated.json.hooks[variantId]].sort((a, b) => b.score - a.score);
        const selectedText = generated.json.selectedHooks[variantId];
        const selected =
          ranked.find((candidate) => candidate.text === selectedText) ?? ranked[0];

        const hookCandidates: HookCandidate[] = ranked.map((candidate) => ({
          text: candidate.text,
          score: candidate.score,
          rationale: candidate.rationale,
        }));

        return {
          ...variant,
          hookCandidates,
          selectedHook: selected
            ? {
                text: selected.text,
                score: selected.score,
                rationale: selected.rationale,
              }
            : undefined,
        };
      });
    } catch (error) {
      fallbackReason = error;
      nextVariants = projectState.variants.map((variant) => {
        const ranked = buildFallbackHooks(projectState, variant.id as "A" | "B");
        return {
          ...variant,
          hookCandidates: ranked,
          selectedHook: ranked[0],
        };
      });
    }

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "hook-generator-scorer",
      usedGemini
        ? `Generated and scored hooks for both variants with Gemini (${model}).`
        : formatGeminiFallbackLog("hook-generator-scorer", fallbackReason),
    );
  },
};
