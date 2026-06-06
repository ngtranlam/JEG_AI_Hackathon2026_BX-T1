import {
  appendNodeLog,
  patchNodeRun,
} from "@/lib/server/state/project-state";
import {
  supportedDurations,
  supportedAspectRatios,
  supportedResolutions,
  type ProjectState,
} from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function countProductImages(projectState: ProjectState) {
  return projectState.brandKit.assets.filter(
    (asset) => asset.type === "product-image",
  ).length;
}

export const inputValidatorNode: WorkflowNode = {
  id: "input-validator",
  async run(projectState) {
    const warnings: string[] = [];
    const { brief } = projectState;

    if (!brief.brandName?.trim()) {
      throw new Error("Brand name is required.");
    }

    if (!brief.productName?.trim()) {
      throw new Error("Product name is required.");
    }

    if (!supportedDurations.includes(brief.targetDuration)) {
      throw new Error("Unsupported duration. Expected one of 15, 20, or 30 seconds.");
    }

    if (!supportedAspectRatios.includes(brief.aspectRatio)) {
      throw new Error("Unsupported aspect ratio. Expected 9:16 or 1:1.");
    }

    if (!supportedResolutions.includes(brief.resolution)) {
      throw new Error("Unsupported resolution. Expected 720p or 1080p.");
    }

    if (!brief.platforms || brief.platforms.length === 0) {
      throw new Error("At least one platform must be selected.");
    }

    const productImageCount = countProductImages(projectState);

    if (productImageCount > 4) {
      throw new Error("Maximum 4 product images allowed.");
    }

    if (productImageCount === 0) {
      warnings.push(
        "Product image missing. The generated video may look generic and may not match the real product.",
      );
    }

    let nextState = patchNodeRun(projectState, "input-validator", {
      artifactPaths: [],
    });

    nextState = appendNodeLog(
      nextState,
      "input-validator",
      `Validated brief: ${brief.targetDuration}s, ${brief.aspectRatio}, ${brief.resolution}, platforms=[${brief.platforms.join(", ")}], ${productImageCount} product image(s).`,
    );

    for (const warning of warnings) {
      nextState = appendNodeLog(nextState, "input-validator", `⚠ ${warning}`);
    }

    return nextState;
  },
};
