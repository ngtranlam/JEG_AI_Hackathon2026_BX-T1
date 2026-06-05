import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function ensureParentDir(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function writeTextArtifact(filePath: string, content: string) {
  await ensureParentDir(filePath);
  await writeFile(filePath, content, "utf8");
}
