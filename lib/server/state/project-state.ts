import {
  type BrandKit,
  type Brief,
  type ProjectStatus,
  type ProjectState,
  type WorkflowNodeId,
  type WorkflowNodeRun,
  workflowNodeIds,
} from "@/lib/types/project";

export const WORKFLOW_NODE_SEQUENCE = [...workflowNodeIds];

function createNodeRun(nodeId: WorkflowNodeId): WorkflowNodeRun {
  return {
    nodeId,
    status: "pending",
    attempts: 0,
    logs: [],
    artifactPaths: [],
  };
}

export function createEmptyWorkflowStatus(): Record<
  WorkflowNodeId,
  WorkflowNodeRun
> {
  return Object.fromEntries(
    WORKFLOW_NODE_SEQUENCE.map((nodeId) => [nodeId, createNodeRun(nodeId)]),
  ) as Record<WorkflowNodeId, WorkflowNodeRun>;
}

export function createProjectState(input: {
  projectId: string;
  brief: Brief;
  brandKit: BrandKit;
}): ProjectState {
  const timestamp = new Date().toISOString();

  return {
    projectId: input.projectId,
    status: "draft",
    brief: input.brief,
    brandKit: input.brandKit,
    variants: [],
    workflowStatus: createEmptyWorkflowStatus(),
    exports: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function withUpdatedTimestamp(projectState: ProjectState): ProjectState {
  return {
    ...projectState,
    updatedAt: new Date().toISOString(),
  };
}

export function setProjectStatus(
  projectState: ProjectState,
  status: ProjectStatus,
): ProjectState {
  return withUpdatedTimestamp({
    ...projectState,
    status,
  });
}

export function patchNodeRun(
  projectState: ProjectState,
  nodeId: WorkflowNodeId,
  patch: Partial<WorkflowNodeRun>,
): ProjectState {
  return withUpdatedTimestamp({
    ...projectState,
    workflowStatus: {
      ...projectState.workflowStatus,
      [nodeId]: {
        ...projectState.workflowStatus[nodeId],
        ...patch,
      },
    },
  });
}

export function appendNodeLog(
  projectState: ProjectState,
  nodeId: WorkflowNodeId,
  message: string,
): ProjectState {
  const nodeRun = projectState.workflowStatus[nodeId];

  return patchNodeRun(projectState, nodeId, {
    logs: [...nodeRun.logs, message],
  });
}

export function markNodeRunning(
  projectState: ProjectState,
  nodeId: WorkflowNodeId,
): ProjectState {
  const nodeRun = projectState.workflowStatus[nodeId];

  return patchNodeRun(projectState, nodeId, {
    status: "running",
    startedAt: nodeRun.startedAt ?? new Date().toISOString(),
    attempts: nodeRun.attempts + 1,
    errorMessage: undefined,
  });
}

export function markNodeCompleted(
  projectState: ProjectState,
  nodeId: WorkflowNodeId,
): ProjectState {
  return patchNodeRun(projectState, nodeId, {
    status: "completed",
    completedAt: new Date().toISOString(),
    errorMessage: undefined,
  });
}

export function markNodeFailed(
  projectState: ProjectState,
  nodeId: WorkflowNodeId,
  errorMessage: string,
): ProjectState {
  return patchNodeRun(projectState, nodeId, {
    status: "failed",
    completedAt: new Date().toISOString(),
    errorMessage,
  });
}

export function markNodeSkipped(
  projectState: ProjectState,
  nodeId: WorkflowNodeId,
  reason: string,
): ProjectState {
  const nodeRun = projectState.workflowStatus[nodeId];

  return patchNodeRun(projectState, nodeId, {
    status: "skipped",
    completedAt: new Date().toISOString(),
    logs: [...nodeRun.logs, reason],
  });
}
