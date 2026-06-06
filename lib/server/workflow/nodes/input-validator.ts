import { existsSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

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

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

async function extractColorsFromLogo(
  logoPath: string,
): Promise<{ primary: string; secondary: string } | null> {
  try {
    const absolutePath = join(process.cwd(), logoPath);
    if (!existsSync(absolutePath)) return null;

    const { dominant } = await sharp(absolutePath).stats();
    const primary = rgbToHex(dominant.r, dominant.g, dominant.b);

    // Get secondary color by resizing and sampling a different region
    const { data } = await sharp(absolutePath)
      .resize(2, 2, { fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Use bottom-right pixel as secondary if different enough
    const channelsPerPixel = data.length / 4; // 4 pixels in 2x2
    const pixelOffset = channelsPerPixel >= 3 ? 3 * 3 : 0; // last pixel offset (RGB)
    const sr = data[pixelOffset] ?? 255;
    const sg = data[pixelOffset + 1] ?? 255;
    const sb = data[pixelOffset + 2] ?? 255;
    const secondary = rgbToHex(sr, sg, sb);

    return { primary, secondary: secondary === primary ? "#FFFFFF" : secondary };
  } catch {
    return null;
  }
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

    // Extract colors from logo if available and no colors set
    let updatedBrandKit = { ...projectState.brandKit };
    const logoAsset = projectState.brandKit.assets.find((a) => a.type === "logo");
    if (logoAsset?.filePath && (!updatedBrandKit.primaryColorHex || !updatedBrandKit.secondaryColorHex)) {
      const colors = await extractColorsFromLogo(logoAsset.filePath);
      if (colors) {
        updatedBrandKit = {
          ...updatedBrandKit,
          primaryColorHex: updatedBrandKit.primaryColorHex || colors.primary,
          secondaryColorHex: updatedBrandKit.secondaryColorHex || colors.secondary,
        };
        warnings.push(`Extracted brand colors from logo: primary=${colors.primary}, secondary=${colors.secondary}`);
      }
    }

    let nextState = patchNodeRun(
      { ...projectState, brandKit: updatedBrandKit },
      "input-validator",
      { artifactPaths: [] },
    );

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
