import { createSquareVideo, createVerticalVideo, probeMediaFile } from "@/lib/server/media/ffmpeg";
import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ExportAsset, ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

async function createVariantExportArtifacts(input: {
  projectId: string;
  variantId: string;
  finalVideoPath: string;
  isSquare: boolean;
  generatedTitle?: string;
  generatedCaption?: string;
  generatedHashtags?: string[];
  score?: number;
}) {
  const altFileName = input.isSquare ? "final_9x16.mp4" : "final_1x1.mp4";
  const altPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "export-packager",
    fileName: altFileName,
  });

  const promptsPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "export-packager",
    fileName: "seedance_prompts.json",
  });

  if (input.isSquare) {
    await createVerticalVideo(input.finalVideoPath, altPath);
  } else {
    await createSquareVideo(input.finalVideoPath, altPath);
  }

  await writeTextArtifact(
    promptsPath,
    JSON.stringify(
      {
        title: input.generatedTitle ?? null,
        caption: input.generatedCaption ?? null,
        hashtags: input.generatedHashtags ?? [],
        publishableScore: input.score ?? null,
      },
      null,
      2,
    ),
  );

  return { altPath, promptsPath };
}

async function createWorkflowReport(projectState: ProjectState) {
  const workflowReportPath = buildArtifactPath({
    projectId: projectState.projectId,
    nodeId: "export-packager",
    fileName: "workflow_report.md",
  });

  const content = [
    "# Workflow Report",
    "",
    `Project ID: ${projectState.projectId}`,
    `Status: ${projectState.status}`,
    "",
    "## Brief Summary",
    `- Brand: ${projectState.brief.brandName}`,
    `- Product: ${projectState.brief.productName}`,
    `- Objective: ${projectState.brief.objective ?? projectState.brief.mainMessage}`,
    `- Duration: ${projectState.brief.targetDuration}s`,
    `- Aspect Ratio: ${projectState.brief.aspectRatio}`,
    `- Resolution: ${projectState.brief.resolution}`,
    `- Platforms: ${projectState.brief.platforms.join(", ")}`,
    "",
    "## Variants",
    ...projectState.variants.flatMap((variant) => [
      `### Variant ${variant.id} - ${variant.name}`,
      `- Hook: ${variant.selectedHook?.text ?? "N/A"}`,
      `- Title: ${variant.generatedTitle ?? "N/A"}`,
      `- Score: ${variant.score?.publishableScore ?? "N/A"}`,
      `- Publishable: ${variant.publishable ? "Yes" : "No"}`,
      "",
    ]),
  ].join("\n");

  await writeTextArtifact(workflowReportPath, content);
  return workflowReportPath;
}

export const exportPackagerNode: WorkflowNode = {
  id: "export-packager",
  async run(projectState: ProjectState) {
    const exportAssets: ExportAsset[] = [];

    const nextVariants = await Promise.all(
      projectState.variants.map(async (variant) => {
        const finalVideoPath = variant.artifacts.find(
          (artifact) => artifact.kind === "final-video",
        )?.path;

        const isSquare = projectState.brief.aspectRatio === "1:1";

        if (!finalVideoPath || !(await probeMediaFile(finalVideoPath))) {
          throw new Error(`Variant ${variant.id} is missing a valid final video for export packaging.`);
        }

        const { altPath, promptsPath } = await createVariantExportArtifacts({
          projectId: projectState.projectId,
          variantId: variant.id,
          finalVideoPath,
          isSquare,
          generatedTitle: variant.generatedTitle,
          generatedCaption: variant.generatedCaption,
          generatedHashtags: variant.generatedHashtags,
          score: variant.score?.publishableScore,
        });

        const altKind = isSquare ? "final-video-vertical" : "final-video-square";
        const altLabel = isSquare ? `${variant.id} final 9:16` : `${variant.id} final 1:1`;
        const altExportType = isSquare ? "video-9x16" : "video-1x1";

        const nextArtifacts: VariantArtifact[] = [
          {
            kind: altKind,
            label: altLabel,
            path: altPath,
          },
          {
            kind: "prompt-export",
            label: `${variant.id} prompt export`,
            path: promptsPath,
          },
        ];

        exportAssets.push(
          {
            type: altExportType,
            label: altLabel,
            path: altPath,
          },
          {
            type: "prompt-export",
            label: `${variant.id} prompt export`,
            path: promptsPath,
          },
        );

        return {
          ...variant,
          artifacts: [...variant.artifacts, ...nextArtifacts],
        };
      }),
    );

    const workflowReportPath = await createWorkflowReport({
      ...projectState,
      variants: nextVariants,
    });

    exportAssets.push({
      type: "workflow-report",
      label: "Workflow report",
      path: workflowReportPath,
    });

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
      exports: exportAssets,
    };

    return appendNodeLog(
      nextState,
      "export-packager",
      `Created alternate-ratio exports (${projectState.brief.aspectRatio === "1:1" ? "9:16 from 1:1" : "1:1 from 9:16"}) from final videos, prompt export files, and the project workflow report.`,
    );
  },
};
