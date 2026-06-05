# Skill 13 — Evaluation Scoring

## Objective

Generate a publishable score for each variant.

## Score categories

```text
Hook strength
Brand consistency
Platform fit
Subtitle readability
Visual quality
Compliance safety
```

## Score formula

```text
publishable_score =
hook_strength * 0.2
+ brand_consistency * 0.2
+ platform_fit * 0.2
+ subtitle_readability * 0.15
+ visual_quality * 0.15
+ compliance * 0.1
```

## Passing condition

```text
publishable_score >= 80
```

## Output format

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

## How to score with LLM

Use available artifacts:

```text
Brief
Brand DNA
Creative direction
Hook
Script
Storyboard
Subtitle style
Prompt list
Compliance constraints
```

Ask the model to evaluate output using the scoring rubric.

## Compliance score

If forbidden claims appear:

```text
Set compliance below 60
Mark publishable false
Suggest rewrite
```

## Brand consistency score

Check:

```text
Tone matches brand
Colors are referenced
Product appears in script/storyboard
CTA matches campaign goal
No off-brand language
```

## Platform fit score

Check:

```text
Strong first 3 seconds
Fast pacing
Clear overlay text
Short-form native style
CTA at end
```

## Subtitle readability

Check:

```text
Short lines
Readable size
Good placement
Not covering product
```

## Evaluation notes

Always output actionable notes:

```text
What is good
What needs improvement
Which scene should be revised
```
