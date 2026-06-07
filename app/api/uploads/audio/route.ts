import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac", "audio/x-m4a", "audio/mp4"];

function sanitizeFileName(fileName: string) {
  const normalized = fileName.trim().replace(/\s+/g, "-");
  return normalized.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase() || "audio.mp3";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }

    if (!ALLOWED_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) {
      return NextResponse.json({ error: "Only audio uploads are supported (MP3, WAV, OGG, AAC, M4A)." }, { status: 400 });
    }

    const safeFileName = sanitizeFileName(file.name);
    const storageDir = path.join(process.cwd(), "public", "uploads");
    const storedFileName = `${randomUUID()}-${safeFileName}`;
    const absolutePath = path.join(storageDir, storedFileName);

    await mkdir(storageDir, { recursive: true });
    await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({
      filePath: absolutePath,
      fileName: file.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload audio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
