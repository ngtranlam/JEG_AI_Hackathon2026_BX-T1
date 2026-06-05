# Build Request: AI Video Content Factory

## 1. Mục tiêu sản phẩm

Xây dựng một workflow / ứng dụng tên **AI Video Content Factory** phục vụ bài thi **BX-T1 - Content Creation Video Factory**.

Mục tiêu chính:

> Từ một marketing brief + brand kit đầu vào, hệ thống tự động tạo ra 2 creative video variants publish-ready cho TikTok / Reels / Shorts trong thời lượng 15–30 giây, có subtitle cứng, voiceover, cover, title, caption, export 9:16 và 1:1. Workflow phải được điều phối rõ ràng bằng TRAE và sử dụng Seedance 2.0 để gen video.

Lưu ý kỹ thuật quan trọng:

Seedance 2.0 chỉ tạo được video segment tối đa khoảng 15 giây. Vì vậy nếu người dùng chọn video 20–30 giây, hệ thống phải chia video thành nhiều segment nhỏ, gen từng segment bằng Seedance, sau đó normalize và ghép lại bằng FFmpeg.

---

## 2. Sản phẩm cần build

Cần build một **web app + workflow runner** có các chức năng:

1. Nhập brief marketing.
2. Upload brand kit: logo, ảnh sản phẩm, màu brand, font, moodboard tùy chọn.
3. TRAE điều phối workflow theo từng node.
4. Tạo 2 creative variants khác nhau.
5. Tạo hook A/B, script, storyboard.
6. Chia storyboard thành các segment ngắn phù hợp giới hạn Seedance.
7. Gọi Seedance 2.0 để gen từng segment video.
8. Normalize video segment bằng FFmpeg.
9. Ghép các segment thành video hoàn chỉnh.
10. Tạo voiceover.
11. Tạo và burn-in subtitle.
12. Tạo cover, title, caption, hashtags.
13. Chấm publishable score.
14. Cho phép editor nhập feedback và regenerate phần cần sửa.
15. Export final package gồm video 9:16, video 1:1, cover, caption, script, storyboard, evaluation report.

---

## 3. Tech stack đề xuất

### Frontend

Use:

```text
Next.js + TypeScript + Tailwind CSS
```

Frontend cần có các màn hình:

1. Brief Input
2. Workflow Progress
3. Variant Review
4. Editor Feedback
5. Export Result

---

### Backend

Use:

```text
Node.js / Next.js API routes hoặc NestJS
```

Backend xử lý:

- Lưu project.
- Chạy workflow.
- Gọi Seed 2.0 / ModelArk cho text generation.
- Gọi Seedance 2.0 cho video generation.
- Quản lý async jobs.
- Chạy FFmpeg.
- Tạo subtitle, cover, export package.

---

### Queue / Async Task

Use:

```text
BullMQ + Redis
```

Lý do:

Seedance video generation là tác vụ async. Cần tạo task, poll status, download kết quả sau khi task hoàn tất.

---

### Video Processing

Use:

```text
FFmpeg
```

FFmpeg dùng để:

- Normalize video segment.
- Scale/crop video về 9:16.
- Ghép segment.
- Add voiceover.
- Burn subtitle.
- Export 1:1.
- Extract frame làm cover.

---

### Image Processing

Use:

```text
Sharp
```

Sharp dùng để:

- Overlay text lên cover.
- Resize logo.
- Tạo thumbnail/cover.
- Có thể extract màu cơ bản nếu cần.

---

### Text Generation

Use:

```text
Seed 2.0 via ModelArk
```

Dùng cho:

- Brief analysis.
- Brand DNA extraction.
- Creative direction generation.
- Hook generation.
- Script writing.
- Storyboard planning.
- Caption/title/hashtag generation.
- Evaluation report.
- Editor feedback parsing.

---

### Video Generation

Use:

```text
Seedance 2.0 via ModelArk
```

Dùng cho:

- Text-to-video segment.
- Image-to-video segment nếu có ảnh sản phẩm.
- Reference-to-video nếu có moodboard/reference.

---

### Voiceover

Use one of:

```text
ElevenLabs
BytePlus TTS nếu có sẵn
OpenAI TTS nếu cần backup
```

MVP có thể dùng ElevenLabs để đảm bảo voice tự nhiên.

---

### Subtitle

Use:

```text
ASS subtitle + FFmpeg burn-in
```

MVP có thể tạo subtitle timing từ storyboard/script. Nếu có thời gian, có thể thêm Whisper để align subtitle chính xác theo voiceover.

---

### Storage

MVP:

```text
Local filesystem
```

Production-ready:

```text
Cloudflare R2 / AWS S3
```

---

### Database

MVP:

```text
SQLite
```

Production-ready:

```text
PostgreSQL
```

---

## 4. Cấu trúc repo đề xuất

```text
video-content-factory/
├── apps/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── api/
│       └── styles/
├── packages/
│   ├── workflow/
│   │   ├── nodes/
│   │   │   ├── input-validator.ts
│   │   │   ├── brief-analyzer.ts
│   │   │   ├── brand-dna-extractor.ts
│   │   │   ├── creative-direction-generator.ts
│   │   │   ├── hook-generator-scorer.ts
│   │   │   ├── script-writer.ts
│   │   │   ├── storyboard-planner.ts
│   │   │   ├── segment-planner.ts
│   │   │   ├── seedance-prompt-builder.ts
│   │   │   ├── seedance-segment-generator.ts
│   │   │   ├── segment-normalizer.ts
│   │   │   ├── video-stitching-agent.ts
│   │   │   ├── voiceover-generator.ts
│   │   │   ├── subtitle-burnin-agent.ts
│   │   │   ├── cover-caption-generator.ts
│   │   │   ├── evaluation-agent.ts
│   │   │   ├── editor-revision-router.ts
│   │   │   └── export-packager.ts
│   │   └── run-workflow.ts
│   ├── modelark/
│   │   ├── seed-client.ts
│   │   └── seedance-client.ts
│   ├── media/
│   │   ├── ffmpeg.ts
│   │   ├── subtitles.ts
│   │   ├── cover.ts
│   │   └── audio.ts
│   ├── queue/
│   │   ├── worker.ts
│   │   └── jobs.ts
│   └── types/
│       └── workflow.ts
├── examples/
│   ├── fnb-brief.json
│   └── skincare-brief.json
├── outputs/
├── docs/
│   ├── workflow-one-page.md
│   ├── demo-script.md
│   └── architecture.md
├── .env.example
├── README.md
└── package.json
```

---

## 5. Environment variables

Tạo file `.env.example`:

```env
MODELARK_API_KEY=
MODELARK_BASE_URL=
SEED_MODEL_ID=
SEEDANCE_MODEL_ID=

ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

REDIS_URL=redis://localhost:6379

DATABASE_URL=file:./dev.db

STORAGE_DRIVER=local
LOCAL_OUTPUT_DIR=./outputs

APP_BASE_URL=http://localhost:3000
```

---

## 6. Data model chính

### Project object

```json
{
  "project_id": "greenbite_001",
  "status": "draft | running | completed | failed",
  "brief": {},
  "brand_kit": {},
  "analysis": {},
  "variants": [],
  "assets": {},
  "exports": {},
  "created_at": "",
  "updated_at": ""
}
```

---

### Brief object

```json
{
  "brand_name": "GreenBite",
  "product": "Healthy salad delivery",
  "audience": "Office workers 25-35",
  "platforms": ["TikTok", "Reels"],
  "target_duration": 30,
  "tone": "fresh, energetic, trustworthy",
  "main_message": "Eat healthy without meal prep",
  "compliance": "No fast weight-loss claims",
  "creative_goal": "Drive first order"
}
```

---

### Brand kit object

```json
{
  "logo_path": "uploads/logo.png",
  "product_images": [
    "uploads/product_01.jpg",
    "uploads/product_02.jpg"
  ],
  "colors": ["#2E7D32", "#FFFFFF", "#F5EEDC"],
  "font": "Montserrat",
  "moodboard": [],
  "visual_style": "clean, bright, modern, realistic"
}
```

---

### Variant object

```json
{
  "variant_id": "A",
  "name": "Emotional Storytelling",
  "creative_direction": "",
  "hypothesis": "",
  "selected_hook": "",
  "script": [],
  "storyboard": [],
  "segments": [],
  "evaluation": {},
  "exports": {}
}
```

---

### Segment object

```json
{
  "segment_id": "A_SEG_01",
  "scene_id": "A_S01",
  "start": 0,
  "end": 3,
  "duration": 3,
  "role": "hook",
  "generation_mode": "T2V | I2V | R2V",
  "seedance_prompt": "",
  "seedance_task_id": "",
  "raw_video_url": "",
  "raw_video_path": "",
  "normalized_video_path": "",
  "status": "pending | generating | completed | failed"
}
```

---

## 7. Chi tiết workflow nodes

## Node 01 — Input Validator

### Purpose

Validate và normalize input brief + brand kit.

### Input

Brief + brand kit từ UI.

### Output

```json
{
  "valid": true,
  "warnings": [],
  "normalized_brief": {
    "target_duration": 30,
    "primary_platform": "TikTok",
    "export_ratios": ["9:16", "1:1"]
  }
}
```

### Requirements

- Nếu thiếu brand name, product, audience, duration thì báo lỗi.
- Nếu duration > 30 thì set warning hoặc giới hạn về 30s.
- Nếu duration < 15 thì cho phép nhưng vẫn output đúng format.
- Nếu không upload moodboard thì dùng default platform style.

---

## Node 02 — Brief Analyzer

### Purpose

Phân tích brief thành insight, pain point, goal, constraints.

### Input

Normalized brief.

### Output

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

### Use model

Seed 2.0 / ModelArk.

---

## Node 03 — Brand DNA Extractor

### Purpose

Phân tích brand kit để tạo brand rules.

### Input

Brand kit + brief analysis.

### Output

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

### Requirements

- Không để Seedance tự vẽ logo/text trong video.
- Logo và text nên được overlay ở post-production bằng FFmpeg/Sharp/Remotion.
- Brand color và style phải truyền vào prompt Seedance.

---

## Node 04 — Creative Direction Generator

### Purpose

Tạo 2 hướng sáng tạo khác nhau cho A/B test.

### Output

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

### Requirements

- Variant A và B phải khác nhau rõ ràng về concept, hook, visual, pacing, CTA.
- Không được chỉ đổi caption hoặc đổi vài từ.
- Mỗi variant phải có A/B testing hypothesis.

---

## Node 05 — Hook Generator & Scorer

### Purpose

Tạo nhiều hook cho mỗi variant và chọn hook tốt nhất.

### Output

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

### Scoring criteria

Chấm 100 điểm dựa trên:

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

## Node 06 — Script Writer

### Purpose

Viết script theo đúng target duration.

### Output example

```json
{
  "variant_id": "A",
  "target_duration": 30,
  "script": [
    {
      "time": "0-3",
      "voiceover": "Bạn không thiếu kỷ luật.",
      "text_overlay": "Không thiếu kỷ luật"
    },
    {
      "time": "3-6",
      "voiceover": "Bạn chỉ thiếu một bữa trưa tiện hơn.",
      "text_overlay": "Chỉ thiếu lựa chọn tốt hơn"
    }
  ]
}
```

### Requirements

- Script phải chia theo timestamp.
- Hook nằm trong 0–3s đầu.
- CTA nằm trong 3–4s cuối.
- Không vi phạm compliance.
- Text overlay ngắn, tối đa 5–7 từ mỗi màn hình.

---

## Node 07 — Storyboard Planner

### Purpose

Biến script thành storyboard chi tiết theo scene.

### Output example

```json
{
  "storyboard": [
    {
      "scene_id": "A_S01",
      "start": 0,
      "end": 3,
      "role": "hook",
      "visual": "Close-up of tired office worker looking at laptop deadline",
      "camera": "handheld close-up",
      "motion": "quick push-in",
      "text_overlay": "Không thiếu kỷ luật",
      "voiceover": "Bạn không thiếu kỷ luật."
    }
  ]
}
```

### Requirements

- Mỗi scene phải có visual rõ ràng.
- Có camera style.
- Có motion nếu cần.
- Có role: hook / problem / product_demo / benefit / proof / CTA.
- Storyboard phải dùng được để build prompt Seedance.

---

## Node 08 — Segment Planner

### Purpose

Chia storyboard thành các segment phù hợp giới hạn Seedance.

### Rules

```text
- Không segment nào dài quá 15s.
- Nên chia mỗi segment 3–8s để dễ kiểm soát.
- Với video 30s, nên có 5–6 segment.
- Hook segment nên 2–3s.
- CTA segment nên 3–4s cuối.
- Nếu scene dài hơn 8–10s, có thể split thành 2 segment.
```

### Output example

```json
{
  "segments": [
    {
      "segment_id": "A_SEG_01",
      "duration": 3,
      "source_scene": "A_S01",
      "generation_mode": "T2V",
      "needs_product_reference": false
    },
    {
      "segment_id": "A_SEG_02",
      "duration": 6,
      "source_scene": "A_S02",
      "generation_mode": "I2V",
      "needs_product_reference": true
    }
  ]
}
```

---

## Node 09 — Seedance Prompt Builder

### Purpose

Tạo prompt riêng cho từng segment.

### Prompt rules

Mỗi prompt nên có:

- Aspect ratio: 9:16.
- Duration.
- Platform style: TikTok/Reels short-form ad.
- Visual description.
- Camera style.
- Motion.
- Brand colors.
- Product reference nếu có.
- Compliance constraints.
- Negative instruction: no text, no fake logo, no medical claims.

### Output example

```json
{
  "segment_id": "A_SEG_01",
  "prompt": "Vertical 9:16 TikTok ad, 3 seconds, realistic modern office, young office worker tired at laptop, natural daylight, handheld close-up, quick push-in, relatable workday stress, clean bright green-white-beige color palette, no text, no logo, no medical claims.",
  "aspect_ratio": "9:16",
  "duration": 3,
  "resolution": "720p"
}
```

---

## Node 10 — Seedance Segment Generator

### Purpose

Gọi Seedance 2.0 để tạo từng video segment.

### Flow

```text
Create Seedance generation task
↓
Store task_id
↓
Poll task status
↓
When success, get video_url
↓
Download raw video
↓
Save to outputs/{project_id}/{variant_id}/raw/
```

### Output

```json
{
  "segment_id": "A_SEG_01",
  "status": "success",
  "task_id": "seedance_task_xxx",
  "video_url": "",
  "local_path": "outputs/greenbite_001/A/raw/A_SEG_01_raw.mp4"
}
```

### Requirements

- Cần retry nếu task lỗi.
- Cần lưu trạng thái từng segment.
- Không block toàn bộ app trong lúc chờ Seedance.
- Dùng BullMQ + Redis để quản lý queue.

---

## Node 11 — Segment Normalizer

### Purpose

Chuẩn hóa video segment trước khi ghép.

### Standard output

```json
{
  "resolution": "1080x1920",
  "fps": 30,
  "codec": "h264",
  "pixel_format": "yuv420p",
  "audio": "muted",
  "container": "mp4"
}
```

### FFmpeg command

```bash
ffmpeg -i input.mp4 \
-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
-c:v libx264 -pix_fmt yuv420p -an \
output_norm.mp4
```

### Output

```json
{
  "segment_id": "A_SEG_01",
  "normalized_path": "outputs/greenbite_001/A/norm/A_SEG_01_norm.mp4",
  "duration": 3.02,
  "fps": 30,
  "resolution": "1080x1920"
}
```

---

## Node 12 — Video Stitching Agent

### Purpose

Ghép các normalized segment thành video draft.

### MVP transition

Use:

```text
Hard cut
```

### FFmpeg concat

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

### Output

```json
{
  "variant_id": "A",
  "draft_video": "outputs/greenbite_001/A/draft/variant_a_draft_9x16.mp4",
  "duration": 30.1
}
```

---

## Node 13 — Voiceover Generator

### Purpose

Tạo voiceover từ script.

### Recommended

Generate one full voiceover for each variant.

### Input

```json
{
  "voice_script": "Bạn không thiếu kỷ luật. Bạn chỉ thiếu một bữa trưa tiện hơn...",
  "voice_style": "warm, energetic, friendly",
  "target_duration": 30
}
```

### Output

```json
{
  "voiceover_path": "outputs/greenbite_001/A/audio/voiceover.mp3",
  "duration": 29.5
}
```

---

## Node 14 — Subtitle Burn-in Agent

### Purpose

Tạo subtitle và burn-in vào video.

### MVP approach

Use storyboard/script timing to generate `.ass` subtitle.

### Advanced approach

TTS voiceover → Whisper transcribe → SRT/ASS → FFmpeg burn-in.

### Subtitle rules

- Subtitle nằm lower-middle.
- Font theo brand kit nếu có.
- Text ngắn, dễ đọc.
- Có stroke/background để đọc được trên video.
- Không che sản phẩm.

### FFmpeg command

```bash
ffmpeg -i variant_a_draft_9x16.mp4 \
-i voiceover.mp3 \
-vf "subtitles=subtitle.ass" \
-c:v libx264 -c:a aac \
variant_a_final_9x16.mp4
```

---

## Node 15 — Cover / Caption / Title Generator

### Purpose

Tạo social publishing assets.

### Output

```json
{
  "title": "Healthy lunch without meal prep",
  "caption": "Busy day? GreenBite makes healthy lunch simple. Fresh, fast, and office-ready.",
  "hashtags": ["#HealthyLunch", "#OfficeFood", "#TikTokFood"],
  "cover_text": "Healthy lunch in 30s",
  "cover_path": "outputs/greenbite_001/A/final/cover.png"
}
```

### Cover generation MVP

1. Extract frame from final video using FFmpeg.
2. Overlay cover text using Sharp.
3. Add logo if available.

---

## Node 16 — Evaluation Agent

### Purpose

Chấm điểm publish-ready cho từng variant.

### Output

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
  "notes": [
    "Hook is strong and audience-specific",
    "Subtitle is readable",
    "Product appears clearly in the demo scene",
    "No compliance issue detected"
  ]
}
```

### Score formula

```text
publishable_score =
hook_strength * 0.2
+ brand_consistency * 0.2
+ platform_fit * 0.2
+ subtitle_readability * 0.15
+ visual_quality * 0.15
+ compliance * 0.1
```

### Passing condition

```text
publishable_score >= 80
```

---

## Node 17 — Editor Revision Router

### Purpose

Nhận feedback từ editor và chỉ regenerate phần cần sửa.

### Input example

```text
Variant A hơi chậm, hook chưa mạnh, subtitle nhỏ quá.
```

### Output example

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

### Requirements

- Nếu feedback liên quan hook, sửa script/storyboard/segment đầu.
- Nếu feedback liên quan subtitle, chỉ regenerate subtitle + burn-in.
- Nếu feedback liên quan CTA, sửa scene cuối.
- Nếu feedback liên quan visual scene cụ thể, regenerate đúng segment đó.
- Sau revision, chạy lại stitching/export/evaluation.

---

## Node 18 — Export Packager

### Purpose

Xuất final package.

### Output folder

```text
outputs/
└── greenbite_001/
    ├── variant_A/
    │   ├── final_9x16.mp4
    │   ├── final_1x1.mp4
    │   ├── cover.png
    │   ├── script.json
    │   ├── storyboard.json
    │   ├── caption.txt
    │   ├── seedance_prompts.json
    │   └── evaluation.json
    ├── variant_B/
    │   ├── final_9x16.mp4
    │   ├── final_1x1.mp4
    │   ├── cover.png
    │   ├── script.json
    │   ├── storyboard.json
    │   ├── caption.txt
    │   ├── seedance_prompts.json
    │   └── evaluation.json
    └── workflow_report.md
```

### Export 1:1 FFmpeg

```bash
ffmpeg -i final_9x16.mp4 \
-vf "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080" \
final_1x1.mp4
```

Requirement:

- 9:16 là primary output.
- 1:1 có thể dùng crop safe-area aware.
- Nếu subtitle bị cắt khi crop 1:1, cần render lại subtitle position cho 1:1.

---

## 8. UI requirements

---

## 8.1. Web app demo UI direction

The demo web app does not need to be complex, but it must look clean, professional, and clearly demonstrate the complete workflow from input to output.

### UI style direction

Use a minimal but professional SaaS-style interface.

Recommended style:

```text
- Clean white / dark neutral background
- Clear card-based layout
- Modern spacing
- Simple typography
- Minimal colors, preferably one accent color
- No over-designed animation required
- Focus on clarity and demo readiness
```

The UI should prioritize:

```text
1. Easy brief input
2. Clear workflow progress
3. Clear side-by-side comparison of 2 generated video variants
4. Easy export/download
```

---

### Main page layout

Recommended layout:

```text
------------------------------------------------------------
Header
TRAE AI Video Content Factory
Brief to 2 publish-ready video variants
------------------------------------------------------------

Left column:
Input brief + brand kit

Right column:
Workflow progress + generated outputs
------------------------------------------------------------
```

On larger screens, use a 2-column layout:

```text
Left: Input panel
Right: Output / Workflow panel
```

On smaller screens, stack sections vertically.

---

### Required input section

The input section must be complete enough for judges to understand what the workflow receives.

Required fields:

```text
- Brand name
- Product / service name
- Product description
- Target audience
- Platform: TikTok / Reels / Shorts
- Target duration: 15s / 20s / 30s
- Brand tone
- Main message
- Campaign goal
- Compliance constraints
- Call to action
```

Required upload fields:

```text
- Logo upload
- Product image upload
- Optional moodboard / reference image upload
```

Optional advanced fields:

```text
- Brand colors
- Font name
- Visual style
- Voice style
- Language
```

The input panel should have a clear primary button:

```text
Generate 2 Video Variants
```

---

### Required workflow progress section

The app should show the workflow steps clearly, even if the internal implementation is simplified.

Display each step with status:

```text
pending | running | completed | failed
```

Required visible steps:

```text
1. Input validation
2. Brief analysis
3. Brand DNA extraction
4. Creative direction generation
5. Hook generation and scoring
6. Script writing
7. Storyboard planning
8. Segment planning
9. Seedance prompt building
10. Seedance video segment generation
11. Segment normalization
12. Video stitching
13. Voiceover generation
14. Subtitle burn-in
15. Cover / caption generation
16. Evaluation
17. Export packaging
```

The progress section can be implemented as:

```text
- Vertical stepper
- Timeline
- Checklist
- Status cards
```

The most important point is that judges can see TRAE orchestrating a multi-step workflow.

---

### Required output section

The output section must clearly show **2 video outputs at the same time**.

Use a side-by-side layout:

```text
------------------------------------------------------------
Variant A                            Variant B
Emotional Storytelling               Product-led Demo
[Video Preview 9:16]                 [Video Preview 9:16]
Hook                                 Hook
Publishable Score                    Publishable Score
Download buttons                     Download buttons
------------------------------------------------------------
```

Each variant card must include:

```text
- Variant name
- Creative direction
- A/B test hypothesis
- Selected hook
- Video preview
- Duration
- Publishable score
- Export buttons
```

Required buttons per variant:

```text
- Download 9:16 video
- Download 1:1 video
- Download cover
- Copy caption
- View script/storyboard
```

---

### Output comparison requirement

The two variants must be visually and conceptually easy to compare.

Show a small comparison table below the video outputs:

```text
| Criteria | Variant A | Variant B |
|---|---|---|
| Creative angle | Emotional storytelling | Product-led demo |
| Hook | ... | ... |
| Target emotion | ... | ... |
| CTA | ... | ... |
| Publishable score | ... | ... |
```

This helps judges immediately understand that the system generated two meaningfully different creative directions, not two nearly identical videos.

---

### Editor feedback UI

Add a simple editor feedback box below the two video outputs.

Required elements:

```text
- Textarea for feedback
- Variant selector: A / B / Both
- Button: Regenerate affected parts
```

Example placeholder:

```text
Example: Make Variant A faster, increase subtitle size, and make the CTA more direct.
```

After feedback is submitted, the UI should show which parts will be regenerated:

```text
Revision plan:
- Rewrite hook
- Regenerate scene 1
- Increase subtitle size
- Re-export final video
```

---

### Export result UI

The final export area should include:

```text
- Download Variant A 9:16
- Download Variant A 1:1
- Download Variant B 9:16
- Download Variant B 1:1
- Download all as ZIP
- Download workflow report
```

Also show generated publishing assets:

```text
- Title
- Caption
- Hashtags
- Cover image
```

---

### Demo UI acceptance criteria

The web app demo is considered acceptable if:

```text
1. User can fill in a complete brief.
2. User can upload logo and product image.
3. User can click one generate button.
4. The app shows workflow progress clearly.
5. The app displays Variant A and Variant B video outputs side by side.
6. Each variant has hook, creative direction, score, and export buttons.
7. The interface looks minimal, clean, and professional.
8. The output section is clear enough for judges to understand within 10 seconds.
```

The UI does not need advanced animations, complex dashboards, or account management. Focus on a polished demo experience that clearly proves the workflow works.


## Screen 1 — Brief Input

Fields:

- Brand name
- Product/service
- Audience
- Platform: TikTok / Reels / Shorts
- Target duration: 15 / 20 / 30 seconds
- Tone
- Main message
- Compliance constraints
- Upload logo
- Upload product images
- Upload moodboard/reference optional
- Button: Generate Video Factory

---

## Screen 2 — Workflow Progress

Hiển thị progress theo node:

```text
✓ Input Validator
✓ Brief Analyzer
✓ Brand DNA Extractor
✓ Creative Direction Generator
✓ Hook Generator & Scorer
✓ Script Writer
✓ Storyboard Planner
⏳ Seedance Segment Generator
```

Mỗi node nên có status:

```text
pending | running | completed | failed
```

---

## Screen 3 — Variant Review

Hiển thị Variant A và B:

- Creative direction
- A/B hypothesis
- Selected hook
- Script
- Storyboard
- Video preview
- Caption/title
- Publishable score

---

## Screen 4 — Editor Feedback

Có text box:

```text
Enter feedback, for example:
Make Variant A faster, increase subtitle size, and make CTA more direct.
```

Button:

```text
Regenerate affected parts
```

Sau khi click, workflow chỉ chạy lại các node cần thiết.

---

## Screen 5 — Export

Cho tải:

- Variant A 9:16
- Variant A 1:1
- Variant B 9:16
- Variant B 1:1
- Cover images
- Captions
- Workflow report
- ZIP final package

---

## 9. API endpoints

```text
POST /api/projects
Create new project from brief and brand kit.

POST /api/projects/:id/run
Start full workflow.

GET /api/projects/:id/status
Get workflow progress.

GET /api/projects/:id
Get project details.

GET /api/projects/:id/variants
Get generated variants.

POST /api/variants/:id/revise
Submit editor feedback and run selective revision.

GET /api/projects/:id/export
Download final package.
```

---

## 10. Database schema

### projects

```text
id
brand_name
product
brief_json
brand_kit_json
analysis_json
status
created_at
updated_at
```

### variants

```text
id
project_id
name
creative_direction
hypothesis
selected_hook
script_json
storyboard_json
score_json
status
created_at
updated_at
```

### segments

```text
id
variant_id
scene_id
duration
generation_mode
prompt
seedance_task_id
raw_video_url
raw_video_path
normalized_video_path
status
created_at
updated_at
```

### assets

```text
id
project_id
type
path
metadata_json
created_at
```

### exports

```text
id
variant_id
ratio
video_path
cover_path
caption_path
evaluation_path
created_at
```

---

## 11. Example input brief for demo

Use this as default sample in the app.

```json
{
  "brand_name": "GreenBite",
  "product": "Healthy salad delivery",
  "audience": "Office workers aged 25-35 in Southeast Asia",
  "platforms": ["TikTok", "Reels"],
  "target_duration": 30,
  "tone": "fresh, energetic, trustworthy",
  "main_message": "Eat healthy without meal prep",
  "compliance": "Do not claim fast weight loss or medical benefits",
  "creative_goal": "Drive first order"
}
```

---

## 12. Expected output for demo

For the sample input, system should generate:

```text
Variant A — Emotional Storytelling
- 30s video
- 9:16 export
- 1:1 export
- Hook
- Script
- Storyboard
- Cover
- Caption
- Evaluation score

Variant B — Product-led Demo
- 30s video
- 9:16 export
- 1:1 export
- Hook
- Script
- Storyboard
- Cover
- Caption
- Evaluation score
```

---

## 13. Demo success criteria

Demo should prove:

1. User can input one brief.
2. TRAE workflow runs through visible nodes.
3. System creates 2 creative variants.
4. System creates hooks, scripts, storyboards.
5. System splits 30s video into Seedance-safe segments.
6. System generates segments with Seedance 2.0.
7. System stitches segments with FFmpeg.
8. System adds voiceover and subtitle.
9. System exports 9:16 and 1:1.
10. System generates cover/caption/title.
11. System shows publishable score.
12. Editor can submit feedback and regenerate affected part.
13. Final output package can be downloaded.

---

## 14. Important implementation notes

### Do not generate text inside Seedance video

Text generated directly inside AI video can be broken or unreadable.

Instead:

- Seedance creates clean visual footage.
- FFmpeg/Sharp/ASS subtitle handles text overlay.
- Logo is added in post-production.

---

### Treat video as timeline segments

Because Seedance duration is limited, the app should never depend on a single 30s generation.

Use:

```text
Script
→ Storyboard
→ Segment plan
→ Seedance clips
→ Normalize clips
→ Stitch final video
```

---

### Make regeneration selective

If editor feedback only affects hook, regenerate only:

```text
hook → scene 1 storyboard → segment 1 video → stitch → subtitle/export
```

Do not regenerate the whole video unless necessary.

---

### Store all intermediate files

Need to save:

- Brief analysis
- Brand DNA
- Creative directions
- Hooks
- Scripts
- Storyboards
- Seedance prompts
- Raw segment videos
- Normalized segment videos
- Final stitched videos
- Captions
- Evaluation reports

This helps debug and helps judges understand the workflow.

---

## 15. README requirements

Create a clear README with:

```text
1. Product overview
2. Problem statement
3. Solution
4. Architecture diagram
5. Tech stack
6. Setup instructions
7. Environment variables
8. How to run local dev
9. How to run sample brief
10. Output folder explanation
11. TRAE workflow explanation
12. Demo script
```

Example setup:

```bash
npm install
cp .env.example .env
docker compose up -d redis
npm run dev
```

Example run:

```bash
npm run workflow -- --brief examples/fnb-brief.json
```

---

## 16. One-page workflow report content

Generate `docs/workflow-one-page.md` with:

```text
Product:
TRAE AI Video Content Factory

Problem:
Short-form video production takes 8–20 hours and requires copywriters, editors, designers, and platform expertise.

Solution:
A TRAE-orchestrated workflow that turns brief + brand kit into 2 publish-ready video variants.

Input:
Brief, brand kit, product images, logo, moodboard.

Workflow:
Analyze → Ideate → Hook test → Script → Storyboard → Segment → Seedance generation → Stitch → Voice/subtitle → Evaluate → Export.

Output:
2 variants, 9:16 + 1:1, cover, title, caption, subtitle, script, storyboard, evaluation.

Key technology:
TRAE, Seedance 2.0, Seed 2.0 ModelArk, FFmpeg, TTS, Whisper/subtitle pipeline.

Differentiation:
Handles Seedance duration limit by segmenting long videos and stitching clips into final publish-ready output.

Evaluation:
Publishable score based on hook strength, brand consistency, platform fit, subtitle readability, visual quality, and compliance.
```

---

## 17. Build priority

### Must-have MVP

Build these first:

```text
1. Brief input UI
2. Brand kit upload
3. Workflow progress UI
4. Brief analysis
5. Brand DNA extraction
6. 2 creative directions
7. Hook generation and scoring
8. Script writing
9. Storyboard planning
10. Segment planner
11. Seedance prompt builder
12. Seedance segment generation
13. FFmpeg normalize and stitch
14. Subtitle burn-in
15. Export 9:16 and 1:1
16. Caption/title/cover
```

---

### Nice-to-have

Build if time allows:

```text
1. Editor feedback selective regeneration
2. Whisper-based subtitle alignment
3. Brand consistency visual checker
4. Better cover design templates
5. Crossfade/transition options
6. Cloud storage
7. ZIP package download
8. Multiple sample briefs
```

---

## 18. Final expected pitch line

The final product should be presented as:

```text
A TRAE-orchestrated AI content factory that turns a marketing brief and brand kit into two publish-ready short-form video variants in under 60 minutes, powered by Seedance 2.0, with hook A/B testing, brand consistency, segment-based video generation, FFmpeg stitching, voiceover, burn-in subtitles, editor revision, and multi-ratio export.
```
