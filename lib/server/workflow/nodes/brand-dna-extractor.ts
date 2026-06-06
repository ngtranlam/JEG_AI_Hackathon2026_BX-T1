import { z } from "zod";

import { appendNodeLog } from "@/lib/server/state/project-state";
import { formatGeminiFallbackLog } from "@/lib/server/text/gemini-error";
import { generateStructuredJsonWithGemini } from "@/lib/server/text/gemini";
import type { ProjectState } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const brandDnaSchema = z.object({
  brandVoice: z.object({
    personality: z.string().min(1),
    sentenceStyle: z.string().min(1),
    avoidWords: z.array(z.string()).default([]),
  }),
  emotionalRange: z.array(z.string()).min(1),
  visualRules: z.object({
    colors: z.array(z.string()).default([]),
    lighting: z.string().min(1),
    cameraStyle: z.string().min(1),
    subtitleStyle: z.object({
      font: z.string().min(1),
      position: z.string().min(1),
      maxWordsPerLine: z.number().int().positive(),
    }),
  }),
  pacingGuidance: z.string().min(1),
  complianceGuardrails: z.array(z.string()).default([]),
  logoRules: z.object({
    placement: z.string().min(1),
    duration: z.string().min(1),
  }),
});

const brandDnaJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "brandVoice",
    "emotionalRange",
    "visualRules",
    "pacingGuidance",
    "complianceGuardrails",
    "logoRules",
  ],
  properties: {
    brandVoice: {
      type: "object",
      additionalProperties: false,
      required: ["personality", "sentenceStyle", "avoidWords"],
      properties: {
        personality: { type: "string" },
        sentenceStyle: { type: "string" },
        avoidWords: { type: "array", items: { type: "string" } },
      },
    },
    emotionalRange: { type: "array", items: { type: "string" } },
    visualRules: {
      type: "object",
      additionalProperties: false,
      required: ["colors", "lighting", "cameraStyle", "subtitleStyle"],
      properties: {
        colors: { type: "array", items: { type: "string" } },
        lighting: { type: "string" },
        cameraStyle: { type: "string" },
        subtitleStyle: {
          type: "object",
          additionalProperties: false,
          required: ["font", "position", "maxWordsPerLine"],
          properties: {
            font: { type: "string" },
            position: { type: "string" },
            maxWordsPerLine: { type: "integer" },
          },
        },
      },
    },
    pacingGuidance: { type: "string" },
    complianceGuardrails: { type: "array", items: { type: "string" } },
    logoRules: {
      type: "object",
      additionalProperties: false,
      required: ["placement", "duration"],
      properties: {
        placement: { type: "string" },
        duration: { type: "string" },
      },
    },
  },
} as const;

function buildBrandDnaPrompt(projectState: ProjectState) {
  return [
    "Extract reusable brand DNA for a short-form video workflow.",
    "Return valid JSON only. Do not include markdown. Do not include explanations.",
    "Use the brand metadata only. Do not invent unsupported claims.",
    "",
    "Input JSON:",
    JSON.stringify(
      {
        brandName: projectState.brief.brandName,
        productName: projectState.brief.productName,
        brandTone: projectState.brief.brandTone,
        primaryColorHex: projectState.brandKit.primaryColorHex ?? null,
        secondaryColorHex: projectState.brandKit.secondaryColorHex ?? null,
        fontFamily: projectState.brandKit.fontFamily ?? null,
        tagline: projectState.brandKit.tagline ?? null,
        visualNotes: projectState.brandKit.visualNotes ?? [],
        forbiddenWords: projectState.brandKit.forbiddenWords ?? [],
        complianceConstraints: projectState.brief.complianceConstraints,
        prohibitedClaims: projectState.brief.prohibitedClaims ?? [],
        assets: projectState.brandKit.assets.map((asset) => ({
          type: asset.type,
          fileName: asset.fileName,
          mimeType: asset.mimeType ?? null,
        })),
      },
      null,
      2,
    ),
  ].join("\n");
}

export const brandDnaExtractorNode: WorkflowNode = {
  id: "brand-dna-extractor",
  async run(projectState: ProjectState) {
    let usedGemini = false;
    let model: string | undefined;
    let fallbackReason: unknown;
    let nextState: ProjectState;

    try {
      const generated = await generateStructuredJsonWithGemini({
        systemPrompt:
          "You are a brand strategist for short-form video ads. Return concise, reusable brand DNA in valid JSON.",
        userPrompt: buildBrandDnaPrompt(projectState),
        validator: brandDnaSchema,
        responseJsonSchema: brandDnaJsonSchema,
      });
      usedGemini = true;
      model = generated.model;

      const visualAnchors = [
        ...(generated.json.visualRules.colors ?? []),
        generated.json.visualRules.lighting,
        generated.json.visualRules.cameraStyle,
        generated.json.visualRules.subtitleStyle.font,
      ].filter(Boolean);

      nextState = {
        ...projectState,
        brandDna: {
          voiceAttributes: [
            generated.json.brandVoice.personality,
            generated.json.brandVoice.sentenceStyle,
          ],
          emotionalRange: generated.json.emotionalRange,
          visualAnchors,
          pacingGuidance: generated.json.pacingGuidance,
          complianceGuardrails: generated.json.complianceGuardrails ?? [],
          avoidWords: generated.json.brandVoice.avoidWords ?? [],
          subtitleGuidance: generated.json.visualRules.subtitleStyle,
          logoGuidance: generated.json.logoRules,
        },
      };
    } catch (error) {
      fallbackReason = error;
      nextState = {
        ...projectState,
        brandDna: {
          voiceAttributes: [projectState.brief.brandTone, "clear short-form phrasing"],
          emotionalRange: ["trust", "clarity", "momentum"],
          visualAnchors: [
            projectState.brandKit.primaryColorHex ?? "#FFFFFF",
            projectState.brandKit.secondaryColorHex ?? "#111111",
            ...(projectState.brandKit.visualNotes ?? []),
          ],
          pacingGuidance: "Keep pacing fast in the opening and clear in the CTA.",
          complianceGuardrails: [
            projectState.brief.complianceConstraints,
            ...(projectState.brief.prohibitedClaims ?? []),
          ].filter(Boolean),
          avoidWords: projectState.brandKit.forbiddenWords ?? [],
          subtitleGuidance: {
            font: projectState.brandKit.fontFamily ?? "Arial",
            position: "lower-middle",
            maxWordsPerLine: 5,
          },
          logoGuidance: {
            placement: "end card only",
            duration: "last 2 seconds",
          },
        },
      };
    }

    return appendNodeLog(
      nextState,
      "brand-dna-extractor",
      usedGemini
        ? `Generated structured brand DNA with Gemini (${model}).`
        : formatGeminiFallbackLog("brand-dna-extractor", fallbackReason),
    );
  },
};
