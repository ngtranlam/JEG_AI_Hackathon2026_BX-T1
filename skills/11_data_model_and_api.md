# Skill 11 — Data Model and API

## Objective

Define project state, database schema, and API endpoints.

## Project state

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

## Brief

```ts
type Brief = {
  brand_name: string
  product: string
  product_description?: string
  audience: string
  platforms: string[]
  target_duration: 15 | 20 | 30
  tone: string
  main_message: string
  compliance: string
  creative_goal: string
  cta?: string
}
```

## Variant

```ts
type Variant = {
  variant_id: 'A' | 'B'
  name: string
  creative_direction: string
  hypothesis: string
  selected_hook: string
  script: ScriptItem[]
  storyboard: StoryboardScene[]
  segments: Segment[]
  evaluation?: Evaluation
  exports?: VariantExports
}
```

## Segment

```ts
type Segment = {
  segment_id: string
  scene_id: string
  start: number
  end: number
  duration: number
  role: string
  generation_mode: 'T2V' | 'I2V' | 'R2V'
  seedance_prompt: string
  seedance_task_id?: string
  raw_video_url?: string
  raw_video_path?: string
  normalized_video_path?: string
  status: NodeStatus
}
```

## API endpoints

```text
POST /api/projects
Create project.

POST /api/projects/:id/run
Run full workflow.

GET /api/projects/:id/status
Get workflow progress.

GET /api/projects/:id
Get project data.

GET /api/projects/:id/variants
Get variants.

POST /api/variants/:id/revise
Submit feedback and run revision.

GET /api/projects/:id/export
Download final package.
```

## Database tables

```text
projects
variants
segments
assets
exports
```

## MVP storage alternative

If DB setup is too slow, use JSON files:

```text
outputs/{project_id}/project.json
outputs/{project_id}/workflow_status.json
```

But DB is recommended for workflow progress.
