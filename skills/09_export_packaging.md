# Skill 09 — Export Packaging

## Objective

Package all final assets for each variant.

## Required exports

Each variant must export:

```text
final_9x16.mp4
final_1x1.mp4
cover.png
caption.txt
script.json
storyboard.json
seedance_prompts.json
evaluation.json
```

## 9:16 export

Primary format:

```text
1080x1920
mp4
H.264
30fps
audio included
subtitle burned in
```

## 1:1 export

Generate from 9:16 using safe crop or re-render.

Basic FFmpeg crop:

```bash
ffmpeg -i final_9x16.mp4 \
-vf "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080" \
final_1x1.mp4
```

## Safe area warning

When converting 9:16 to 1:1, make sure subtitle and CTA are not cut.

If needed, regenerate subtitle placement for 1:1.

## Cover generation

MVP:

```text
Extract frame from final video
Overlay cover text
Add logo if available
Save cover.png
```

FFmpeg extract frame:

```bash
ffmpeg -ss 00:00:02 -i final_9x16.mp4 -frames:v 1 cover_base.png
```

Then use Sharp for overlay.

## Caption file

Create `caption.txt`:

```text
Title:
...

Caption:
...

Hashtags:
#...
```

## Workflow report

Generate `workflow_report.md` containing:

```text
Brief summary
Brand DNA
Variant A summary
Variant B summary
Hooks
Scripts
Segment plan
Evaluation scores
Export paths
```

## ZIP package

Nice-to-have:

```text
project_final_package.zip
```

Zip folder:

```text
outputs/{project_id}/
```
