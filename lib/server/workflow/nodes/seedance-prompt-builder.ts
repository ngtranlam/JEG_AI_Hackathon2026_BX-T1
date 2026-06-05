import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, SegmentPlan } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function buildPromptSummary(input: {
  brandName: string;
  productName: string;
  strategyAngle: string;
  toneOfVoice: string;
  segment: SegmentPlan;
  complianceNotes: string[];
  visualAnchors: string[];
}) {
  const compliance = input.complianceNotes.length
    ? `Compliance guardrails: ${input.complianceNotes.join("; ")}.`
    : "No extra compliance guardrails provided.";

  const visualAnchors = input.visualAnchors.length
    ? `Visual anchors: ${input.visualAnchors.join(", ")}.`
    : "Visual anchors: clean brand-safe composition.";

  return [
    `Create a short vertical video segment for ${input.brandName}.`,
    `Product focus: ${input.productName}.`,
    `Creative angle: ${input.strategyAngle}.`,
    `Tone: ${input.toneOfVoice}.`,
    `Segment purpose: ${input.segment.purpose}.`,
    `Keep duration close to ${input.segment.durationSeconds} seconds.`,
    `Narrative summary: ${input.segment.promptSummary ?? "Use the planned narration beats."}`,
    visualAnchors,
    compliance,
  ].join(" ");
}

export const seedancePromptBuilderNode: WorkflowNode = {
  id: "seedance-prompt-builder",
  async run(projectState: ProjectState) {
    const complianceNotes = [
      ...projectState.brief.complianceNotes,
      ...(projectState.brief.prohibitedClaims ?? []),
    ];

    const nextVariants = projectState.variants.map((variant) => {
      const visualAnchors = projectState.brandDna?.visualAnchors ?? [];
      const nextSegmentPlan = (variant.segmentPlan ?? []).map((segment) => ({
        ...segment,
        promptSummary: buildPromptSummary({
          brandName: projectState.brief.brandName,
          productName: projectState.brief.productName,
          strategyAngle: variant.strategy.angle,
          toneOfVoice: projectState.brief.toneOfVoice,
          segment,
          complianceNotes,
          visualAnchors,
        }),
      }));

      return {
        ...variant,
        segmentPlan: nextSegmentPlan,
      };
    });

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "seedance-prompt-builder",
      "Built Seedance-ready prompt summaries for every planned segment in both variants.",
    );
  },
};
