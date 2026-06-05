import { appendNodeLog } from "@/lib/server/state/project-state";
import type { ProjectState, ScriptBeat, SegmentPlan } from "@/lib/types/project";

import type { WorkflowNode } from "@/lib/server/workflow/nodes/types";

const MAX_SEGMENT_DURATION_SECONDS = 8;

function chunkScriptBeats(script: ScriptBeat[]) {
  const groups: ScriptBeat[][] = [];
  let currentGroup: ScriptBeat[] = [];
  let currentDurationMs = 0;

  for (const beat of script) {
    const beatDurationMs = beat.endMs - beat.startMs;

    if (
      currentGroup.length > 0 &&
      currentDurationMs + beatDurationMs > MAX_SEGMENT_DURATION_SECONDS * 1000
    ) {
      groups.push(currentGroup);
      currentGroup = [];
      currentDurationMs = 0;
    }

    currentGroup.push(beat);
    currentDurationMs += beatDurationMs;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

function summarizePurpose(beats: ScriptBeat[]) {
  const intents = new Set(beats.map((beat) => beat.intent));

  if (intents.has("hook")) return "hook";
  if (intents.has("cta")) return "cta";
  return "body";
}

function buildSegmentPlan(variantId: string, script: ScriptBeat[]) {
  const groups = chunkScriptBeats(script);

  return groups.map((beats, index) => {
    const firstBeat = beats[0];
    const lastBeat = beats[beats.length - 1];
    const durationSeconds = Number(
      (((lastBeat?.endMs ?? 0) - (firstBeat?.startMs ?? 0)) / 1000).toFixed(1),
    );

    return {
      id: `${variantId}_SEG_${String(index + 1).padStart(2, "0")}`,
      order: index + 1,
      durationSeconds,
      purpose: summarizePurpose(beats),
      generationMode: beats.some((beat) => beat.intent === "cta") ? "I2V" : "T2V",
      needsProductReference: beats.some((beat) => beat.intent === "cta"),
      sourceScene: `${variantId}_S${String(index + 1).padStart(2, "0")}`,
      status: "pending",
      promptSummary: beats.map((beat) => beat.narration).join(" "),
    } satisfies SegmentPlan;
  });
}

export const segmentPlannerNode: WorkflowNode = {
  id: "segment-planner",
  async run(projectState: ProjectState) {
    const nextVariants = projectState.variants.map((variant) => ({
      ...variant,
      segmentPlan: buildSegmentPlan(variant.id, variant.script ?? []),
    }));

    const nextState: ProjectState = {
      ...projectState,
      variants: nextVariants,
    };

    return appendNodeLog(
      nextState,
      "segment-planner",
      "Split script beats into Seedance-safe segments with duration and purpose metadata.",
    );
  },
};
