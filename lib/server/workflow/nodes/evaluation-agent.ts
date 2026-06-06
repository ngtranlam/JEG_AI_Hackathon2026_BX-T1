import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import { formatGeminiFallbackLog } from "@/lib/server/text/gemini-error";
import { getConfiguredGeminiAdvancedModel, generateStructuredJsonWithGemini } from "@/lib/server/text/gemini";
import type {
  ProjectState,
  VariantArtifact,
  VariantScoreBreakdown,
} from "@/lib/types/project";
import { z } from "zod";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

const evaluationResponseSchema = z.object({
  variantId: z.enum(["A", "B"]),
  scores: z.object({
    hookStrength: z.number().int().min(0).max(100),
    brandConsistency: z.number().int().min(0).max(100),
    platformFit: z.number().int().min(0).max(100),
    aspectRatioFit: z.number().int().min(0).max(100),
    subtitleReadability: z.number().int().min(0).max(100),
    visualQuality: z.number().int().min(0).max(100),
    compliance: z.number().int().min(0).max(100),
  }),
  notes: z.array(z.string()).default([]),
});

const evaluationResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["variantId", "scores", "notes"],
  properties: {
    variantId: { type: "string", enum: ["A", "B"] },
    scores: {
      type: "object",
      additionalProperties: false,
      required: [
        "hookStrength",
        "brandConsistency",
        "platformFit",
        "aspectRatioFit",
        "subtitleReadability",
        "visualQuality",
        "compliance",
      ],
      properties: {
        hookStrength: { type: "integer" },
        brandConsistency: { type: "integer" },
        platformFit: { type: "integer" },
        aspectRatioFit: { type: "integer" },
        subtitleReadability: { type: "integer" },
        visualQuality: { type: "integer" },
        compliance: { type: "integer" },
      },
    },
    notes: { type: "array", items: { type: "string" } },
  },
} as const;

function computePublishableScore(score: Omit<VariantScoreBreakdown, "publishableScore">) {
  return clampScore(
    score.hookStrength * 0.15 +
      score.brandConsistency * 0.15 +
      score.platformFit * 0.15 +
      score.aspectRatioFit * 0.15 +
      score.subtitleReadability * 0.15 +
      score.visualQuality * 0.15 +
      score.compliance * 0.1,
  );
}

function buildEvaluationPrompt(projectState: ProjectState, variantId: "A" | "B") {
  const variant = projectState.variants.find((item) => item.id === variantId);
  return [
    "Evaluate this short-form video variant for publish readiness.",
    "Return valid JSON only. Do not include markdown. Do not include explanations.",
    "Score the variant from 0 to 100 for hookStrength, brandConsistency, platformFit, aspectRatioFit, subtitleReadability, visualQuality, and compliance.",
    "Base the judgment on the planning artifacts and generated metadata. Give concise notes with strengths or fixes.",
    "",
    "Input JSON:",
    JSON.stringify(
      {
        variantId,
        brief: projectState.brief,
        brandDna: projectState.brandDna,
        variant,
      },
      null,
      2,
    ),
  ].join("\n");
}

async function createEvaluationArtifact(input: {
  projectId: string;
  variantId: string;
  score: VariantScoreBreakdown;
  notes: string[];
}) {
  const evaluationPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "evaluation-agent",
    fileName: "evaluation.json",
  });

  await writeTextArtifact(
    evaluationPath,
    JSON.stringify(
      {
        variantId: input.variantId,
        scores: input.score,
        publishable: input.score.publishableScore >= 80,
        notes: input.notes,
      },
      null,
      2,
    ),
  );

  return evaluationPath;
}

export const evaluationAgentNode: WorkflowNode = {
  id: "evaluation-agent",
  async run(projectState: ProjectState) {
    let usedGemini = false;
    let model: string | undefined;
    let fallbackReason: unknown;
    let evaluationByVariant = new Map<
      "A" | "B",
      {
        variantId: "A" | "B";
        scores: {
          hookStrength: number;
          brandConsistency: number;
          platformFit: number;
          aspectRatioFit: number;
          subtitleReadability: number;
          visualQuality: number;
          compliance: number;
        };
        notes?: string[];
      }
    >();

    try {
      const generatedEvaluations = await Promise.all(
        (["A", "B"] as const).map((variantId) =>
          generateStructuredJsonWithGemini({
            systemPrompt:
              "You are a creative QA reviewer for performance marketing videos. Return evaluation scores and notes in valid JSON.",
            userPrompt: buildEvaluationPrompt(projectState, variantId),
            validator: evaluationResponseSchema,
            responseJsonSchema: evaluationResponseJsonSchema,
            model: getConfiguredGeminiAdvancedModel(),
          }),
        ),
      );
      usedGemini = true;
      model = generatedEvaluations[0]?.model;
      evaluationByVariant = new Map(
        generatedEvaluations.map((result) => [result.json.variantId, result.json]),
      );
    } catch (error) {
      fallbackReason = error;
    }

    const nextVariants = await Promise.all(
      projectState.variants.map(async (variant) => {
        const generated = evaluationByVariant.get(variant.id as "A" | "B");
        const partialScore = {
          hookStrength: clampScore(generated?.scores.hookStrength ?? 70),
          brandConsistency: clampScore(generated?.scores.brandConsistency ?? 70),
          platformFit: clampScore(generated?.scores.platformFit ?? 70),
          aspectRatioFit: clampScore(generated?.scores.aspectRatioFit ?? 70),
          subtitleReadability: clampScore(generated?.scores.subtitleReadability ?? 70),
          visualQuality: clampScore(generated?.scores.visualQuality ?? 70),
          compliance: clampScore(generated?.scores.compliance ?? 70),
        };
        const score: VariantScoreBreakdown = {
          ...partialScore,
          publishableScore: computePublishableScore(partialScore),
        };
        const notes = generated?.notes?.length
          ? generated.notes
          : [
              score.publishableScore >= 80
                ? "Ready for editor review with minor polish."
                : "Needs another revision pass before it is publish-ready.",
            ];
        const evaluationPath = await createEvaluationArtifact({
          projectId: projectState.projectId,
          variantId: variant.id,
          score,
          notes,
        });

        const nextArtifacts: VariantArtifact[] = [
          {
            kind: "evaluation-report",
            label: `${variant.id} evaluation`,
            path: evaluationPath,
          },
        ];

        return {
          ...variant,
          score,
          publishable: score.publishableScore >= 80,
          evaluationSummary:
            score.publishableScore >= 80
              ? "Publishable with light polish."
              : "Needs revision before publishing.",
          evaluationNotes: notes,
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
      "evaluation-agent",
      usedGemini
        ? `Scored both variants with Gemini evaluation and saved evaluation reports (${model}).`
        : formatGeminiFallbackLog("evaluation-agent", fallbackReason),
    );
  },
};
