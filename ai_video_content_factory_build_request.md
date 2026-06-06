# Full Updated Build Specification — TRAE AI Video Content Factory

## 0. Purpose

This document is the latest and most accurate specification for building the **TRAE AI Video Content Factory**.

It replaces previous scattered notes and consolidates all workflow updates.

The product must be built as a **single-page web app + workflow runner** that transforms a marketing brief and brand assets into **2 publish-ready short-form video variants**.

---

# 1. Product Goal

Build a workflow-driven AI video content factory for the BX-T1 challenge.

The product should:

```text
Input brief + brand assets
→ Analyze campaign and brand
→ Generate 2 creative variants
→ Generate hooks, scripts, storyboards, and Seedance prompts
→ Generate video segments with Seedance 2.0
→ Stitch segments into final video
→ Generate voiceover with ElevenLabs
→ Burn subtitles
→ Generate cover, title, caption, hashtags
→ Export final video assets
```

The final result should be:

```text
2 creative video variants
Each variant is publish-ready
Each variant can be exported in selected aspect ratio
Workflow must be visible and reusable
```

---

# 2. Critical Product Rule: Sample Scenarios Are Not Fixed Tests

The sample scenarios in the challenge statement are **only examples**.

Do **not** hardcode them into the product as fixed tests.

Examples from the prompt such as:

```text
- F&B brief → emotional storytelling + product-led demo
- Skincare brief → hook variants A/B/C
- Change audience from Gen Z to Millennial mom
```

are only demonstration ideas.

The product must support **any valid user input brief**, not only these sample cases.

Correct behavior:

```text
User enters arbitrary brand/product/audience/platform/duration/assets
→ Workflow generates suitable variants dynamically
```

Incorrect behavior:

```text
Only supports fixed F&B or skincare test cases
Only outputs pre-defined demo scripts
Hardcodes Gen Z / Millennial mom audience test
```

The app may include a "Load Sample Brief" button, but it must be optional and clearly labeled as a demo helper.

---

# 3. Model and Tool Responsibility

Use the following model/tool split.

| Responsibility | Tool / Model |
|---|---|
| Brief analysis | Gemini |
| Brand DNA extraction | Gemini |
| Creative directions | Gemini |
| Hook generation and scoring | Gemini |
| Script writing | Gemini |
| Storyboard planning | Gemini |
| Segment planning | Code + Gemini if needed |
| Seedance prompt building | Gemini |
| Video generation | Seedance 2.0 |
| Voice generation | ElevenLabs |
| Character dialogue audio | ElevenLabs |
| Video stitching | FFmpeg |
| Audio mixing | FFmpeg |
| Subtitle burn-in | ASS + FFmpeg |
| Cover/caption/title text | Gemini |
| Evaluation scoring | Gemini |
| Editor revision routing | Gemini |
| Export packaging | Code |

## 3.1 Text Planning Model

Use Gemini as the primary model for all text-based planning and reasoning tasks.

```env
TEXT_MODEL_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_ADVANCED_MODEL=gemini-2.5-pro
```

Recommended:

```text
Gemini 2.5 Flash → default for most nodes
Gemini 2.5 Pro → optional for more complex storyboard/evaluation/revision
```

Do not use Seed 2.0 Lite as the primary planning model.

Seed 2.0 Lite may remain only as optional fallback if needed.

## 3.2 Video Generation Model

Use Seedance 2.0 for all video generation.

```env
VIDEO_MODEL_PROVIDER=modelark
ARK_API_KEY=
SEEDANCE_MODEL_ID=dreamina-seedance-2-0-260128
```

Seedance 2.0 is required.

## 3.3 Voice Generation

Use ElevenLabs for all voice generation.

Do **not** use Seed Speech / BytePlus TTS.

```env
VOICE_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=
```

Optional:

```env
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
ELEVENLABS_STABILITY=0.5
ELEVENLABS_SIMILARITY_BOOST=0.75
ELEVENLABS_STYLE=0.3
ELEVENLABS_USE_SPEAKER_BOOST=true
```

---

# 4. Core Input Requirements

The user must be able to input a full campaign brief and brand assets from the web app.

## 4.1 Required Brief Inputs

```text
Brand name
Product / service name
Product description
Target audience
Platform
Target duration
Video aspect ratio
Brand tone
Main message
Compliance constraints
Call to action
```

## 4.2 Platform Input

Allow selecting one or more:

```text
TikTok
Instagram Reels
YouTube Shorts
```

## 4.3 Target Duration Input

Allow selecting:

```text
15s
20s
30s
```

The system must support all three.

If a video is longer than one Seedance generation limit, the system must split it into multiple segments and stitch them together.

## 4.4 Aspect Ratio Input

Add a dropdown or segmented selector for video aspect ratio.

Supported options:

```text
9:16
1:1
```

This is important and must be visible in the input UI.

### Aspect ratio behavior

The selected aspect ratio determines the primary final output.

If user selects:

```text
9:16
```

The system should generate and export vertical video.

If user selects:

```text
1:1
```

The system should generate and export square video.

Optional but recommended:

```text
Allow exporting the other ratio as a secondary format if needed.
```

Example:

```text
Primary ratio selected: 9:16
Secondary export: 1:1 optional

Primary ratio selected: 1:1
Secondary export: 9:16 optional
```

### Why aspect ratio matters

The aspect ratio affects:

```text
- Seedance generation ratio
- storyboard composition
- camera framing
- subtitle placement
- product placement
- cover layout
- final FFmpeg export
```

Do not treat aspect ratio as only an export setting.

It must influence planning and prompt building.

## 4.5 Product Image Upload

Product images are the most important visual asset.

Allow uploading:

```text
1 to 4 product images
```

Maximum:

```text
4 images
```

Product image rules:

```text
- Product image upload is required for best results.
- Product images are used for Seedance I2V or reference-based video generation.
- Product images help avoid generic-looking outputs.
- Product images can be used for product demo scenes, close-ups, covers, and product visibility.
```

If no product image is uploaded, show warning:

```text
Product image missing. The generated video may look generic and may not match the real product.
```

But the workflow may still run using T2V.

## 4.6 Logo Upload

Logo is optional.

Use logo only for:

```text
- cover image
- end card
- export package
```

Do not ask Seedance to hallucinate the logo inside the generated video.

If logo is missing:

```text
Use brand name as text on cover/end card.
```

## 4.7 Moodboard / Visual Reference Upload

Moodboard is optional.

Moodboard means:

```text
Images or videos that show desired style, lighting, camera angle, aesthetic, or vibe.
```

Moodboard is not the product image.

Use moodboard for:

```text
- visual style guidance
- lighting reference
- camera style
- overall aesthetic
```

If moodboard is missing:

```text
Use default platform-native ad style based on platform, tone, and product category.
```

## 4.8 Brand Colors

Allow input:

```text
Primary color
Secondary color
```

These are optional but recommended.

Use them for:

```text
- subtitle style
- cover design
- CTA styling
- visual prompts
- brand consistency
```

---

# 5. Web App UI Requirements

Build a **single-page web app**.

Do not use tabs, separate pages, big marketing header, sidebar navigation, pricing, login, or dashboard clutter.

## 5.1 Layout

Use one page with two main columns.

```text
Left column: Input Brief
Right column: Workflow Progress + Generated Outputs
```

Recommended proportions:

```text
Left column: 32%
Right column: 68%
```

## 5.2 Left Column — Input Brief

Create one compact card titled:

```text
Input Brief
```

Fields:

```text
Brand name
Product / service
Product description
Target audience
Platform selector
Target duration selector: 15s / 20s / 30s
Video aspect ratio dropdown: 9:16 / 1:1
Brand tone
Main message
Compliance constraints
Call to action
Primary color
Secondary color
Product image upload, max 4 images
Logo upload, optional
Moodboard / visual reference upload, optional
```

Primary button:

```text
Generate 2 Video Variants
```

## 5.3 Right Column — Workflow Progress

Show visible workflow progress.

Steps:

```text
Input
Analyze
Brand DNA
Creative Direction
Hook Scoring
Script
Storyboard
Audio Strategy
Segment Plan
Seedance Prompts
Seedance Clips
Normalize
Stitching
Voiceover
Subtitles
Cover & Caption
Evaluation
Export
```

Status values:

```text
pending
running
completed
failed
```

## 5.4 Right Column — Output

Show two video output cards side by side.

```text
Variant A
Variant B
```

Each card must show:

```text
Variant name
Creative direction
A/B hypothesis
Selected hook
Video preview
Aspect ratio
Duration
Publishable score
Download buttons
View script/storyboard button
Copy caption button
```

The two videos must be visible at the same time.

## 5.5 Comparison Table

Below the two output cards, show:

```text
Criteria | Variant A | Variant B
Creative angle
Hook
Target emotion
CTA
Aspect ratio
Publishable score
```

## 5.6 Editor Feedback

Add compact editor feedback area:

```text
Variant selector: A / B / Both
Feedback textarea
Button: Regenerate Affected Parts
Revision plan preview
```

## 5.7 Export Section

At minimum:

```text
Download Variant A selected ratio
Download Variant B selected ratio
Download cover
Download caption
Download workflow report
Download ZIP
```

If secondary export is supported:

```text
Download Variant A 9:16
Download Variant A 1:1
Download Variant B 9:16
Download Variant B 1:1
```

---

# 6. Updated Workflow Overview

The final workflow should be:

```text
01 Input Validator
02 Brief Analyzer, Gemini
03 Brand DNA Extractor, Gemini
04 Creative Direction Generator, Gemini
05 Hook Generator & Scorer, Gemini
06 Script Writer, Gemini
07 Storyboard Planner, Gemini
08 Audio Strategy Planner, Gemini/code
09 Segment Planner, code + Gemini if needed
10 Seedance Prompt Builder, Gemini
11 Seedance Segment Generator, Seedance 2.0
12 Segment Normalizer, FFmpeg
13 Video Stitching Agent, FFmpeg
14 Voiceover / Audio Agent, ElevenLabs
15 Subtitle Burn-in Agent, ASS + FFmpeg
16 Cover / Caption / Title Generator, Gemini + Sharp/FFmpeg
17 Evaluation Agent, Gemini
18 Editor Revision Router, Gemini
19 Export Packager, code
```

---

# 7. Node Details

## 7.1 Node 01 — Input Validator

Use code, not AI.

Validate:

```text
Required text fields are present
Duration is 15, 20, or 30
Aspect ratio is 9:16 or 1:1
Product images count is 0–4
Uploaded files are valid
Compliance constraints are saved
```

If product images are missing, warn but allow workflow to run.

If product images exceed 4, reject upload.

Output:

```json
{
  "valid": true,
  "warnings": [
    "Product image missing. Output may look generic."
  ],
  "normalized_brief": {
    "target_duration": 30,
    "aspect_ratio": "9:16",
    "primary_platform": "TikTok"
  }
}
```

## 7.2 Node 02 — Brief Analyzer

Use Gemini.

Input:

```json
{
  "brand_name": "",
  "product": "",
  "product_description": "",
  "audience": "",
  "platforms": [],
  "target_duration": 30,
  "aspect_ratio": "9:16",
  "tone": "",
  "main_message": "",
  "compliance": "",
  "cta": ""
}
```

Output:

```json
{
  "audience_insight": "",
  "pain_points": [],
  "desired_emotion": [],
  "content_goal": "",
  "must_include": [],
  "must_avoid": [],
  "platform_conventions": [],
  "aspect_ratio_notes": ""
}
```

Important:

```text
Gemini must consider aspect ratio when analyzing platform conventions.
```

## 7.3 Node 03 — Brand DNA Extractor

Use Gemini.

Input includes:

```text
Brand name
Brand tone
Primary color
Secondary color
Product image metadata
Logo optional
Moodboard optional
Aspect ratio
```

Output:

```json
{
  "brand_voice": {
    "personality": "",
    "sentence_style": "",
    "avoid_words": []
  },
  "visual_rules": {
    "colors": [],
    "lighting": "",
    "camera_style": "",
    "composition_rules": "",
    "aspect_ratio_framing": "",
    "subtitle_style": {
      "font": "",
      "position": "lower-middle",
      "max_words_per_line": 5
    }
  },
  "logo_rules": {
    "optional": true,
    "placement": "end card only",
    "duration": "last 2 seconds"
  }
}
```

Important:

```text
Do not use logo as Seedance-generated content.
Use logo only in post-production for cover/end card.
```

## 7.4 Node 04 — Creative Direction Generator

Use Gemini.

Generate exactly 2 variants.

Output:

```json
{
  "variants": [
    {
      "variant_id": "A",
      "name": "",
      "angle": "",
      "hypothesis": "",
      "style": "",
      "target_emotion": "",
      "cta_strategy": ""
    },
    {
      "variant_id": "B",
      "name": "",
      "angle": "",
      "hypothesis": "",
      "style": "",
      "target_emotion": "",
      "cta_strategy": ""
    }
  ]
}
```

Rules:

```text
The variants must be meaningfully different.
Do not hardcode F&B/skincare sample scenarios.
Generate directions dynamically from user input.
```

## 7.5 Node 05 — Hook Generator & Scorer

Use Gemini.

Generate 3–5 hooks per variant.

Output:

```json
{
  "hooks": {
    "A": [
      {
        "hook": "",
        "score": 91,
        "reason": ""
      }
    ],
    "B": [
      {
        "hook": "",
        "score": 88,
        "reason": ""
      }
    ]
  },
  "selected_hooks": {
    "A": "",
    "B": ""
  }
}
```

Score criteria:

```json
{
  "clarity": 20,
  "curiosity": 20,
  "pain_point_fit": 20,
  "platform_fit": 20,
  "brand_fit": 20
}
```

## 7.6 Node 06 — Script Writer

Use Gemini.

Output:

```json
{
  "variant_id": "A",
  "target_duration": 30,
  "aspect_ratio": "9:16",
  "script": [
    {
      "start": 0,
      "end": 3,
      "voiceover": "",
      "text_overlay": ""
    }
  ]
}
```

Rules:

```text
Hook must be in first 0–3 seconds.
CTA must be in final 3–4 seconds.
Script must respect compliance constraints.
Text overlay must be short.
Script must consider selected aspect ratio.
```

Aspect ratio notes:

```text
For 9:16:
- prioritize vertical framing
- keep product and subtitles inside vertical safe area
- good for TikTok/Reels/Shorts

For 1:1:
- use centered product composition
- avoid extreme vertical movements
- subtitles should fit square safe area
```

## 7.7 Node 07 — Storyboard Planner

Use Gemini.

Output:

```json
{
  "storyboard": [
    {
      "scene_id": "A_S01",
      "start": 0,
      "end": 3,
      "role": "hook",
      "visual": "",
      "camera": "",
      "motion": "",
      "composition": "",
      "text_overlay": "",
      "voiceover": "",
      "product_reference_required": false,
      "audio_type": "narration_voiceover",
      "requires_lip_sync": false,
      "aspect_ratio": "9:16"
    }
  ]
}
```

Rules:

```text
Use narration_voiceover by default.
Use character_dialogue only if on-screen speaker is necessary.
Set product_reference_required=true for product demo/close-up scenes.
Composition must respect selected aspect ratio.
```

## 7.8 Node 08 — Audio Strategy Planner

Use Gemini/code.

Determine audio mode per scene:

```text
narration_voiceover
character_dialogue
no_voice
```

Default:

```text
narration_voiceover
```

Character dialogue is only for scenes where a person must visibly speak.

Important:

```text
If character_dialogue is used, simple FFmpeg audio mixing is not enough for lip-sync.
Generate dialogue audio with ElevenLabs and use it as audio reference for Seedance if supported.
If audio reference/lip-sync is not stable, convert scene to narration_voiceover.
```

Output:

```json
{
  "scene_audio_strategy": [
    {
      "scene_id": "A_S01",
      "audio_type": "narration_voiceover",
      "requires_lip_sync": false
    }
  ]
}
```

## 7.9 Node 09 — Segment Planner

Use code, with Gemini only if semantic splitting is needed.

Rules:

```text
No segment longer than 15 seconds.
Recommended segment length: 3–8 seconds.
Hook segment: 2–3 seconds.
CTA segment: 3–4 seconds.
30s video should usually have 5–6 segments.
20s video should usually have 4–5 segments.
15s video should usually have 3–4 segments.
```

Output:

```json
{
  "segments": [
    {
      "segment_id": "A_SEG_01",
      "scene_id": "A_S01",
      "start": 0,
      "end": 3,
      "duration": 3,
      "role": "hook",
      "generation_mode": "T2V",
      "needs_product_reference": false,
      "aspect_ratio": "9:16",
      "audio_type": "narration_voiceover",
      "requires_lip_sync": false
    }
  ]
}
```

## 7.10 Node 10 — Seedance Prompt Builder

Use Gemini.

Generate prompt per segment.

Use Seedance prompt formula:

```text
Subject + Action + Camera Language + Reference Assets + Style & Aesthetics + Audio & SFX + Constraints
```

Output:

```json
{
  "prompts": [
    {
      "segment_id": "A_SEG_01",
      "generation_mode": "T2V",
      "prompt": "",
      "ratio": "9:16",
      "resolution": "720p",
      "duration": 5,
      "generate_audio": false,
      "watermark": false
    }
  ]
}
```

Important prompt rules:

```text
Keep prompt under 1000 words.
Use natural language.
Reference assets by order: [Image 1], [Image 2], [Video 1], [Audio 1].
Specify camera and aesthetic.
Do not mix mutually exclusive Seedance modes.
Respect selected aspect ratio.
Use product images as references when product_reference_required=true.
For normal narration mode, set generate_audio=false and mix ElevenLabs voice later.
For character dialogue mode, use ElevenLabs dialogue audio as reference only if Seedance mode supports it.
```

Product image handling:

```text
If 1–4 product images are uploaded:
- Use them as reference images for product demo scenes.
- Do not exceed 4 uploaded product images in app input.
- Use the clearest product image as primary reference.
```

## 7.11 Node 11 — Seedance Segment Generator

Use Seedance 2.0.

Model:

```text
dreamina-seedance-2-0-260128
```

API behavior:

```text
Create generation task
Receive task ID
Poll task status
Download generated video
Save raw segment
```

Supported modes:

```text
T2V
I2V first frame
I2V first + last frame
Multimodal reference video
```

Important constraints:

```text
Duration must be 4–15 seconds.
For short scenes under 4 seconds, either set duration to 4 and trim later, or merge with adjacent scene.
Aspect ratio must match selected ratio: 9:16 or 1:1.
```

Output:

```json
{
  "segment_id": "A_SEG_01",
  "status": "success",
  "task_id": "",
  "video_url": "",
  "local_path": "outputs/project_id/A/raw/A_SEG_01_raw.mp4"
}
```

## 7.12 Node 12 — Segment Normalizer

Use FFmpeg.

Normalize every generated clip.

For `9:16`:

```text
1080x1920
30fps
H.264
yuv420p
mp4
```

For `1:1`:

```text
1080x1080
30fps
H.264
yuv420p
mp4
```

Example for 9:16:

```bash
ffmpeg -i input.mp4 \\
-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \\
-c:v libx264 -pix_fmt yuv420p -an \\
output_norm.mp4
```

Example for 1:1:

```bash
ffmpeg -i input.mp4 \\
-vf "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,fps=30" \\
-c:v libx264 -pix_fmt yuv420p -an \\
output_norm.mp4
```

## 7.13 Node 13 — Video Stitching Agent

Use FFmpeg.

Stitch normalized segments in storyboard order.

Use hard cuts for MVP.

Output:

```text
variant_a_draft_9x16.mp4
or
variant_a_draft_1x1.mp4
```

Use selected aspect ratio in filename.

## 7.14 Node 14 — Voiceover / Audio Agent

Use ElevenLabs.

Do not use Seed Speech / BytePlus TTS.

Default mode:

```text
Narration voiceover
```

Flow:

```text
Approved script
→ ElevenLabs TTS
→ voiceover.mp3
→ FFmpeg mix with stitched video
```

Output:

```json
{
  "provider": "elevenlabs",
  "audio_type": "narration_voiceover",
  "audio_path": "outputs/project_id/A/audio/voiceover.mp3",
  "duration": 29.4,
  "used_as_final_mix": true
}
```

For character dialogue:

```text
Generate dialogue audio with ElevenLabs.
Use as Seedance audio reference if supported.
If not stable, convert scene to narration mode.
```

## 7.15 Node 15 — Subtitle Burn-in Agent

Use ASS subtitle + FFmpeg.

For MVP:

```text
Use script/storyboard timing.
```

Advanced:

```text
Use Whisper after TTS generation for better subtitle timing.
```

Subtitle must respect aspect ratio.

For 9:16:

```text
lower-middle, vertical safe area
```

For 1:1:

```text
lower-middle, square safe area, avoid crop edges
```

## 7.16 Node 16 — Cover / Caption / Title Generator

Use Gemini for text.

Use FFmpeg/Sharp for cover.

Output:

```json
{
  "title": "",
  "caption": "",
  "hashtags": [],
  "cover_text": "",
  "cover_path": ""
}
```

Cover layout must respect selected aspect ratio.

## 7.17 Node 17 — Evaluation Agent

Use Gemini.

Evaluate:

```text
Hook strength
Brand consistency
Platform fit
Aspect ratio fit
Subtitle readability
Visual quality
Compliance
```

Output:

```json
{
  "variant_id": "A",
  "scores": {
    "hook_strength": 91,
    "brand_consistency": 88,
    "platform_fit": 86,
    "aspect_ratio_fit": 90,
    "subtitle_readability": 92,
    "visual_quality": 84,
    "compliance": 100
  },
  "publishable_score": 90,
  "publishable": true,
  "notes": []
}
```

Updated score formula:

```text
publishable_score =
hook_strength * 0.18
+ brand_consistency * 0.18
+ platform_fit * 0.16
+ aspect_ratio_fit * 0.12
+ subtitle_readability * 0.14
+ visual_quality * 0.14
+ compliance * 0.08
```

## 7.18 Node 18 — Editor Revision Router

Use Gemini.

Convert editor feedback into a selective revision plan.

Output:

```json
{
  "revision_plan": [
    {
      "target": "script",
      "action": "rewrite_hook",
      "scene_id": "A_S01"
    },
    {
      "target": "segment_video",
      "action": "regenerate",
      "segment_id": "A_SEG_01"
    },
    {
      "target": "subtitle",
      "action": "increase_font_size"
    }
  ]
}
```

Rules:

```text
Do not regenerate everything by default.
Only regenerate affected parts.
If aspect ratio-related feedback appears, update storyboard composition, Seedance prompts, subtitle placement, and export.
```

## 7.19 Node 19 — Export Packager

Use code.

Output folder:

```text
outputs/
└── {project_id}/
    ├── variant_A/
    │   ├── final_selected_ratio.mp4
    │   ├── final_9x16.mp4 optional
    │   ├── final_1x1.mp4 optional
    │   ├── cover.png
    │   ├── caption.txt
    │   ├── script.json
    │   ├── storyboard.json
    │   ├── seedance_prompts.json
    │   └── evaluation.json
    ├── variant_B/
    │   └── ...
    └── workflow_report.md
```

ZIP export is recommended.

---

# 8. Aspect Ratio Rules

Aspect ratio must be treated as a core workflow parameter.

Do not only crop at the end.

The selected aspect ratio must influence:

```text
Brief analysis
Creative direction
Script pacing
Storyboard composition
Seedance prompt ratio
Video normalization
Subtitle placement
Cover layout
Evaluation
Export
```

## 8.1 9:16 behavior

Use for:

```text
TikTok
Reels
Shorts
Vertical mobile-first ads
```

Prompt composition:

```text
vertical 9:16 frame
center subject
product visible in mobile safe area
subtitle lower-middle
avoid important objects near edge
```

Seedance parameter:

```json
{
  "ratio": "9:16"
}
```

Normalize to:

```text
1080x1920
```

## 8.2 1:1 behavior

Use for:

```text
square social posts
feed ads
multi-platform square assets
```

Prompt composition:

```text
square 1:1 frame
center product
balanced composition
avoid extreme vertical camera movement
subtitle lower-middle within square safe area
```

Seedance parameter:

```json
{
  "ratio": "1:1"
}
```

Normalize to:

```text
1080x1080
```

---

# 9. Seedance API Notes

Seedance 2.0 API is asynchronous.

Workflow:

```text
Submit task
Receive task ID
Poll task status
Download video when succeeded
```

Seedance generation duration:

```text
[4, 15] seconds
```

If a planned segment is shorter than 4 seconds:

```text
Option 1: generate 4 seconds and trim
Option 2: merge with adjacent segment
```

For 20–30s videos, segment generation is required.

---

# 10. Voice and Dialogue Rules

## 10.1 Default

Use ElevenLabs to generate narration voiceover.

```text
Seedance creates clean visual clips.
ElevenLabs creates voiceover.
FFmpeg mixes voiceover into final video.
```

## 10.2 Character speaking scene

If an on-screen character must speak:

```text
ElevenLabs generates dialogue audio.
If Seedance supports audio reference/lip-sync for selected mode, use dialogue audio as reference.
If not stable, avoid talking head and convert scene to narration.
```

Do not simply overlay voice on a talking face if mouth movement is not synced.

---

# 11. Updated Data Model

## Brief

```ts
type Brief = {
  brandName: string
  productName: string
  productDescription: string
  targetAudience: string
  platforms: Array<'TikTok' | 'Reels' | 'Shorts'>
  targetDuration: 15 | 20 | 30
  aspectRatio: '9:16' | '1:1'
  brandTone: string
  mainMessage: string
  complianceConstraints: string
  callToAction: string
  primaryColor?: string
  secondaryColor?: string
}
```

## Brand Assets

```ts
type BrandAssets = {
  productImages: string[] // 0-4 images, recommended 1-4
  logo?: string
  moodboard?: string[]
}
```

## Variant

```ts
type Variant = {
  variantId: 'A' | 'B'
  name: string
  creativeDirection: string
  hypothesis: string
  selectedHook: string
  aspectRatio: '9:16' | '1:1'
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
  segmentId: string
  sceneId: string
  start: number
  end: number
  duration: number
  role: string
  generationMode: 'T2V' | 'I2V' | 'R2V'
  needsProductReference: boolean
  referenceImageIds?: string[]
  aspectRatio: '9:16' | '1:1'
  audioType: 'narration_voiceover' | 'character_dialogue' | 'no_voice'
  requiresLipSync: boolean
  seedancePrompt: string
  seedanceTaskId?: string
  rawVideoPath?: string
  normalizedVideoPath?: string
}
```

---

# 12. Environment Variables

```env
# Text planning
TEXT_MODEL_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_ADVANCED_MODEL=gemini-2.5-pro

# Video generation
VIDEO_MODEL_PROVIDER=modelark
ARK_API_KEY=
SEEDANCE_MODEL_ID=dreamina-seedance-2-0-260128

# Voice generation
VOICE_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=

# Queue
REDIS_URL=redis://localhost:6379

# Storage
STORAGE_DRIVER=local
LOCAL_OUTPUT_DIR=./outputs

# App
APP_BASE_URL=http://localhost:3000
```

---

# 13. Build Priorities

## Must-have

```text
Single-page UI
Complete input form
Aspect ratio dropdown: 9:16 / 1:1
Product image upload: 1–4 images max
Workflow progress display
Gemini text planning nodes
2 creative variants
Seedance segment generation
FFmpeg normalization and stitching
ElevenLabs voiceover
Subtitle burn-in
2 video output cards side by side
Export selected ratio
Evaluation score
Workflow report
```

## Nice-to-have

```text
Secondary ratio export
ZIP download
Editor feedback selective regeneration
Character dialogue mode with Seedance audio reference
Whisper subtitle alignment
Moodboard visual understanding
Advanced cover templates
```

---

# 14. Final Instruction to TRAE

Build the product according to this updated specification.

Critical instructions:

```text
1. Use Gemini for all text planning, analysis, script, storyboard, prompt, evaluation, and revision nodes.
2. Use Seedance 2.0 only for video generation.
3. Use ElevenLabs only for voice generation.
4. Do not use Seed Speech / BytePlus TTS.
5. Add input dropdown for video aspect ratio: 9:16 and 1:1.
6. Product images can be uploaded as 1–4 images, max 4.
7. Treat aspect ratio as a core workflow parameter, not just final crop.
8. Do not hardcode challenge sample scenarios as fixed product tests.
9. Keep UI single-page, minimal, professional, and focused on input + 2 video outputs.
10. Display both generated video variants side by side.
```

Final product pitch:

```text
A single-page TRAE-orchestrated AI content factory that accepts any marketing brief and brand assets, then generates two publish-ready short-form video variants using Gemini for planning, Seedance 2.0 for video, ElevenLabs for voice, and FFmpeg for post-production, with explicit aspect-ratio control and reusable workflow output.
```
