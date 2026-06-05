import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type {
  ProjectState,
  Variant,
  VariantArtifact,
  VariantScoreBreakdown,
} from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeScores(projectState: ProjectState, variant: Variant): VariantScoreBreakdown {
  const hookStrength = clampScore((variant.selectedHook?.score ?? 72) * 0.9 + 10);
  const brandConsistency = clampScore(
    70 +
      (projectState.brandDna?.visualAnchors.length ?? 0) * 3 +
      (projectState.brandKit.forbiddenWords?.length ? 5 : 0),
  );
  const platformFit = clampScore(
    72 +
      (projectState.brief.durationSeconds <= 20 ? 8 : 4) +
      ((variant.segmentPlan?.length ?? 0) >= 3 ? 6 : 0),
  );
  const subtitleReadability = clampScore(
    78 + ((variant.script?.length ?? 0) > 0 ? 8 : 0) + (projectState.brandKit.fontFamily ? 4 : 0),
  );
  const visualQuality = clampScore(
    74 + ((variant.storyboard?.length ?? 0) > 0 ? 6 : 0) + ((variant.segmentPlan?.length ?? 0) > 0 ? 6 : 0),
  );

  const forbiddenClaims = projectState.brief.prohibitedClaims ?? [];
  const scriptText = (variant.script ?? []).map((beat) => beat.narration).join(" ").toLowerCase();
  const containsForbiddenClaim = forbiddenClaims.some((claim) =>
    scriptText.includes(claim.toLowerCase()),
  );
  const compliance = containsForbiddenClaim ? 55 : 100;

  const publishableScore = clampScore(
    hookStrength * 0.2 +
      brandConsistency * 0.2 +
      platformFit * 0.2 +
      subtitleReadability * 0.15 +
      visualQuality * 0.15 +
      compliance * 0.1,
  );

  return {
    hookStrength,
    brandConsistency,
    platformFit,
    subtitleReadability,
    visualQuality,
    compliance,
    publishableScore,
  };
}

function buildEvaluationNotes(variant: Variant, score: VariantScoreBreakdown) {
  const notes: string[] = [];

  notes.push(`Strongest area: hook strength at ${score.hookStrength}.`);
  notes.push(
    score.publishableScore >= 80
      ? "Ready for editor review with minor polish."
      : "Needs another revision pass before it is publish-ready.",
  );

  if ((variant.segmentPlan?.length ?? 0) < 3) {
    notes.push("Consider adding more segment pacing detail for stronger short-form rhythm.");
  }

  if (score.compliance < 60) {
    notes.push("Compliance risk detected. Rewrite claims before publishing.");
  }

  return notes;
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
    const nextVariants = await Promise.all(
      projectState.variants.map(async (variant) => {
        const score = computeScores(projectState, variant);
        const notes = buildEvaluationNotes(variant, score);
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
      "Scored both variants against the publishable rubric and saved evaluation reports.",
    );
  },
};
