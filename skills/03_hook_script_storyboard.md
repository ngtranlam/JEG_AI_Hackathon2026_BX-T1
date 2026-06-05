# Skill 03 — Hook, Script, and Storyboard

## Objective

Convert the brief and creative direction into a timed script and storyboard.

## Hook generation

Generate 3–5 hooks per variant.

Hook should be:

```text
Short
Specific
Audience-aware
Platform-native
Strong in first 0–3 seconds
```

## Hook types

Use these hook types:

```text
Pain-point hook
Contrarian hook
Curiosity hook
Demo hook
Problem-solution hook
Relatable situation hook
```

## Hook scoring

Score each hook from 0–100 using:

```json
{
  "clarity": 20,
  "curiosity": 20,
  "pain_point_fit": 20,
  "platform_fit": 20,
  "brand_fit": 20
}
```

Select the best hook for each variant.

## Script rules

A script must:

```text
Fit target duration
Use timestamps
Start with hook
End with CTA
Respect compliance
Avoid long sentences
Keep overlay text short
```

## Script JSON format

```json
{
  "variant_id": "A",
  "target_duration": 30,
  "script": [
    {
      "time": "0-3",
      "voiceover": "",
      "text_overlay": ""
    }
  ]
}
```

## Storyboard rules

Each storyboard scene must include:

```text
scene_id
start
end
role
visual
camera
motion
text_overlay
voiceover
product_reference_required
```

## Storyboard roles

Use these roles:

```text
hook
problem
product_reveal
product_demo
benefit
proof
cta
```

## Storyboard JSON format

```json
{
  "scene_id": "A_S01",
  "start": 0,
  "end": 3,
  "role": "hook",
  "visual": "Close-up of tired office worker looking at laptop deadline",
  "camera": "handheld close-up",
  "motion": "quick push-in",
  "text_overlay": "Không thiếu kỷ luật",
  "voiceover": "Bạn không thiếu kỷ luật.",
  "product_reference_required": false
}
```

## Timing guidance

For 30s video:

```text
0–3s: hook
3–7s: problem/context
7–14s: product reveal/demo
14–22s: benefits/proof
22–26s: product detail
26–30s: CTA
```

For 20s video:

```text
0–3s: hook
3–6s: problem
6–13s: product/demo
13–17s: benefit
17–20s: CTA
```

For 15s video:

```text
0–2s: hook
2–5s: product reveal
5–11s: benefit/demo
11–15s: CTA
```
