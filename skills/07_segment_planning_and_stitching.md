# Skill 07 — Segment Planning and Stitching

## Objective

Handle videos longer than Seedance's single generation limit by splitting into segments and stitching them.

## Segment planning rules

```text
Max segment duration: 15s
Recommended segment duration: 3–8s
Hook: 2–3s
CTA: 3–4s
30s video: usually 5–6 segments
20s video: usually 4–5 segments
15s video: usually 3–4 segments
```

## Why not 15s + 15s only

Avoid simple 15s + 15s split unless necessary.

Better segmentation:

```text
More control
Easier regeneration
Better pacing
Better TikTok/Reels rhythm
```

## Segment JSON

```json
{
  "segment_id": "A_SEG_01",
  "duration": 3,
  "source_scene": "A_S01",
  "role": "hook",
  "generation_mode": "T2V",
  "needs_product_reference": false
}
```

## Normalize clips before stitching

Use FFmpeg to normalize every generated clip.

Standard:

```text
1080x1920
30fps
H.264
yuv420p
no audio
mp4
```

## FFmpeg normalize command

```bash
ffmpeg -i input.mp4 \
-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
-c:v libx264 -pix_fmt yuv420p -an \
output_norm.mp4
```

## Stitching method

Create `files.txt`:

```text
file 'A_SEG_01_norm.mp4'
file 'A_SEG_02_norm.mp4'
file 'A_SEG_03_norm.mp4'
```

Run:

```bash
ffmpeg -f concat -safe 0 -i files.txt \
-c:v libx264 -pix_fmt yuv420p -r 30 \
variant_a_draft_9x16.mp4
```

## Default transition

Use hard cuts.

Hard cuts are acceptable for TikTok/Reels and less error-prone.

## Stitch output

```text
outputs/{project_id}/{variant_id}/draft/{variant_id}_draft_9x16.mp4
```

## Duration check

After stitching, verify final duration is close to target duration.

Allowed tolerance:

```text
±1.5 seconds
```

If too long:

```text
Trim final video
```

If too short:

```text
Pad final CTA/end card
```
