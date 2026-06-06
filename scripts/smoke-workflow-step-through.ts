import { randomUUID } from "node:crypto";

import { coverCaptionTitleGeneratorNode } from "@/lib/server/workflow/nodes/cover-caption-title-generator";
import { brandDnaExtractorNode } from "@/lib/server/workflow/nodes/brand-dna-extractor";
import { briefAnalyzerNode } from "@/lib/server/workflow/nodes/brief-analyzer";
import { creativeDirectionGeneratorNode } from "@/lib/server/workflow/nodes/creative-direction-generator";
import { editorRevisionRouterNode } from "@/lib/server/workflow/nodes/editor-revision-router";
import { evaluationAgentNode } from "@/lib/server/workflow/nodes/evaluation-agent";
import { exportPackagerNode } from "@/lib/server/workflow/nodes/export-packager";
import { hookGeneratorScorerNode } from "@/lib/server/workflow/nodes/hook-generator-scorer";
import { inputValidatorNode } from "@/lib/server/workflow/nodes/input-validator";
import { seedancePromptBuilderNode } from "@/lib/server/workflow/nodes/seedance-prompt-builder";
import { seedanceSegmentGeneratorNode } from "@/lib/server/workflow/nodes/seedance-segment-generator";
import { segmentPlannerNode } from "@/lib/server/workflow/nodes/segment-planner";
import { segmentNormalizerNode } from "@/lib/server/workflow/nodes/segment-normalizer";
import { scriptWriterNode } from "@/lib/server/workflow/nodes/script-writer";
import { storyboardPlannerNode } from "@/lib/server/workflow/nodes/storyboard-planner";
import { subtitleBurnInAgentNode } from "@/lib/server/workflow/nodes/subtitle-burn-in-agent";
import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";
import { videoStitchingAgentNode } from "@/lib/server/workflow/nodes/video-stitching-agent";
import { voiceoverGeneratorNode } from "@/lib/server/workflow/nodes/voiceover-generator";
import { createProjectState, markNodeCompleted, markNodeFailed, markNodeRunning, setProjectStatus } from "@/lib/server/state/project-state";

const nodes: WorkflowNode[] = [
  inputValidatorNode,
  briefAnalyzerNode,
  brandDnaExtractorNode,
  creativeDirectionGeneratorNode,
  hookGeneratorScorerNode,
  scriptWriterNode,
  storyboardPlannerNode,
  segmentPlannerNode,
  seedancePromptBuilderNode,
  seedanceSegmentGeneratorNode,
  segmentNormalizerNode,
  videoStitchingAgentNode,
  voiceoverGeneratorNode,
  subtitleBurnInAgentNode,
  coverCaptionTitleGeneratorNode,
  evaluationAgentNode,
  editorRevisionRouterNode,
  exportPackagerNode,
];

async function main() {
  const referenceImagePath =
    process.argv[2] ??
    "uploads/90b28f57-4055-427c-b567-eee5a0d64dde-screenshot-2026-06-05-at-20.51.06.png";

  let projectState = createProjectState({
    projectId: `workflow-step-smoke-${randomUUID()}`,
    brief: {
      brandName: "GreenBite",
      productName: "Healthy salad delivery",
      productDescription: "Fresh, chef-prepared salads delivered to your office.",
      audience: "Office workers 25-35",
      platforms: ["TikTok"],
      targetDuration: 15,
      aspectRatio: "9:16",
      resolution: "720p",
      brandTone: "fresh, energetic, trustworthy",
      mainMessage: "Healthy eating made effortless.",
      complianceConstraints: "No fast weight-loss claims.",
      callToAction: "Order now",
      objective: "Drive first orders for lunch delivery",
      offer: "Free delivery for first order",
      prohibitedClaims: ["Lose 5kg in 7 days"],
      references: ["Clean bright realistic food shots, fast cuts, subtitle-heavy."],
    },
    brandKit: {
      primaryColorHex: "#2E7D32",
      secondaryColorHex: "#FFFFFF",
      fontFamily: "Montserrat",
      tagline: "Eat healthy without meal prep",
      visualNotes: ["Clean, bright, modern", "Realistic product shots"],
      forbiddenWords: ["miracle", "guaranteed"],
      assets: [
        {
          type: "product-image",
          fileName: referenceImagePath.split("/").pop() ?? "reference.png",
          filePath: referenceImagePath,
          mimeType: "image/png",
          publicUrl: `/${referenceImagePath}`,
        },
      ],
    },
  });
  projectState = setProjectStatus(projectState, "running");

  for (const node of nodes) {
    console.log(`START ${node.id}`);
    projectState = markNodeRunning(projectState, node.id);

    try {
      projectState = await node.run(projectState);
      projectState = markNodeCompleted(projectState, node.id);
      console.log(`DONE ${node.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      projectState = markNodeFailed(projectState, node.id, message);
      console.error(`FAIL ${node.id}`);
      console.error(message);
      process.exit(1);
    }
  }

  console.log(
    JSON.stringify(
      {
        projectId: projectState.projectId,
        status: projectState.status,
        variants: projectState.variants.map((variant) => ({
          id: variant.id,
          artifacts: variant.artifacts.map((artifact) => artifact.kind),
          score: variant.score?.publishableScore,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
