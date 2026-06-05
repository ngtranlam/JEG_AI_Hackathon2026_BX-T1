import { appendNodeLog } from "@/lib/server/state/project-state";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

export const briefAnalyzerNode: WorkflowNode = {
  id: "brief-analyzer",
  async run(projectState) {
    const nextState = {
      ...projectState,
      analysis: {
        audienceInsight: `Primary audience: ${projectState.brief.audience}.`,
        valueProposition: `${projectState.brief.productName} supports the objective: ${projectState.brief.objective}.`,
        problemStatement: `${projectState.brief.audience} needs a clearer reason to care about ${projectState.brief.productName}.`,
        platformFitRationale: `Content is being optimized for ${projectState.brief.platform}.`,
        campaignObjective: projectState.brief.objective,
      },
    };

    return appendNodeLog(
      nextState,
      "brief-analyzer",
      "Created a deterministic fallback brief analysis for the workflow skeleton.",
    );
  },
};
