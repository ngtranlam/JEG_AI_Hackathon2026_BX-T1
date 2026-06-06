import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/config/env";
import { buildArtifactPath } from "@/lib/server/storage/artifacts";
import { writeTextArtifact } from "@/lib/server/storage/files";

export type SeedanceGenerationMode = "T2V" | "I2V" | "R2V";

export type SeedanceAspectRatio = "16:9" | "4:3" | "1:1" | "3:4" | "9:16" | "21:9" | "adaptive";

export interface SeedanceCreateTaskInput {
  projectId: string;
  variantId: string;
  segmentId: string;
  prompt: string;
  durationSeconds: number;
  generationMode: SeedanceGenerationMode;
  aspectRatio: SeedanceAspectRatio;
  referenceImageUrls?: string[];
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  referenceAudioUrl?: string;
  generateAudio?: boolean;
  cameraFixed?: boolean;
  resolution?: "480p" | "720p" | "1080p";
}

export interface SeedanceTaskResult {
  taskId: string;
  provider: "modelark";
  status: "completed";
  rawVideoPath: string;
  videoUrl?: string;
  lastFrameUrl?: string;
}

const DEFAULT_MODELARK_BASE_URL = "https://ark.ap-southeast.bytepluses.com/api/v3";
const CREATE_TASK_PATH = "/contents/generations/tasks";
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

type SeedanceTaskStatus =
  | "queued"
  | "running"
  | "cancelled"
  | "succeeded"
  | "failed"
  | "expired";

interface SeedanceRequestContentText {
  type: "text";
  text: string;
}

interface SeedanceRequestContentImage {
  type: "image_url";
  image_url: {
    url: string;
  };
  role?: "first_frame" | "last_frame" | "reference_image";
}

interface SeedanceRequestContentAudio {
  type: "audio_url";
  audio_url: {
    url: string;
  };
  role: "reference_audio";
}

type SeedanceRequestContent =
  | SeedanceRequestContentText
  | SeedanceRequestContentImage
  | SeedanceRequestContentAudio;

interface SeedanceCreateTaskRequestBody {
  model: string;
  content: SeedanceRequestContent[];
  duration: number;
  resolution: "480p" | "720p" | "1080p";
  ratio: SeedanceAspectRatio;
  generate_audio: boolean;
  return_last_frame: boolean;
  watermark?: boolean;
  camera_fixed?: boolean;
}

interface SeedanceTaskResponse {
  id: string;
  status?: SeedanceTaskStatus;
  error?: {
    code?: string;
    message?: string;
  } | null;
  content?: {
    video_url?: string;
    last_frame_url?: string;
  };
  duration?: number;
  ratio?: string;
  resolution?: string;
}

function getModelArkBaseUrl() {
  return (env.MODELARK_BASE_URL ?? DEFAULT_MODELARK_BASE_URL).replace(/\/$/, "");
}

function getRequiredSeedanceModelId() {
  const modelId = env.SEEDANCE_MODEL_ID ?? env.SEED_MODEL_ID;

  if (!modelId) {
    throw new Error("SEEDANCE_MODEL_ID is required when SEEDANCE_PROVIDER=modelark.");
  }

  return modelId;
}

function getRequiredModelArkApiKey() {
  if (!env.MODELARK_API_KEY) {
    throw new Error("MODELARK_API_KEY is required when SEEDANCE_PROVIDER=modelark.");
  }

  return env.MODELARK_API_KEY;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clampSeedanceDuration(durationSeconds: number) {
  return Math.min(15, Math.max(4, Math.round(durationSeconds)));
}

function buildSeedanceContent(input: SeedanceCreateTaskInput): SeedanceRequestContent[] {
  const prompt = input.prompt.trim();
  const content: SeedanceRequestContent[] = prompt
    ? [
        {
          type: "text",
          text: prompt,
        },
      ]
    : [];

  if (input.generationMode === "I2V") {
    if (input.firstFrameUrl) {
      content.push({
        type: "image_url",
        role: "first_frame",
        image_url: { url: input.firstFrameUrl },
      });
    }
    if (input.lastFrameUrl) {
      content.push({
        type: "image_url",
        role: "last_frame",
        image_url: { url: input.lastFrameUrl },
      });
    }
  } else if (input.generationMode === "R2V") {
    for (const imageUrl of input.referenceImageUrls ?? []) {
      content.push({
        type: "image_url",
        role: "reference_image",
        image_url: { url: imageUrl },
      });
    }
  }

  if (input.referenceAudioUrl) {
    content.push({
      type: "audio_url",
      role: "reference_audio",
      audio_url: { url: input.referenceAudioUrl },
    });
  }

  if (content.length === 0) {
    throw new Error("Seedance requires at least one text or image input.");
  }

  return content;
}

async function modelArkFetch<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getModelArkBaseUrl()}${pathname}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getRequiredModelArkApiKey()}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as T | { error?: { message?: string } }) : null;

  if (!response.ok) {
    const responseMessage =
      typeof data === "object" &&
      data &&
      "error" in data &&
      typeof data.error === "object" &&
      data.error &&
      "message" in data.error &&
      typeof data.error.message === "string"
        ? data.error.message
        : text || `ModelArk request failed with status ${response.status}.`;

    throw new Error(responseMessage);
  }

  return data as T;
}

async function createModelArkSeedanceTask(input: SeedanceCreateTaskInput) {
  const body: SeedanceCreateTaskRequestBody = {
    model: getRequiredSeedanceModelId(),
    content: buildSeedanceContent(input),
    duration: clampSeedanceDuration(input.durationSeconds),
    resolution: input.resolution ?? "720p",
    ratio: input.aspectRatio,
    generate_audio: input.generateAudio ?? false,
    return_last_frame: true,
    watermark: false,
    camera_fixed: input.cameraFixed,
  };

  return modelArkFetch<SeedanceTaskResponse>(CREATE_TASK_PATH, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function retrieveModelArkSeedanceTask(taskId: string) {
  return modelArkFetch<SeedanceTaskResponse>(
    `${CREATE_TASK_PATH}/${encodeURIComponent(taskId)}`,
    {
      method: "GET",
    },
  );
}

async function waitForModelArkSeedanceTask(taskId: string) {
  const start = Date.now();
  let lastStatus: SeedanceTaskStatus | undefined;

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const task = await retrieveModelArkSeedanceTask(taskId);
    if (task.status && task.status !== lastStatus) {
      lastStatus = task.status;
      console.log(`[seedance] task ${taskId} status -> ${task.status}`);
    }

    if (task.status === "succeeded") {
      return task;
    }

    if (task.status === "failed" || task.status === "expired" || task.status === "cancelled") {
      const reason = task.error?.message ?? `Seedance task ended with status ${task.status}.`;
      throw new Error(reason);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Seedance task polling timed out.");
}

async function downloadSeedanceVideo(videoUrl: string, rawVideoPath: string) {
  const response = await fetch(videoUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to download generated Seedance video: ${response.status}.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await mkdir(path.dirname(rawVideoPath), { recursive: true });
  await writeFile(rawVideoPath, Buffer.from(arrayBuffer));
}

export async function createSeedanceTask(
  input: SeedanceCreateTaskInput,
): Promise<SeedanceTaskResult> {
  if (env.SEEDANCE_PROVIDER !== "modelark") {
    throw new Error("SEEDANCE_PROVIDER must be set to modelark for real Seedance generation.");
  }

  const rawVideoPath = buildArtifactPath({
    projectId: input.projectId,
    variantId: input.variantId,
    nodeId: "seedance-segment-generator",
    fileName: `${input.segmentId}_raw.mp4`,
  });

  const createdTask = await createModelArkSeedanceTask(input);
  const taskId = createdTask.id;

  if (!taskId) {
    throw new Error("Seedance create task response did not include a task ID.");
  }

  console.log(
    `[seedance] created task ${taskId} for ${input.projectId}/${input.variantId}/${input.segmentId} (${input.generationMode}, ${input.aspectRatio}, ${clampSeedanceDuration(input.durationSeconds)}s)`,
  );

  const completedTask = await waitForModelArkSeedanceTask(taskId);
  const videoUrl = completedTask.content?.video_url;

  if (!videoUrl) {
    throw new Error("Seedance completed without returning a video URL.");
  }

  await downloadSeedanceVideo(videoUrl, rawVideoPath);
  console.log(
    `[seedance] downloaded task ${taskId} output to ${rawVideoPath}`,
  );

  const lastFrameUrl = completedTask.content?.last_frame_url;

  await writeTextArtifact(
    buildArtifactPath({
      projectId: input.projectId,
      variantId: input.variantId,
      nodeId: "seedance-segment-generator",
      fileName: `${input.segmentId}_seedance-task.json`,
    }),
    JSON.stringify(
      {
        provider: "modelark",
        taskId,
        requestedDurationSeconds: input.durationSeconds,
        submittedDurationSeconds: clampSeedanceDuration(input.durationSeconds),
        generationMode: input.generationMode,
        aspectRatio: input.aspectRatio,
        referenceImageUrls: input.referenceImageUrls,
        firstFrameUrl: input.firstFrameUrl,
        referenceAudioUrl: input.referenceAudioUrl,
        generateAudio: input.generateAudio ?? false,
        prompt: input.prompt,
        lastFrameUrl,
        response: completedTask,
      },
      null,
      2,
    ),
  );

  return {
    taskId,
    provider: "modelark",
    status: "completed",
    rawVideoPath,
    videoUrl,
    lastFrameUrl,
  };
}
