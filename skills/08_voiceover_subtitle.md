# Skill 08 — Voiceover and Subtitle

## Objective

Add voiceover and burn-in subtitles to make the video publish-ready.

## Voiceover strategy

Recommended MVP:

```text
Generate one full voiceover per variant from full script.
```

Advanced:

```text
Generate per-segment voiceover for selective regeneration.
```

## TTS providers

Possible options:

```text
ElevenLabs
BytePlus TTS
OpenAI TTS
Local TTS fallback
```

## Voiceover input

```json
{
  "voice_script": "Bạn không thiếu kỷ luật. Bạn chỉ thiếu một bữa trưa tiện hơn...",
  "voice_style": "warm, energetic, friendly",
  "target_duration": 30
}
```

## Voiceover output

```text
outputs/{project_id}/{variant_id}/audio/voiceover.mp3
```

## Subtitle strategy

MVP:

```text
Use script/storyboard timing to generate ASS subtitle.
```

Advanced:

```text
TTS voiceover
→ Whisper transcription
→ SRT/ASS
→ FFmpeg burn-in
```

## Subtitle style rules

```text
Position: lower-middle
Max words per line: 5–7
Large readable font
Stroke or shadow
Avoid covering product
Use brand font if available
```

## Use ASS subtitle

ASS supports:

```text
Font
Size
Position
Stroke
Shadow
Line breaks
```

## Burn-in command

```bash
ffmpeg -i draft.mp4 \
-i voiceover.mp3 \
-vf "subtitles=subtitle.ass" \
-c:v libx264 -c:a aac \
final_9x16.mp4
```

## Audio rules

Final video should include:

```text
Voiceover
Optional background music
Balanced volume
No original Seedance audio unless intentionally used
```

## Subtitle file output

```text
outputs/{project_id}/{variant_id}/subtitle/subtitle.ass
```

## Final video output

```text
outputs/{project_id}/{variant_id}/final/final_9x16.mp4
```
