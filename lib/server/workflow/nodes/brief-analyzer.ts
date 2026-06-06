import { z } from "zod";

import { formatGeminiFallbackLog } from "@/lib/server/text/gemini-error";
import { generateStructuredJsonWithGemini } from "@/lib/server/text/gemini";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const briefAnalysisSchema = z.object({
  audienceInsight: z.string().min(1),
  valueProposition: z.string().min(1),
  problemStatement: z.string().min(1),
  platformFitRationale: z.string().min(1),
  campaignObjective: z.string().min(1),
  painPoints: z.array(z.string()).default([]),
  desiredEmotion: z.array(z.string()).default([]),
  mustInclude: z.array(z.string()).default([]),
  mustAvoid: z.array(z.string()).default([]),
  platformConventions: z.array(z.string()).default([]),
  aspectRatioNotes: z.string().default(""),
});

const briefAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "audienceInsight",
    "valueProposition",
    "problemStatement",
    "platformFitRationale",
    "campaignObjective",
    "painPoints",
    "desiredEmotion",
    "mustInclude",
    "mustAvoid",
    "platformConventions",
    "aspectRatioNotes",
  ],
  properties: {
    audienceInsight: { type: "string" },
    valueProposition: { type: "string" },
    problemStatement: { type: "string" },
    platformFitRationale: { type: "string" },
    campaignObjective: { type: "string" },
    painPoints: { type: "array", items: { type: "string" } },
    desiredEmotion: { type: "array", items: { type: "string" } },
    mustInclude: { type: "array", items: { type: "string" } },
    mustAvoid: { type: "array", items: { type: "string" } },
    platformConventions: { type: "array", items: { type: "string" } },
    aspectRatioNotes: { type: "string" },
  },
} as const;

function buildBriefAnalysisPrompt(projectState: ProjectState) {
  return [
    "Analyze the marketing brief for a short-form video workflow.",
    "Return valid JSON only. Do not include markdown. Do not include explanations.",
    "Respect all compliance constraints and avoid unsupported claims.",
    `The selected aspect ratio is ${projectState.brief.aspectRatio}. Consider how this affects platform conventions, framing, and composition.`,
    "",
    "Input JSON:",
    JSON.stringify(
      {
        brandName: projectState.brief.brandName,
        productName: projectState.brief.productName,
        productDescription: projectState.brief.productDescription,
        audience: projectState.brief.audience,
        platforms: projectState.brief.platforms,
        targetDuration: projectState.brief.targetDuration,
        aspectRatio: projectState.brief.aspectRatio,
        brandTone: projectState.brief.brandTone,
        mainMessage: projectState.brief.mainMessage,
        complianceConstraints: projectState.brief.complianceConstraints,
        callToAction: projectState.brief.callToAction,
        objective: projectState.brief.objective ?? null,
        offer: projectState.brief.offer ?? null,
        mandatoryClaims: projectState.brief.mandatoryClaims ?? [],
        prohibitedClaims: projectState.brief.prohibitedClaims ?? [],
        references: projectState.brief.references ?? [],
      },
      null,
      2,
    ),
  ].join("\n");
}

export const briefAnalyzerNode: WorkflowNode = {
  id: "brief-analyzer",
  async run(projectState: ProjectState) {
    let usedGemini = false;
    let model: string | undefined;
    let fallbackReason: unknown;
    let nextState: ProjectState;

    try {
      const analysis = await generateStructuredJsonWithGemini({
        systemPrompt:
          "You are a senior creative strategist for short-form video ads. Return concise, production-ready analysis in valid JSON.",
        userPrompt: buildBriefAnalysisPrompt(projectState),
        validator: briefAnalysisSchema,
        responseJsonSchema: briefAnalysisJsonSchema,
      });
      usedGemini = true;
      model = analysis.model;
      nextState = {
        ...projectState,
        analysis: analysis.json,
      };
    } catch (error) {
      fallbackReason = error;
      nextState = {
        ...projectState,
        analysis: {
          audienceInsight: `Primary audience: ${projectState.brief.audience}.`,
          valueProposition: `${projectState.brief.productName}: ${projectState.brief.mainMessage || projectState.brief.objective || ""}.`,
          problemStatement: `${projectState.brief.audience} needs a clearer reason to care about ${projectState.brief.productName}.`,
          platformFitRationale: `Content is being optimized for ${projectState.brief.platforms.join(", ")}.`,
          campaignObjective: projectState.brief.objective ?? projectState.brief.mainMessage,
          painPoints: [],
          desiredEmotion: [],
          mustInclude: [],
          mustAvoid: [],
          platformConventions: [],
          aspectRatioNotes: `Selected aspect ratio: ${projectState.brief.aspectRatio}.`,
        },
      };
    }

    return appendNodeLog(
      nextState,
      "brief-analyzer",
      usedGemini
        ? `Generated structured brief analysis with Gemini (${model}).`
        : formatGeminiFallbackLog("brief-analyzer", fallbackReason),
    );
  },
};
