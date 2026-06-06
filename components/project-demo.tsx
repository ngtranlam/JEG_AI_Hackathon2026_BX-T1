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

type ExamplePreset = {
  label: string;
  payload: CreateProjectPayload;
};

type AssetSlot = {
  type: BrandAsset["type"];
  title: string;
  hint: string;
};

const EXAMPLES: ExamplePreset[] = [
  {
    label: "F&B (GreenBite)",
    payload: {
      brief: {
        brandName: "GreenBite",
        productName: "Healthy salad delivery",
        productDescription: "Fresh, chef-prepared salads delivered to your office within 30 minutes.",
        audience: "Office workers 25-35",
        platforms: ["TikTok"],
        targetDuration: 20,
        aspectRatio: "9:16",
        resolution: "720p",
        brandTone: "fresh, energetic, trustworthy",
        mainMessage: "Healthy eating made effortless for busy professionals.",
        complianceConstraints: "No fast weight-loss claims.",
        callToAction: "Order now",
        objective: "Drive first orders for lunch delivery",
        offer: "Free delivery for first order",
        prohibitedClaims: ["Lose 5kg in 7 days"],
        references: ["Clean bright realistic food shots, fast cuts, subtitle-heavy."],
      },
      brandKit: {
        primaryColorHex: "#2E7D32",
        secondaryColorHex: "#FFFFFF",
        fontFamily: "Montserrat",
        tagline: "Eat healthy without meal prep",
        visualNotes: ["Clean, bright, modern", "Realistic product shots"],
        forbiddenWords: ["miracle", "guaranteed"],
        assets: [
          { type: "logo", fileName: "logo.png", filePath: "uploads/logo.png" },
          {
            type: "product-image",
            fileName: "product_01.jpg",
            filePath: "uploads/product_01.jpg",
          },
        ],
      },
    },
  },
  {
    label: "Skincare (GlowUp)",
    payload: {
      brief: {
        brandName: "GlowUp",
        productName: "Hydrating serum",
        productDescription: "Lightweight hyaluronic acid serum for deep hydration and a dewy finish.",
        audience: "Skincare beginners, 18-28",
        platforms: ["Instagram Reels"],
        targetDuration: 30,
        aspectRatio: "9:16",
        resolution: "720p",
        brandTone: "calm, premium, confident",
        mainMessage: "Effortless hydration that fits your routine.",
        complianceConstraints: "Avoid medical claims. Avoid before/after exaggeration.",
        callToAction: "Tap to shop",
        objective: "Increase add-to-cart for the serum",
        offer: "Bundle discount this week",
        prohibitedClaims: ["Cures acne instantly"],
        references: ["Macro texture shots, premium lighting, slow motion product demo."],
      },
      brandKit: {
        primaryColorHex: "#111827",
        secondaryColorHex: "#F59E0B",
        fontFamily: "Inter",
        tagline: "Hydrate. Glow. Repeat.",
        visualNotes: ["Premium", "Minimal", "High contrast"],
        forbiddenWords: ["cure", "guarantee"],
        assets: [
          { type: "logo", fileName: "logo.png", filePath: "uploads/logo.png" },
          {
            type: "product-image",
            fileName: "serum.jpg",
            filePath: "uploads/serum.jpg",
          },
        ],
      },
    },
  },
];

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

function normalizeHexColor(value?: string) {
  const normalized = value?.trim() ?? "";
  return /^#[0-9A-Fa-f]{6}$/.test(normalized) ? normalized : "#FFFFFF";
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
  const [selectedExample, setSelectedExample] = React.useState(
    EXAMPLES[0]?.label ?? "",
  );
  const activePreset = React.useMemo(
    () => EXAMPLES.find((preset) => preset.label === selectedExample) ?? EXAMPLES[0],
    [selectedExample],
  );

  const [payload, setPayload] = React.useState<CreateProjectPayload>(
    activePreset.payload,
  );
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

  React.useEffect(() => {
    setPayload(activePreset.payload);
  }, [activePreset]);

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

    try {
      const response = await postJson<{ project: ProjectState }>(
        `/api/projects/${project.projectId}/generate`,
        {},
      );
      setProject(response.project);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to enqueue generation job.";
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

      setAssetForType(type, data.asset);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload image.";
      setError(message);
    } finally {
      setUploadingAssetType(null);
      setDraggingAssetType(null);
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Project Input</h2>
            <p className="text-sm text-slate-500">Điền thông tin và tải hình ảnh tham chiếu.</p>
          </div>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Preset
            </span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={selectedExample}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedExample(event.target.value)
              }
              disabled={busy}
            >
              {EXAMPLES.map((preset) => (
                <option key={preset.label} value={preset.label}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Brand name
            </span>
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={payload.brief.brandName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("brandName", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Product name
            </span>
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={payload.brief.productName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("productName", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700 sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Audience
            </span>
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={payload.brief.audience}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("audience", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700 sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Objective
            </span>
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={payload.brief.objective}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("objective", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700 sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Product description
            </span>
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={payload.brief.productDescription}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("productDescription", event.target.value)
              }
              placeholder="Short description of the product"
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700 sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Main message
            </span>
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={payload.brief.mainMessage}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("mainMessage", event.target.value)
              }
              placeholder="Core message of the video"
              disabled={busy}
            />
          </label>

          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Platforms
            </span>
            <div className="flex flex-wrap gap-2">
              {(["TikTok", "Instagram Reels", "YouTube Shorts"] as const).map((platform) => {
                const isSelected = payload.brief.platforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? "border-sky-400 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-sky-300"
                    }`}
                    onClick={() => {
                      const next = isSelected
                        ? payload.brief.platforms.filter((p) => p !== platform)
                        : [...payload.brief.platforms, platform];
                      if (next.length > 0) updateBrief("platforms", next);
                    }}
                    disabled={busy}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Aspect ratio
            </span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={payload.brief.aspectRatio}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                updateBrief("aspectRatio", event.target.value as Brief["aspectRatio"])
              }
              disabled={busy}
            >
              <option value="9:16">9:16 (Vertical)</option>
              <option value="1:1">1:1 (Square)</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Resolution
            </span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={payload.brief.resolution}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                updateBrief("resolution", event.target.value as Brief["resolution"])
              }
              disabled={busy}
            >
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Duration
            </span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={payload.brief.targetDuration}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                updateBrief(
                  "targetDuration",
                  Number(event.target.value) as Brief["targetDuration"],
                )
              }
              disabled={busy}
            >
              <option value={15}>15 seconds</option>
              <option value={20}>20 seconds</option>
              <option value={30}>30 seconds</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              CTA
            </span>
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={payload.brief.callToAction}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("callToAction", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Brand tone
            </span>
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={payload.brief.brandTone}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("brandTone", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Primary color
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                value={normalizeHexColor(payload.brandKit.primaryColorHex)}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  updateBrandKit("primaryColorHex", event.target.value.toUpperCase())
                }
                disabled={busy}
              />
              <input
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                value={payload.brandKit.primaryColorHex ?? ""}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  updateBrandKit("primaryColorHex", event.target.value)
                }
                placeholder="#2E7D32"
                disabled={busy}
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Secondary color
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                value={normalizeHexColor(payload.brandKit.secondaryColorHex)}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  updateBrandKit("secondaryColorHex", event.target.value.toUpperCase())
                }
                disabled={busy}
              />
              <input
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                value={payload.brandKit.secondaryColorHex ?? ""}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  updateBrandKit("secondaryColorHex", event.target.value)
                }
                placeholder="#FFFFFF"
                disabled={busy}
              />
            </div>
          </label>
        </div>

        <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Images</h3>
            <p className="text-sm text-slate-500">Kéo thả ảnh vào khung hoặc bấm để chọn file.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {assetSlots.map((slot) => {
              const asset = getAssetByType(payload.brandKit.assets, slot.type) ?? emptyAsset(slot.type);
              const isUploading = uploadingAssetType === slot.type;
              const isDragging = draggingAssetType === slot.type;
              const hasPreview = Boolean(asset.publicUrl);

              return (
                <div
                  key={slot.type}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-slate-900">{slot.title}</div>
                    <div className="text-xs text-slate-500">{slot.hint}</div>
                  </div>

                  <label
                    className={`relative flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-4 py-5 text-center transition ${
                      isDragging
                        ? "border-sky-400 bg-sky-50"
                        : "border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50/60"
                    }`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (!busy && uploadingAssetType === null) {
                        setDraggingAssetType(slot.type);
                      }
                    }}
                    onDragLeave={() => {
                      setDraggingAssetType((current) => (current === slot.type ? null : current));
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const file = event.dataTransfer.files?.[0] ?? null;
                      void handleAssetUpload(slot.type, file);
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const file = event.currentTarget.files?.[0] ?? null;
                        void handleAssetUpload(slot.type, file);
                        event.currentTarget.value = "";
                      }}
                      disabled={busy || uploadingAssetType !== null}
                    />

                    {hasPreview ? (
                      <>
                        <Image
                          src={asset.publicUrl!}
                          alt={asset.fileName || slot.title}
                          width={800}
                          height={500}
                          className="h-full w-full rounded-xl object-cover"
                        />
                        <div className="absolute inset-x-4 bottom-4 rounded-xl bg-white/88 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
                          Bấm hoặc kéo thả để thay ảnh
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-7 w-7"
                            aria-hidden="true"
                          >
                            <path d="M12 16V4" />
                            <path d="m7 9 5-5 5 5" />
                            <path d="M5 20h14" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium text-slate-700">
                          {isUploading ? "Đang tải lên..." : "Kéo thả ảnh vào đây"}
                        </div>
                        <div className="text-sm text-slate-500">hoặc bấm để chọn file</div>
                      </div>
                    )}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleCreateProject}
            disabled={busy || uploadingAssetType !== null}
          >
            Create
          </button>

          <button
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleGenerate}
            disabled={
              busy || uploadingAssetType !== null || !project?.projectId || isProjectActive
            }
          >
            {isProjectActive ? "Generating..." : "Generate"}
          </button>

          <button
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleRefresh}
            disabled={busy || uploadingAssetType !== null || !project?.projectId}
          >
            Reload
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="space-y-6">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">Run Status</h2>
              <p className="text-sm text-slate-500">
                {project?.projectId ? project.projectId : "No project"}
              </p>
            </div>
            <span
              className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${statusColor(
                project?.status ?? "draft",
              )}`}
            >
              {project?.status ?? "draft"}
            </span>
          </div>

          <ol className="mt-5 space-y-3 text-sm">
            {workflowNodeIds.map((nodeId) => {
              const nodeRun = project?.workflowStatus?.[nodeId];
              const status = nodeRun?.status ?? "pending";
              const isExpanded = expandedNode === nodeId;
              const resultLines = getNodeResultLines(project, nodeId);

              return (
                <li key={nodeId} className="rounded-2xl border border-slate-200 bg-slate-50">
                  <button
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    onClick={() =>
                      setExpandedNode((prev) => (prev === nodeId ? null : nodeId))
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${nodeStatusColor(status)}`} />
                      <span className="font-medium text-slate-900">{nodeId}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1 font-medium text-slate-600">
                        {nodeStatusText(status)}
                      </span>
                      <span>{formatElapsedTime(nodeRun?.startedAt, nodeRun?.completedAt)}</span>
                      {nodeRun?.startedAt ? <span>{formatTimestamp(nodeRun.startedAt)}</span> : null}
                    </div>
                  </button>

                  {nodeRun && isExpanded ? (
                    <div className="space-y-3 border-t border-slate-200 px-4 py-4 text-xs text-slate-600">
                      {nodeRun.errorMessage ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                          {nodeRun.errorMessage}
                        </div>
                      ) : null}

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <div className="text-slate-400">Status</div>
                          <div className="font-medium text-slate-900">{nodeStatusText(status)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Attempts</div>
                          <div className="font-medium text-slate-900">{nodeRun.attempts}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Started</div>
                          <div className="font-medium text-slate-900">
                            {formatTimestamp(nodeRun.startedAt) || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Completed</div>
                          <div className="font-medium text-slate-900">
                            {formatTimestamp(nodeRun.completedAt) || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Elapsed</div>
                          <div className="font-medium text-slate-900">
                            {formatElapsedTime(nodeRun.startedAt, nodeRun.completedAt)}
                          </div>
                        </div>
                      </div>

                      {nodeRun.status !== "pending" && resultLines.length ? (
                        <div className="space-y-2">
                          <div className="text-slate-400">
                            {nodeRun.status === "completed" ? "Result" : "Progress"}
                          </div>
                          <ul className="space-y-1">
                            {resultLines.map((line, index) => (
                              <li key={`${nodeId}-result-${index}`} className="text-slate-700">
                                {line}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <div className="text-slate-400">Logs</div>
                        {nodeRun.logs.length ? (
                          <ul className="space-y-1">
                            {nodeRun.logs.map((line, index) => (
                              <li key={`${nodeId}-${index}`} className="text-slate-700">
                                {line}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-slate-400">No logs yet.</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Variants</h2>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {project?.variants?.length ? (
              project.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900">{variant.name}</div>
                      <div className="text-xs text-slate-500">{variant.strategy?.angle}</div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                      {variant.id}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Title
                      </div>
                      <div className="mt-1 text-slate-900">
                        {variant.generatedTitle ?? "Not generated yet."}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Hook
                      </div>
                      <div className="mt-1 text-slate-900">
                        {variant.selectedHook?.text ?? "Not generated yet."}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Script beats
                      </div>
                      {variant.script?.length ? (
                        <ul className="mt-2 space-y-1 text-xs text-slate-700">
                          {variant.script.slice(0, 6).map((beat) => (
                            <li key={`${variant.id}-${beat.startMs}`}>
                              <span className="text-slate-400">
                                {Math.round(beat.startMs / 1000)}s–{Math.round(beat.endMs / 1000)}s:
                              </span>{" "}
                              {beat.narration}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-1 text-slate-400">Not generated yet.</div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Caption
                      </div>
                      <div className="mt-1 whitespace-pre-line text-slate-900">
                        {variant.generatedCaption ?? "Not generated yet."}
                      </div>
                      {variant.generatedHashtags?.length ? (
                        <div className="mt-2 text-xs text-sky-700">
                          {variant.generatedHashtags.join(" ")}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Segment plan
                      </div>
                      {variant.segmentPlan?.length ? (
                        <ul className="mt-2 space-y-2 text-xs text-slate-700">
                          {variant.segmentPlan.map((segment) => (
                            <li
                              key={segment.id}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-slate-900">{segment.id}</span>
                                <span className="text-slate-400">
                                  {segment.durationSeconds}s · {segment.purpose} ·{" "}
                                  {segment.generationMode ?? "T2V"} ·{" "}
                                  {segment.status ?? "pending"}
                                </span>
                              </div>
                              <div className="mt-1 text-slate-600">
                                {truncate(
                                  segment.promptSummary ?? "Prompt summary pending.",
                                  180,
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-1 text-slate-400">Not generated yet.</div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Evaluation
                      </div>
                      {variant.score ? (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <span className="text-slate-600">Publishable score</span>
                            <span className="font-semibold text-slate-900">
                              {variant.score.publishableScore}
                            </span>
                          </div>
                          <div className="text-slate-700">
                            {variant.evaluationSummary ?? "No summary yet."}
                          </div>
                          {variant.evaluationNotes?.length ? (
                            <ul className="space-y-1 text-xs text-slate-700">
                              {variant.evaluationNotes.map((note) => (
                                <li key={`${variant.id}-${note}`}>{note}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-1 text-slate-400">Not generated yet.</div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Artifacts
                      </div>
                      {variant.artifacts.length ? (
                        <ul className="mt-2 space-y-1 text-xs text-slate-700">
                          {variant.artifacts.map((artifact) => (
                            <li key={`${variant.id}-${artifact.kind}-${artifact.path}`}>
                              <span className="text-slate-400">
                                {artifactLabel(artifact.kind)}:
                              </span>{" "}
                              {truncate(artifact.path, 88)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-1 text-slate-400">Not generated yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-400 lg:col-span-2">
                No variants available yet.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Outputs</h2>
              <p className="text-sm text-slate-500">
                Hiện UI output da co 2 nhom: revision plan va export bundle.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Revision</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {project?.revisionPlan?.length ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Exports</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {project?.exports?.length ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Revision plan
              </div>
              {project?.revisionPlan?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {project.revisionPlan.map((item, index) => (
                    <li
                      key={`${item.target}-${item.action}-${index}`}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="font-medium text-slate-900">
                        {item.target} → {item.action}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {item.sceneId ? `Scene: ${item.sceneId}` : null}
                        {item.sceneId && item.segmentId ? " · " : null}
                        {item.segmentId ? `Segment: ${item.segmentId}` : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-400">
                  Chua co revision plan tren UI. Phan nay da co khung hien thi, nhung du lieu se
                  xuat hien sau khi workflow chay xong.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Export bundle
              </div>
              {project?.exports?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {project.exports.map((item) => (
                    <li
                      key={`${item.type}-${item.path}`}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="font-medium text-slate-900">{item.label}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {truncate(item.path, 88)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-400">
                  Chua co export bundle tren UI. Hien tai phan output da du khung metadata, nhung
                  chua co nut download hay preview file thuc te.
                </div>
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
