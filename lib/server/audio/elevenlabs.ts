import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { TextToSpeechConvertRequestOutputFormat } from "@elevenlabs/elevenlabs-js/api/resources/textToSpeech/types/TextToSpeechConvertRequestOutputFormat";

import { env } from "@/lib/config/env";
import { ensureParentDir } from "@/lib/server/storage/files";

export type GenerateVoiceoverInput = {
  projectId: string;
  variantId: string;
  text: string;
  language?: string;
  voiceId: string;
  voiceStyle?: string;
  outputPath: string;
};

export type GenerateVoiceoverOutput = {
  provider: "elevenlabs";
  audioPath: string;
  duration?: number;
  format: "mp3" | "wav";
  status: "completed" | "failed";
};

const DEFAULT_ELEVENLABS_MODEL_ID = "eleven_v3";

export function getConfiguredElevenLabsVoiceId() {
  return "CeNX9CMwmxDxUF5Q2Inm";
}

export function getConfiguredElevenLabsModelId() {
  return env.ELEVENLABS_MODEL_ID ?? DEFAULT_ELEVENLABS_MODEL_ID;
}

export function hasElevenLabsRuntimeConfig() {
  return Boolean(env.ELEVENLABS_API_KEY && getConfiguredElevenLabsVoiceId());
}

function probeAudioDurationSeconds(filePath: string) {
  return new Promise<number | undefined>((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}: ${stderr.trim()}`));
        return;
      }

      const parsed = Number.parseFloat(stdout.trim());
      resolve(Number.isFinite(parsed) ? parsed : undefined);
    });
  });
}

export async function generateVoiceoverWithElevenLabs(
  input: GenerateVoiceoverInput,
): Promise<GenerateVoiceoverOutput> {
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is required for ElevenLabs voice generation.");
  }

  const client = new ElevenLabsClient({
    apiKey: env.ELEVENLABS_API_KEY,
  });
  const outputFormat = (env.ELEVENLABS_OUTPUT_FORMAT ??
    "mp3_44100_128") as TextToSpeechConvertRequestOutputFormat;

  const audioStream = await client.textToSpeech.convert(input.voiceId, {
    text: input.text,
    modelId: getConfiguredElevenLabsModelId(),
    outputFormat,
    languageCode: input.language?.slice(0, 2).toLowerCase(),
    voiceSettings: {
      stability: env.ELEVENLABS_STABILITY,
      similarityBoost: env.ELEVENLABS_SIMILARITY_BOOST,
      style: env.ELEVENLABS_STYLE,
      useSpeakerBoost: env.ELEVENLABS_USE_SPEAKER_BOOST,
    },
  });

  const arrayBuffer = await new Response(audioStream).arrayBuffer();

  await ensureParentDir(input.outputPath);
  await writeFile(input.outputPath, Buffer.from(arrayBuffer));

  const duration = await probeAudioDurationSeconds(input.outputPath);

  return {
    provider: "elevenlabs",
    audioPath: input.outputPath,
    duration,
    format: input.outputPath.endsWith(".wav") ? "wav" : "mp3",
    status: "completed",
  };
}
