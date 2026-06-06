# Workflow Update Note — Voice Generation & Character Dialogue

## Purpose

This document updates the existing TRAE AI Video Content Factory workflow.

The original workflow already includes a node named:

```text
Voiceover Generator
```

This update clarifies how that node should be implemented.

---

## 1. Important decision

Do **not** use Seed Speech / BytePlus TTS for voice generation.

Use **ElevenLabs** as the primary and only required provider for the `Voiceover Generator` task.

```text
Primary voice provider: ElevenLabs
Do not use: Seed Speech / BytePlus TTS
```

Reason:

```text
- ElevenLabs is easier to integrate for this demo.
- Voice generation needs controlled narration from the approved script.
- The system must be able to regenerate voice independently from video.
- Voiceover should be easy to mix with FFmpeg.
```

---

## 2. Updated node name

Rename or reinterpret the existing node:

```text
Voiceover Generator
```

as:

```text
Voiceover / Audio Strategy Agent
```

This node should handle two different audio cases:

```text
1. Narration Voiceover
2. Character Dialogue / Talking Head
```

---

## 3. Default audio mode: Narration Voiceover

This is the default mode for MVP and most scenes.

### Use case

The video shows:

```text
- Product footage
- Lifestyle scene
- Office scene
- Product demo
- Unboxing
- CTA screen
```

A voice narrates over the video, but no on-screen character needs to lip-sync.

### Flow

```text
Approved script
→ ElevenLabs TTS
→ voiceover.mp3
→ FFmpeg mix with stitched video
→ Subtitle burn-in
→ Final export
```

### Input

```json
{
  "project_id": "greenbite_001",
  "variant_id": "A",
  "audio_type": "narration_voiceover",
  "provider": "elevenlabs",
  "language": "vi-VN",
  "voice_id": "ELEVENLABS_VOICE_ID",
  "voice_style": "warm, energetic, friendly",
  "target_duration": 30,
  "script_lines": [
    {
      "start": 0,
      "end": 3,
      "voiceover": "Bạn không thiếu kỷ luật."
    },
    {
      "start": 3,
      "end": 6,
      "voiceover": "Bạn chỉ thiếu một bữa trưa tiện hơn."
    },
    {
      "start": 6,
      "end": 12,
      "voiceover": "GreenBite giao salad tươi tới tận văn phòng."
    }
  ]
}
```

### Process

```text
1. Merge all script_lines.voiceover into one narration text.
2. Call ElevenLabs TTS API.
3. Save generated audio as voiceover.mp3.
4. Measure audio duration.
5. Return audio metadata.
6. Pass audio_path to FFmpeg audio mix step.
```

### Output

```json
{
  "project_id": "greenbite_001",
  "variant_id": "A",
  "provider": "elevenlabs",
  "audio_type": "narration_voiceover",
  "status": "completed",
  "audio_path": "outputs/greenbite_001/A/audio/voiceover.mp3",
  "format": "mp3",
  "duration": 29.4,
  "language": "vi-VN",
  "voice_id": "ELEVENLABS_VOICE_ID",
  "used_as_final_mix": true,
  "next_step": "subtitle_burn_in"
}
```

---

## 4. Important limitation: narration voiceover is not lip-sync

If the video contains an on-screen person speaking directly to camera, simply generating ElevenLabs audio and mixing it with FFmpeg is not enough.

This will not create lip-sync.

Bad approach for talking character:

```text
Seedance creates video of person
+
ElevenLabs creates voice
+
FFmpeg mixes audio
=
Mouth may not match speech
```

This can look fake or broken.

---

## 5. Character Dialogue / Talking Head mode

Use this mode only when a scene explicitly requires an on-screen character to speak.

Example:

```text
A young office worker looks at the camera and says:
“Bạn không thiếu kỷ luật, bạn chỉ thiếu một bữa trưa tiện hơn.”
```

### Required behavior

For character dialogue scenes, the workflow should not treat the voice as simple background narration.

Instead:

```text
Dialogue script
→ ElevenLabs generates dialogue audio
→ Use the generated audio as an audio reference / lip-sync input for Seedance if the selected Seedance mode supports it
→ Seedance generates a talking character segment
→ Normalize the generated segment
→ Stitch into final video
```

### Character dialogue scene input

```json
{
  "scene_id": "A_S01",
  "segment_id": "A_SEG_01",
  "role": "talking_head",
  "audio_type": "character_dialogue",
  "requires_lip_sync": true,
  "dialogue": "Bạn không thiếu kỷ luật, bạn chỉ thiếu một bữa trưa tiện hơn.",
  "visual_prompt": "Young office worker speaking directly to camera in a modern office, vertical TikTok style",
  "provider": "elevenlabs",
  "voice_id": "ELEVENLABS_VOICE_ID"
}
```

### Character dialogue process

```text
1. Generate dialogue audio using ElevenLabs.
2. Save audio file as scene dialogue audio.
3. If Seedance supports audio reference / lip-sync mode:
   - Pass dialogue audio to Seedance generation for that segment.
   - Generate video segment with the character speaking.
4. If Seedance mode does not support audio reference / lip-sync:
   - Avoid talking head generation.
   - Convert the scene to narration mode.
   - Generate clean visual footage without visible mouth speaking.
   - Mix narration voiceover later with FFmpeg.
```

### Character dialogue output

```json
{
  "scene_id": "A_S01",
  "segment_id": "A_SEG_01",
  "audio_type": "character_dialogue",
  "requires_lip_sync": true,
  "audio_path": "outputs/greenbite_001/A/audio/A_SEG_01_dialogue.mp3",
  "used_as_seedance_audio_reference": true,
  "generated_video_path": "outputs/greenbite_001/A/raw/A_SEG_01_talking_head_raw.mp4"
}
```

---

## 6. Audio strategy per scene

Add an audio strategy field to the storyboard / segment plan.

Each scene should specify:

```json
{
  "scene_id": "A_S01",
  "audio_type": "narration_voiceover | character_dialogue | no_voice",
  "requires_lip_sync": false
}
```

Recommended defaults:

```text
Product demo scene → narration_voiceover
Lifestyle scene → narration_voiceover
Product close-up → narration_voiceover
CTA/end card → narration_voiceover or no_voice
Talking head scene → character_dialogue
Testimonial scene → character_dialogue
```

---

## 7. MVP recommendation

For the MVP and hackathon demo, prefer:

```text
Narration Voiceover Mode
```

Avoid using too many talking head / character dialogue scenes.

Reason:

```text
- Narration is easier to control.
- It avoids lip-sync risk.
- It works well for product demo and TikTok/Reels ads.
- It is easier to revise.
- It is easier to stitch multiple Seedance segments.
```

Recommended MVP structure:

```text
0–3s: visual hook + narration
3–10s: problem/lifestyle scene + narration
10–20s: product demo + narration
20–26s: benefit/proof + narration
26–30s: CTA/end card + narration or no_voice
```

Only use character dialogue if absolutely needed.

---

## 8. Updated workflow

Replace this:

```text
Seedance clips
→ Stitching
→ Voiceover Generator
→ Subtitle Burn-in
```

With this:

```text
Storyboard Planner
→ Audio Strategy Planner
→ Segment Planner
→ Seedance Prompt Builder
→ If narration scene:
     Generate visual-only Seedance clip
→ If character dialogue scene:
     Generate ElevenLabs dialogue audio
     Use audio reference in Seedance if supported
→ Normalize segments
→ Stitch video
→ Generate full ElevenLabs narration voiceover if needed
→ FFmpeg audio mix
→ Subtitle burn-in
→ Export
```

Simplified MVP workflow:

```text
Seedance generates clean visual clips
→ FFmpeg stitches video
→ ElevenLabs generates full voiceover
→ FFmpeg mixes voiceover
→ ASS subtitle burn-in
→ Final export
```

---

## 9. ElevenLabs environment variables

Add these environment variables:

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

Remove or ignore Seed Speech related variables if they exist.

Do not require:

```env
BYTEPLUS_TTS_API_KEY
SEED_SPEECH_API_KEY
```

---

## 10. Implementation interface

Create a provider adapter for ElevenLabs.

```ts
type GenerateVoiceoverInput = {
  projectId: string
  variantId: string
  text: string
  language?: string
  voiceId: string
  voiceStyle?: string
  outputPath: string
}

type GenerateVoiceoverOutput = {
  provider: 'elevenlabs'
  audioPath: string
  duration?: number
  format: 'mp3' | 'wav'
  status: 'completed' | 'failed'
}
```

Function:

```ts
async function generateVoiceoverWithElevenLabs(
  input: GenerateVoiceoverInput
): Promise<GenerateVoiceoverOutput>
```

---

## 11. FFmpeg audio mix

After ElevenLabs generates audio, mix it with stitched video.

Example:

```bash
ffmpeg -i variant_a_draft_9x16.mp4 \
-i voiceover.mp3 \
-c:v copy \
-c:a aac \
-shortest \
variant_a_with_voice.mp4
```

If burning subtitle at the same time:

```bash
ffmpeg -i variant_a_draft_9x16.mp4 \
-i voiceover.mp3 \
-vf "subtitles=subtitle.ass" \
-c:v libx264 \
-c:a aac \
-shortest \
variant_a_final_9x16.mp4
```

---

## 12. Subtitle alignment note

For MVP:

```text
Use script/storyboard timing to generate subtitles.
```

Advanced option:

```text
Use ElevenLabs timing/alignment if available.
Otherwise use Whisper after TTS generation to create better subtitle timing.
```

Recommended MVP subtitle flow:

```text
script_lines with start/end
→ generate ASS subtitle
→ burn into video with FFmpeg
```

---

## 13. Final instruction to TRAE

Update the current implementation with the following rule:

```text
Do not use Seed Speech or BytePlus TTS for voice generation.
Use ElevenLabs for all voice generation tasks.
```

Use ElevenLabs for:

```text
- Full narration voiceover
- Per-scene dialogue audio
- Optional character dialogue audio reference for Seedance
```

Default to:

```text
Narration voiceover mode
```

Only use character dialogue mode when a scene explicitly requires an on-screen person to speak. If lip-sync/audio-reference generation is not supported or unstable, convert the scene to narration voiceover mode to avoid broken mouth movement.
