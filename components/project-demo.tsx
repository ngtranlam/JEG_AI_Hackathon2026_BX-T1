"use client";

import Image from "next/image";
import * as React from "react";

import type {
  BrandAsset,
  BrandKit,
  Brief,
  ProjectState,
  WorkflowNodeId,
} from "@/lib/types/project";
import { workflowNodeIds } from "@/lib/types/project";

type CreateProjectPayload = {
  projectId?: string;
  brief: Brief;
  brandKit: BrandKit;
};

type UploadImageResponse = {
  asset: BrandAsset;
};

type AssetSlot = {
  type: BrandAsset["type"];
  title: string;
  hint: string;
};

const EMPTY_PAYLOAD: CreateProjectPayload = {
  brief: {
    brandName: "",
    productName: "",
    productDescription: "",
    audience: "",
    platforms: [],
    targetDuration: 15,
    aspectRatio: "9:16",
    resolution: "720p",
    brandTone: "",
    mainMessage: "",
    complianceConstraints: "",
    callToAction: "",
    enableVoice: true,
    voiceGender: "female" as const,
  },
  brandKit: {
    assets: [],
  },
};

const assetSlots: AssetSlot[] = [
  { type: "logo", title: "Logo", hint: "PNG, JPG or WEBP" },
  { type: "product-image", title: "Product image", hint: "Main product visual" },
  { type: "moodboard", title: "Moodboard", hint: "Style or composition reference" },
  { type: "reference", title: "Reference", hint: "Extra image reference" },
];

function formatTimestamp(value?: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString();
  } catch {
    return value;
  }
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function toTimestampMs(value?: string) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatElapsedTime(startedAt?: string, completedAt?: string) {
  const startedMs = toTimestampMs(startedAt);
  if (!startedMs) {
    return "-";
  }

  const endedMs = toTimestampMs(completedAt) ?? Date.now();
  const totalSeconds = Math.max(0, Math.floor((endedMs - startedMs) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function artifactLabel(kind: string) {
  switch (kind) {
    case "draft-video":
      return "Draft video";
    case "final-video":
      return "Final video";
    case "normalized-segment-video":
      return "Normalized segment";
    case "raw-segment-video":
      return "Raw segment";
    case "stitch-manifest":
      return "Concat manifest";
    case "voiceover-audio":
      return "Voiceover";
    case "voiceover-mixed-video":
      return "Video with voiceover";
    case "audio-strategy-plan":
      return "Audio strategy";
    case "audio-mix-plan":
      return "Audio mix plan";
    case "voiceover-request":
      return "ElevenLabs request";
    case "subtitle-file":
      return "Subtitle";
    case "cover-image":
      return "Cover";
    case "caption-file":
      return "Caption";
    case "evaluation-report":
      return "Evaluation";
    case "final-video-square":
      return "Final 1:1";
    case "final-video-vertical":
      return "Final 9:16";
    case "prompt-export":
      return "Prompt export";
    default:
      return kind;
  }
}


function emptyAsset(type: BrandAsset["type"]): BrandAsset {
  return {
    type,
    fileName: "",
    filePath: "",
  };
}

function getAssetByType(assets: BrandAsset[], type: BrandAsset["type"]) {
  return assets.find((asset) => asset.type === type) ?? null;
}

function sanitizeBrandAsset(asset: BrandAsset): BrandAsset | null {
  const fileName = asset.fileName.trim();
  const filePath = asset.filePath.trim();

  if (!fileName || !filePath) {
    return null;
  }

  return {
    ...asset,
    fileName,
    filePath,
    mimeType: asset.mimeType?.trim() || undefined,
    publicUrl: asset.publicUrl?.trim() || undefined,
  };
}

function buildCreateProjectPayload(payload: CreateProjectPayload): CreateProjectPayload {
  return {
    ...payload,
    brandKit: {
      ...payload.brandKit,
      assets: payload.brandKit.assets
        .map(sanitizeBrandAsset)
        .filter((asset): asset is BrandAsset => asset !== null),
    },
  };
}

function statusColor(status: string) {
  switch (status) {
    case "running":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "queued":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function nodeStatusColor(status: string) {
  switch (status) {
    case "running":
      return "bg-sky-500";
    case "completed":
      return "bg-emerald-500";
    case "failed":
      return "bg-rose-500";
    case "skipped":
      return "bg-slate-400";
    default:
      return "bg-slate-300";
  }
}

function nodeStatusText(status: string) {
  switch (status) {
    case "pending":
      return "Pending";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "skipped":
      return "Skipped";
    default:
      return status;
  }
}

function collectArtifactLines(project: ProjectState, predicate: (kind: string) => boolean) {
  return project.variants.flatMap((variant) =>
    variant.artifacts
      .filter((artifact) => predicate(artifact.kind))
      .map((artifact) => `${variant.id}: ${artifactLabel(artifact.kind)} · ${truncate(artifact.path, 84)}`),
  );
}

function getNodeResultLines(project: ProjectState | null, nodeId: WorkflowNodeId) {
  if (!project) {
    return [];
  }

  switch (nodeId) {
    case "input-validator":
      return [
        `${project.brandKit.assets.length} asset(s) validated for ${project.brief.platforms.join(", ")}.`,
        `${project.brief.targetDuration}s ${project.brief.aspectRatio} ${project.brief.resolution} brief for ${project.brief.brandName}.`,
      ];
    case "brief-analyzer":
      return project.analysis
        ? [project.analysis.valueProposition, project.analysis.audienceInsight]
        : [];
    case "brand-dna-extractor":
      return project.brandDna
        ? [
            `Voice: ${project.brandDna.voiceAttributes.join(", ")}`,
            `Visual: ${project.brandDna.visualAnchors.join(", ")}`,
          ]
        : [];
    case "creative-direction-generator":
      return project.variants.map((variant) => `${variant.id}: ${variant.strategy.angle}`);
    case "hook-generator-scorer":
      return project.variants
        .map((variant) =>
          variant.selectedHook?.text ? `${variant.id}: ${variant.selectedHook.text}` : null,
        )
        .filter((line): line is string => Boolean(line));
    case "script-writer":
      return project.variants
        .map((variant) =>
          variant.script?.[0]?.narration
            ? `${variant.id}: ${truncate(variant.script[0].narration, 120)}`
            : null,
        )
        .filter((line): line is string => Boolean(line));
    case "storyboard-planner":
      return project.variants.map(
        (variant) => `${variant.id}: ${variant.storyboard?.length ?? 0} scene(s).`,
      );
    case "segment-planner":
      return project.variants.map((variant) => {
        const segmentSummary =
          variant.segmentPlan
            ?.map((segment) => `${segment.id} ${segment.generationMode ?? "T2V"} ${segment.durationSeconds}s`)
            .join(", ") ?? "No segments.";
        return `${variant.id}: ${truncate(segmentSummary, 160)}`;
      });
    case "seedance-prompt-builder":
      return project.variants.flatMap((variant) =>
        (variant.segmentPlan ?? [])
          .slice(0, 2)
          .map((segment) => `${variant.id}/${segment.id}: ${truncate(segment.promptSummary ?? "No prompt yet.", 140)}`),
      );
    case "seedance-segment-generator":
      return project.variants.flatMap((variant) =>
        (variant.segmentPlan ?? [])
          .filter((segment) => segment.seedanceTaskId || segment.rawVideoPath || segment.status)
          .map(
            (segment) =>
              `${variant.id}/${segment.id}: ${segment.status ?? "pending"}${segment.seedanceTaskId ? ` · ${segment.seedanceTaskId}` : ""}`,
          ),
      );
    case "segment-normalizer":
      return collectArtifactLines(project, (kind) => kind === "normalized-segment-video");
    case "video-stitching-agent":
      return collectArtifactLines(project, (kind) => kind === "draft-video" || kind === "stitch-manifest");
    case "voiceover-generator":
      return collectArtifactLines(
        project,
        (kind) => kind === "voiceover-audio" || kind === "voiceover-mixed-video",
      );
    case "subtitle-burn-in-agent":
      return collectArtifactLines(project, (kind) => kind === "subtitle-file");
    case "cover-caption-title-generator":
      return project.variants.flatMap((variant) => {
        const lines = [];
        if (variant.generatedTitle) lines.push(`${variant.id} title: ${variant.generatedTitle}`);
        if (variant.generatedCaption) {
          lines.push(`${variant.id} caption: ${truncate(variant.generatedCaption, 140)}`);
        }
        return lines;
      });
    case "evaluation-agent":
      return project.variants.flatMap((variant) =>
        variant.score
          ? [`${variant.id}: publishable score ${variant.score.publishableScore}`]
          : [],
      );
    case "editor-revision-router":
      return project.revisionPlan?.length
        ? project.revisionPlan.map((item) => `${item.target}: ${item.action}`)
        : [];
    case "export-packager":
      return project.exports.map((item) => `${item.label}: ${truncate(item.path, 120)}`);
    default:
      return [];
  }
}

async function postJson<TResponse>(url: string, payload: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as TResponse & { error?: string };

  if (!response.ok) {
    const message = data?.error ?? `Request failed (${response.status}).`;
    throw new Error(message);
  }

  return data;
}

async function getJson<TResponse>(url: string): Promise<TResponse> {
  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as TResponse & { error?: string };

  if (!response.ok) {
    const message = data?.error ?? `Request failed (${response.status}).`;
    throw new Error(message);
  }

  return data;
}

export function ProjectDemo() {
  const [payload, setPayload] = React.useState<CreateProjectPayload>(EMPTY_PAYLOAD);
  const [project, setProject] = React.useState<ProjectState | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [uploadingAssetType, setUploadingAssetType] = React.useState<BrandAsset["type"] | null>(
    null,
  );
  const [draggingAssetType, setDraggingAssetType] = React.useState<BrandAsset["type"] | null>(
    null,
  );
  const [expandedNode, setExpandedNode] = React.useState<WorkflowNodeId | null>(
    null,
  );
  const pollFailureCountRef = React.useRef(0);

  const shouldPoll = project?.status === "queued" || project?.status === "running";
  const isProjectActive = shouldPoll;

  React.useEffect(() => {
    if (!project?.projectId || !shouldPoll) return;

    const interval = window.setInterval(async () => {
      try {
        const response = await getJson<{ project: ProjectState | null }>(
          `/api/projects/${project.projectId}`,
        );
        if (!response.project) {
          throw new Error("Project state is unavailable.");
        }
        pollFailureCountRef.current = 0;
        setError((current) =>
          current?.startsWith("Khong the dong bo tien trinh") ? null : current,
        );
        setProject(response.project);
      } catch (error) {
        pollFailureCountRef.current += 1;

        if (pollFailureCountRef.current < 3) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Unknown polling error.";
        setError(
          `Khong the dong bo tien trinh workflow cho project ${project.projectId}: ${message}`,
        );
        window.clearInterval(interval);
      }
    }, 1200);

    return () => window.clearInterval(interval);
  }, [project?.projectId, shouldPoll]);

  function updateBrief<K extends keyof Brief>(key: K, value: Brief[K]) {
    setPayload((prev) => ({
      ...prev,
      brief: {
        ...prev.brief,
        [key]: value,
      },
    }));
  }

  function updateBrandKit<K extends keyof BrandKit>(key: K, value: BrandKit[K]) {
    setPayload((prev) => ({
      ...prev,
      brandKit: {
        ...prev.brandKit,
        [key]: value,
      },
    }));
  }

  function setAssetForType(type: BrandAsset["type"], nextAsset: BrandAsset) {
    setPayload((prev) => {
      const exists = prev.brandKit.assets.some((asset) => asset.type === type);

      return {
        ...prev,
        brandKit: {
          ...prev.brandKit,
          assets: exists
            ? prev.brandKit.assets.map((asset) => (asset.type === type ? nextAsset : asset))
            : [...prev.brandKit.assets, nextAsset],
        },
      };
    });
  }

  function appendAsset(nextAsset: BrandAsset) {
    setPayload((prev) => ({
      ...prev,
      brandKit: {
        ...prev.brandKit,
        assets: [...prev.brandKit.assets, nextAsset],
      },
    }));
  }

  async function handleCreateProject() {
    setBusy(true);
    setError(null);

    try {
      const response = await postJson<{ project: ProjectState }>(
        "/api/projects",
        buildCreateProjectPayload(payload),
      );
      setProject(response.project);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate() {
    if (!project?.projectId) return;
    setBusy(true);
    setError(null);

    console.log("[handleGenerate] Starting generation for project:", project.projectId);

    try {
      const response = await postJson<{ project: ProjectState }>(
        `/api/projects/${project.projectId}/generate`,
        {},
      );
      console.log("[handleGenerate] Response received:", response);
      console.log("[handleGenerate] New project state:", response.project);
      setProject(response.project);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to enqueue generation job.";
      console.error("[handleGenerate] Error:", err);
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setError(null);

    try {
      await fetch("/api/cleanup", { method: "POST" });
      setProject(null);
      setError("Generation cancelled. Cache cleared.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    setError(null);

    try {
      await fetch("/api/cleanup", { method: "POST" });
      setPayload(EMPTY_PAYLOAD);
      setProject(null);
      setExpandedNode(null);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRunFromNode(nodeId: string) {
    if (!project?.projectId) return;
    setBusy(true);
    setError(null);

    try {
      const response = await postJson<{ project: ProjectState }>(
        `/api/projects/${project.projectId}/run-from`,
        { startFromNode: nodeId },
      );
      setProject(response.project);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to re-run from node.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh() {
    if (!project?.projectId) return;
    setBusy(true);
    setError(null);

    try {
      const response = await getJson<{ project: ProjectState | null }>(
        `/api/projects/${project.projectId}`,
      );
      if (response.project) setProject(response.project);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh project.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleMusicUpload(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/uploads/audio", { method: "POST", body: formData });
      const data = (await response.json()) as { filePath?: string; fileName?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to upload audio.");
      updateBrandKit("backgroundMusicPath", data.filePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload audio.");
    }
  }

  async function handleAssetUpload(type: BrandAsset["type"], file: File | null) {
    if (!file) return;

    setUploadingAssetType(type);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("assetType", type);

      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as UploadImageResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to upload image.");
      }

      if (type === "product-image") {
        appendAsset(data.asset);
      } else {
        setAssetForType(type, data.asset);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload image.";
      setError(message);
    } finally {
      setUploadingAssetType(null);
      setDraggingAssetType(null);
    }
  }

  const nodeLabels: Record<string, string> = {
    "input-validator": "Input",
    "brief-analyzer": "Analyze",
    "brand-dna-extractor": "Brand DNA",
    "creative-direction-generator": "Creative Direction",
    "hook-generator-scorer": "Hook Scoring",
    "script-writer": "Script",
    "storyboard-planner": "Storyboard",
    "segment-planner": "Segment Plan",
    "seedance-prompt-builder": "Seedance Prompts",
    "seedance-segment-generator": "Seedance Clips",
    "segment-normalizer": "Normalize",
    "video-stitching-agent": "Stitching",
    "voiceover-generator": "Voiceover",
    "subtitle-burn-in-agent": "Subtitles",
    "cover-caption-title-generator": "Cover & Caption",
    "evaluation-agent": "Evaluation",
    "editor-revision-router": "Revision",
    "export-packager": "Export",
  };

  const inputCls = "w-full rounded-[9px] border border-[#e4e7ef] bg-white px-3 py-[11px] text-sm text-[#111827] outline-none transition placeholder:text-[#a7adbb] focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
  const labelCls = "text-xs font-semibold text-[#111827] leading-tight";

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[410px_1fr]">
      {/* ───── LEFT: Input Brief ───── */}
      <aside className="rounded-2xl border border-[#e4e7ef] bg-white p-[22px] shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg bg-orange-50 text-orange-500 text-sm font-extrabold">
            ✎
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#111827]">Input Brief</h1>
            <p className="mt-1 text-xs text-[#6b7280]">Provide details to generate high-performing videos.</p>
          </div>
        </div>

        {/* Brand name */}
        <div className="mb-3.5 grid grid-cols-[110px_1fr] items-start gap-3">
          <div className={labelCls} style={{ paddingTop: 11 }}>Brand name</div>
          <input className={inputCls} value={payload.brief.brandName} onChange={(e) => updateBrief("brandName", e.target.value)} placeholder="e.g. Glowtics" disabled={busy} />
        </div>

        {/* Product / service */}
        <div className="mb-3.5 grid grid-cols-[110px_1fr] items-start gap-3">
          <div className={labelCls} style={{ paddingTop: 11 }}>Product / service</div>
          <input className={inputCls} value={payload.brief.productName} onChange={(e) => updateBrief("productName", e.target.value)} placeholder="e.g. Vitamin C Serum" disabled={busy} />
        </div>

        {/* Product description */}
        <div className="mb-3.5 grid grid-cols-[110px_1fr] items-start gap-3">
          <div className={labelCls} style={{ paddingTop: 11 }}>Product description</div>
          <div className="relative">
            <textarea className={`${inputCls} min-h-[78px] resize-none`} value={payload.brief.productDescription} onChange={(e) => updateBrief("productDescription", e.target.value)} placeholder="Describe your product / service, key benefits, differentiators..." disabled={busy} />
            <span className="absolute right-3 bottom-2 text-[11px] text-[#a7adbb]">{payload.brief.productDescription.length} / 500</span>
          </div>
        </div>

        {/* Target audience */}
        <div className="mb-3.5 grid grid-cols-[110px_1fr] items-start gap-3">
          <div className={labelCls} style={{ paddingTop: 11 }}>Target audience</div>
          <input className={inputCls} value={payload.brief.audience} onChange={(e) => updateBrief("audience", e.target.value)} placeholder="e.g. Skincare enthusiasts, ages 18-35" disabled={busy} />
        </div>

        {/* Platform */}
        <div className="mb-3.5 grid grid-cols-[110px_1fr] items-start gap-3">
          <div className={labelCls} style={{ paddingTop: 11 }}>Platform</div>
          <div className="grid grid-cols-3 gap-2">
            {(["TikTok", "Instagram Reels", "YouTube Shorts"] as const).map((platform) => {
              const sel = payload.brief.platforms[0] === platform;
              const platformIcon = platform === "TikTok" ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.1v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.7a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.44a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.87z"/></svg>
              ) : platform === "Instagram Reels" ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              );
              return (
                <button key={platform} type="button" disabled={busy}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] border px-2 py-2 text-xs font-semibold transition ${sel ? "border-orange-300 bg-white text-orange-500" : "border-[#e4e7ef] bg-white text-[#6b7280] hover:border-orange-200"}`}
                  onClick={() => updateBrief("platforms", [platform])}
                >
                  {platformIcon}
                  {platform === "Instagram Reels" ? "Reels" : platform === "YouTube Shorts" ? "Shorts" : platform}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration + Aspect ratio row */}
        <div className="mb-3.5 grid grid-cols-2 gap-3.5">
          <div>
            <div className={`${labelCls} mb-[7px]`}>Target duration</div>
            <div className="grid h-10 grid-cols-3 overflow-hidden rounded-[9px] border border-[#e4e7ef] bg-white">
              {([15, 20, 30] as const).map((d) => (
                <button key={d} type="button" disabled={busy}
                  className={`border-0 text-sm font-semibold ${payload.brief.targetDuration === d ? "bg-orange-500 text-white" : "bg-white text-[#111827]"}`}
                  onClick={() => updateBrief("targetDuration", d)}
                >{d}s</button>
              ))}
            </div>
          </div>
          <div>
            <div className={`${labelCls} mb-[7px]`}>Video aspect ratio</div>
            <select className={inputCls} value={payload.brief.aspectRatio} onChange={(e) => updateBrief("aspectRatio", e.target.value as Brief["aspectRatio"])} disabled={busy}>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
            </select>
          </div>
        </div>

        {/* Resolution + Brand tone row */}
        <div className="mb-3.5 grid grid-cols-2 gap-3.5">
          <div>
            <div className={`${labelCls} mb-[7px]`}>Resolution</div>
            <select className={inputCls} value={payload.brief.resolution} onChange={(e) => updateBrief("resolution", e.target.value as Brief["resolution"])} disabled={busy}>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </div>
          <div>
            <div className={`${labelCls} mb-[7px]`}>Brand tone</div>
            <input className={inputCls} value={payload.brief.brandTone} onChange={(e) => updateBrief("brandTone", e.target.value)} placeholder="e.g. Premium, trustworthy" disabled={busy} />
          </div>
        </div>

        {/* Main message */}
        <div className="mb-3.5 grid grid-cols-[110px_1fr] items-start gap-3">
          <div className={labelCls} style={{ paddingTop: 11 }}>Main message</div>
          <div className="relative">
            <input className={inputCls} value={payload.brief.mainMessage} onChange={(e) => updateBrief("mainMessage", e.target.value)} placeholder="e.g. Brighten skin naturally with Vitamin C" disabled={busy} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#a7adbb]">{payload.brief.mainMessage.length} / 120</span>
          </div>
        </div>

        {/* Compliance constraints */}
        <div className="mb-3.5 grid grid-cols-[110px_1fr] items-start gap-3">
          <div className={labelCls} style={{ paddingTop: 11 }}>
            Compliance constraints
            <span className="block font-medium text-[#6b7280]">(optional)</span>
          </div>
          <div className="relative">
            <textarea className={`${inputCls} min-h-[58px] resize-none`} value={payload.brief.complianceConstraints} onChange={(e) => updateBrief("complianceConstraints", e.target.value)} placeholder="e.g. No medical claims, avoid superlatives..." disabled={busy} />
            <span className="absolute right-3 bottom-2 text-[11px] text-[#a7adbb]">{payload.brief.complianceConstraints.length} / 300</span>
          </div>
        </div>

        {/* Call to action */}
        <div className="mb-3.5 grid grid-cols-[110px_1fr] items-start gap-3">
          <div className={labelCls} style={{ paddingTop: 11 }}>
            Call to action
            <span className="block font-medium text-[#6b7280]">(optional)</span>
          </div>
          <div className="relative">
            <input className={inputCls} value={payload.brief.callToAction ?? ""} onChange={(e) => updateBrief("callToAction", e.target.value)} placeholder="e.g. Shop now, Get yours today" disabled={busy} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#a7adbb]">{(payload.brief.callToAction ?? "").length} / 80</span>
          </div>
        </div>


        {/* Product images */}
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-extrabold">Product images <span className="font-medium text-[#6b7280]">(1-4)</span></div>
          <button type="button" className="text-[11px] text-[#6b7280] hover:underline" onClick={() => updateBrandKit("assets", payload.brandKit.assets.filter((a) => a.type !== "product-image"))}>Clear all</button>
        </div>
        <div className="mb-4 grid grid-cols-4 gap-2.5">
          {payload.brandKit.assets.filter((a) => a.type === "product-image").map((asset, i) => (
            <div key={`pi-${i}`} className="relative h-16 overflow-hidden rounded-[10px] border border-[#e4e7ef] bg-[#f3f4f6]">
              {asset.publicUrl && <Image src={asset.publicUrl} alt={asset.fileName} width={120} height={64} className="h-full w-full object-cover" />}
              <button type="button" className="absolute right-1.5 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[rgba(17,24,39,0.78)] text-[11px] text-white"
                onClick={() => updateBrandKit("assets", payload.brandKit.assets.filter((_, idx) => idx !== payload.brandKit.assets.indexOf(asset)))}
              >x</button>
            </div>
          ))}
          {payload.brandKit.assets.filter((a) => a.type === "product-image").length < 4 && (
            <label className="flex h-16 cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-[#c9cedb] bg-white text-xs text-[#374151]">
              <strong className="text-2xl font-normal leading-none">+</strong>
              <span>Add image</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.currentTarget.files?.[0] ?? null; void handleAssetUpload("product-image", file); e.currentTarget.value = ""; }} disabled={busy || uploadingAssetType !== null} />
            </label>
          )}
        </div>

        {/* Logo upload */}
        <div className="mb-2 text-xs font-extrabold">Optional logo</div>
        {(() => {
          const logoAsset = getAssetByType(payload.brandKit.assets, "logo");
          return logoAsset?.publicUrl ? (
            <div className="mb-4 flex items-center gap-3 rounded-[10px] border border-[#e4e7ef] bg-white p-2">
              <Image src={logoAsset.publicUrl} alt={logoAsset.fileName} width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
              <div className="flex-1">
                <strong className="block text-xs text-[#4b5563]">{logoAsset.fileName}</strong>
                <small className="text-[#9ca3af]">Logo uploaded</small>
              </div>
              <label className="cursor-pointer rounded-md bg-[#f3f4f6] px-2 py-1 text-[11px] font-medium text-[#374151] hover:bg-[#e5e7eb]">
                Replace
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.currentTarget.files?.[0] ?? null; void handleAssetUpload("logo", file); e.currentTarget.value = ""; }} disabled={busy || uploadingAssetType !== null} />
              </label>
            </div>
          ) : (
            <label className="mb-4 flex h-[52px] cursor-pointer items-center justify-center gap-3 rounded-[10px] border border-dashed border-[#cbd2e1] bg-white text-center text-[#6b7280]">
              <span className="text-xl">&#8679;</span>
              <div>
                <strong className="block text-xs text-[#4b5563]">Upload logo (optional)</strong>
                <small className="text-[#9ca3af]">PNG, JPG or SVG</small>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.currentTarget.files?.[0] ?? null; void handleAssetUpload("logo", file); e.currentTarget.value = ""; }} disabled={busy || uploadingAssetType !== null} />
            </label>
          );
        })()}

        {/* Moodboard upload */}
        <div className="mb-2 text-xs font-extrabold">Optional moodboard / visual reference</div>
        {(() => {
          const moodAsset = getAssetByType(payload.brandKit.assets, "moodboard");
          return moodAsset?.publicUrl ? (
            <div className="mb-4 flex items-center gap-3 rounded-[10px] border border-[#e4e7ef] bg-white p-2">
              <Image src={moodAsset.publicUrl} alt={moodAsset.fileName} width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
              <div className="flex-1">
                <strong className="block text-xs text-[#4b5563]">{moodAsset.fileName}</strong>
                <small className="text-[#9ca3af]">Moodboard uploaded</small>
              </div>
              <label className="cursor-pointer rounded-md bg-[#f3f4f6] px-2 py-1 text-[11px] font-medium text-[#374151] hover:bg-[#e5e7eb]">
                Replace
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const file = e.currentTarget.files?.[0] ?? null; void handleAssetUpload("moodboard", file); e.currentTarget.value = ""; }} disabled={busy || uploadingAssetType !== null} />
              </label>
            </div>
          ) : (
            <label className="mb-4 flex h-[52px] cursor-pointer items-center justify-center gap-3 rounded-[10px] border border-dashed border-[#cbd2e1] bg-white text-center text-[#6b7280]">
              <span className="text-xl">&#8679;</span>
              <div>
                <strong className="block text-xs text-[#4b5563]">Upload moodboard (optional)</strong>
                <small className="text-[#9ca3af]">PNG, JPG or PDF</small>
              </div>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const file = e.currentTarget.files?.[0] ?? null; void handleAssetUpload("moodboard", file); e.currentTarget.value = ""; }} disabled={busy || uploadingAssetType !== null} />
            </label>
          );
        })()}

        {/* Voice toggle */}
        <div className="mb-3.5 rounded-[10px] border border-[#e4e7ef] bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold">Voiceover &amp; subtitles</div>
              <div className="text-[11px] text-[#6b7280]">Generate voice narration and burn subtitles</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={(payload.brief.enableVoice ?? true)}
              disabled={busy}
              onClick={() => updateBrief("enableVoice", !(payload.brief.enableVoice ?? true))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 ${(payload.brief.enableVoice ?? true) ? "bg-orange-500" : "bg-[#d1d5db]"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${(payload.brief.enableVoice ?? true) ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
          {(payload.brief.enableVoice ?? true) && (
            <div className="mt-3 border-t border-[#f3f4f6] pt-3">
              <div className="mb-2 text-[11px] font-bold text-[#374151]">Voice gender <span className="text-rose-500">*</span></div>
              <div className="grid grid-cols-2 gap-2">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    disabled={busy}
                    onClick={() => updateBrief("voiceGender", g)}
                    className={`rounded-[8px] border px-3 py-2 text-xs font-bold transition ${
                      payload.brief.voiceGender === g
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-[#e4e7ef] bg-white text-[#374151] hover:border-orange-300"
                    } disabled:opacity-40`}
                  >
                    {g === "male" ? "👨 Nam" : "👩 Nữ"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background music upload */}
        <div className="mb-2 text-xs font-extrabold">Background music <span className="font-medium text-[#6b7280]">(optional)</span></div>
        {payload.brandKit.backgroundMusicPath ? (
          <div className="mb-4 flex items-center gap-3 rounded-[10px] border border-[#e4e7ef] bg-white p-2">
            <span className="text-2xl">🎵</span>
            <div className="flex-1 min-w-0">
              <strong className="block truncate text-xs text-[#4b5563]">{payload.brandKit.backgroundMusicPath.split("/").pop()}</strong>
              <small className="text-[#9ca3af]">Will mix at 30% volume over video audio</small>
            </div>
            <button type="button" className="rounded-md bg-[#f3f4f6] px-2 py-1 text-[11px] font-medium text-[#374151] hover:bg-[#e5e7eb]" onClick={() => updateBrandKit("backgroundMusicPath", undefined)}>Remove</button>
          </div>
        ) : (
          <label className="mb-4 flex h-[52px] cursor-pointer items-center justify-center gap-3 rounded-[10px] border border-dashed border-[#cbd2e1] bg-white text-center text-[#6b7280]">
            <span className="text-xl">🎵</span>
            <div>
              <strong className="block text-xs text-[#4b5563]">Upload background music (optional)</strong>
              <small className="text-[#9ca3af]">MP3, WAV, AAC — loops to fit video length</small>
            </div>
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const file = e.currentTarget.files?.[0] ?? null; void handleMusicUpload(file); e.currentTarget.value = ""; }} disabled={busy} />
          </label>
        )}

        {error && <div className="mb-4 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            className="rounded-[10px] bg-gradient-to-br from-orange-500 to-orange-600 px-3 py-3 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(249,115,22,0.25)] transition hover:from-orange-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={project?.projectId ? handleGenerate : handleCreateProject}
            disabled={busy || uploadingAssetType !== null || isProjectActive}
          >
            {isProjectActive ? "Generating..." : "Generate"}
          </button>
          <button
            className="rounded-[10px] border border-[#e4e7ef] bg-white px-3 py-3 text-xs font-extrabold text-[#374151] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleCancel}
            disabled={busy || !isProjectActive}
          >
            Cancel
          </button>
          <button
            className="rounded-[10px] border border-[#e4e7ef] bg-white px-3 py-3 text-xs font-extrabold text-[#374151] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleReset}
            disabled={busy}
          >
            Reset
          </button>
        </div>
      </aside>

      {/* ───── RIGHT: Workflow + Variants + Comparison + Feedback + Export ───── */}
      <section className="space-y-4">
        {/* Workflow Progress */}
        <div className="rounded-2xl border border-[#e4e7ef] bg-white p-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-[17px] font-extrabold text-[#111827]">Workflow Progress</h2>
          <div className="mt-3.5 grid grid-cols-6 gap-3">
            {workflowNodeIds.map((nodeId, idx) => {
              const nodeRun = project?.workflowStatus?.[nodeId];
              const status = nodeRun?.status ?? "pending";
              const isActive = status === "running";
              const isDone = status === "completed";
              const isFailed = status === "failed";

              let stepCls = "h-11 flex items-center justify-between gap-1.5 rounded-[10px] border px-3 text-xs font-bold transition cursor-pointer";
              if (isActive) stepCls += " border-orange-400 bg-white text-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.14)]";
              else if (isDone) stepCls += " border-[#e4e7ef] bg-white text-[#111827]";
              else if (isFailed) stepCls += " border-rose-300 bg-rose-50 text-rose-600";
              else stepCls += " border-[#e4e7ef] bg-[#fbfbfd] text-[#9ca3af]";

              return (
                <button key={nodeId} type="button" className={stepCls} onClick={() => setExpandedNode((prev) => (prev === nodeId ? null : nodeId))}>
                  {isDone ? (
                    <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-emerald-500 text-[10px] font-extrabold text-white">✓</span>
                  ) : isActive ? (
                    <span className="h-[15px] w-[15px] flex-none rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin-slow" />
                  ) : (
                    <span className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-[10px] font-extrabold ${isFailed ? "bg-rose-500 text-white" : "bg-[#e5e7eb] text-[#9ca3af]"}`}>{idx + 1}</span>
                  )}
                  <span className="truncate">{nodeLabels[nodeId] ?? nodeId}</span>
                  {isDone && <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Expanded node detail */}
          {expandedNode && project?.workflowStatus?.[expandedNode] && (() => {
            const nodeRun = project.workflowStatus[expandedNode];
            const resultLines = getNodeResultLines(project, expandedNode);
            
            return (
              <div className="mt-3 rounded-[10px] border border-[#e4e7ef] bg-[#fbfbfd] p-4 text-xs text-[#374151]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-extrabold text-[#111827]">{nodeLabels[expandedNode] ?? expandedNode}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy || isProjectActive}
                      className="rounded-md bg-orange-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-orange-600 disabled:opacity-40"
                      onClick={() => handleRunFromNode(expandedNode)}
                    >
                      ▶ Run again
                    </button>
                    <span className="text-[#6b7280]">{formatElapsedTime(nodeRun.startedAt, nodeRun.completedAt)}</span>
                  </div>
                </div>
                {nodeRun.errorMessage && <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">{nodeRun.errorMessage}</div>}
                {expandedNode !== "seedance-segment-generator" && resultLines.length > 0 && <ul className="mb-2 space-y-1">{resultLines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
                {expandedNode !== "seedance-segment-generator" && nodeRun.logs.length > 0 && <ul className="space-y-1 text-[#6b7280]">{nodeRun.logs.map((l, i) => <li key={i}>{l}</li>)}</ul>}
                
                {/* Seedance Clips Video Preview Grid */}
                {expandedNode === "seedance-segment-generator" && project?.variants && (
                  <div className="mt-3 space-y-4">
                    {project.variants.map((variant) => {
                      const segments = variant.segmentPlan ?? [];
                      if (segments.length === 0) return null;
                      
                      return (
                        <div key={variant.id}>
                          <div className="mb-2 font-bold text-[#111827]">Variant {variant.id}</div>
                          <div className="grid grid-cols-3 gap-2.5">
                            {segments.map((segment) => {
                              const isGenerating = segment.status === "generating";
                              const hasVideo = Boolean(segment.rawVideoPath);
                              
                              return (
                                <div key={segment.id} className="relative rounded-lg border border-[#e4e7ef] bg-white p-2">
                                  <div className="mb-1.5 flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-[#6b7280]">{segment.id}</div>
                                    <div className="text-[10px] text-[#9ca3af]">{segment.durationSeconds}s</div>
                                  </div>
                                  {hasVideo ? (
                                    <video 
                                      src={`/api/outputs/${segment.rawVideoPath?.split("outputs/generated/")[1] ?? segment.rawVideoPath}`} 
                                      className="w-full rounded bg-[#111827]" 
                                      controls 
                                      muted
                                      preload="metadata"
                                      style={{ aspectRatio: payload.brief.aspectRatio === "1:1" ? "1/1" : "9/16" }}
                                    />
                                  ) : (
                                    <div 
                                      className="relative w-full overflow-hidden rounded bg-gradient-to-br from-[#f3f4f6] to-[#e5e7eb]"
                                      style={{ aspectRatio: payload.brief.aspectRatio === "1:1" ? "1/1" : "9/16" }}
                                    >
                                      {isGenerating && (
                                        <>
                                          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-orange-100/40 to-orange-200/40" />
                                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#9ca3af]">
                                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-orange-500" />
                                            <div className="text-[10px] font-bold">Generating...</div>
                                          </div>
                                        </>
                                      )}
                                      {!isGenerating && (
                                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#9ca3af]">
                                          Pending
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Generated Variants */}
        <div className="rounded-2xl border border-[#e4e7ef] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="mb-3.5 text-[17px] font-extrabold text-[#111827]">Generated Variants</h2>

          {/* Variant cards - always show skeleton */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {(project?.variants?.length ? project.variants : [{ id: "A" }, { id: "B" }]).map((item) => {
              const variant = project?.variants?.find((v) => v.id === item.id) ?? null;
              const variantId = item.id;
              const finalVideo = variant?.artifacts.find((a) => a.kind === "final-video");
              const score = variant?.score?.publishableScore;

              return (
                <article key={variantId} className="grid grid-cols-[190px_1fr] gap-4 rounded-2xl border border-[#e4e7ef] p-3.5">
                  {/* Video preview */}
                  <div className="relative h-[365px] overflow-hidden rounded-[10px] bg-[#111827]">
                    <span className="absolute left-0 top-0 z-10 rounded-br-[9px] bg-orange-500 px-3 py-2 text-xs font-extrabold text-white">Variant {variantId}</span>
                    {finalVideo ? (
                      <video src={`/${finalVideo.path}`} className="h-full w-full object-cover" controls muted preload="metadata" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80 bg-[rgba(17,24,39,0.62)] text-3xl text-white pl-1">&#9654;</div>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 text-[11px] text-white">
                      0:00 / 0:{String(variant?.segmentPlan?.reduce((s, seg) => s + seg.durationSeconds, 0) ?? payload.brief.targetDuration).padStart(2, "0")}
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/55"><span className="block h-full w-0 bg-white" /></div>
                    </div>
                  </div>

                  {/* Variant body */}
                  <div className="py-1.5">
                    <h3 className="text-base font-extrabold">{variant?.name || variant?.strategy?.angle || `Variant ${variantId}`}</h3>
                    <p className="mt-1.5 text-xs text-[#6b7280]">Hypothesis: {variant?.strategy?.hypothesis ?? "Pending generation..."}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-[#e4e7ef] px-2.5 text-xs font-semibold text-[#4b5563]">&#9719; {payload.brief.targetDuration}s</span>
                      <span className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-[#e4e7ef] px-2.5 text-xs font-semibold text-[#4b5563]">&#8999; {payload.brief.aspectRatio}</span>
                      <span className="flex items-center gap-2 rounded-lg border border-[#e4e7ef] px-2.5 py-1">
                        <span className={`rounded-[7px] px-2 py-1 text-lg font-extrabold ${score != null ? "bg-emerald-100 text-emerald-600" : "bg-[#f3f4f6] text-[#9ca3af]"}`}>{score ?? "--"}</span>
                        <span className="text-[11px] text-[#6b7280]">/100<br/>Publishable Score</span>
                      </span>
                    </div>

                    {/* Hook */}
                    <div className="mt-3.5 rounded-[9px] border border-[#e4e7ef] bg-[#fffaf5] p-3">
                      <div className="mb-2 text-xs font-extrabold">Selected Hook</div>
                      <div className={`text-sm font-semibold ${variant?.selectedHook?.text ? "text-orange-500" : "text-[#c4c8d3]"}`}>&ldquo;{variant?.selectedHook?.text ?? "Waiting for generation..."}&rdquo;</div>
                    </div>

                    {/* Creative Direction */}
                    <div className="mt-3.5">
                      <div className="mb-2 text-xs font-extrabold">Creative Direction</div>
                      <p className={`text-[13px] leading-relaxed ${variant?.strategy ? "text-[#2f3747]" : "text-[#c4c8d3]"}`}>{variant?.strategy?.summary ?? variant?.strategy?.angle ?? "Creative direction will appear after generation."}</p>
                    </div>

                    {/* Score bars - always show structure */}
                    <div className="mt-4 space-y-3">
                      {[
                        { label: "Hook", value: variant?.score?.hookStrength },
                        { label: "Brand Fit", value: variant?.score?.brandConsistency },
                        { label: "Platform Fit", value: variant?.score?.platformFit },
                      ].map((row) => (
                        <div key={row.label} className="grid grid-cols-[78px_1fr_46px] items-center gap-2.5 text-xs">
                          <strong>{row.label}</strong>
                          <div className="h-[5px] overflow-hidden rounded-full bg-[#e9e9fb]"><span className="block h-full rounded-full bg-orange-500 transition-all" style={{ width: `${row.value ?? 0}%` }} /></div>
                          <span className={row.value != null ? "" : "text-[#c4c8d3]"}>{row.value ?? "--"} /100</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Variant actions */}
                  <div className="col-span-2 grid grid-cols-3 gap-3">
                    {finalVideo ? (
                      <a href={`/${finalVideo.path}`} download className="flex h-[38px] items-center justify-center rounded-lg border border-[#d7dceb] bg-white text-xs font-bold text-[#374151]">&#8681; Download</a>
                    ) : (
                      <button type="button" disabled className="flex h-[38px] items-center justify-center rounded-lg border border-[#d7dceb] bg-white text-xs font-bold text-[#c4c8d3] cursor-not-allowed">&#8681; Download</button>
                    )}
                    <button type="button" className={`flex h-[38px] items-center justify-center rounded-lg border border-[#d7dceb] bg-white text-xs font-bold ${variant ? "text-[#374151]" : "text-[#c4c8d3] cursor-not-allowed"}`} disabled={!variant} onClick={() => setExpandedNode((prev) => (prev === "script-writer" ? null : "script-writer"))}>&#9776; View Script</button>
                    <button type="button" className={`flex h-[38px] items-center justify-center rounded-lg border border-[#d7dceb] bg-white text-xs font-bold ${variant?.generatedCaption ? "text-[#374151]" : "text-[#c4c8d3] cursor-not-allowed"}`} disabled={!variant?.generatedCaption} onClick={() => { if (variant?.generatedCaption) void navigator.clipboard.writeText(variant.generatedCaption + "\n" + (variant.generatedHashtags?.join(" ") ?? "")); }}>&#10697; Copy Caption</button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Lower grid: Comparison + Feedback - always show */}
          <div className="mt-3.5 grid grid-cols-1 gap-3.5 xl:grid-cols-[42%_58%]">
            {/* Variant Comparison */}
            <div className="rounded-2xl border border-[#e4e7ef] bg-white p-4">
              <h2 className="text-[17px] font-extrabold">Variant Comparison</h2>
              <table className="mt-3 w-full overflow-hidden rounded-[10px] border-collapse text-xs">
                <thead><tr><th className="border border-[#e4e7ef] bg-[#fafafa] px-2.5 py-[11px] text-left font-extrabold">Criteria</th><th className="border border-[#e4e7ef] bg-[#fafafa] px-2.5 py-[11px] text-left font-extrabold">Variant A</th><th className="border border-[#e4e7ef] bg-[#fafafa] px-2.5 py-[11px] text-left font-extrabold">Variant B</th></tr></thead>
                <tbody>
                  <tr><td className="border border-[#e4e7ef] px-2.5 py-[11px] text-[#374151]">Creative angle</td><td className="border border-[#e4e7ef] px-2.5 py-[11px] text-[#374151]">{project?.variants?.[0]?.strategy?.angle ?? <span className="text-[#c4c8d3]">--</span>}</td><td className="border border-[#e4e7ef] px-2.5 py-[11px] text-[#374151]">{project?.variants?.[1]?.strategy?.angle ?? <span className="text-[#c4c8d3]">--</span>}</td></tr>
                  <tr><td className="border border-[#e4e7ef] px-2.5 py-[11px] text-[#374151]">Hook</td><td className="border border-[#e4e7ef] px-2.5 py-[11px] text-[#374151]">{project?.variants?.[0]?.selectedHook?.text ?? <span className="text-[#c4c8d3]">--</span>}</td><td className="border border-[#e4e7ef] px-2.5 py-[11px] text-[#374151]">{project?.variants?.[1]?.selectedHook?.text ?? <span className="text-[#c4c8d3]">--</span>}</td></tr>
                  <tr><td className="border border-[#e4e7ef] px-2.5 py-[11px] text-[#374151]">Aspect ratio</td><td className="border border-[#e4e7ef] px-2.5 py-[11px] text-[#374151]">{payload.brief.aspectRatio}</td><td className="border border-[#e4e7ef] px-2.5 py-[11px] text-[#374151]">{payload.brief.aspectRatio}</td></tr>
                  <tr><td className="border border-[#e4e7ef] px-2.5 py-[11px] text-[#374151]">Publishable score</td><td className="border border-[#e4e7ef] px-2.5 py-[11px]"><strong className={project?.variants?.[0]?.score ? "text-emerald-600" : "text-[#c4c8d3]"}>{project?.variants?.[0]?.score?.publishableScore ?? "--"} /100</strong></td><td className="border border-[#e4e7ef] px-2.5 py-[11px]"><strong className={project?.variants?.[1]?.score ? "text-emerald-600" : "text-[#c4c8d3]"}>{project?.variants?.[1]?.score?.publishableScore ?? "--"} /100</strong></td></tr>
                </tbody>
              </table>
            </div>

            {/* Editor Feedback */}
            <div className="rounded-2xl border border-[#e4e7ef] bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-extrabold">Editor Feedback</h2>
                <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                  Apply to
                  <button type="button" className="h-7 w-[34px] rounded-[7px] border border-[#e4e7ef] bg-white font-bold">A</button>
                  <button type="button" className="h-7 w-[34px] rounded-[7px] border border-[#e4e7ef] bg-white font-bold">B</button>
                  <button type="button" className="h-7 rounded-[7px] bg-orange-500 px-2.5 font-bold text-white border-orange-500">Both</button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_190px] gap-3.5">
                <div>
                  <textarea className={`${inputCls} min-h-[112px] resize-none`} placeholder="Share feedback or change requests (e.g., shorter hook, different CTA, highlight ingredient X)..." />
                  <button type="button" className="mt-3 w-full rounded-[9px] bg-orange-500 py-2.5 text-sm font-extrabold text-white hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={!project?.variants?.length}>&#8635; Regenerate Affected Parts</button>
                </div>
                <div className="rounded-[10px] border border-[#e4e7ef] bg-[#fbfbfd] p-3 text-xs text-[#4b5563]">
                  <div className="mb-2 font-extrabold text-[#111827]">Revision Plan (Preview)</div>
                  {project?.revisionPlan?.length ? (
                    <ul className="mb-3 list-disc space-y-1 pl-4 leading-relaxed">
                      {project.revisionPlan.map((revItem, i) => <li key={i}>{revItem.target}: {revItem.action}</li>)}
                    </ul>
                  ) : (
                    <p className="mb-3 text-[#9ca3af]">Revision plan will appear here after feedback is submitted.</p>
                  )}
                  <span className="text-[#6b7280]">Est. time: ~2-3 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Export Package - always show, buttons dimmed when no data */}
          <div className="mt-3.5 grid grid-cols-[260px_1fr] items-center gap-4 rounded-2xl border border-[#e4e7ef] bg-white p-4">
            <div>
              <h2 className="text-[17px] font-extrabold">Export Package</h2>
              <p className="mt-1 text-xs text-[#6b7280]">Download your assets and share or publish.</p>
            </div>
            {(() => {
              const hasExports = Boolean(project?.exports?.length);
              const btnCls = hasExports
                ? "flex h-[38px] items-center justify-center rounded-lg border border-[#d7dceb] bg-white text-xs font-bold text-[#374151]"
                : "flex h-[38px] items-center justify-center rounded-lg border border-[#d7dceb] bg-white text-xs font-bold text-[#c4c8d3] cursor-not-allowed opacity-50";
              const zipCls = hasExports
                ? "flex h-[38px] items-center justify-center rounded-lg bg-orange-500 text-xs font-bold text-white"
                : "flex h-[38px] items-center justify-center rounded-lg bg-orange-500 text-xs font-bold text-white opacity-40 cursor-not-allowed";
              return (
                <div className="grid grid-cols-5 gap-2.5">
                  <button type="button" disabled={!hasExports} className={btnCls}>&#8681; Download A</button>
                  <button type="button" disabled={!hasExports} className={btnCls}>&#8681; Download B</button>
                  <button type="button" disabled={!hasExports} className={btnCls}>&#9638; Download Cover</button>
                  <button type="button" disabled={!hasExports} className={btnCls}>CC Download Caption</button>
                  <button type="button" disabled={!hasExports} className={zipCls}>Download ZIP</button>
                </div>
              );
            })()}
          </div>
        </div>
      </section>
    </div>
  );
}
