import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, ScriptBeat, Variant } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function buildBeats(input: {
  durationSeconds: number;
  hook: string;
  productName: string;
  offer?: string;
  cta: string;
  variantId: Variant["id"];
}) {
  const beatCount = input.durationSeconds <= 15 ? 4 : input.durationSeconds <= 20 ? 5 : 6;
  const totalMs = input.durationSeconds * 1000;
  const beatMs = Math.floor(totalMs / beatCount);

  const templates =
    input.variantId === "A"
      ? [
          (hookText: string) => hookText,
          () => `You know that moment when everything piles up and you still need a win?`,
          () => `That’s where ${input.productName} fits—simple, steady, and made for real life.`,
          () => `It’s not about perfection. It’s about feeling in control again.`,
          () => (input.offer ? `Bonus: ${input.offer}.` : `Make it easy on yourself today.`),
          () => `${input.cta}.`,
        ]
      : [
          (hookText: string) => hookText,
          () => `Step 1: set it up. Step 2: let it do the work. Step 3: enjoy the payoff.`,
          () => `Here’s the part people miss—consistency beats complicated.`,
          () => `If you want the fastest path to clarity, this is it.`,
          () => (input.offer ? `Right now: ${input.offer}.` : `No fluff. Just results.`),
          () => `${input.cta}.`,
        ];

  const beats: ScriptBeat[] = [];
  for (let index = 0; index < beatCount; index += 1) {
    const startMs = index * beatMs;
    const endMs = index === beatCount - 1 ? totalMs : (index + 1) * beatMs;
    const narration = templates[index]?.(input.hook) ?? `${input.cta}.`;

    beats.push({
      startMs,
      endMs,
      narration,
      intent: index === 0 ? "hook" : index === beatCount - 1 ? "cta" : "body",
    });
  }

  return beats;
}

export const scriptWriterNode: WorkflowNode = {
  id: "script-writer",
  async run(projectState) {
    const nextVariants = projectState.variants.map((variant) => {
      const hook = variant.selectedHook?.text ?? `Discover ${projectState.brief.productName}.`;

      return {
        ...variant,
        script: buildBeats({
          durationSeconds: projectState.brief.durationSeconds,
          hook,
          productName: projectState.brief.productName,
          offer: projectState.brief.offer,
          cta: projectState.brief.primaryCallToAction,
          variantId: variant.id,
        }),
      };
    });

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "script-writer",
      "Generated timed script beats aligned to the selected duration for both variants.",
    );
  },
};

