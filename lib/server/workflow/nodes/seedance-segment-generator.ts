import { env } from "@/lib/config/env";
import { createSeedanceTask } from "@/lib/server/modelark/seedance-client";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { BrandAsset, ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode, WorkflowNodeContext } from "@/lib/server/workflow/nodes/types";

function toAbsoluteAssetUrl(pathOrUrl?: string) {
  if (!pathOrUrl) {
    return undefined;
  }

  if (/^https?:\/\//.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const baseUrl = env.APP_BASE_URL.replace(/\/$/, "");
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;

  return `${baseUrl}${normalizedPath}`;
}

function pickReferenceAsset(projectState: ProjectState) {
  const priorityOrder: BrandAsset["type"][] = [
    "product-image",
    "reference",
    "moodboard",
    "logo",
  ];

  for (const type of priorityOrder) {
    const match = projectState.brandKit.assets.find((asset) => asset.type === type);
    if (match) {
      return match;
    }
  }

  return undefined;
}

function pickAllProductImages(projectState: ProjectState) {
  return projectState.brandKit.assets.filter(
    (asset) => asset.type === "product-image",
  );
}

function isRasterReferenceAsset(asset: BrandAsset) {
  const mimeType = asset.mimeType?.toLowerCase();

  if (!mimeType) {
    return true;
  }

  return (
    mimeType === "image/png" ||
    mimeType === "image/jpeg" ||
    mimeType === "image/jpg" ||
    mimeType === "image/webp"
  );
}

function isPrivateHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function isProviderAccessibleUrl(url: string) {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      !isPrivateHostname(parsed.hostname)
    );
  } catch {
    return false;
  }
}

async function buildReferenceImageInput(asset?: BrandAsset) {
  if (!asset) {
    return undefined;
  }

  if (!isRasterReferenceAsset(asset)) {
    return undefined;
  }

  const absoluteUrl = toAbsoluteAssetUrl(asset.publicUrl ?? asset.filePath);

  if (!absoluteUrl || !isProviderAccessibleUrl(absoluteUrl)) {
    return undefined;
  }

  return absoluteUrl;
}

function updateSegmentState(
  projectState: ProjectState,
  variantId: string,
  segmentId: string,
  patch: {
    seedanceTaskId?: string;
    rawVideoPath?: string;
    lastFrameUrl?: string;
    status?: "pending" | "generating" | "completed" | "failed";
  },
  artifact?: VariantArtifact,
) {
  return {
    ...projectState,
    variants: projectState.variants.map((variant) => {
      if (variant.id !== variantId) {
        return variant;
      }

      const nextArtifacts = artifact
        ? [
            ...variant.artifacts.filter(
              (item) => !(item.kind === artifact.kind && item.label === artifact.label),
            ),
            artifact,
          ]
        : variant.artifacts;

      return {
        ...variant,
        segmentPlan: (variant.segmentPlan ?? []).map((segment) =>
          segment.id === segmentId
            ? {
                ...segment,
                ...patch,
              }
            : segment,
        ),
        artifacts: nextArtifacts,
      };
    }),
  };
}

export const seedanceSegmentGeneratorNode: WorkflowNode = {
  id: "seedance-segment-generator",
  async run(projectState: ProjectState, context?: WorkflowNodeContext) {
    const referenceAsset = pickReferenceAsset(projectState);
    const referenceImageUrl = await buildReferenceImageInput(referenceAsset);
    const productImages = pickAllProductImages(projectState);
    const referenceImageUrls: string[] = [];
    for (const img of productImages) {
      const url = await buildReferenceImageInput(img);
      if (url) referenceImageUrls.push(url);
    }
    const aspectRatio = projectState.brief.aspectRatio;
    const downgradedSegments: string[] = [];
    let nextState = projectState;
    let previousLastFrameUrl: string | undefined;

    for (const variant of nextState.variants) {
      for (const segment of variant.segmentPlan ?? []) {
        const requestedGenerationMode = segment.generationMode ?? "T2V";
        const effectiveGenerationMode =
          requestedGenerationMode !== "T2V" && !referenceImageUrl
            ? "T2V"
            : requestedGenerationMode;

        if (requestedGenerationMode !== effectiveGenerationMode) {
          downgradedSegments.push(`${variant.id}/${segment.id}`);
        }
        console.log(
          `[seedance-node] generating ${nextState.projectId}/${variant.id}/${segment.id}`,
        );
        nextState = updateSegmentState(nextState, variant.id, segment.id, {
          status: "generating",
        });
        nextState = appendNodeLog(
          nextState,
          "seedance-segment-generator",
          `Generating ${variant.id}/${segment.id} (${effectiveGenerationMode}).`,
        );
        await context?.onStateChange?.(nextState);

        const result = await createSeedanceTask({
          projectId: nextState.projectId,
          variantId: variant.id,
          segmentId: segment.id,
          prompt: segment.promptSummary ?? "",
          durationSeconds: segment.durationSeconds,
          generationMode: effectiveGenerationMode,
          aspectRatio,
          firstFrameUrl:
            effectiveGenerationMode === "I2V" ? (previousLastFrameUrl ?? referenceImageUrl) : undefined,
          referenceImageUrls:
            effectiveGenerationMode === "R2V" ? referenceImageUrls : undefined,
          generateAudio: true,
          resolution: nextState.brief.resolution,
        });

        previousLastFrameUrl = result.lastFrameUrl;

        nextState = updateSegmentState(
          nextState,
          variant.id,
          segment.id,
          {
            seedanceTaskId: result.taskId,
            rawVideoPath: result.rawVideoPath,
            lastFrameUrl: result.lastFrameUrl,
            status: "completed",
          },
          {
            kind: "raw-segment-video",
            label: `${segment.id} raw segment`,
            path: result.rawVideoPath,
          },
        );
        nextState = appendNodeLog(
          nextState,
          "seedance-segment-generator",
          `Completed ${variant.id}/${segment.id}: ${result.taskId}.`,
        );
        await context?.onStateChange?.(nextState);
      }
    }

    return appendNodeLog(
      nextState,
      "seedance-segment-generator",
      downgradedSegments.length > 0
        ? `Generated Seedance raw segment artifacts. Downgraded ${downgradedSegments.length} segment(s) to T2V because no provider-accessible raster reference image was available.`
        : referenceImageUrl
          ? "Generated Seedance raw segment artifacts and used a provider-accessible uploaded image as I2V reference when applicable."
          : "Generated Seedance raw segment artifacts using text-only prompts because no provider-accessible raster reference image was available.",
    );
  },
};
