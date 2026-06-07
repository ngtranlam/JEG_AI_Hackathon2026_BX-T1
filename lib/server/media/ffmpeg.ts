import { access, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

async function ensureParentDir(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

function runProcess(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

export async function assertFileExists(filePath: string) {
  await access(filePath);
}

export async function probeMediaFile(filePath: string) {
  try {
    await runProcess("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function normalizeVerticalVideo(inputPath: string, outputPath: string, resolution: "720p" | "1080p" = "1080p") {
  const w = resolution === "1080p" ? 1080 : 720;
  const h = resolution === "1080p" ? 1920 : 1280;
  await ensureParentDir(outputPath);
  await runProcess("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,fps=30,setsar=1`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ]);
}

export async function normalizeSquareVideo(inputPath: string, outputPath: string, resolution: "720p" | "1080p" = "1080p") {
  const s = resolution === "1080p" ? 1080 : 720;
  await ensureParentDir(outputPath);
  await runProcess("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    `scale=${s}:${s}:force_original_aspect_ratio=decrease,pad=${s}:${s}:(ow-iw)/2:(oh-ih)/2:color=black,fps=30,setsar=1`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ]);
}

export async function concatVideos(manifestPath: string, outputPath: string) {
  await ensureParentDir(outputPath);
  await runProcess("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    manifestPath,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ]);
}

export async function mixVoiceoverWithVideo(
  videoPath: string,
  audioPath: string,
  outputPath: string,
) {
  await ensureParentDir(outputPath);
  await runProcess("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-filter_complex",
    "[0:a][1:a]amix=inputs=2:duration=shortest:dropout_transition=2[aout]",
    "-map",
    "0:v:0",
    "-map",
    "[aout]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ]);
}

export async function createSquareVideo(inputPath: string, outputPath: string) {
  await ensureParentDir(outputPath);
  await runProcess("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ]);
}

export async function createVerticalVideo(inputPath: string, outputPath: string) {
  await ensureParentDir(outputPath);
  await runProcess("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ]);
}

export async function mixBackgroundMusic(
  videoPath: string,
  musicPath: string,
  outputPath: string,
  musicVolume = 0.3,
) {
  await ensureParentDir(outputPath);
  await runProcess("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-i",
    musicPath,
    "-filter_complex",
    `[1:a]aloop=loop=-1:size=2e+09,volume=${musicVolume}[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
    "-map",
    "0:v:0",
    "-map",
    "[aout]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ]);
}

export async function burnAssSubtitles(
  inputPath: string,
  subtitlePath: string,
  outputPath: string,
) {
  await ensureParentDir(outputPath);
  await runProcess("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    `ass=${subtitlePath}`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ]);
}
