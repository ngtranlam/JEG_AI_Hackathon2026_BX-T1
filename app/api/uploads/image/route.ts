import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import type { BrandAsset } from "@/lib/types/project";

const allowedAssetTypes: BrandAsset["type"][] = [
  "logo",
  "product-image",
  "moodboard",
  "reference",
];

function isBrandAssetType(value: FormDataEntryValue | null): value is BrandAsset["type"] {
  return typeof value === "string" && allowedAssetTypes.includes(value as BrandAsset["type"]);
}

function sanitizeFileName(fileName: string) {
  const normalized = fileName.trim().replace(/\s+/g, "-");
  return normalized.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase() || "upload.bin";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const assetType = formData.get("assetType");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    if (!isBrandAssetType(assetType)) {
      return NextResponse.json({ error: "Invalid asset type." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
    }

    const safeFileName = sanitizeFileName(file.name);
    const storageDir = path.join(process.cwd(), "public", "uploads");
    const storedFileName = `${randomUUID()}-${safeFileName}`;
    const absolutePath = path.join(storageDir, storedFileName);
    const relativePath = `uploads/${storedFileName}`;
    const publicUrl = `/${relativePath}`;

    await mkdir(storageDir, { recursive: true });
    await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({
      asset: {
        type: assetType,
        fileName: file.name,
        filePath: relativePath,
        mimeType: file.type,
        publicUrl,
      } satisfies BrandAsset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
