import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ExportAsset, ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

async function createVariantExportArtifacts(input: {
  projectId: string;
  variantId: string;
  finalVideoPath?: string;
  generatedTitle?: string;
  generatedCaption?: string;
  generatedHashtags?: string[];
  score?: number;
}) {
  const final1x1Path = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "export-packager",
    fileName: "final_1x1.mp4",
  });

  const promptsPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "export-packager",
    fileName: "seedance_prompts.json",
  });

  await writeTextArtifact(
    final1x1Path,
    JSON.stringify(
      {
        mock: true,
        sourceFinal9x16: input.finalVideoPath ?? null,
        profile: "1080x1080 safe crop placeholder",
      },
      null,
      2,
    ),
  );

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

  return { final1x1Path, promptsPath };
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
    `- Objective: ${projectState.brief.objective}`,
    `- Duration: ${projectState.brief.durationSeconds}s`,
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

        const { final1x1Path, promptsPath } = await createVariantExportArtifacts({
          projectId: projectState.projectId,
          variantId: variant.id,
          finalVideoPath,
          generatedTitle: variant.generatedTitle,
          generatedCaption: variant.generatedCaption,
          generatedHashtags: variant.generatedHashtags,
          score: variant.score?.publishableScore,
        });

        const nextArtifacts: VariantArtifact[] = [
          {
            kind: "final-video-square",
            label: `${variant.id} final 1:1`,
            path: final1x1Path,
          },
          {
            kind: "prompt-export",
            label: `${variant.id} prompt export`,
            path: promptsPath,
          },
        ];

        exportAssets.push(
          {
            type: "video-1x1",
            label: `${variant.id} final 1:1`,
            path: final1x1Path,
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
      "Created mock 1:1 exports, prompt export files, and the project workflow report.",
    );
  },
};
