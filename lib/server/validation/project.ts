import { z } from "zod";

const durationSchema = z.union([z.literal(15), z.literal(20), z.literal(30)]);

const brandAssetSchema = z.object({
  type: z.enum(["logo", "product-image", "moodboard", "reference"]),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  mimeType: z.string().min(1).optional(),
});

export const briefSchema = z.object({
  brandName: z.string().min(1),
  productName: z.string().min(1),
  audience: z.string().min(1),
  objective: z.string().min(1),
  offer: z.string().min(1).optional(),
  primaryCallToAction: z.string().min(1),
  toneOfVoice: z.string().min(1),
  platform: z.enum(["tiktok", "instagram-reels", "youtube-shorts"]),
  durationSeconds: durationSchema,
  complianceNotes: z.array(z.string().min(1)).default([]),
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
