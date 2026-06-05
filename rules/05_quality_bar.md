# Rule 05 — Quality Bar

## Minimum quality

The product must be good enough for a hackathon demo.

Minimum acceptable quality:

```text
- UI looks clean and professional
- Workflow runs from input to output
- 2 variants are clearly different
- Final video files are playable
- Subtitle is readable
- Export files exist
- Intermediate artifacts are visible
```

## Publishable score target

The workflow should mark a variant publishable if:

```text
publishable_score >= 80
```

Scoring formula:

```text
publishable_score =
hook_strength * 0.2
+ brand_consistency * 0.2
+ platform_fit * 0.2
+ subtitle_readability * 0.15
+ visual_quality * 0.15
+ compliance * 0.1
```

## Evaluation criteria

Each variant should be evaluated by:

```text
Hook strength
Brand consistency
Platform fit
Subtitle readability
Visual quality
Compliance safety
```

## Brand quality

The video should follow:

```text
Brand tone
Brand colors
Product visibility
Compliance constraints
CTA
```

## Short-form video quality

The video should have:

```text
Strong 0–3s hook
Fast pacing
Clear product moment
Readable subtitle
Clear CTA
No unnecessary intro
No long empty scene
```

## Technical quality

Generated output should have:

```text
mp4 format
H.264 codec
1080x1920 for 9:16
1080x1080 for 1:1
30fps
yuv420p pixel format
audio included
subtitle burned in
```

## Failure handling

If a node fails, the UI should show:

```text
Failed node
Error message
Retry option if possible
```

Do not silently fail.
