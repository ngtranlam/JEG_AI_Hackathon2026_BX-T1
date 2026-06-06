import { writeFile } from "node:fs/promises";

import sharp from "sharp";
import { z } from "zod";

import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { ensureParentDir, writeTextArtifact } from "@/lib/server/storage/files";
import { appendNodeLog } from "@/lib/server/state/project-state";
import { formatGeminiFallbackLog } from "@/lib/server/text/gemini-error";
import { generateStructuredJsonWithGemini } from "@/lib/server/text/gemini";
import type { ProjectState, VariantArtifact } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const publishingCopySchema = z.object({
  variantId: z.enum(["A", "B"]),
  title: z.string().min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string().min(2)).min(2).max(8),
  coverText: z.string().min(1),
  ctaWording: z.string().min(1),
});

const publishingCopyJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["variantId", "title", "caption", "hashtags", "coverText", "ctaWording"],
  properties: {
    variantId: { type: "string", enum: ["A", "B"] },
    title: { type: "string" },
    caption: { type: "string" },
    hashtags: { type: "array", minItems: 2, maxItems: 8, items: { type: "string" } },
    coverText: { type: "string" },
    ctaWording: { type: "string" },
  },
} as const;

function buildPublishingCopyPrompt(projectState: ProjectState, variantId: "A" | "B") {
  const variant = projectState.variants.find((item) => item.id === variantId);

  return [
    "Generate publish-ready copy for a short-form video variant.",
    "Return valid JSON only. Do not include markdown. Do not include explanations.",
    "Create a concise title, caption, 2-8 relevant hashtags, a short cover text line, and CTA wording.",
    "Respect compliance constraints and keep the copy aligned with the variant strategy.",
    "",
    "Input JSON:",
    JSON.stringify(
      {
        variantId,
        brief: projectState.brief,
        brandDna: projectState.brandDna,
        strategy: variant?.strategy,
        selectedHook: variant?.selectedHook ?? null,
        script: variant?.script ?? [],
      },
      null,
      2,
    ),
  ].join("\n");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildCoverSvg(input: {
  title: string;
  coverText?: string;
  brandName: string;
  cta: string;
  primaryColorHex?: string;
  secondaryColorHex?: string;
  fontFamily?: string;
  variantId: string;
  isSquare?: boolean;
}) {
  const primary = input.primaryColorHex ?? "#111827";
  const secondary = input.secondaryColorHex ?? "#F8FAFC";
  const fontFamily = escapeXml(input.fontFamily ?? "Inter");
  const headline = escapeXml(input.coverText ?? input.title);
  const brandName = escapeXml(input.brandName);
  const cta = escapeXml(input.cta);
  const badge = escapeXml(`Variant ${input.variantId}`);
  const w = 1080;
  const h = input.isSquare ? 1080 : 1920;

  if (input.isSquare) {
    return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#bg)" />
      <rect x="60" y="60" width="200" height="56" rx="28" fill="rgba(255,255,255,0.18)" />
      <text x="160" y="98" text-anchor="middle" fill="#FFFFFF" font-size="24" font-family="${fontFamily}" font-weight="700">${badge}</text>
      <text x="80" y="200" fill="#FFFFFF" font-size="32" font-family="${fontFamily}" font-weight="600">${brandName}</text>
      <foreignObject x="80" y="240" width="920" height="480">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color:#FFFFFF;font-family:${fontFamily},Arial,sans-serif;font-size:68px;font-weight:800;line-height:1.08;letter-spacing:-0.03em;">
          ${headline}
        </div>
      </foreignObject>
      <rect x="80" y="800" width="360" height="96" rx="48" fill="#FFFFFF" />
      <text x="260" y="862" text-anchor="middle" fill="${primary}" font-size="36" font-family="${fontFamily}" font-weight="800">${cta}</text>
      <text x="80" y="960" fill="rgba(255,255,255,0.88)" font-size="28" font-family="${fontFamily}" font-weight="500">Short-form cover generated for social preview</text>
    </svg>
  `;
  }

  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#bg)" />
      <rect x="72" y="72" width="230" height="64" rx="32" fill="rgba(255,255,255,0.18)" />
      <text x="187" y="114" text-anchor="middle" fill="#FFFFFF" font-size="28" font-family="${fontFamily}" font-weight="700">${badge}</text>
      <rect x="72" y="240" width="936" height="1160" rx="48" fill="rgba(15,23,42,0.26)" />
      <text x="108" y="368" fill="#FFFFFF" font-size="36" font-family="${fontFamily}" font-weight="600">${brandName}</text>
      <foreignObject x="108" y="420" width="864" height="720">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color:#FFFFFF;font-family:${fontFamily},Arial,sans-serif;font-size:88px;font-weight:800;line-height:1.08;letter-spacing:-0.03em;">
          ${headline}
        </div>
      </foreignObject>
      <rect x="108" y="1460" width="420" height="112" rx="56" fill="#FFFFFF" />
      <text x="318" y="1530" text-anchor="middle" fill="${primary}" font-size="42" font-family="${fontFamily}" font-weight="800">${cta}</text>
      <text x="108" y="1660" fill="rgba(255,255,255,0.88)" font-size="34" font-family="${fontFamily}" font-weight="500">Short-form cover generated for social preview</text>
    </svg>
  `;
}

async function createPublishingArtifacts(input: {
  projectId: string;
  variantId: string;
  title: string;
  caption: string;
  hashtags: string[];
  coverText?: string;
  brandName: string;
  primaryColorHex?: string;
  secondaryColorHex?: string;
  fontFamily?: string;
  primaryCallToAction: string;
  isSquare?: boolean;
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

  await ensureParentDir(coverPath);
  await writeFile(
    coverPath,
    await sharp(Buffer.from(buildCoverSvg({
      title: input.title,
      coverText: input.coverText,
      brandName: input.brandName,
      cta: input.primaryCallToAction,
      primaryColorHex: input.primaryColorHex,
      secondaryColorHex: input.secondaryColorHex,
      fontFamily: input.fontFamily,
      variantId: input.variantId,
      isSquare: input.isSquare,
    })))
      .png()
      .toBuffer(),
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
    let usedGemini = false;
    let model: string | undefined;
    let fallbackReason: unknown;
    let copyByVariant = new Map<"A" | "B", z.output<typeof publishingCopySchema>>();

    try {
      const generatedCopy = await Promise.all(
        (["A", "B"] as const).map((variantId) =>
          generateStructuredJsonWithGemini({
            systemPrompt:
              "You are a social copywriter for short-form ads. Return concise publishing copy in valid JSON.",
            userPrompt: buildPublishingCopyPrompt(projectState, variantId),
            validator: publishingCopySchema,
            responseJsonSchema: publishingCopyJsonSchema,
          }),
        ),
      );
      usedGemini = true;
      model = generatedCopy[0]?.model;
      copyByVariant = new Map(
        generatedCopy.map((result) => [result.json.variantId, result.json]),
      );
    } catch (error) {
      fallbackReason = error;
      copyByVariant = new Map(
        (["A", "B"] as const).map((variantId) => {
          const variant = projectState.variants.find((item) => item.id === variantId);
          const title =
            variantId === "A"
              ? `${projectState.brief.productName}: the easier win for busy days`
              : `${projectState.brief.productName} demo: see the payoff in seconds`;
          return [
            variantId,
            {
              variantId,
              title,
              caption: `${title}\nCTA: ${projectState.brief.callToAction}.`,
              hashtags: [
                `#${projectState.brief.brandName.replace(/\s+/g, "")}`,
                `#${projectState.brief.productName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "")}`,
                "#ShortFormVideo",
              ],
              coverText: variant?.selectedHook?.text ?? title,
              ctaWording: projectState.brief.callToAction,
            },
          ];
        }),
      );
    }

    const nextVariants = await Promise.all(
      projectState.variants.map(async (variant) => {
        const variantId = variant.id as "A" | "B";
        const generated = copyByVariant.get(variantId);
        const title = generated?.title ?? `${projectState.brief.productName} short-form ad`;
        const caption = generated?.caption ?? `${title}\nCTA: ${projectState.brief.callToAction}.`;
        const hashtags =
          generated?.hashtags ?? [`#${projectState.brief.brandName.replace(/\s+/g, "")}`, "#ShortFormVideo"];
        const primaryCallToAction = generated?.ctaWording ?? projectState.brief.callToAction;
        const { coverPath, captionPath } = await createPublishingArtifacts({
          projectId: projectState.projectId,
          variantId: variant.id,
          title,
          caption,
          hashtags,
          coverText: generated?.coverText,
          brandName: projectState.brief.brandName,
          primaryColorHex: projectState.brandKit.primaryColorHex,
          secondaryColorHex: projectState.brandKit.secondaryColorHex,
          fontFamily: projectState.brandKit.fontFamily,
          primaryCallToAction,
          isSquare: projectState.brief.aspectRatio === "1:1",
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
      usedGemini
        ? `Created real cover PNG assets plus Gemini-generated title, caption, hashtag, and cover text outputs for both variants (${model}).`
        : formatGeminiFallbackLog("cover-caption-title-generator", fallbackReason),
    );
  },
};
