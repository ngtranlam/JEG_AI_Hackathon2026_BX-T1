import { appendNodeLog } from "@/lib/server/state/project-state";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

export const brandDnaExtractorNode: WorkflowNode = {
  id: "brand-dna-extractor",
  async run(projectState) {
    const tone = projectState.brief.toneOfVoice;
    const visualAnchors = [
      projectState.brandKit.primaryColorHex,
      projectState.brandKit.secondaryColorHex,
      projectState.brandKit.fontFamily,
    ].filter(Boolean) as string[];

    const nextState = {
      ...projectState,
      brandDna: {
        voiceAttributes: [tone],
        emotionalRange: ["credible", "engaging"],
        visualAnchors,
        pacingGuidance: `Match a ${tone} tone within ${projectState.brief.durationSeconds} seconds.`,
        complianceGuardrails: [
          ...projectState.brief.complianceNotes,
          ...(projectState.brief.prohibitedClaims ?? []),
          ...(projectState.brandKit.forbiddenWords ?? []),
        ],
      },
    };

    return appendNodeLog(
      nextState,
      "brand-dna-extractor",
      "Derived baseline brand DNA from the brief and brand kit metadata.",
    );
  },
};
