import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function buildTitle(projectState: ProjectState, variantId: string) {
  if (variantId === "A") {
    return `${projectState.brief.productName}: the easier win for busy days`;
  }

  return `${projectState.brief.productName} demo: see the payoff in seconds`;
}

function buildCaption(projectState: ProjectState, variantId: string) {
  const title = buildTitle(projectState, variantId);
  const offerLine = projectState.brief.offer ? `Offer: ${projectState.brief.offer}.` : "";

  return `${title}\n${offerLine}\nCTA: ${projectState.brief.primaryCallToAction}.`;
}

function buildHashtags(projectState: ProjectState) {
  const brandTag = `#${projectState.brief.brandName.replace(/\s+/g, "")}`;
  const productTag = `#${projectState.brief.productName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "")}`;

  return [brandTag, productTag, "#TikTokAds", "#ShortFormVideo"];
}

async function createPublishingArtifacts(input: {
  projectId: string;
  variantId: string;
  title: string;
  caption: string;
  hashtags: string[];
}) {
  const coverPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "cover-caption-title-generator",
    fileName: "cover.png",
  });

  const captionPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "cover-caption-title-generator",
    fileName: "caption.txt",
  });

  await writeTextArtifact(
    coverPath,
    JSON.stringify(
      {
        mock: true,
        title: input.title,
        variantId: input.variantId,
        note: "Placeholder cover artifact. Replace with Sharp/real image rendering later.",
      },
      null,
      2,
    ),
  );

  await writeTextArtifact(
    captionPath,
    `Title:\n${input.title}\n\nCaption:\n${input.caption}\n\nHashtags:\n${input.hashtags.join(" ")}`,
  );

  return { coverPath, captionPath };
}

export const coverCaptionTitleGeneratorNode: WorkflowNode = {
  id: "cover-caption-title-generator",
  async run(projectState: ProjectState) {
    const nextVariants = await Promise.all(
      projectState.variants.map(async (variant) => {
        const title = buildTitle(projectState, variant.id);
        const caption = buildCaption(projectState, variant.id);
        const hashtags = buildHashtags(projectState);
        const { coverPath, captionPath } = await createPublishingArtifacts({
          projectId: projectState.projectId,
          variantId: variant.id,
          title,
          caption,
          hashtags,
        });

        const nextArtifacts: VariantArtifact[] = [
          {
            kind: "cover-image",
            label: `${variant.id} cover`,
            path: coverPath,
          },
          {
            kind: "caption-file",
            label: `${variant.id} caption`,
            path: captionPath,
          },
        ];

        return {
          ...variant,
          generatedTitle: title,
          generatedCaption: caption,
          generatedHashtags: hashtags,
          artifacts: [...variant.artifacts, ...nextArtifacts],
        };
      }),
    );

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "cover-caption-title-generator",
      "Created mock cover, title, caption, and hashtag outputs for both variants.",
    );
  },
};
