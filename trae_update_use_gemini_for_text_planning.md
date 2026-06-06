# Workflow Update Note — Use Gemini for Text Planning Nodes

## Purpose

This document updates the current TRAE AI Video Content Factory workflow.

The existing workflow may currently use:

```text
Seed 2.0 / Seed 2.0 Lite via ModelArk
```

for text-based reasoning and planning nodes.

Update the workflow so that all **analysis, planning, script, storyboard, prompt-building, scoring, and revision-routing nodes** use **Gemini** instead.

---

## 1. Important decision

Use Gemini as the primary model for all text-based workflow nodes.

```text
Primary text planning model: Gemini
Video generation model: Seedance 2.0
Voice generation provider: ElevenLabs
Media processing: FFmpeg / code
```

Do not use Seed 2.0 / Seed 2.0 Lite as the primary model for text planning anymore.

Seed 2.0 Lite can remain as an optional fallback only if Gemini is not configured.

---

## 2. What should change

Replace this:

```text
Seed 2.0 Lite / ModelArk
→ brief analysis
→ brand analysis
→ creative directions
→ hooks
→ scripts
→ storyboards
→ Seedance prompts
→ evaluation
→ editor revision routing
```

With this:

```text
Gemini
→ brief analysis
→ brand analysis
→ creative directions
→ hooks
→ scripts
→ storyboards
→ Seedance prompts
→ evaluation
→ editor revision routing
```

Keep this unchanged:

```text
Seedance 2.0
→ video generation only

ElevenLabs
→ voice generation only

FFmpeg
→ video stitching, audio mixing, subtitle burn-in, export
```

---

## 3. Recommended model configuration

Add or update environment variables:

```env
TEXT_MODEL_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_ADVANCED_MODEL=gemini-2.5-pro

VIDEO_MODEL_PROVIDER=modelark
SEEDANCE_MODEL_ID=dreamina-seedance-2-0-260128
ARK_API_KEY=

VOICE_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

Optional fallback:

```env
FALLBACK_TEXT_MODEL_PROVIDER=modelark
FALLBACK_TEXT_MODEL_ID=seed-2-0-lite-260428
```

---

## 4. Model usage strategy

Use Gemini models like this:

```text
Gemini 2.5 Flash
→ default for most planning and JSON generation tasks

Gemini 2.5 Pro
→ optional for complex reasoning tasks such as storyboard, evaluation, and revision routing
```

Recommended mapping:

| Workflow Node | Use Gemini? | Recommended Model |
|---|---:|---|
| Input Validator | No | Code only |
| Brief Analyzer | Yes | Gemini Flash |
| Brand DNA Extractor | Yes | Gemini Flash |
| Creative Direction Generator | Yes | Gemini Flash or Pro |
| Hook Generator & Scorer | Yes | Gemini Flash |
| Script Writer | Yes | Gemini Flash |
| Storyboard Planner | Yes | Gemini Flash or Pro |
| Segment Planner | Partial | Code + Gemini Flash |
| Seedance Prompt Builder | Yes | Gemini Flash |
| Seedance Segment Generator | No | Seedance 2.0 |
| Segment Normalizer | No | FFmpeg |
| Video Stitching Agent | No | FFmpeg |
| Voiceover / Audio Strategy Agent | No for TTS text-to-audio | ElevenLabs |
| Subtitle Burn-in Agent | No | FFmpeg / ASS |
| Cover / Caption / Title Generator | Yes for text | Gemini Flash |
| Evaluation Agent | Yes | Gemini Flash or Pro |
| Editor Revision Router | Yes | Gemini Flash or Pro |
| Export Packager | No | Code |

---

## 5. Nodes that must use Gemini

The following nodes must call Gemini:

```text
02 Brief Analyzer
03 Brand DNA Extractor
04 Creative Direction Generator
05 Hook Generator & Scorer
06 Script Writer
07 Storyboard Planner
08 Segment Planner, if semantic splitting is needed
09 Seedance Prompt Builder
15 Cover / Caption / Title Generator
16 Evaluation Agent
17 Editor Revision Router
```

---

## 6. Nodes that must not use Gemini

Do not use Gemini for these tasks unless explicitly needed for metadata:

```text
01 Input Validator
10 Seedance Segment Generator
11 Segment Normalizer
12 Video Stitching Agent
13 Voiceover generation audio synthesis
14 Subtitle Burn-in Agent
18 Export Packager
```

These should use:

```text
Input Validator → TypeScript/Zod validation
Seedance Segment Generator → Seedance 2.0 API
Segment Normalizer → FFmpeg
Video Stitching → FFmpeg
Voiceover → ElevenLabs
Subtitle Burn-in → ASS + FFmpeg
Export Packager → code + filesystem/ZIP
```

---

## 7. Gemini client abstraction

Implement a generic Gemini text generation client.

Suggested interface:

```ts
type GeminiGenerateInput = {
  systemPrompt?: string
  userPrompt: string
  model?: string
  responseSchema?: unknown
  temperature?: number
}

type GeminiGenerateOutput<T = unknown> = {
  text?: string
  json?: T
  raw: unknown
}

async function generateWithGemini<T>(
  input: GeminiGenerateInput
): Promise<GeminiGenerateOutput<T>>
```

The client should support:

```text
- JSON output
- retry on invalid JSON
- schema validation
- configurable model name
- fallback model
```

---

## 8. Structured JSON output is required

All planning nodes should ask Gemini to return structured JSON.

Do not rely on free-form prose for workflow-critical nodes.

Each node should validate Gemini output with a schema.

Recommended:

```text
TypeScript + Zod
```

Example:

```ts
const BriefAnalysisSchema = z.object({
  audience_insight: z.string(),
  pain_points: z.array(z.string()),
  desired_emotion: z.array(z.string()),
  content_goal: z.string(),
  must_include: z.array(z.string()),
  must_avoid: z.array(z.string()),
  platform_conventions: z.array(z.string())
})
```

If Gemini returns invalid JSON:

```text
1. Retry with a stricter repair prompt.
2. If still invalid, fail the node with a clear error.
3. Do not silently continue with broken data.
```

---

## 9. Gemini prompt rules

Each Gemini node prompt must include:

```text
- The exact task
- Input JSON
- Required output JSON schema
- Compliance constraints
- Do not add unrelated features
- Do not output markdown unless requested
- Return valid JSON only
```

For most workflow nodes, use:

```text
Return valid JSON only. Do not include markdown. Do not include explanations.
```

---

## 10. Node-specific instructions

## 10.1 Brief Analyzer

### Input

```json
{
  "brand_name": "GreenBite",
  "product": "Healthy salad delivery",
  "audience": "Office workers aged 25-35",
  "platforms": ["TikTok", "Reels"],
  "target_duration": 30,
  "tone": "fresh, energetic, trustworthy",
  "main_message": "Eat healthy without meal prep",
  "compliance": "No fast weight-loss claims",
  "creative_goal": "Drive first order"
}
```

### Gemini output

```json
{
  "audience_insight": "",
  "pain_points": [],
  "desired_emotion": [],
  "content_goal": "",
  "must_include": [],
  "must_avoid": [],
  "platform_conventions": []
}
```

---

## 10.2 Brand DNA Extractor

### Input

```json
{
  "brand_name": "GreenBite",
  "brand_tone": "fresh, energetic, trustworthy",
  "brand_colors": {
    "primary": "#2E7D32",
    "secondary": "#FFFFFF"
  },
  "product_images": ["uploads/product_01.jpg"],
  "logo": "optional",
  "moodboard": "optional"
}
```

### Gemini output

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
    "subtitle_style": {
      "font": "",
      "position": "lower-middle",
      "max_words_per_line": 5
    }
  },
  "logo_rules": {
    "placement": "end card only",
    "duration": "last 2 seconds"
  }
}
```

---

## 10.3 Creative Direction Generator

### Gemini must generate exactly 2 variants

Output:

```json
{
  "variants": [
    {
      "variant_id": "A",
      "name": "Emotional Storytelling",
      "angle": "",
      "hypothesis": "",
      "style": "",
      "target_emotion": "",
      "cta_strategy": ""
    },
    {
      "variant_id": "B",
      "name": "Product-led Demo",
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
- The 2 variants must be meaningfully different.
- Do not only change caption/music/color.
- Each variant must have an A/B testing hypothesis.
```

---

## 10.4 Hook Generator & Scorer

Gemini must generate 3–5 hooks per variant and score them.

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
        "score": 86,
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

Scoring criteria:

```json
{
  "clarity": 20,
  "curiosity": 20,
  "pain_point_fit": 20,
  "platform_fit": 20,
  "brand_fit": 20
}
```

---

## 10.5 Script Writer

Gemini must write timestamped scripts.

Output:

```json
{
  "variant_id": "A",
  "target_duration": 30,
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
- Hook must appear in first 0–3 seconds.
- CTA must appear in the final 3–4 seconds.
- Text overlay must be short.
- Compliance constraints must be respected.
```

---

## 10.6 Storyboard Planner

Gemini must convert the script into storyboard scenes.

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
      "text_overlay": "",
      "voiceover": "",
      "product_reference_required": false,
      "audio_type": "narration_voiceover",
      "requires_lip_sync": false
    }
  ]
}
```

Rules:

```text
- Use narration_voiceover by default.
- Use character_dialogue only if the scene explicitly requires an on-screen speaker.
- For product demo scenes, set product_reference_required = true.
```

---

## 10.7 Segment Planner

This node can be mostly code-based.

Use Gemini only if semantic splitting is needed.

Rules:

```text
- No segment longer than 15 seconds.
- Recommended segment length: 3–8 seconds.
- Hook: 2–3 seconds.
- CTA: 3–4 seconds.
- 30s video should usually have 5–6 segments.
```

Output:

```json
{
  "segments": [
    {
      "segment_id": "A_SEG_01",
      "scene_id": "A_S01",
      "duration": 3,
      "role": "hook",
      "generation_mode": "T2V",
      "needs_product_reference": false,
      "audio_type": "narration_voiceover",
      "requires_lip_sync": false
    }
  ]
}
```

---

## 10.8 Seedance Prompt Builder

Gemini must generate Seedance prompts using the Seedance best-practice formula:

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

Prompt rules:

```text
- Keep prompt under 1000 words.
- Use natural language.
- Reference assets by order: [Image 1], [Video 1], [Audio 1].
- Put dialogue in double quotes only if generate_audio is true.
- Specify camera and aesthetic.
- Do not mix mutually exclusive Seedance modes.
- For MVP narration mode, set generate_audio=false and mix ElevenLabs voice later.
```

Important:

```text
For normal narration scenes:
- Seedance should generate clean visual video.
- ElevenLabs generates voice separately.
- FFmpeg mixes voice later.

For character_dialogue scenes:
- ElevenLabs can generate dialogue audio first.
- If Seedance supports audio reference for the selected mode, pass that audio as reference.
```

---

## 10.9 Cover / Caption / Title Generator

Use Gemini for:

```text
title
caption
hashtags
cover text
CTA wording
```

Output:

```json
{
  "title": "",
  "caption": "",
  "hashtags": [],
  "cover_text": ""
}
```

---

## 10.10 Evaluation Agent

Use Gemini to evaluate the generated artifacts.

Output:

```json
{
  "variant_id": "A",
  "scores": {
    "hook_strength": 91,
    "brand_consistency": 88,
    "platform_fit": 86,
    "subtitle_readability": 92,
    "visual_quality": 84,
    "compliance": 100
  },
  "publishable_score": 90,
  "publishable": true,
  "notes": []
}
```

Score formula:

```text
publishable_score =
hook_strength * 0.2
+ brand_consistency * 0.2
+ platform_fit * 0.2
+ subtitle_readability * 0.15
+ visual_quality * 0.15
+ compliance * 0.1
```

---

## 10.11 Editor Revision Router

Use Gemini to convert editor feedback into a revision plan.

Input example:

```text
Variant A hơi chậm, hook chưa mạnh, subtitle nhỏ quá.
```

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
- Do not regenerate everything by default.
- Only regenerate affected parts.
- If feedback is vague, apply safe improvements:
  - stronger hook
  - faster first 3 seconds
  - clearer CTA
  - larger subtitle
```

---

## 11. Gemini multimodal note

If product images or moodboard images are available, Gemini may be used for image understanding to extract:

```text
- product appearance
- colors
- packaging description
- moodboard visual style
- lighting style
- camera style
```

However, for MVP, it is acceptable to use metadata and user-provided descriptions only.

Product images should still be passed to Seedance as image references for I2V/product scenes.

---

## 12. Updated model responsibility summary

Use this responsibility split:

| Responsibility | Tool / Model |
|---|---|
| Brief analysis | Gemini |
| Brand DNA | Gemini |
| Creative directions | Gemini |
| Hook generation and scoring | Gemini |
| Script writing | Gemini |
| Storyboard planning | Gemini |
| Segment planning | Code + Gemini if needed |
| Seedance prompt building | Gemini |
| Video generation | Seedance 2.0 |
| Voice generation | ElevenLabs |
| Video stitching | FFmpeg |
| Subtitle burn-in | ASS + FFmpeg |
| Cover/caption/title text | Gemini |
| Evaluation | Gemini |
| Editor revision routing | Gemini |
| Export packaging | Code |

---

## 13. Update README / docs

Update all README and workflow docs to say:

```text
Gemini is used as the primary planning and reasoning model for all text-based workflow nodes.

Seedance 2.0 is used only for video generation.

ElevenLabs is used for all voice generation.

Seed 2.0 Lite is not required for the main workflow and may remain only as an optional fallback.
```

---

## 14. Final instruction to TRAE

Implement this update:

```text
Replace Seed 2.0 Lite / ModelArk text planning with Gemini across all analysis, planning, prompt, scoring, and revision nodes.
```

Do not change:

```text
Seedance 2.0 video generation
ElevenLabs voice generation
FFmpeg stitching/subtitle/export
```

Default env:

```env
TEXT_MODEL_PROVIDER=gemini
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_ADVANCED_MODEL=gemini-2.5-pro
VIDEO_MODEL_PROVIDER=modelark
VOICE_PROVIDER=elevenlabs
```
