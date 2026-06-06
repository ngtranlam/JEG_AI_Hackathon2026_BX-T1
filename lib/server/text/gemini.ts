import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { env } from "@/lib/config/env";

let geminiClient: GoogleGenAI | undefined;

export type GenerateStructuredJsonWithGeminiInput<T> = {
  systemPrompt?: string;
  userPrompt: string;
  validator: z.ZodType<T>;
  responseJsonSchema?: unknown;
  model?: string;
  temperature?: number;
  maxAttempts?: number;
};

export type GenerateStructuredJsonWithGeminiOutput<T> = {
  text: string;
  json: T;
  raw: unknown;
  model: string;
};

function stripMarkdownCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function buildPrompt(input: {
  systemPrompt?: string;
  userPrompt: string;
  attempt: number;
}) {
  const repairPrompt =
    input.attempt > 1
      ? "\n\nYour previous response was invalid. Return valid JSON only. Do not include markdown, explanations, or code fences."
      : "";

  return [
    input.systemPrompt?.trim() ? `System instructions:\n${input.systemPrompt.trim()}` : undefined,
    `User request:\n${input.userPrompt.trim()}${repairPrompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function getConfiguredGeminiTextModel() {
  return env.GEMINI_TEXT_MODEL;
}

export function getConfiguredGeminiAdvancedModel() {
  return env.GEMINI_ADVANCED_MODEL;
}

export function hasGeminiRuntimeConfig() {
  return Boolean(
    env.TEXT_MODEL_PROVIDER === "gemini" &&
      env.GOOGLE_CLOUD_PROJECT &&
      env.GOOGLE_CLOUD_LOCATION,
  );
}

function getGeminiClient() {
  if (!hasGeminiRuntimeConfig()) {
    throw new Error(
      "Gemini Vertex runtime config is incomplete. Set TEXT_MODEL_PROVIDER=gemini, GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, and GOOGLE_APPLICATION_CREDENTIALS/ADC.",
    );
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      vertexai: true,
      project: env.GOOGLE_CLOUD_PROJECT,
      location: env.GOOGLE_CLOUD_LOCATION,
    });
  }

  return geminiClient;
}

export async function generateStructuredJsonWithGemini<T>(
  input: GenerateStructuredJsonWithGeminiInput<T>,
): Promise<GenerateStructuredJsonWithGeminiOutput<T>> {
  const client = getGeminiClient();
  const model = input.model ?? getConfiguredGeminiTextModel();
  const maxAttempts = input.maxAttempts ?? 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: buildPrompt({
          systemPrompt: input.systemPrompt,
          userPrompt: input.userPrompt,
          attempt,
        }),
        config: {
          temperature: input.temperature ?? 0.2,
          responseMimeType: "application/json",
          responseJsonSchema: input.responseJsonSchema,
        },
      });

      const text = stripMarkdownCodeFence(response.text ?? "");

      if (!text) {
        throw new Error("Gemini returned an empty response.");
      }

      const parsed = JSON.parse(text) as unknown;
      const validated = input.validator.parse(parsed);

      return {
        text,
        json: validated,
        raw: response,
        model,
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Gemini structured generation failed for an unknown reason.");
    }
  }

  throw new Error(`Gemini structured generation failed after ${maxAttempts} attempts: ${lastError?.message}`);
}
