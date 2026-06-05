# Rule 03 — Workflow Constraints

## Workflow must remain linear and understandable

The base workflow must follow this sequence:

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

Do not randomly reorder major steps.

## Each node must have clear input and output

Each workflow node should be implemented as a function/module with:

```text
Input type
Output type
Error handling
Status update
Stored artifact
```

## Store intermediate outputs

Every node should save its result to the project state.

Examples:

```text
analysis.json
brand_dna.json
creative_directions.json
hooks.json
script.json
storyboard.json
segments.json
seedance_prompts.json
evaluation.json
```

## Use project state as source of truth

The workflow should pass a central `project` object between nodes.

Example:

```json
{
  "project_id": "greenbite_001",
  "brief": {},
  "brand_kit": {},
  "analysis": {},
  "variants": [],
  "exports": {}
}
```

## Segment duration rules

For Seedance generation:

```text
- Segment duration must not exceed 15 seconds.
- Recommended segment duration: 3–8 seconds.
- Hook segment: 2–3 seconds.
- CTA segment: 3–4 seconds.
- 30s videos should usually have 5–6 segments.
```

## Video normalization standard

All generated clips should be normalized before stitching:

```text
Resolution: 1080x1920
FPS: 30
Codec: H.264
Pixel format: yuv420p
Audio: muted before final audio mix
Container: mp4
```

## Default transition

Use hard cuts for MVP.

Optional transitions:

```text
- 0.2s crossfade
- zoom cut
- whip cut
```

Do not spend time on advanced transitions before core workflow works.

## Subtitle rules

Subtitle should be:

```text
- Burned into final video
- Easy to read
- Lower-middle area
- Short line length
- Styled using ASS subtitle
- Not covering the product
```

## Export rules

Generate:

```text
final_9x16.mp4
final_1x1.mp4
cover.png
caption.txt
script.json
storyboard.json
evaluation.json
```

## Editor revision constraint

When editor gives feedback, regenerate only the affected parts.

Examples:

```text
Feedback: subtitle too small
Action: regenerate subtitle + re-export only

Feedback: hook not strong
Action: rewrite hook + regenerate first segment + re-stitch

Feedback: CTA weak
Action: rewrite CTA + regenerate final segment + re-stitch
```

Do not regenerate everything unless absolutely necessary.
