# Skill 10 — Web App UI

## Objective

Build a minimal but professional demo UI.

The UI must clearly show:

```text
Input
Workflow progress
2 video outputs side by side
Export controls
```

## Recommended stack

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui optional
```

## Page layout

Use 2-column layout on desktop:

```text
Left column: Input panel
Right column: Workflow progress and outputs
```

On mobile, stack vertically.

## Header

Show:

```text
TRAE AI Video Content Factory
Brief to 2 publish-ready video variants
```

## Input panel

Required fields:

```text
Brand name
Product/service name
Product description
Target audience
Platform
Duration
Brand tone
Main message
Campaign goal
Compliance constraints
CTA
Logo upload
Product image upload
Moodboard upload optional
```

Button:

```text
Generate 2 Video Variants
```

## Workflow progress UI

Use:

```text
Stepper
Timeline
Checklist
Status cards
```

Status values:

```text
pending
running
completed
failed
```

## Output UI

Display side-by-side cards:

```text
Variant A
Variant B
```

Each card:

```text
Video preview
Variant name
Creative direction
A/B hypothesis
Selected hook
Duration
Publishable score
Buttons
```

## Required buttons

```text
Download 9:16
Download 1:1
Download cover
Copy caption
View script/storyboard
```

## Comparison table

Show below variants:

```text
Creative angle
Hook
Target emotion
CTA
Publishable score
```

## Editor feedback UI

Below output cards:

```text
Variant selector: A / B / Both
Textarea
Button: Regenerate affected parts
```

After submit, show revision plan.

## Visual style

Keep it:

```text
Clean
Minimal
Professional
Card-based
Readable
One accent color
```

Avoid:

```text
Too many animations
Complex dashboard
Distracting graphics
```

## Acceptance criteria

The UI is acceptable if:

```text
A judge can see the input and both output videos within 10 seconds.
The two variants are easy to compare.
The workflow progress is visible.
The app feels like a real demo product.
```
