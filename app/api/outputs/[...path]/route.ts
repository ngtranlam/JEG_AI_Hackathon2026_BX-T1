import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

const OUTPUTS_ROOT = join(process.cwd(), "outputs", "generated");

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export async function GET(_: Request, context: RouteContext) {
  const { path } = await context.params;
  const filePath = join(OUTPUTS_ROOT, ...path);

  // Prevent directory traversal
  if (!filePath.startsWith(OUTPUTS_ROOT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  const data = await readFile(filePath);
  return new NextResponse(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
