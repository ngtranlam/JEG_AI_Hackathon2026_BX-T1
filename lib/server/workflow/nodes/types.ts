import type { ProjectState, WorkflowNodeId } from "@/lib/types/project";

export interface WorkflowNode {
  id: WorkflowNodeId;
  run(projectState: ProjectState): Promise<ProjectState>;
}
