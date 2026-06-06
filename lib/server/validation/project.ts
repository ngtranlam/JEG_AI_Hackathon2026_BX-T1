import { z } from "zod";

const durationSchema = z.union([z.literal(15), z.literal(20), z.literal(30)]);

const aspectRatioSchema = z.enum(["9:16", "1:1"]);

const resolutionSchema = z.enum(["720p", "1080p"]);

const platformSchema = z.enum(["TikTok", "Instagram Reels", "YouTube Shorts"]);

const brandAssetSchema = z.object({
  type: z.enum(["logo", "product-image", "moodboard", "reference"]),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  mimeType: z.string().min(1).optional(),
  publicUrl: z.string().min(1).optional(),
});

export const briefSchema = z.object({
  brandName: z.string().min(1),
  productName: z.string().min(1),
  productDescription: z.string().default(""),
  audience: z.string().min(1),
  platforms: z.array(platformSchema).min(1),
  targetDuration: durationSchema,
  aspectRatio: aspectRatioSchema,
  resolution: resolutionSchema.default("720p"),
  brandTone: z.string().min(1),
  mainMessage: z.string().default(""),
  complianceConstraints: z.string().default(""),
  callToAction: z.string().optional().default(""),
  objective: z.string().min(1).optional(),
  offer: z.string().min(1).optional(),
  mandatoryClaims: z.array(z.string().min(1)).optional(),
  prohibitedClaims: z.array(z.string().min(1)).optional(),
  references: z.array(z.string().min(1)).optional(),
});

export const brandKitSchema = z.object({
  primaryColorHex: z.string().min(1).optional(),
  secondaryColorHex: z.string().min(1).optional(),
  fontFamily: z.string().min(1).optional(),
  tagline: z.string().min(1).optional(),
  visualNotes: z.array(z.string().min(1)).optional(),
  forbiddenWords: z.array(z.string().min(1)).optional(),
  assets: z.array(brandAssetSchema).default([]),
});

export const createProjectRequestSchema = z.object({
  projectId: z.string().min(1).optional(),
  brief: briefSchema,
  brandKit: brandKitSchema,
});

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
