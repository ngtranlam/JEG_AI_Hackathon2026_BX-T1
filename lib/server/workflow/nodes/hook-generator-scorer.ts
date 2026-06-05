import { appendNodeLog } from "@/lib/server/state/project-state";
import type { HookCandidate, ProjectState, Variant } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

function scoreHook(input: { hook: string; productName: string; cta: string }) {
  const hookLower = input.hook.toLowerCase();
  const productLower = input.productName.toLowerCase();
  const ctaLower = input.cta.toLowerCase();

  const hasProduct = hookLower.includes(productLower.split(" ")[0] ?? productLower);
  const hasCtaWord = ctaLower
    .split(" ")
    .filter(Boolean)
    .some((word) => hookLower.includes(word));

  const lengthScore = Math.max(0, 1 - Math.abs(input.hook.length - 72) / 72);
  const punctuationScore = /[?!]/.test(input.hook) ? 1 : 0.6;

  const score =
    (hasProduct ? 0.35 : 0.15) +
    (hasCtaWord ? 0.15 : 0.05) +
    lengthScore * 0.3 +
    punctuationScore * 0.2;

  return Math.round(score * 100);
}

function rankHooks(hooks: string[], productName: string, cta: string): HookCandidate[] {
  return hooks
    .map((hook) => {
      const score = scoreHook({ hook, productName, cta });
      return {
        text: hook,
        score,
        rationale: hasKeywordRationale(hook, productName, cta),
      } satisfies HookCandidate;
    })
    .sort((a, b) => b.score - a.score);
}

function hasKeywordRationale(hook: string, productName: string, cta: string) {
  const lower = hook.toLowerCase();
  const product = productName.toLowerCase().split(" ")[0] ?? productName.toLowerCase();
  const includesProduct = product ? lower.includes(product) : false;
  const includesCta = cta
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .some((word) => lower.includes(word));

  const parts = [
    includesProduct ? "mentions product" : "does not mention product",
    includesCta ? "contains CTA keyword" : "no CTA keyword",
  ];

  return parts.join(", ");
}

function buildHooksForVariant(variant: Variant, projectState: ProjectState) {
  const product = projectState.brief.productName;
  const audience = projectState.brief.audience;
  const cta = projectState.brief.primaryCallToAction;

  if (variant.id === "A") {
    return [
      `Ever felt like ${audience} life moves too fast to take care of yourself?`,
      `This is the moment ${audience} finally stops settling for “good enough”.`,
      `${product} is what I wish I had when I was exhausted and overwhelmed.`,
      `You have 15 seconds—here’s the simplest upgrade for your day.`,
    ];
  }

  return [
    `${product} in action—here’s why it works in under 10 seconds.`,
    `Stop scrolling. Watch what happens when you use ${product}.`,
    `One product, one routine, one clear result. ${cta}.`,
    `If you want results without the chaos, this is the demo to watch.`,
  ];
}

export const hookGeneratorScorerNode: WorkflowNode = {
  id: "hook-generator-scorer",
  async run(projectState) {
    const product = projectState.brief.productName;
    const cta = projectState.brief.primaryCallToAction;

    const nextVariants = projectState.variants.map((variant) => {
      const hooks = buildHooksForVariant(variant, projectState);
      const ranked = rankHooks(hooks, product, cta);

      return {
        ...variant,
        hookCandidates: ranked,
        selectedHook: ranked[0],
      };
    });

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "hook-generator-scorer",
      "Generated multiple hooks per variant and selected the best-scoring option.",
    );
  },
};

