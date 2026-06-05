import { appendNodeLog } from "@/lib/server/state/project-state";
import type { CreativeDirection, ProjectState, Variant } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function buildVariant(input: {
  id: "A" | "B";
  name: string;
  strategy: CreativeDirection;
}): Variant {
  return {
    id: input.id,
    name: input.name,
    strategy: input.strategy,
    artifacts: [],
  };
}

export const creativeDirectionGeneratorNode: WorkflowNode = {
  id: "creative-direction-generator",
  async run(projectState: ProjectState) {
    const product = projectState.brief.productName;
    const audience = projectState.brief.audience;
    const tone = projectState.brief.toneOfVoice;
    const objective = projectState.brief.objective;

    const variantA = buildVariant({
      id: "A",
      name: "Emotional Storytelling",
      strategy: {
        angle: "Emotional Storytelling",
        summary: `Show an emotionally resonant moment for ${audience}, then position ${product} as the relief. Keep tone ${tone}.`,
        differentiators: [
          "Emotion-led hook",
          "Relatable problem moment",
          "Soft CTA that escalates at the end",
        ],
      },
    });

    const variantB = buildVariant({
      id: "B",
      name: "Product-led Demo",
      strategy: {
        angle: "Product-led Demo",
        summary: `Start with a fast product demo of ${product} and a clear payoff. Keep tone ${tone} and optimize for ${objective}.`,
        differentiators: [
          "Demo-led hook",
          "Feature-to-benefit structure",
          "Direct CTA early and late",
        ],
      },
    });

    const nextState: ProjectState = {
      ...projectState,
      variants: [variantA, variantB],
    };

    return appendNodeLog(
      nextState,
      "creative-direction-generator",
      "Generated two meaningfully different creative directions (A: emotional storytelling, B: product-led demo).",
    );
  },
};
