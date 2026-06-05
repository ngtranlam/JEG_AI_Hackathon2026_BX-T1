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

const EXAMPLES: ExamplePreset[] = [
  {
    label: "F&B (GreenBite)",
    payload: {
      brief: {
        brandName: "GreenBite",
        productName: "Healthy salad delivery",
        audience: "Office workers 25-35",
        objective: "Drive first orders for lunch delivery",
        offer: "Free delivery for first order",
        primaryCallToAction: "Order now",
        toneOfVoice: "fresh, energetic, trustworthy",
        platform: "tiktok",
        durationSeconds: 20,
        complianceNotes: ["No fast weight-loss claims."],
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
        audience: "Skincare beginners, 18-28",
        objective: "Increase add-to-cart for the serum",
        offer: "Bundle discount this week",
        primaryCallToAction: "Tap to shop",
        toneOfVoice: "calm, premium, confident",
        platform: "instagram-reels",
        durationSeconds: 30,
        complianceNotes: ["Avoid medical claims.", "Avoid before/after exaggeration."],
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
    case "prompt-export":
      return "Prompt export";
    default:
      return kind;
  }
}

function emptyAsset(type: BrandAsset["type"] = "product-image"): BrandAsset {
  return {
    type,
    fileName: "",
    filePath: "",
  };
}

function statusColor(status: string) {
  switch (status) {
    case "running":
      return "bg-sky-400/20 text-sky-200 border-sky-400/30";
    case "completed":
      return "bg-emerald-400/20 text-emerald-200 border-emerald-400/30";
    case "failed":
      return "bg-rose-500/20 text-rose-200 border-rose-500/30";
    case "queued":
      return "bg-amber-400/20 text-amber-200 border-amber-400/30";
    default:
      return "bg-white/10 text-slate-200 border-white/10";
  }
}

function nodeStatusColor(status: string) {
  switch (status) {
    case "running":
      return "bg-sky-400";
    case "completed":
      return "bg-emerald-400";
    case "failed":
      return "bg-rose-500";
    case "skipped":
      return "bg-slate-500";
    default:
      return "bg-slate-700";
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
  const [uploadingAssetIndex, setUploadingAssetIndex] = React.useState<number | null>(
    null,
  );
  const [expandedNode, setExpandedNode] = React.useState<WorkflowNodeId | null>(
    null,
  );

  React.useEffect(() => {
    setPayload(activePreset.payload);
  }, [activePreset]);

  const shouldPoll = project?.status === "queued" || project?.status === "running";

  React.useEffect(() => {
    if (!project?.projectId || !shouldPoll) return;

    const interval = window.setInterval(async () => {
      try {
        const response = await getJson<{ project: ProjectState | null }>(
          `/api/projects/${project.projectId}`,
        );
        if (response.project) {
          setProject(response.project);
        }
      } catch {
        window.clearInterval(interval);
      }
    }, 1200);

    return () => window.clearInterval(interval);
  }, [project?.projectId, shouldPoll]);

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

  function updateBrief<K extends keyof Brief>(key: K, value: Brief[K]) {
    setPayload((prev: CreateProjectPayload) => ({
      ...prev,
      brief: {
        ...prev.brief,
        [key]: value,
      },
    }));
  }

  function updateBrandKit<K extends keyof BrandKit>(key: K, value: BrandKit[K]) {
    setPayload((prev: CreateProjectPayload) => ({
      ...prev,
      brandKit: {
        ...prev.brandKit,
        [key]: value,
      },
    }));
  }

  function updateBrandAsset(
    index: number,
    key: keyof BrandAsset,
    value: BrandAsset[keyof BrandAsset],
  ) {
    setPayload((prev) => ({
      ...prev,
      brandKit: {
        ...prev.brandKit,
        assets: prev.brandKit.assets.map((asset, assetIndex) =>
          assetIndex === index
            ? {
                ...asset,
                [key]: value,
              }
            : asset,
        ),
      },
    }));
  }

  function addBrandAsset(type: BrandAsset["type"]) {
    setPayload((prev) => ({
      ...prev,
      brandKit: {
        ...prev.brandKit,
        assets: [...prev.brandKit.assets, emptyAsset(type)],
      },
    }));
  }

  function removeBrandAsset(index: number) {
    setPayload((prev) => ({
      ...prev,
      brandKit: {
        ...prev.brandKit,
        assets: prev.brandKit.assets.filter((_, assetIndex) => assetIndex !== index),
      },
    }));
  }

  async function handleAssetUpload(index: number, fileList: FileList | null) {
    const file = fileList?.[0];
    const asset = payload.brandKit.assets[index];

    if (!file || !asset) return;

    setUploadingAssetIndex(index);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("assetType", asset.type);

      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as UploadImageResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to upload image.");
      }

      setPayload((prev) => ({
        ...prev,
        brandKit: {
          ...prev.brandKit,
          assets: prev.brandKit.assets.map((item, assetIndex) =>
            assetIndex === index
              ? {
                  ...item,
                  ...data.asset,
                }
              : item,
          ),
        },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload image.";
      setError(message);
    } finally {
      setUploadingAssetIndex(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white">Project Input</h2>
            <p className="text-sm text-slate-300">
              Create a project, enqueue generation, and watch node-by-node orchestration.
            </p>
          </div>

          <label className="flex flex-col gap-1 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Example preset
            </span>
            <select
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
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
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Brand name
            </span>
            <input
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              value={payload.brief.brandName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("brandName", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Product name
            </span>
            <input
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              value={payload.brief.productName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("productName", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Audience
            </span>
            <input
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              value={payload.brief.audience}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("audience", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Objective
            </span>
            <input
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              value={payload.brief.objective}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("objective", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Platform
            </span>
            <select
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              value={payload.brief.platform}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                updateBrief("platform", event.target.value as Brief["platform"])
              }
              disabled={busy}
            >
              <option value="tiktok">TikTok</option>
              <option value="instagram-reels">Reels</option>
              <option value="youtube-shorts">Shorts</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Duration (seconds)
            </span>
            <select
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              value={payload.brief.durationSeconds}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                updateBrief(
                  "durationSeconds",
                  Number(event.target.value) as Brief["durationSeconds"],
                )
              }
              disabled={busy}
            >
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              CTA
            </span>
            <input
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              value={payload.brief.primaryCallToAction}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("primaryCallToAction", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Tone of voice
            </span>
            <input
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              value={payload.brief.toneOfVoice}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrief("toneOfVoice", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Primary color
            </span>
            <input
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              value={payload.brandKit.primaryColorHex ?? ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrandKit("primaryColorHex", event.target.value)
              }
              disabled={busy}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Secondary color
            </span>
            <input
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              value={payload.brandKit.secondaryColorHex ?? ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateBrandKit("secondaryColorHex", event.target.value)
              }
              disabled={busy}
            />
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Asset Inputs</h3>
              <p className="mt-1 text-xs text-slate-400">
                Upload logo, product, moodboard, or reference images locally for the
                workflow. Files are stored under <code>/public/uploads</code> in this MVP.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white"
                type="button"
                onClick={() => addBrandAsset("logo")}
                disabled={busy}
              >
                Add logo
              </button>
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white"
                type="button"
                onClick={() => addBrandAsset("product-image")}
                disabled={busy}
              >
                Add product image
              </button>
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white"
                type="button"
                onClick={() => addBrandAsset("moodboard")}
                disabled={busy}
              >
                Add moodboard
              </button>
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white"
                type="button"
                onClick={() => addBrandAsset("reference")}
                disabled={busy}
              >
                Add reference
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {payload.brandKit.assets.length ? (
              payload.brandKit.assets.map((asset, index) => (
                <div
                  key={`${asset.type}-${index}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[0.9fr_1fr_1.2fr_auto]">
                    <label className="flex flex-col gap-2 text-sm text-slate-200">
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Type
                      </span>
                      <select
                        className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                        value={asset.type}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                          updateBrandAsset(index, "type", event.target.value as BrandAsset["type"])
                        }
                        disabled={busy || uploadingAssetIndex !== null}
                      >
                        <option value="logo">Logo</option>
                        <option value="product-image">Product image</option>
                        <option value="moodboard">Moodboard</option>
                        <option value="reference">Reference</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-slate-200">
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        File name
                      </span>
                      <input
                        className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                        value={asset.fileName}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          updateBrandAsset(index, "fileName", event.target.value)
                        }
                        placeholder="logo.png"
                        disabled={busy || uploadingAssetIndex !== null}
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-slate-200">
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        File path
                      </span>
                      <input
                        className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                        value={asset.filePath}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          updateBrandAsset(index, "filePath", event.target.value)
                        }
                        placeholder="uploads/product_01.jpg"
                        disabled={busy || uploadingAssetIndex !== null}
                      />
                    </label>

                    <div className="flex items-end">
                      <button
                        className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-100"
                        type="button"
                        onClick={() => removeBrandAsset(index)}
                        disabled={busy || uploadingAssetIndex !== null}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-slate-200">
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Upload image
                      </span>
                      <input
                        className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                        type="file"
                        accept="image/*"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          const { files } = event.currentTarget;
                          void handleAssetUpload(index, files);
                          event.currentTarget.value = "";
                        }}
                        disabled={busy || uploadingAssetIndex !== null}
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm text-slate-200">
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          MIME type
                        </span>
                        <input
                          className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-400"
                          value={asset.mimeType ?? ""}
                          placeholder="image/png"
                          readOnly
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm text-slate-200">
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Public URL
                        </span>
                        <input
                          className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-400"
                          value={asset.publicUrl ?? ""}
                          placeholder="/uploads/..."
                          readOnly
                        />
                      </label>
                    </div>
                  </div>

                  {uploadingAssetIndex === index ? (
                    <div className="mt-3 text-xs text-sky-200">Uploading image...</div>
                  ) : null}

                  {asset.publicUrl ? (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
                      <Image
                        src={asset.publicUrl}
                        alt={asset.fileName || `${asset.type} preview`}
                        width={960}
                        height={320}
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm text-slate-400">
                No assets added yet. Add and upload at least a logo or product image for a
                more realistic workflow input.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={handleCreateProject}
            disabled={busy || uploadingAssetIndex !== null}
          >
            Create project
          </button>

          <button
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={handleGenerate}
            disabled={busy || uploadingAssetIndex !== null || !project?.projectId}
          >
            Enqueue generation
          </button>

          <button
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={handleRefresh}
            disabled={busy || uploadingAssetIndex !== null || !project?.projectId}
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </section>

      <section className="space-y-6">
        <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-white">Workflow</h2>
              <p className="text-sm text-slate-300">
                {project?.projectId ? (
                  <>
                    Project <span className="font-semibold text-white">{project.projectId}</span>
                  </>
                ) : (
                  "Create a project to start."
                )}
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

          <ol className="mt-5 space-y-3 text-sm text-slate-200">
            {workflowNodeIds.map((nodeId) => {
              const nodeRun = project?.workflowStatus?.[nodeId];
              const status = nodeRun?.status ?? "pending";
              const isExpanded = expandedNode === nodeId;

              return (
                <li key={nodeId} className="rounded-2xl border border-white/10 bg-white/5">
                  <button
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    onClick={() =>
                      setExpandedNode((prev) => (prev === nodeId ? null : nodeId))
                    }
                    disabled={!nodeRun}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${nodeStatusColor(status)}`} />
                      <span className="font-medium text-white">{nodeId}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span>{status}</span>
                      {nodeRun?.startedAt ? (
                        <span className="text-slate-400">{formatTimestamp(nodeRun.startedAt)}</span>
                      ) : null}
                    </div>
                  </button>

                  {nodeRun && isExpanded ? (
                    <div className="space-y-3 border-t border-white/10 px-4 py-4 text-xs text-slate-300">
                      {nodeRun.errorMessage ? (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-100">
                          {nodeRun.errorMessage}
                        </div>
                      ) : null}

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <div className="text-slate-400">Attempts</div>
                          <div className="text-white">{nodeRun.attempts}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Completed</div>
                          <div className="text-white">
                            {formatTimestamp(nodeRun.completedAt) || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-slate-400">Logs</div>
                        {nodeRun.logs.length ? (
                          <ul className="space-y-1">
                            {nodeRun.logs.map((line, index) => (
                              <li key={`${nodeId}-${index}`} className="text-slate-200">
                                {line}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-slate-500">No logs yet.</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">Variants</h2>
          <p className="mt-1 text-sm text-slate-300">
            Once planning nodes run, the A/B strategies, hooks, scripts, segments, and
            prompt summaries appear here.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {project?.variants?.length ? (
              project.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-white">{variant.name}</div>
                      <div className="text-xs text-slate-400">{variant.strategy?.angle}</div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                      {variant.id}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-slate-200">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Title
                      </div>
                      <div className="mt-1 text-slate-100">
                        {variant.generatedTitle ?? "Not generated yet."}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Hook
                      </div>
                      <div className="mt-1 text-slate-100">
                        {variant.selectedHook?.text ?? "Not generated yet."}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Script beats
                      </div>
                      {variant.script?.length ? (
                        <ul className="mt-2 space-y-1 text-xs text-slate-200">
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
                        <div className="mt-1 text-slate-500">Not generated yet.</div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Caption
                      </div>
                      <div className="mt-1 whitespace-pre-line text-slate-100">
                        {variant.generatedCaption ?? "Not generated yet."}
                      </div>
                      {variant.generatedHashtags?.length ? (
                        <div className="mt-2 text-xs text-sky-200">
                          {variant.generatedHashtags.join(" ")}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Segment plan
                      </div>
                      {variant.segmentPlan?.length ? (
                        <ul className="mt-2 space-y-2 text-xs text-slate-200">
                          {variant.segmentPlan.map((segment) => (
                            <li
                              key={segment.id}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-white">{segment.id}</span>
                                <span className="text-slate-400">
                                  {segment.durationSeconds}s · {segment.purpose} ·{" "}
                                  {segment.generationMode ?? "T2V"} ·{" "}
                                  {segment.status ?? "pending"}
                                </span>
                              </div>
                              <div className="mt-1 text-slate-300">
                                {truncate(
                                  segment.promptSummary ?? "Prompt summary pending.",
                                  180,
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-1 text-slate-500">Not generated yet.</div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Evaluation
                      </div>
                      {variant.score ? (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <span className="text-slate-300">Publishable score</span>
                            <span className="font-semibold text-white">
                              {variant.score.publishableScore}
                            </span>
                          </div>
                          <div className="text-slate-300">
                            {variant.evaluationSummary ?? "No summary yet."}
                          </div>
                          {variant.evaluationNotes?.length ? (
                            <ul className="space-y-1 text-xs text-slate-200">
                              {variant.evaluationNotes.map((note) => (
                                <li key={`${variant.id}-${note}`}>{note}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-1 text-slate-500">Not generated yet.</div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Artifacts
                      </div>
                      {variant.artifacts.length ? (
                        <ul className="mt-2 space-y-1 text-xs text-slate-200">
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
                        <div className="mt-1 text-slate-500">Not generated yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/30 p-6 text-sm text-slate-400 lg:col-span-2">
                No variants available yet.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <h2 className="text-xl font-semibold text-white">Revision and Exports</h2>
          <p className="mt-1 text-sm text-slate-300">
            The mock-first workflow also prepares a safe revision plan and export bundle metadata.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Revision plan
              </div>
              {project?.revisionPlan?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {project.revisionPlan.map((item, index) => (
                    <li
                      key={`${item.target}-${item.action}-${index}`}
                      className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2"
                    >
                      <div className="font-medium text-white">
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
                <div className="mt-3 text-sm text-slate-500">Not generated yet.</div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Export bundle
              </div>
              {project?.exports?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {project.exports.map((item) => (
                    <li
                      key={`${item.type}-${item.path}`}
                      className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2"
                    >
                      <div className="font-medium text-white">{item.label}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {truncate(item.path, 88)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 text-sm text-slate-500">Not generated yet.</div>
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
