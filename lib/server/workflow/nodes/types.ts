import type { ProjectState, WorkflowNodeId } from "@/lib/types/project";

export interface WorkflowNodeContext {
  onStateChange?: (projectState: ProjectState) => Promise<void> | void;
}

export interface WorkflowNode {
  id: WorkflowNodeId;
  run(projectState: ProjectState, context?: WorkflowNodeContext): Promise<ProjectState>;
}
