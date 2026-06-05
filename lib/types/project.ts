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

export interface Brief {
  brandName: string;
  productName: string;
  audience: string;
  objective: string;
  offer?: string;
  primaryCallToAction: string;
  toneOfVoice: string;
  platform: "tiktok" | "instagram-reels" | "youtube-shorts";
  durationSeconds: SupportedDuration;
  complianceNotes: string[];
  mandatoryClaims?: string[];
  prohibitedClaims?: string[];
  references?: string[];
}

export interface BrandAsset {
  type: "logo" | "product-image" | "moodboard" | "reference";
  fileName: string;
  filePath: string;
  mimeType?: string;
}

export interface BrandKit {
  primaryColorHex?: string;
  secondaryColorHex?: string;
  fontFamily?: string;
  tagline?: string;
  visualNotes?: string[];
  forbiddenWords?: string[];
  assets: BrandAsset[];
}

export interface BriefAnalysis {
  audienceInsight: string;
  valueProposition: string;
  problemStatement: string;
  platformFitRationale: string;
  campaignObjective: string;
}

export interface BrandDna {
  voiceAttributes: string[];
  emotionalRange: string[];
  visualAnchors: string[];
  pacingGuidance: string;
  complianceGuardrails: string[];
}

export interface CreativeDirection {
  angle: string;
  summary: string;
  differentiators: string[];
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

export interface StoryboardFrame {
  order: number;
  shotType: string;
  subject: string;
  motion: string;
  notes: string;
}

export interface SegmentPlan {
  id: string;
  order: number;
  durationSeconds: number;
  purpose: string;
  promptSummary?: string;
}

export interface VariantScoreBreakdown {
  hookStrength: number;
  brandConsistency: number;
  platformFit: number;
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
  score?: VariantScoreBreakdown;
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

export interface ProjectState {
  projectId: string;
  status: ProjectStatus;
  brief: Brief;
  brandKit: BrandKit;
  analysis?: BriefAnalysis;
  brandDna?: BrandDna;
  variants: Variant[];
  workflowStatus: Record<WorkflowNodeId, WorkflowNodeRun>;
  exports: ExportAsset[];
  createdAt: string;
  updatedAt: string;
}
