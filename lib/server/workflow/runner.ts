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
import { coverCaptionTitleGeneratorNode } from "@/lib/server/workflow/nodes/cover-caption-title-generator";
import { editorRevisionRouterNode } from "@/lib/server/workflow/nodes/editor-revision-router";
import { creativeDirectionGeneratorNode } from "@/lib/server/workflow/nodes/creative-direction-generator";
import { evaluationAgentNode } from "@/lib/server/workflow/nodes/evaluation-agent";
import { exportPackagerNode } from "@/lib/server/workflow/nodes/export-packager";
import { hookGeneratorScorerNode } from "@/lib/server/workflow/nodes/hook-generator-scorer";
import { inputValidatorNode } from "@/lib/server/workflow/nodes/input-validator";
import { seedancePromptBuilderNode } from "@/lib/server/workflow/nodes/seedance-prompt-builder";
import { seedanceSegmentGeneratorNode } from "@/lib/server/workflow/nodes/seedance-segment-generator";
import { segmentPlannerNode } from "@/lib/server/workflow/nodes/segment-planner";
import { segmentNormalizerNode } from "@/lib/server/workflow/nodes/segment-normalizer";
import { scriptWriterNode } from "@/lib/server/workflow/nodes/script-writer";
import { storyboardPlannerNode } from "@/lib/server/workflow/nodes/storyboard-planner";
import { subtitleBurnInAgentNode } from "@/lib/server/workflow/nodes/subtitle-burn-in-agent";
import { videoStitchingAgentNode } from "@/lib/server/workflow/nodes/video-stitching-agent";
import { voiceoverGeneratorNode } from "@/lib/server/workflow/nodes/voiceover-generator";

import type { WorkflowNode, WorkflowNodeContext } from "@/lib/server/workflow/nodes/types";

type WorkflowStateListener = (projectState: ProjectState) => Promise<void> | void;

const ACTIVE_WORKFLOW_NODES: WorkflowNode[] = [
  inputValidatorNode,
  briefAnalyzerNode,
  brandDnaExtractorNode,
  creativeDirectionGeneratorNode,
  hookGeneratorScorerNode,
  scriptWriterNode,
  storyboardPlannerNode,
  segmentPlannerNode,
  seedancePromptBuilderNode,
  seedanceSegmentGeneratorNode,
  segmentNormalizerNode,
  videoStitchingAgentNode,
  voiceoverGeneratorNode,
  subtitleBurnInAgentNode,
  coverCaptionTitleGeneratorNode,
  evaluationAgentNode,
  editorRevisionRouterNode,
  exportPackagerNode,
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

export async function runProjectWorkflow(
  projectState: ProjectState,
  options?: {
    onStateChange?: WorkflowStateListener;
  },
) {
  const notifyStateChange = async (state: ProjectState) => {
    await options?.onStateChange?.(state);
    return state;
  };

  let nextState = setProjectStatus(projectState, "running");
  await notifyStateChange(nextState);

  for (const node of ACTIVE_WORKFLOW_NODES) {
    const workflowNodeContext: WorkflowNodeContext = {
      onStateChange: async (state) => {
        nextState = state;
        await notifyStateChange(state);
      },
    };

    nextState = markNodeRunning(nextState, node.id);
    await notifyStateChange(nextState);

    try {
      nextState = await node.run(nextState, workflowNodeContext);
      nextState = markNodeCompleted(nextState, node.id);
      await notifyStateChange(nextState);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown workflow node failure.";

      nextState = appendNodeLog(nextState, node.id, message);
      nextState = markNodeFailed(nextState, node.id, message);
      nextState = setProjectStatus(nextState, "failed");
      await notifyStateChange(nextState);

      return nextState;
    }
  }

  nextState = skipUnimplementedNodes(nextState);
  nextState = setProjectStatus(nextState, "completed");
  await notifyStateChange(nextState);

  return nextState;
}
