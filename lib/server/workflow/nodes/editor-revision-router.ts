import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, RevisionAction } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function buildSafeDefaultRevisionPlan(projectState: ProjectState): RevisionAction[] {
  const firstVariant = projectState.variants[0];
  const firstSegment = firstVariant?.segmentPlan?.[0];

  return [
    {
      target: "hook",
      action: "rewrite_hook",
      sceneId: `${firstVariant?.id ?? "A"}_S01`,
    },
    {
      target: "segment_video",
      action: "regenerate",
      segmentId: firstSegment?.id,
    },
    {
      target: "subtitle",
      action: "increase_font_size",
    },
  ].filter((action) => action.segmentId !== undefined || action.target !== "segment_video");
}

export const editorRevisionRouterNode: WorkflowNode = {
  id: "editor-revision-router",
  async run(projectState: ProjectState) {
    const revisionPlan = buildSafeDefaultRevisionPlan(projectState);

    const nextState: ProjectState = {
      ...projectState,
      revisionPlan,
    };

    return appendNodeLog(
      nextState,
      "editor-revision-router",
      "Created a safe default revision plan for stronger hook, faster opening, and larger subtitles.",
    );
  },
};
