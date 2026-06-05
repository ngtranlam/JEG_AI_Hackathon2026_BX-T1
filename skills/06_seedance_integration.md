# Skill 06 — Seedance Integration

## Objective

Use Seedance 2.0 to generate video segments from storyboard segments.

## Important constraint

Do not depend on Seedance to generate a full 30s video in one call.

Always treat Seedance output as **short clips**.

## Generation modes

Use:

```text
T2V: text-to-video
I2V: image-to-video when product image is available
R2V / reference mode: if available and if moodboard/reference is provided
```

## When to use T2V

Use T2V for:

```text
Lifestyle scene
Office context
Human situation
General scene without exact product reference
```

## When to use I2V

Use I2V for:

```text
Product close-up
Packaging scene
Unboxing
Demo with actual uploaded product image
```

## Prompt requirements

Each Seedance prompt must include:

```text
Aspect ratio
Duration
Platform style
Scene visual
Camera style
Motion
Lighting
Brand colors
Product reference instruction if needed
Compliance constraints
Negative instructions
```

## Prompt negative instructions

Always include:

```text
no text
no logo
no watermark
no fake claims
no medical claims
no unreadable typography
```

## Prompt example

```text
Vertical 9:16 TikTok ad, 5 seconds, realistic modern office lunch scene, young office worker opening a fresh healthy salad delivery box on desk, natural daylight, handheld close-up, appetizing food photography, clean green-white-beige brand color palette, fast but premium pacing, no text, no logo, no medical claims.
```

## Task lifecycle

Seedance is async.

Implement:

```text
create task
store task_id
poll status
if success get video_url
download video
save raw segment
update segment status
```

## Segment output

Save raw video:

```text
outputs/{project_id}/{variant_id}/raw/{segment_id}_raw.mp4
```

## Failure handling

If Seedance generation fails:

```text
Retry same prompt once
If still fails, simplify prompt
If still fails, mark segment failed and show error
```

## Prompt simplification fallback

If a prompt fails, simplify by removing:

```text
Complex camera motion
Too many style clauses
Too many objects
Complex human actions
```

Keep:

```text
Scene description
Duration
Aspect ratio
Brand colors
No text/no logo constraints
```
