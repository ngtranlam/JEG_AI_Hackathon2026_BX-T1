# AI Video Content Factory Implementation Plan

## 1. Goal

Build a minimal but professional web application that transforms a structured marketing brief plus brand kit into **two meaningfully different short-form video variants** that are ready to review and export.

This plan follows the project rules and skills exactly:

- Seedance 2.0 is mandatory for video generation.
- TRAE orchestration must be visible in the product experience.
- The system must generate 2 meaningful variants, not 2 cosmetic prompt rewrites.
- The pipeline must support 15s, 20s, and 30s videos.
- Long videos must be produced through segment planning, segment generation, normalization, and stitching.
- The output must include publish-ready assets beyond the video itself.
- The demo must clearly show workflow progress, intermediate artifacts, final results, and exports.

## 2. Product Scope

### In scope

- Single-project workflow from brief input to downloadable outputs
- Brand kit ingestion
- A/B creative strategy generation
- Hook, script, storyboard, and segment planning
- Seedance-powered video segment generation
- FFmpeg-based normalization and stitching
- Voiceover generation
- Subtitle generation and burn-in
- Cover, title, caption, and export package generation
- Publishability scoring
- Editor feedback and selective regeneration

### Out of scope

- Authentication
- Billing
- Multi-user workspaces
- Social publishing integrations
- CRM / calendar / campaign dashboards
- Heavy infrastructure such as microservices, Kafka, Kubernetes
- Rendering brand text or logos directly inside Seedance-generated clips

## 3. Delivery Strategy

### MVP first

The MVP must prove the end-to-end story in one demo flow:

1. User fills brief and uploads brand assets.
2. User clicks one generate button.
3. UI shows visible node-by-node orchestration.
4. System produces Variant A and Variant B side by side.
5. User can inspect hook, script, storyboard, score, and downloadable outputs.

### Suggested stack

- Next.js + TypeScript + Tailwind CSS
- Next.js API routes for backend endpoints
- BullMQ + Redis for async workflow jobs
- SQLite for MVP persistence
- Local filesystem for artifact storage
- ModelArk for text generation with Seed 2.0
- Seedance 2.0 for video generation
- ElevenLabs for voiceover
- FFmpeg for normalization, stitching, audio mix, and subtitle burn-in
- Sharp for image processing and covers

## 4. Architecture Summary

### Core principles

- `project` is the central source of truth.
- Every workflow node reads project state and writes back structured outputs.
- Every node stores status, logs, artifacts, timestamps, and errors.
- Revisions must regenerate only the affected downstream scope.
- UI must never block while generation is in progress.

### Workflow order

1. Input Validator
2. Brief Analyzer
3. Brand DNA Extractor
4. Creative Direction Generator
5. Hook Generator and Scorer
6. Script Writer
7. Storyboard Planner
8. Segment Planner
9. Seedance Prompt Builder
10. Seedance Segment Generator
11. Segment Normalizer
12. Video Stitching Agent
13. Voiceover Generator
14. Subtitle Burn-in Agent
15. Cover / Caption / Title Generator
16. Evaluation Agent
17. Editor Revision Router
18. Export Packager

### Data model baseline

```ts
type ProjectState = {
  project_id: string
  status: 'draft' | 'running' | 'completed' | 'failed'
  brief: Brief
  brand_kit: BrandKit
  analysis?: BriefAnalysis
  brand_dna?: BrandDNA
  variants: Variant[]
  workflow_status: Record<string, NodeStatus>
  exports?: ExportPackage
}
```

## 5. Phased Roadmap

### Phase 0 - Foundation and Environment

**Outcome:** a runnable repo with the required tools, local setup, and directory structure.

- Initialize app structure and dependency baseline.
- Configure TypeScript, linting, formatting, and env handling.
- Create folder conventions for workflows, nodes, storage, media, and UI.
- Add Redis, SQLite, FFmpeg, and local storage setup instructions.
- Add seed `.env.example` with all required keys.

### Phase 1 - Types, Storage, and Project State

**Outcome:** a stable internal contract for every node and API route.

- Define all core types: brief, brand kit, variants, segments, assets, exports, scores.
- Create SQLite schema or Prisma models for project metadata and workflow state.
- Define local artifact path conventions.
- Implement repository helpers for reading and writing project state.
- Ensure every artifact has a durable location and metadata record.

### Phase 2 - Workflow Engine and Queue

**Outcome:** an asynchronous, restartable runner that executes nodes sequentially.

- Build node interface and workflow runner.
- Add BullMQ job creation, retries, and status updates.
- Store node status transitions and logs.
- Support safe failure handling and resumable diagnostics.
- Add workflow event model for UI polling.

### Phase 3 - API Layer

**Outcome:** the app can create projects, start generation, observe progress, submit revisions, and download outputs.

- Build project creation endpoint.
- Build project detail endpoint.
- Build workflow start endpoint.
- Build polling endpoint for project/workflow state.
- Build revision endpoint.
- Build export download endpoints.

### Phase 4 - UI Shell and Demo Experience

**Outcome:** judges can understand the product value within 10 seconds.

- Build brief input screen and asset upload flow.
- Build workflow progress panel with visible node status.
- Build side-by-side output view for Variant A and Variant B.
- Show hooks, scripts, storyboard, scores, and export buttons.
- Add editor feedback box and regeneration controls.

### Phase 5 - Text Planning Nodes

**Outcome:** both variants have high-quality planning artifacts before media generation starts.

- Implement brief analysis.
- Implement brand DNA extraction.
- Implement creative direction generation.
- Implement hook generation and scoring.
- Implement script generation.
- Implement storyboard generation.
- Implement segment planning.
- Implement Seedance prompt building with fallbacks.

### Phase 6 - Seedance Media Pipeline

**Outcome:** planned segments become real normalized video assets.

- Create Seedance task lifecycle: create, poll, download.
- Generate clips for every segment in both variants.
- Normalize clips to consistent technical output.
- Stitch normalized clips into draft videos.
- Persist all intermediate media artifacts for review and reuse.

### Phase 7 - Audio and Subtitle Pipeline

**Outcome:** draft videos become publishable with narration and readable subtitles.

- Generate voiceover aligned to variant script.
- Produce subtitle timing data.
- Render ASS subtitle files using brand-safe styles.
- Burn subtitles into final draft.
- Mix voiceover audio correctly into exported video.

### Phase 8 - Publishing Assets and Export Packaging

**Outcome:** each variant has a full publish-ready bundle.

- Generate title, caption, CTA, hashtags, and cover image.
- Export 9:16 primary version.
- Export 1:1 derived version.
- Build downloadable package structure.
- Generate workflow report and artifact manifest.

### Phase 9 - Evaluation and QA Gates

**Outcome:** system can explain whether output is publishable and why.

- Implement scoring rubric.
- Score both variants consistently.
- Flag failing criteria.
- Surface scores and rationale in UI.
- Add acceptance verification against demo requirements.

### Phase 10 - Revision Loop

**Outcome:** users can request changes without rerunning unaffected steps.

- Accept editor feedback with structured change intent.
- Map feedback to affected nodes.
- Regenerate only downstream dependencies.
- Preserve version history and prior artifacts.
- Reflect revised outputs clearly in UI.

### Phase 11 - Demo Polish and Release Readiness

**Outcome:** the project is stable enough for a hackathon demo.

- Add sample brief and sample assets.
- Validate all user flows locally.
- Improve loading states and error messaging.
- Ensure artifacts are easy to inspect during presentation.
- Prepare demo script and fallback plan.

## 6. Detailed Issue / Ticket Breakdown

### Epic 0 - Project Foundation

#### ISSUE-0001 - Initialize repository structure

- **Goal:** create a clean implementation baseline.
- **Work:**
  - Create `/app`, `/components`, `/lib`, `/server`, `/workers`, `/docs`, `/outputs`.
  - Add subfolders for workflow nodes, storage, media, scoring, and API logic.
  - Define naming conventions for artifacts and jobs.
- **Acceptance criteria:**
  - Repo structure clearly separates UI, API, workflow, and media processing.
  - A new contributor can understand where each concern belongs.

#### ISSUE-0002 - Add core dependencies

- **Goal:** install the minimum required stack.
- **Work:**
  - Add Next.js, TypeScript, Tailwind, BullMQ, Redis client, SQLite/Prisma, Sharp, FFmpeg helpers, Zod, and SDK clients.
  - Add dev tools for linting and formatting.
- **Acceptance criteria:**
  - Project installs without dependency conflicts.
  - Required libraries exist for all scoped MVP features.

#### ISSUE-0003 - Create environment configuration

- **Goal:** standardize runtime configuration.
- **Work:**
  - Add `.env.example`.
  - Add typed env parsing and validation.
  - Document required keys for ModelArk, Seedance, ElevenLabs, Redis, database, and output paths.
- **Acceptance criteria:**
  - App fails fast when required env values are missing.
  - Setup instructions are reproducible on a fresh machine.

### Epic 1 - Types, Models, and Storage

#### ISSUE-0101 - Define `Brief` type

- **Goal:** formalize all required user inputs.
- **Work:**
  - Include brand name, product name, audience, objective, offer, CTA, tone, compliance notes, duration, and platform intent.
  - Add validation rules for required fields.
- **Acceptance criteria:**
  - Brief payload shape is shared across form, API, and workflow.

#### ISSUE-0102 - Define `BrandKit` type

- **Goal:** standardize uploaded brand assets and brand constraints.
- **Work:**
  - Support logo, product image, primary colors, secondary colors, fonts, tagline, forbidden claims, and visual notes.
- **Acceptance criteria:**
  - All downstream nodes can consume brand kit data from one stable structure.

#### ISSUE-0103 - Define `ProjectState` and workflow node contracts

- **Goal:** make the workflow deterministic.
- **Work:**
  - Create types for project status, workflow status, logs, artifacts, and per-node outputs.
  - Define shared runner signature for nodes.
- **Acceptance criteria:**
  - Every node follows the same state input/output contract.

#### ISSUE-0104 - Implement artifact storage conventions

- **Goal:** ensure all artifacts are persistable and traceable.
- **Work:**
  - Define folder layout by project, variant, node, and artifact type.
  - Add helpers for generating absolute file paths and public URLs.
- **Acceptance criteria:**
  - Any artifact can be resolved from project metadata without manual guessing.

#### ISSUE-0105 - Create persistence layer

- **Goal:** persist project state and workflow history.
- **Work:**
  - Create database schema for projects, node runs, artifacts, revisions, and exports.
  - Add repository helpers for create, read, update, append-log, and list-artifacts.
- **Acceptance criteria:**
  - Project and workflow state survives server restarts.

### Epic 2 - Workflow Engine

#### ISSUE-0201 - Create node status model

- **Goal:** support visible orchestration.
- **Work:**
  - Define states such as pending, running, completed, failed, skipped.
  - Record started at, completed at, error message, retry count, and artifact references.
- **Acceptance criteria:**
  - UI can render accurate status for every node.

#### ISSUE-0202 - Build base workflow runner

- **Goal:** run nodes sequentially against one project state object.
- **Work:**
  - Execute nodes in fixed order.
  - Save state after each node.
  - Stop correctly on failure.
- **Acceptance criteria:**
  - A project can progress node by node without losing state.

#### ISSUE-0203 - Add per-node logging

- **Goal:** make the system explainable during demo and debugging.
- **Work:**
  - Record human-readable log messages.
  - Store node input summary, output summary, and duration.
- **Acceptance criteria:**
  - Each node run leaves enough evidence for troubleshooting.

#### ISSUE-0204 - Add retry and failure policy

- **Goal:** improve resilience for unstable external calls.
- **Work:**
  - Retry transient failures for text, TTS, and video API calls.
  - Avoid retrying validation failures.
- **Acceptance criteria:**
  - Transient external errors do not immediately kill the whole workflow.

### Epic 3 - API Layer

#### ISSUE-0301 - Build `POST /api/projects`

- **Goal:** create a draft project from user input.
- **Work:**
  - Validate payload.
  - Save brief and brand kit metadata.
  - Return project ID and initial state.
- **Acceptance criteria:**
  - Frontend can create a new project with one request.

#### ISSUE-0302 - Build `GET /api/projects/:id`

- **Goal:** fetch current project state.
- **Work:**
  - Return project, variants, node statuses, scores, and available assets.
- **Acceptance criteria:**
  - Frontend can fully hydrate the project view from one endpoint.

#### ISSUE-0303 - Build `POST /api/projects/:id/generate`

- **Goal:** enqueue the workflow.
- **Work:**
  - Check project validity.
  - Push a generation job into BullMQ.
- **Acceptance criteria:**
  - Generation starts asynchronously and the request returns quickly.

#### ISSUE-0304 - Build revision endpoint

- **Goal:** support editor feedback.
- **Work:**
  - Accept comment text and optional target scope.
  - Save a revision request.
  - Trigger selective downstream regeneration.
- **Acceptance criteria:**
  - User can submit revision instructions without recreating the project.

#### ISSUE-0305 - Build download endpoints

- **Goal:** deliver final artifacts cleanly.
- **Work:**
  - Support download of 9:16, 1:1, subtitle file, cover, caption, and packaged bundle.
- **Acceptance criteria:**
  - Users can retrieve final outputs directly from UI buttons.

### Epic 4 - Queue and Async Jobs

#### ISSUE-0401 - Configure BullMQ and Redis

- **Goal:** handle generation outside the request cycle.
- **Work:**
  - Create queue, worker, and job naming conventions.
  - Add connection configuration and health checks.
- **Acceptance criteria:**
  - Jobs can be enqueued and processed locally.

#### ISSUE-0402 - Implement generation job processor

- **Goal:** connect API and workflow runner.
- **Work:**
  - Load project.
  - Run workflow.
  - Save final state and terminal status.
- **Acceptance criteria:**
  - Worker executes the pipeline without needing manual intervention.

#### ISSUE-0403 - Add job progress sync

- **Goal:** reflect runner progress in persisted project state.
- **Work:**
  - Update project status on every node transition.
  - Save job ID references for traceability.
- **Acceptance criteria:**
  - UI polling reflects near-real-time workflow progress.

### Epic 5 - UI: App Shell and Input

#### ISSUE-0501 - Build app layout

- **Goal:** create a clean demo-ready shell.
- **Work:**
  - Add header, content grid, workflow panel area, and results area.
- **Acceptance criteria:**
  - Layout supports both input and output views without clutter.

#### ISSUE-0502 - Build brief form

- **Goal:** capture all required brief data.
- **Work:**
  - Add structured inputs with validation and helper text.
  - Support duration options 15 / 20 / 30 seconds.
- **Acceptance criteria:**
  - User can complete all required fields without confusion.

#### ISSUE-0503 - Build brand asset upload

- **Goal:** collect minimum brand kit assets.
- **Work:**
  - Support logo and product image upload.
  - Support basic brand metadata fields.
- **Acceptance criteria:**
  - User can upload required assets before generation.

#### ISSUE-0504 - Add single generate CTA

- **Goal:** make the primary action obvious.
- **Work:**
  - Create one clear button to create project and trigger workflow.
- **Acceptance criteria:**
  - Demo flow starts from one prominent action.

### Epic 6 - UI: Workflow Visibility

#### ISSUE-0601 - Build workflow progress panel

- **Goal:** show TRAE orchestration clearly.
- **Work:**
  - Render all node names in order.
  - Show status chips, timestamps, and current active step.
- **Acceptance criteria:**
  - A judge can visually confirm that the system is running a staged workflow.

#### ISSUE-0602 - Build node detail drawer

- **Goal:** expose intermediate artifacts and reasoning.
- **Work:**
  - Show logs, summaries, and artifact links for the selected node.
- **Acceptance criteria:**
  - Users can inspect what each node produced.

### Epic 7 - UI: Variant Output and Export

#### ISSUE-0701 - Build side-by-side variant view

- **Goal:** make A/B comparison immediate.
- **Work:**
  - Render Variant A and Variant B cards in parallel.
  - Show strategy label for each.
- **Acceptance criteria:**
  - Differences between variants are visible without extra clicks.

#### ISSUE-0702 - Show planning artifacts

- **Goal:** make the creative pipeline inspectable.
- **Work:**
  - Show hook, script, storyboard, segment table, and prompt summary.
- **Acceptance criteria:**
  - Users can inspect text outputs before and after media generation.

#### ISSUE-0703 - Show score and export actions

- **Goal:** present publish-ready outcomes clearly.
- **Work:**
  - Render publishable score, rationale, and download buttons.
- **Acceptance criteria:**
  - Final review and export actions are accessible in one place.

### Epic 8 - Input Validator Node

#### ISSUE-0801 - Validate brief completeness

- **Goal:** stop invalid projects early.
- **Work:**
  - Check required fields and supported durations.
  - Check presence of minimum brand kit assets.
- **Acceptance criteria:**
  - Invalid projects fail before expensive generation starts.

### Epic 9 - Brief Analyzer Node

#### ISSUE-0901 - Generate brief analysis

- **Goal:** extract production-relevant planning signals.
- **Work:**
  - Derive audience, value proposition, problem statement, CTA goal, and platform fit.
- **Acceptance criteria:**
  - Downstream creative nodes receive a structured analysis object.

### Epic 10 - Brand DNA Extractor Node

#### ISSUE-1001 - Generate brand DNA

- **Goal:** make brand consistency explicit and reusable.
- **Work:**
  - Derive voice, visual tone, pacing cues, emotional range, prohibited claims, and brand anchors.
- **Acceptance criteria:**
  - Every downstream node can inherit brand-safe guidance.

### Epic 11 - Creative Direction Node

#### ISSUE-1101 - Generate two distinct creative strategies

- **Goal:** produce meaningful A/B divergence.
- **Work:**
  - Variant A: emotional storytelling.
  - Variant B: product-led demo.
  - Add rationale for why the strategies differ.
- **Acceptance criteria:**
  - The two variants are clearly not interchangeable.

### Epic 12 - Hook Generator and Scorer Node

#### ISSUE-1201 - Generate multiple hooks per variant

- **Goal:** improve hook quality before script writing.
- **Work:**
  - Generate several hooks.
  - Score them against audience fit, clarity, novelty, and platform fit.
  - Keep the best candidate.
- **Acceptance criteria:**
  - Each variant has one selected hook plus rejected alternatives for traceability.

### Epic 13 - Script Writer Node

#### ISSUE-1301 - Generate timed scripts

- **Goal:** create usable narration and shot structure.
- **Work:**
  - Produce script beats aligned to the selected duration.
  - Keep CTA and compliance intact.
- **Acceptance criteria:**
  - Scripts are segmented enough to feed storyboard and TTS generation.

### Epic 14 - Storyboard Planner Node

#### ISSUE-1401 - Generate storyboard frames

- **Goal:** convert scripts into visual execution plans.
- **Work:**
  - Define scene intent, shot type, motion, subject, and transition ideas.
- **Acceptance criteria:**
  - Storyboard data is sufficiently detailed for segment planning.

### Epic 15 - Segment Planner Node

#### ISSUE-1501 - Split each variant into Seedance-safe segments

- **Goal:** respect model duration limits.
- **Work:**
  - Break video into short segments.
  - Assign target duration and purpose to each segment.
- **Acceptance criteria:**
  - Total segment duration matches requested final length.

#### ISSUE-1502 - Create segment dependency metadata

- **Goal:** support selective regeneration and stitching.
- **Work:**
  - Track order, prompt source, expected assets, and downstream dependency map.
- **Acceptance criteria:**
  - System can regenerate one affected segment without losing global context.

### Epic 16 - Seedance Prompt Builder Node

#### ISSUE-1601 - Build segment prompts

- **Goal:** turn storyboard intent into generation-ready prompts.
- **Work:**
  - Merge storyboard, brand DNA, compliance notes, and creative strategy into each segment prompt.
- **Acceptance criteria:**
  - Prompts are specific enough for short-form visual generation.

#### ISSUE-1602 - Add prompt fallback logic

- **Goal:** improve recovery from failed or weak generations.
- **Work:**
  - Create simplified fallback prompts when first-pass prompts fail or produce poor outputs.
- **Acceptance criteria:**
  - System has a defined fallback strategy instead of silently failing.

### Epic 17 - Seedance Segment Generator Node

#### ISSUE-1701 - Integrate Seedance task creation

- **Goal:** create generation jobs for every planned segment.
- **Work:**
  - Send prompts and settings to Seedance.
  - Store external task IDs.
- **Acceptance criteria:**
  - Each segment has a traceable external generation task.

#### ISSUE-1702 - Implement poll and download lifecycle

- **Goal:** retrieve generated media reliably.
- **Work:**
  - Poll task status.
  - Download resulting clip.
  - Save local artifact references.
- **Acceptance criteria:**
  - Completed Seedance tasks produce locally stored clip files.

#### ISSUE-1703 - Capture segment generation metadata

- **Goal:** support debugging and quality review.
- **Work:**
  - Save prompt, settings, duration, response payload summary, and failure details.
- **Acceptance criteria:**
  - Every segment run has enough metadata for audit and diagnosis.

### Epic 18 - Segment Normalizer Node

#### ISSUE-1801 - Normalize video clips with FFmpeg

- **Goal:** create stitch-safe clip outputs.
- **Work:**
  - Standardize resolution, frame rate, codec, pixel format, and audio handling.
- **Acceptance criteria:**
  - All segment clips share consistent technical specs.

### Epic 19 - Video Stitching Node

#### ISSUE-1901 - Concatenate normalized segments

- **Goal:** assemble draft videos per variant.
- **Work:**
  - Build concat manifest.
  - Stitch clips in planned order.
- **Acceptance criteria:**
  - Each variant has one playable draft video assembled from its segments.

#### ISSUE-1902 - Validate final draft duration

- **Goal:** catch timing drift.
- **Work:**
  - Check stitched duration against requested target with an allowed tolerance.
- **Acceptance criteria:**
  - Final draft length stays within accepted timing range.

### Epic 20 - Voiceover Generator Node

#### ISSUE-2001 - Generate voiceover audio

- **Goal:** create narration for each variant.
- **Work:**
  - Convert approved script into TTS audio.
  - Save audio artifact and timing metadata if available.
- **Acceptance criteria:**
  - Each variant has a usable narration file.

### Epic 21 - Subtitle Burn-in Node

#### ISSUE-2101 - Build subtitle timing data

- **Goal:** convert script and/or TTS alignment into subtitles.
- **Work:**
  - Generate subtitle entries with readable chunking.
- **Acceptance criteria:**
  - Subtitle timing covers the spoken script with acceptable readability.

#### ISSUE-2102 - Render branded ASS subtitle files

- **Goal:** keep subtitles readable and brand-safe.
- **Work:**
  - Apply typography, sizing, positioning, and contrast rules.
- **Acceptance criteria:**
  - Subtitle files are suitable for burn-in and separately downloadable.

#### ISSUE-2103 - Burn subtitles and mix audio

- **Goal:** create final publishable video outputs.
- **Work:**
  - Burn subtitles into the stitched video.
  - Add voiceover audio track.
- **Acceptance criteria:**
  - Each variant has a final 9:16 video with audible narration and visible subtitles.

### Epic 22 - Cover, Caption, and Title Node

#### ISSUE-2201 - Generate titles and captions

- **Goal:** provide publish-ready metadata.
- **Work:**
  - Generate title, caption, CTA copy, and optional hashtags for each variant.
- **Acceptance criteria:**
  - Each variant includes reusable social copy.

#### ISSUE-2202 - Generate cover image

- **Goal:** produce a thumbnail-ready asset.
- **Work:**
  - Use brand-safe composition with product imagery and overlay text if needed.
- **Acceptance criteria:**
  - Each variant includes one exportable cover image.

### Epic 23 - Evaluation Node

#### ISSUE-2301 - Implement publishable scoring rubric

- **Goal:** quantify output quality.
- **Work:**
  - Score hook strength, brand consistency, platform fit, subtitle readability, visual quality, and compliance.
- **Acceptance criteria:**
  - Both variants receive a numeric publishable score and component breakdown.

#### ISSUE-2302 - Generate score rationale

- **Goal:** make scoring explainable.
- **Work:**
  - Add human-readable explanation of strengths, weaknesses, and recommended improvements.
- **Acceptance criteria:**
  - Users understand why a variant passed or underperformed.

### Epic 24 - Editor Revision Router

#### ISSUE-2401 - Classify revision intent

- **Goal:** map feedback to workflow scope.
- **Work:**
  - Detect whether feedback targets hook, script, tone, visuals, subtitles, or CTA.
- **Acceptance criteria:**
  - Revision requests can be routed to the right node boundary.

#### ISSUE-2402 - Implement selective downstream regeneration

- **Goal:** avoid rerunning unaffected work.
- **Work:**
  - Recompute only dependent nodes and preserve reusable artifacts.
- **Acceptance criteria:**
  - A revision request updates only the necessary part of the pipeline.

### Epic 25 - Export Packaging

#### ISSUE-2501 - Export 1:1 version from final 9:16

- **Goal:** satisfy multi-ratio delivery requirements.
- **Work:**
  - Derive square version with safe crop rules.
- **Acceptance criteria:**
  - Each variant has downloadable 9:16 and 1:1 outputs.

#### ISSUE-2502 - Build variant export package

- **Goal:** bundle all final assets per variant.
- **Work:**
  - Include final videos, subtitles, cover, caption, title, and metadata JSON.
- **Acceptance criteria:**
  - One package contains everything needed for review and publishing.

#### ISSUE-2503 - Build project-level export package

- **Goal:** create one artifact for handoff or judging.
- **Work:**
  - Bundle both variants and shared workflow report.
- **Acceptance criteria:**
  - Judges can download one package containing the full project result.

#### ISSUE-2504 - Generate `workflow_report.md`

- **Goal:** make the orchestration story visible outside the UI.
- **Work:**
  - Summarize brief, brand DNA, variant strategies, node results, and final scores.
- **Acceptance criteria:**
  - Export package includes a readable workflow summary.

### Epic 26 - Demo Polish and QA

#### ISSUE-2601 - Add sample project seed data

- **Goal:** guarantee a reliable demo path.
- **Work:**
  - Add one well-formed sample brief and sample brand assets.
- **Acceptance criteria:**
  - Team can run a guided demo even if ad hoc input is unavailable.

#### ISSUE-2602 - Add end-to-end manual QA checklist

- **Goal:** validate MVP behavior before demo day.
- **Work:**
  - Check input flow, async progress, variant differentiation, playback, scores, revisions, and downloads.
- **Acceptance criteria:**
  - Team has a repeatable release sanity checklist.

#### ISSUE-2603 - Improve empty, loading, and failure states

- **Goal:** avoid confusing demo moments.
- **Work:**
  - Add clear messaging for queueing, processing, failed nodes, and missing exports.
- **Acceptance criteria:**
  - UI remains understandable even when generation is slow or partially fails.

## 7. Priority Order

### P0 - Must build first

- Foundation and environment
- Types, storage, and project state
- Workflow engine and async queue
- Core API endpoints
- Brief input UI
- Workflow progress UI
- Variant side-by-side result view
- Text planning nodes
- Seedance segment generation
- Normalization and stitching
- Voiceover and subtitle burn-in
- 9:16 and 1:1 export
- Publishable score

### P1 - Strongly recommended for demo strength

- Node detail inspection
- Cover/title/caption generation
- Download package bundle
- Revision routing and selective regeneration
- Workflow report

### P2 - Polish after MVP is stable

- Better fallback prompts
- Better logs and diagnostics
- Stronger demo presets
- UI refinements and extra quality-of-life improvements

## 8. Suggested Execution Sequence

1. Finish foundation, env, and dependency setup.
2. Lock types, project state, and persistence model.
3. Build queue, worker, and sequential workflow runner.
4. Build minimum API routes.
5. Build input screen and workflow visibility UI.
6. Implement text planning nodes end to end.
7. Integrate Seedance generation lifecycle.
8. Implement FFmpeg normalization and stitching.
9. Add TTS, subtitles, and final video rendering.
10. Add exports, scoring, and final review UI.
11. Add revision loop.
12. Polish the demo and rehearse fallback paths.

## 9. Definition of Done

The implementation is considered complete when all conditions below are true:

- A user can submit a brief and brand assets from the web UI.
- The system visibly runs the full staged workflow asynchronously.
- The system produces Variant A and Variant B with clearly different creative strategies.
- Each variant includes a playable final video, hook, script, storyboard, subtitle asset, title, caption, and cover.
- Each variant can be exported in 9:16 and 1:1.
- The UI shows publishable scoring and workflow status.
- Revision feedback can selectively rerun affected steps.
- The demo can be executed reliably on a local machine.
