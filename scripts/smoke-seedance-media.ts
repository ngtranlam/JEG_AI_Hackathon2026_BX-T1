import path from "node:path";

import { createEmptyWorkflowStatus, createProjectState } from "@/lib/server/state/project-state";
import { segmentNormalizerNode } from "@/lib/server/workflow/nodes/segment-normalizer";
import { subtitleBurnInAgentNode } from "@/lib/server/workflow/nodes/subtitle-burn-in-agent";
import { videoStitchingAgentNode } from "@/lib/server/workflow/nodes/video-stitching-agent";

async function main() {
  const rawVideoArg = process.argv[2];

  if (!rawVideoArg) {
    throw new Error("Usage: npx tsx scripts/smoke-seedance-media.ts <raw-video-path>");
  }

  const rawVideoPath = path.resolve(process.cwd(), rawVideoArg);
  const base = createProjectState({
    projectId: "seedance-media-smoke",
    brief: {
      brandName: "SmokeTest",
      productName: "Demo Bottle",
      productDescription: "Test product for media pipeline.",
      audience: "test audience",
      platforms: ["TikTok"],
      targetDuration: 15,
      aspectRatio: "9:16",
      resolution: "720p",
      brandTone: "clean",
      mainMessage: "Verify media pipeline.",
      complianceConstraints: "",
      callToAction: "learn more",
      objective: "verify media pipeline",
    },
    brandKit: {
      fontFamily: "Arial",
      assets: [],
    },
  });

  const project = {
    ...base,
    workflowStatus: createEmptyWorkflowStatus(),
    variants: [
      {
        id: "variant-a",
        name: "Variant A",
        strategy: {
          angle: "demo",
          summary: "demo",
          differentiators: [],
        },
        script: [
          {
            startMs: 0,
            endMs: 4000,
            narration: "Demo subtitle line",
            intent: "body",
          },
        ],
        segmentPlan: [
          {
            id: "SEG_01",
            order: 1,
            durationSeconds: 4,
            purpose: "body",
            generationMode: "T2V" as const,
            rawVideoPath,
            status: "completed" as const,
            promptSummary: "demo",
          },
        ],
        artifacts: [],
      },
    ],
  };

  const normalized = await segmentNormalizerNode.run(project);
  const stitched = await videoStitchingAgentNode.run(normalized);
  const subtitled = await subtitleBurnInAgentNode.run(stitched);

  console.log(JSON.stringify(subtitled.variants[0]?.artifacts ?? [], null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
