# Skill 04 — Brand Consistency

## Objective

Ensure the output video matches the brand kit and does not feel generic.

## Inputs

Brand kit may include:

```text
Logo
Product images
Brand colors
Font
Tone of voice
Moodboard
Reference images
Visual style
```

## Brand DNA output

Generate:

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
    "subtitle_style": {}
  },
  "logo_rules": {
    "placement": "end card only",
    "duration": "last 2 seconds"
  }
}
```

## Brand voice rules

Extract:

```text
Tone
Vocabulary
Sentence style
Audience fit
Forbidden claims
CTA style
```

## Visual rules

Extract:

```text
Dominant colors
Lighting direction
Camera style
Product visibility
Background style
Subtitle style
Logo placement
```

## Logo rules

Do not ask Seedance to hallucinate logo.

Correct approach:

```text
Add logo during post-production.
Usually place logo on final end card or cover.
```

## Text rules

Do not ask Seedance to generate readable text.

Use:

```text
ASS subtitle
FFmpeg overlay
Sharp for cover
Remotion if chosen
```

## Compliance rules

Brand and compliance constraints must be passed into:

```text
Hook generation
Script generation
Storyboard generation
Seedance prompt builder
Caption generation
Evaluation
```

## Brand consistency evaluation

Score:

```text
0–100 brand consistency
```

Criteria:

```text
Tone matches brief
Colors match brand
Product appears clearly
No forbidden claims
Subtitle style matches brand
CTA matches brand voice
```
