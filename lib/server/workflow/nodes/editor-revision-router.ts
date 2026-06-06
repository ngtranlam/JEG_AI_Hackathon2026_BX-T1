import { z } from "zod";

import { appendNodeLog } from "@/lib/server/state/project-state";
import { formatGeminiFallbackLog } from "@/lib/server/text/gemini-error";
import { getConfiguredGeminiAdvancedModel, generateStructuredJsonWithGemini } from "@/lib/server/text/gemini";
import type { ProjectState, RevisionAction } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const revisionActionSchema = z.object({
  target: z.string().min(1),
  action: z.string().min(1),
  sceneId: z.string().optional(),
  segmentId: z.string().optional(),
});

const revisionResponseSchema = z.object({
  revisionPlan: z.array(revisionActionSchema).min(1),
});

const revisionResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["revisionPlan"],
  properties: {
    revisionPlan: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["target", "action"],
        properties: {
          target: { type: "string" },
          action: { type: "string" },
          sceneId: { type: "string" },
          segmentId: { type: "string" },
        },
      },
    },
  },
} as const;

function buildRevisionPrompt(projectState: ProjectState) {
  return [
    "Convert the current project state into a targeted revision plan.",
    "Return valid JSON only. Do not include markdown. Do not include explanations.",
    "No explicit editor feedback is provided, so apply safe default improvements only where beneficial.",
    "Do not regenerate everything by default. Prefer stronger hook, faster opening, clearer CTA, and larger subtitle only if needed.",
    "",
    "Input JSON:",
    JSON.stringify(
      {
        brief: projectState.brief,
        variants: projectState.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          strategy: variant.strategy,
          selectedHook: variant.selectedHook ?? null,
          score: variant.score ?? null,
          evaluationSummary: variant.evaluationSummary ?? null,
          evaluationNotes: variant.evaluationNotes ?? [],
          storyboard: variant.storyboard ?? [],
          segmentPlan: variant.segmentPlan ?? [],
        })),
      },
      null,
      2,
    ),
  ].join("\n");
}

export const editorRevisionRouterNode: WorkflowNode = {
  id: "editor-revision-router",
  async run(projectState: ProjectState) {
    let usedGemini = false;
    let model: string | undefined;
    let fallbackReason: unknown;
    let revisionPlan: RevisionAction[];

    try {
      const generated = await generateStructuredJsonWithGemini({
        systemPrompt:
          "You are an editor revision router for a workflow engine. Return a minimal safe revision plan in valid JSON.",
        userPrompt: buildRevisionPrompt(projectState),
        validator: revisionResponseSchema,
        responseJsonSchema: revisionResponseJsonSchema,
        model: getConfiguredGeminiAdvancedModel(),
      });
      usedGemini = true;
      model = generated.model;
      revisionPlan = generated.json.revisionPlan.filter(
        (action) => action.segmentId !== undefined || action.target !== "segment_video",
      );
    } catch (error) {
      fallbackReason = error;
      const firstVariant = projectState.variants[0];
      const firstSegment = firstVariant?.segmentPlan?.[0];
      revisionPlan = [
        {
          target: "hook",
          action: "rewrite_hook",
          sceneId: `${firstVariant?.id ?? "A"}_S01`,
        },
        {
          target: "segment_video",
          action: "regenerate",
          segmentId: firstSegment?.id,
        },
        {
          target: "subtitle",
          action: "increase_font_size",
        },
      ].filter((action) => action.segmentId !== undefined || action.target !== "segment_video");
    }

    const nextState: ProjectState = {
      ...projectState,
      revisionPlan,
    };

    return appendNodeLog(
      nextState,
      "editor-revision-router",
      usedGemini
        ? `Created a targeted Gemini revision plan for stronger hook, pacing, CTA, and subtitle fixes (${model}).`
        : formatGeminiFallbackLog("editor-revision-router", fallbackReason),
    );
  },
};
