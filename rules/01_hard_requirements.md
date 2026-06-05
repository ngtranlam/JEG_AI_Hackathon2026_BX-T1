# Rule 01 — Hard Requirements

These requirements are mandatory.

## 1. Seedance 2.0 is mandatory

The workflow must use **Seedance 2.0** for video generation.

The system must generate video clips through Seedance 2.0, not only mock static previews.

## 2. TRAE orchestration must be visible

The workflow must show clearly that TRAE is orchestrating multiple steps.

The UI or workflow logs must show steps such as:

```text
Input validation
Brief analysis
Brand DNA extraction
Creative direction generation
Hook generation
Script writing
Storyboard planning
Segment planning
Seedance prompt building
Seedance video generation
Video stitching
Subtitle burn-in
Export packaging
```

## 3. Must output 2 creative variants

The system must create at least 2 creative video variants.

They must be meaningfully different.

Good example:

```text
Variant A: Emotional Storytelling
Variant B: Product-led Demo
```

Bad example:

```text
Variant A: same video with different caption
Variant B: same video with different music
```

## 4. Must support 15–30s video duration

Target video duration must support:

```text
15s
20s
30s
```

Because Seedance clip duration is limited, the system must use segment-based generation for longer videos.

## 5. Must handle Seedance duration limit

Never assume Seedance can generate a full 30s video in one call.

For 20–30s video:

```text
Script
→ Storyboard
→ Segment Planner
→ Generate Seedance clips
→ Normalize clips
→ Stitch clips
```

## 6. Must export 9:16 and 1:1

Minimum required export ratios:

```text
9:16
1:1
```

9:16 is the primary format.

1:1 can be generated using safe-area crop or dedicated layout.

## 7. Must include publish-ready assets

Each final variant should include:

```text
- Video file
- Voiceover
- Burn-in subtitle
- Cover image
- Title
- Caption
- Hashtags
- Script
- Storyboard
- Evaluation report
```

## 8. Must show both output videos together

The web app output section must display the 2 video variants side by side.

Judges must be able to compare Variant A and Variant B immediately.

## 9. Must avoid compliance violations

If the brief includes compliance constraints, every downstream node must respect them.

Examples:

```text
- No medical claims
- No fast weight-loss claims
- No guaranteed outcome
- No before-after transformation claim if forbidden
```

## 10. Must be reusable

The workflow must accept a new brief and run again.

Do not hardcode only one demo output.
