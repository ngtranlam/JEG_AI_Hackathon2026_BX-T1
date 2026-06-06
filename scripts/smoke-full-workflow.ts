import { randomUUID } from "node:crypto";

import { createProjectState } from "@/lib/server/state/project-state";
import { runProjectWorkflow } from "@/lib/server/workflow/runner";

async function main() {
  const referenceImagePath =
    process.argv[2] ??
    "uploads/90b28f57-4055-427c-b567-eee5a0d64dde-screenshot-2026-06-05-at-20.51.06.png";

  const projectState = createProjectState({
    projectId: `gemini-workflow-smoke-${randomUUID()}`,
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

  const result = await runProjectWorkflow(projectState);

  console.log(
    JSON.stringify(
      {
        projectId: result.projectId,
        status: result.status,
        workflowStatus: Object.fromEntries(
          Object.entries(result.workflowStatus).map(([nodeId, node]) => [
            nodeId,
            {
              status: node.status,
              errorMessage: node.errorMessage,
              lastLog: node.logs.at(-1),
            },
          ]),
        ),
        variants: result.variants.map((variant) => ({
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
