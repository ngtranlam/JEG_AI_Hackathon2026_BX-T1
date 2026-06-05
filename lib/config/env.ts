import { z } from "zod";

const envSchema = z.object({
  MODELARK_API_KEY: z.string().min(1).optional(),
  MODELARK_BASE_URL: z.string().url().optional(),
  SEED_MODEL_ID: z.string().min(1).optional(),
  SEEDANCE_MODEL_ID: z.string().min(1).optional(),
  ELEVENLABS_API_KEY: z.string().min(1).optional(),
  ELEVENLABS_VOICE_ID: z.string().min(1).optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  DATABASE_URL: z.string().default("file:./prisma/dev.db"),
  STORAGE_DRIVER: z.enum(["local"]).default("local"),
  LOCAL_OUTPUT_DIR: z.string().default("./outputs/generated"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
});

export const env = envSchema.parse({
  MODELARK_API_KEY: process.env.MODELARK_API_KEY,
  MODELARK_BASE_URL: process.env.MODELARK_BASE_URL,
  SEED_MODEL_ID: process.env.SEED_MODEL_ID,
  SEEDANCE_MODEL_ID: process.env.SEEDANCE_MODEL_ID,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID,
  REDIS_URL: process.env.REDIS_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER,
  LOCAL_OUTPUT_DIR: process.env.LOCAL_OUTPUT_DIR,
  APP_BASE_URL: process.env.APP_BASE_URL,
});
