# Skill 12 — Editor Revision Loop

## Objective

Allow an editor to give feedback and regenerate only affected parts.

## Input

Editor feedback example:

```text
Variant A hơi chậm, hook chưa mạnh, subtitle nhỏ quá.
```

## Output

Revision plan:

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

## Feedback mapping

Map feedback to action:

```text
hook weak → rewrite hook + first scene + first segment
too slow → shorten scene timing + re-stitch
subtitle small → regenerate ASS subtitle + re-export
CTA weak → rewrite final scene + regenerate final segment
product unclear → regenerate product demo segment
wrong tone → rewrite script + possibly regenerate affected segments
```

## Selective regeneration

Do not regenerate everything by default.

Regenerate only:

```text
Affected script section
Affected storyboard scene
Affected Seedance prompt
Affected video segment
Dependent stitch/export steps
```

## Revision flow

```text
Receive feedback
→ Parse feedback
→ Create revision plan
→ Confirm target variant
→ Execute affected nodes
→ Re-stitch if video changed
→ Re-burn subtitle if subtitle/audio changed
→ Re-evaluate
→ Update output
```

## UI display

Show:

```text
Revision plan
Affected nodes
Progress
New output preview
```

## Fallback

If the feedback is vague, apply safe improvements:

```text
Stronger hook
Faster first 3 seconds
Clearer CTA
Larger subtitle
```

Do not ask too many questions during demo.
