import { Queue, Worker, type ConnectionOptions, type Processor } from "bullmq";

import { env } from "@/lib/config/env";

export const PROJECT_GENERATION_QUEUE_NAME = "project-generation";
export const PROJECT_GENERATION_JOB_NAME = "run-project-generation";

export interface ProjectGenerationJobData {
  projectId: string;
}

let projectGenerationQueue: Queue<ProjectGenerationJobData> | undefined;

function createRedisConnection(): ConnectionOptions {
  const redisUrl = new URL(env.REDIS_URL);
  const databaseIndex = redisUrl.pathname.replace("/", "");

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || "6379"),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: databaseIndex ? Number(databaseIndex) : 0,
    maxRetriesPerRequest: null,
  };
}

export function getProjectGenerationQueue() {
  if (!projectGenerationQueue) {
    projectGenerationQueue = new Queue<ProjectGenerationJobData>(
      PROJECT_GENERATION_QUEUE_NAME,
      {
        connection: createRedisConnection(),
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      },
    );
  }

  return projectGenerationQueue;
}

export async function enqueueProjectGeneration(input: ProjectGenerationJobData) {
  const queue = getProjectGenerationQueue();

  return queue.add(PROJECT_GENERATION_JOB_NAME, input, {
    jobId: `${input.projectId}-${Date.now()}`,
  });
}

export function createProjectGenerationWorker(
  processor: Processor<ProjectGenerationJobData>,
) {
  return new Worker<ProjectGenerationJobData>(
    PROJECT_GENERATION_QUEUE_NAME,
    processor,
    {
      connection: createRedisConnection(),
      concurrency: 1,
    },
  );
}
