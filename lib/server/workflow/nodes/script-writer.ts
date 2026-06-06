import { z } from "zod";

import { formatGeminiFallbackLog } from "@/lib/server/text/gemini-error";
import { generateStructuredJsonWithGemini } from "@/lib/server/text/gemini";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, ScriptBeat } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const scriptBeatSchema = z.object({
  startMs: z.number().int().min(0),
  endMs: z.number().int().positive(),
  narration: z.string().min(1),
  intent: z.enum(["hook", "body", "cta"]),
});

const scriptResponseSchema = z.object({
  variantId: z.enum(["A", "B"]),
  script: z.array(scriptBeatSchema).min(3),
});

const scriptResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["variantId", "script"],
  properties: {
    variantId: { type: "string", enum: ["A", "B"] },
    script: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["startMs", "endMs", "narration", "intent"],
        properties: {
          startMs: { type: "integer" },
          endMs: { type: "integer" },
          narration: { type: "string" },
          intent: { type: "string", enum: ["hook", "body", "cta"] },
        },
      },
    },
  },
} as const;

function buildFallbackBeats(input: {
  durationSeconds: number;
  hook: string;
  productName: string;
  offer?: string;
  cta: string;
  variantId: "A" | "B";
}) {
  const beatCount = input.durationSeconds <= 15 ? 4 : input.durationSeconds <= 20 ? 5 : 6;
  const totalMs = input.durationSeconds * 1000;
  const beatMs = Math.floor(totalMs / beatCount);
  const templates =
    input.variantId === "A"
      ? [
          (hookText: string) => hookText,
          () => "You know that moment when everything piles up and you still need a win?",
          () => `${input.productName} fits right there, simple and steady for real life.`,
          () => (input.offer ? `Bonus: ${input.offer}. ${input.cta}.` : `${input.cta}.`),
        ]
      : [
          (hookText: string) => hookText,
          () => "Step 1: set it up. Step 2: let it do the work.",
          () => "Here is the part people miss. Consistency beats complicated.",
          () => (input.offer ? `Right now: ${input.offer}. ${input.cta}.` : `${input.cta}.`),
        ];

  return Array.from({ length: beatCount }, (_, index) => {
    const startMs = index * beatMs;
    const endMs = index === beatCount - 1 ? totalMs : (index + 1) * beatMs;
    return {
      startMs,
      endMs,
      narration: templates[index]?.(input.hook) ?? `${input.cta}.`,
      intent: index === 0 ? "hook" : index === beatCount - 1 ? "cta" : "body",
    } satisfies ScriptBeat;
  });
}

function normalizeScriptBeats(beats: ScriptBeat[], durationSeconds: number) {
  const totalMs = durationSeconds * 1000;

  return beats
    .map((beat, index) => {
      const startMs = Math.max(0, Math.min(totalMs, Math.round(beat.startMs)));
      const rawEndMs = Math.max(startMs + 200, Math.round(beat.endMs));
      const endMs = index === beats.length - 1 ? totalMs : Math.min(totalMs, rawEndMs);

      return {
        startMs,
        endMs,
        narration: beat.narration.trim(),
        intent: beat.intent,
      };
    })
    .sort((a, b) => a.startMs - b.startMs)
    .map((beat, index, items) => ({
      ...beat,
      startMs: index === 0 ? 0 : Math.min(beat.startMs, items[index - 1]!.endMs),
      endMs: index === items.length - 1 ? totalMs : Math.max(beat.endMs, beat.startMs + 200),
    }));
}

function buildScriptPrompt(projectState: ProjectState, variantId: "A" | "B") {
  const variant = projectState.variants.find((item) => item.id === variantId);

  return [
    `Write a timestamped voiceover script for a short-form ${projectState.brief.aspectRatio} video ad.`,
    "Return valid JSON only. Do not include markdown. Do not include explanations.",
    "Hook must land in the first 0-3 seconds. CTA must land in the last 3-4 seconds.",
    "Keep narration concise and natural for spoken delivery. Respect compliance constraints.",
    "",
    "Input JSON:",
    JSON.stringify(
      {
        variantId,
        targetDuration: projectState.brief.targetDuration,
        brief: projectState.brief,
        analysis: projectState.analysis,
        brandDna: projectState.brandDna,
        strategy: variant?.strategy,
        selectedHook: variant?.selectedHook ?? null,
      },
      null,
      2,
    ),
  ].join("\n");
}

export const scriptWriterNode: WorkflowNode = {
  id: "script-writer",
  async run(projectState: ProjectState) {
    let usedGemini = false;
    let model: string | undefined;
    let fallbackReason: unknown;
    let scriptByVariant: Map<"A" | "B", ScriptBeat[]>;

    try {
      const generatedScripts = await Promise.all(
        (["A", "B"] as const).map((variantId) =>
          generateStructuredJsonWithGemini({
            systemPrompt:
              "You are a short-form ad script writer. Return production-ready script beats in valid JSON.",
            userPrompt: buildScriptPrompt(projectState, variantId),
            validator: scriptResponseSchema,
            responseJsonSchema: scriptResponseJsonSchema,
          }),
        ),
      );
      usedGemini = true;
      model = generatedScripts[0]?.model;
      scriptByVariant = new Map(
        generatedScripts.map((result) => [
          result.json.variantId,
          normalizeScriptBeats(result.json.script, projectState.brief.targetDuration),
        ]),
      );
    } catch (error) {
      fallbackReason = error;
      scriptByVariant = new Map(
        projectState.variants.map((variant) => {
          const variantId = variant.id as "A" | "B";
          return [
            variantId,
            buildFallbackBeats({
              durationSeconds: projectState.brief.targetDuration,
              hook: variant.selectedHook?.text ?? `Discover ${projectState.brief.productName}.`,
              productName: projectState.brief.productName,
              offer: projectState.brief.offer,
              cta: projectState.brief.callToAction ?? "",
              variantId,
            }),
          ];
        }),
      );
    }

    const nextVariants = projectState.variants.map((variant) => ({
      ...variant,
      script: scriptByVariant.get(variant.id as "A" | "B") ?? [],
    }));

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "script-writer",
      usedGemini
        ? `Generated timed scripts for both variants with Gemini (${model}).`
        : formatGeminiFallbackLog("script-writer", fallbackReason),
    );
  },
};
