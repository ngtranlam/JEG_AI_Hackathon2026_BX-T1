export const supportedDurations = [15, 20, 30] as const;

export type SupportedDuration = (typeof supportedDurations)[number];

export type ProjectStatus =
  | "draft"
  | "queued"
  | "running"
  | "completed"
  | "failed";

export type WorkflowNodeStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export const workflowNodeIds = [
  "input-validator",
  "brief-analyzer",
  "brand-dna-extractor",
  "creative-direction-generator",
  "hook-generator-scorer",
  "script-writer",
  "storyboard-planner",
  "segment-planner",
  "seedance-prompt-builder",
  "seedance-segment-generator",
  "segment-normalizer",
  "video-stitching-agent",
  "voiceover-generator",
  "subtitle-burn-in-agent",
  "cover-caption-title-generator",
  "evaluation-agent",
  "editor-revision-router",
  "export-packager",
] as const;

export type WorkflowNodeId = (typeof workflowNodeIds)[number];

export const supportedAspectRatios = ["9:16", "1:1"] as const;

export type SupportedAspectRatio = (typeof supportedAspectRatios)[number];

export const supportedResolutions = ["720p", "1080p"] as const;

export type SupportedResolution = (typeof supportedResolutions)[number];

export const supportedPlatforms = ["TikTok", "Instagram Reels", "YouTube Shorts"] as const;

export type SupportedPlatform = (typeof supportedPlatforms)[number];

export interface Brief {
  brandName: string;
  productName: string;
  productDescription: string;
  audience: string;
  platforms: SupportedPlatform[];
  targetDuration: SupportedDuration;
  aspectRatio: SupportedAspectRatio;
  resolution: SupportedResolution;
  brandTone: string;
  mainMessage: string;
  complianceConstraints: string;
  callToAction?: string;
  enableVoice?: boolean;
  voiceGender?: "male" | "female";
  objective?: string;
  offer?: string;
  mandatoryClaims?: string[];
  prohibitedClaims?: string[];
  references?: string[];
}

export interface BrandAsset {
  type: "logo" | "product-image" | "moodboard" | "reference";
  fileName: string;
  filePath: string;
  mimeType?: string;
  publicUrl?: string;
}

export interface BrandKit {
  primaryColorHex?: string;
  secondaryColorHex?: string;
  fontFamily?: string;
  tagline?: string;
  visualNotes?: string[];
  forbiddenWords?: string[];
  assets: BrandAsset[];
  backgroundMusicPath?: string;
}

export interface BriefAnalysis {
  audienceInsight: string;
  valueProposition: string;
  problemStatement: string;
  platformFitRationale: string;
  campaignObjective: string;
  painPoints?: string[];
  desiredEmotion?: string[];
  mustInclude?: string[];
  mustAvoid?: string[];
  platformConventions?: string[];
  aspectRatioNotes?: string;
}

export interface BrandDna {
  voiceAttributes: string[];
  emotionalRange: string[];
  visualAnchors: string[];
  pacingGuidance: string;
  complianceGuardrails: string[];
  avoidWords?: string[];
  subtitleGuidance?: {
    font?: string;
    position?: string;
    maxWordsPerLine?: number;
  };
  logoGuidance?: {
    placement?: string;
    duration?: string;
  };
}

export interface CreativeDirection {
  angle: string;
  summary: string;
  differentiators: string[];
  hypothesis?: string;
  style?: string;
  targetEmotion?: string;
  ctaStrategy?: string;
}

export interface HookCandidate {
  text: string;
  score: number;
  rationale: string;
}

export interface ScriptBeat {
  startMs: number;
  endMs: number;
  narration: string;
  intent: string;
}

export type AudioType = "narration_voiceover" | "character_dialogue" | "no_voice";

export type VoiceProvider = "elevenlabs";

export interface AudioStrategy {
  audioType: AudioType;
  requiresLipSync: boolean;
  provider: VoiceProvider;
  language: string;
  voiceIdEnvKey: "ELEVENLABS_VOICE_ID";
  voiceStyle: string;
}

export interface StoryboardFrame {
  order: number;
  sceneId?: string;
  role?: string;
  startMs?: number;
  endMs?: number;
  shotType: string;
  subject: string;
  motion: string;
  composition?: string;
  notes: string;
  textOverlay?: string;
  voiceover?: string;
  productReferenceRequired?: boolean;
  audioType?: AudioType;
  requiresLipSync?: boolean;
  aspectRatio?: SupportedAspectRatio;
}

export interface SegmentPlan {
  id: string;
  order: number;
  durationSeconds: number;
  purpose: string;
  generationMode?: "T2V" | "I2V" | "R2V";
  needsProductReference?: boolean;
  referenceImageIds?: string[];
  aspectRatio?: SupportedAspectRatio;
  sourceScene?: string;
  seedanceTaskId?: string;
  rawVideoPath?: string;
  normalizedVideoPath?: string;
  lastFrameUrl?: string;
  status?: "pending" | "generating" | "completed" | "failed";
  promptSummary?: string;
  audioStrategy?: AudioStrategy;
  dialogueText?: string;
  dialogueAudioPath?: string;
  narrationText?: string;
  seedanceAudioReferencePath?: string;
}

export interface VariantScoreBreakdown {
  hookStrength: number;
  brandConsistency: number;
  platformFit: number;
  aspectRatioFit: number;
  subtitleReadability: number;
  visualQuality: number;
  compliance: number;
  publishableScore: number;
}

export interface VariantArtifact {
  kind: string;
  path: string;
  label: string;
}

export interface Variant {
  id: string;
  name: string;
  strategy: CreativeDirection;
  selectedHook?: HookCandidate;
  hookCandidates?: HookCandidate[];
  script?: ScriptBeat[];
  storyboard?: StoryboardFrame[];
  segmentPlan?: SegmentPlan[];
  artifacts: VariantArtifact[];
  generatedTitle?: string;
  generatedCaption?: string;
  generatedHashtags?: string[];
  score?: VariantScoreBreakdown;
  publishable?: boolean;
  evaluationSummary?: string;
  evaluationNotes?: string[];
  audioStrategySummary?: AudioStrategy;
}

export interface WorkflowNodeRun {
  nodeId: WorkflowNodeId;
  status: WorkflowNodeStatus;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  logs: string[];
  errorMessage?: string;
  artifactPaths: string[];
}

export interface ExportAsset {
  type: string;
  label: string;
  path: string;
}

export interface RevisionAction {
  target: string;
  action: string;
  sceneId?: string;
  segmentId?: string;
}

export interface ProjectState {
  projectId: string;
  status: ProjectStatus;
  brief: Brief;
  brandKit: BrandKit;
  analysis?: BriefAnalysis;
  brandDna?: BrandDna;
  revisionPlan?: RevisionAction[];
  variants: Variant[];
  workflowStatus: Record<WorkflowNodeId, WorkflowNodeRun>;
  exports: ExportAsset[];
  createdAt: string;
  updatedAt: string;
}
