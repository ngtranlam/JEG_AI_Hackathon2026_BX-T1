import type { AudioStrategy, AudioType, ScriptBeat } from "@/lib/types/project";

function buildDefaultVoiceStyle(toneOfVoice: string) {
  return toneOfVoice || "clear, brand-safe, natural";
}

export function pickDefaultAudioType(input: {
  beat?: ScriptBeat;
  purpose?: string;
  shotType?: string;
}): AudioType {
  const text = [
    input.beat?.intent ?? "",
    input.purpose ?? "",
    input.shotType ?? "",
    input.beat?.narration ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (
    text.includes("testimonial") ||
    text.includes("talking head") ||
    text.includes("speaking to camera") ||
    text.includes("direct to camera")
  ) {
    return "character_dialogue";
  }

  if (text.includes("cta") || text.includes("end card")) {
    return "no_voice";
  }

  return "narration_voiceover";
}

export function buildAudioStrategy(input: {
  toneOfVoice: string;
  audioType: AudioType;
  language?: string;
}): AudioStrategy {
  return {
    audioType: input.audioType,
    requiresLipSync: input.audioType === "character_dialogue",
    provider: "elevenlabs",
    language: input.language ?? "vi-VN",
    voiceIdEnvKey: "ELEVENLABS_VOICE_ID",
    voiceStyle: buildDefaultVoiceStyle(input.toneOfVoice),
  };
}
