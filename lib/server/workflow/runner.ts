import {
  WORKFLOW_NODE_SEQUENCE,
  appendNodeLog,
  markNodeCompleted,
  markNodeFailed,
  markNodeRunning,
  markNodeSkipped,
  setProjectStatus,
} from "@/lib/server/state/project-state";
import { type ProjectState, type WorkflowNodeId } from "@/lib/types/project";
import { briefAnalyzerNode } from "@/lib/server/workflow/nodes/brief-analyzer";
import { brandDnaExtractorNode } from "@/lib/server/workflow/nodes/brand-dna-extractor";
import { inputValidatorNode } from "@/lib/server/workflow/nodes/input-validator";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const ACTIVE_WORKFLOW_NODES: WorkflowNode[] = [
  inputValidatorNode,
  briefAnalyzerNode,
  brandDnaExtractorNode,
];

const ACTIVE_NODE_IDS = new Set<WorkflowNodeId>(
  ACTIVE_WORKFLOW_NODES.map((node) => node.id),
);

function skipUnimplementedNodes(projectState: ProjectState) {
  return WORKFLOW_NODE_SEQUENCE.reduce((currentState, nodeId) => {
    if (
      ACTIVE_NODE_IDS.has(nodeId) ||
      currentState.workflowStatus[nodeId].status !== "pending"
    ) {
      return currentState;
    }

    return markNodeSkipped(
      currentState,
      nodeId,
      "Skipped in the current backend skeleton because the node is not implemented yet.",
    );
  }, projectState);
}

export async function runProjectWorkflow(projectState: ProjectState) {
  let nextState = setProjectStatus(projectState, "running");

  for (const node of ACTIVE_WORKFLOW_NODES) {
    nextState = markNodeRunning(nextState, node.id);

    try {
      nextState = await node.run(nextState);
      nextState = markNodeCompleted(nextState, node.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown workflow node failure.";

      nextState = appendNodeLog(nextState, node.id, message);
      nextState = markNodeFailed(nextState, node.id, message);

      return setProjectStatus(nextState, "failed");
    }
  }

  nextState = skipUnimplementedNodes(nextState);

  return setProjectStatus(nextState, "completed");
}
