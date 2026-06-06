import { env } from "@/lib/config/env";
import { createProjectGenerationWorker } from "@/lib/server/queue/project-generation";
import {
  getProjectRecord,
  updateProjectState,
} from "@/lib/server/repositories/project-repository";
import { runProjectWorkflow } from "@/lib/server/workflow/runner";
import type { WorkflowNodeId } from "@/lib/types/project";

async function processProjectGeneration(projectId: string, startFromNode?: string) {
  const projectRecord = await getProjectRecord(projectId);

  if (!projectRecord?.projectState) {
    throw new Error(`Project ${projectId} was not found in storage.`);
  }

  await runProjectWorkflow(projectRecord.projectState, {
    startFromNode: startFromNode as WorkflowNodeId | undefined,
    onStateChange: async (nextState) => {
      await updateProjectState(projectId, nextState);
    },
  });
}

const worker = createProjectGenerationWorker(async (job) => {
  await processProjectGeneration(job.data.projectId, job.data.startFromNode);
});

worker.on("ready", () => {
  console.log(
    `Project generation worker is listening on ${env.REDIS_URL}.`,
  );
});

worker.on("completed", (job) => {
  console.log(`Completed project generation job ${job.id}.`);
});

worker.on("failed", (job, error) => {
  const jobId = job?.id ?? "unknown";
  console.error(`Project generation job ${jobId} failed:`, error);
});
