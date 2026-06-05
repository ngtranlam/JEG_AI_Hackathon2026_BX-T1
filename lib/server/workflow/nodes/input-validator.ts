import {
  appendNodeLog,
  patchNodeRun,
} from "@/lib/server/state/project-state";
import { supportedDurations, type ProjectState } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function hasRequiredBrandAssets(projectState: ProjectState) {
  return projectState.brandKit.assets.some(
    (asset) => asset.type === "logo" || asset.type === "product-image",
  );
}

export const inputValidatorNode: WorkflowNode = {
  id: "input-validator",
  async run(projectState) {
    if (!supportedDurations.includes(projectState.brief.durationSeconds)) {
      throw new Error("Unsupported duration. Expected one of 15, 20, or 30 seconds.");
    }

    if (!hasRequiredBrandAssets(projectState)) {
      throw new Error(
        "Brand kit must include at least one logo or product image before generation starts.",
      );
    }

    const nextState = patchNodeRun(projectState, "input-validator", {
      artifactPaths: [],
    });

    return appendNodeLog(
      nextState,
      "input-validator",
      "Validated brief duration and minimum brand asset requirements.",
    );
  },
};
