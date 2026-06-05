import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, StoryboardFrame } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function buildStoryboard(projectState: ProjectState, variantId: string) {
  const product = projectState.brief.productName;
  const tone = projectState.brief.toneOfVoice;

  const frames: StoryboardFrame[] = [];
  const beats = projectState.variants.find((variant) => variant.id === variantId)?.script ?? [];

  beats.forEach((beat, index) => {
    frames.push({
      order: index + 1,
      shotType: index === 0 ? "tight close-up" : "medium shot",
      subject: index === 0 ? "human face reaction" : product,
      motion: index === 0 ? "quick snap zoom" : "smooth handheld move",
      notes: `Tone: ${tone}. Beat intent: ${beat.intent}. Keep subtitles safe area.`,
    });
  });

  return frames;
}

export const storyboardPlannerNode: WorkflowNode = {
  id: "storyboard-planner",
  async run(projectState) {
    const nextVariants = projectState.variants.map((variant) => ({
      ...variant,
      storyboard: buildStoryboard(projectState, variant.id),
    }));

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "storyboard-planner",
      "Generated a minimal storyboard plan aligned to the script beats.",
    );
  },
};

