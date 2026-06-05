# Skill 05 — Workflow Orchestration

## Objective

Implement the project as a clear multi-node workflow that TRAE can orchestrate.

## Core workflow nodes

```text
01 Input Validator
02 Brief Analyzer
03 Brand DNA Extractor
04 Creative Direction Generator
05 Hook Generator & Scorer
06 Script Writer
07 Storyboard Planner
08 Segment Planner
09 Seedance Prompt Builder
10 Seedance Segment Generator
11 Segment Normalizer
12 Video Stitching Agent
13 Voiceover Generator
14 Subtitle Burn-in Agent
15 Cover / Caption / Title Generator
16 Evaluation Agent
17 Editor Revision Router
18 Export Packager
```

## Node design

Each node should be a function or module:

```ts
async function runNode(project: ProjectState): Promise<ProjectState>
```

Each node should:

```text
Read project state
Validate required fields
Perform its task
Write output back to project state
Save artifact file
Update workflow status
Handle errors
```

## Project status

Use status values:

```text
pending
running
completed
failed
skipped
```

## Workflow state example

```json
{
  "workflow_status": {
    "brief_analyzer": "completed",
    "brand_dna_extractor": "completed",
    "seedance_segment_generator": "running"
  }
}
```

## Artifact storage

Save artifacts to:

```text
outputs/{project_id}/artifacts/
```

Examples:

```text
analysis.json
brand_dna.json
creative_directions.json
hooks.json
script_A.json
storyboard_A.json
segments_A.json
prompts_A.json
evaluation_A.json
```

## Error handling

If a node fails:

```text
Set node status = failed
Store error message
Expose error in UI
Allow retry if possible
```

## Async video generation

Seedance generation must not block the UI.

Use queue:

```text
Create job
Store task_id
Poll status
Update segment status
Download result
Continue workflow
```

## Retry policy

Recommended:

```text
Text nodes: retry 1–2 times
Seedance task creation: retry 2 times
Video download: retry 3 times
FFmpeg processing: retry 1 time
```

## Logging

Log:

```text
Node start
Node complete
Node failed
Generated artifact path
Seedance task id
FFmpeg command summary
```
