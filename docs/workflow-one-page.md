# Workflow One-Pager

## Input

- Marketing brief (brand, product, audience, objective, CTA, tone, duration)
- Brand kit (colors, fonts, logo/product refs, compliance notes)

## Output (Target)

- Two variants (A/B) with distinct creative directions
- Intermediate artifacts: hooks, scripts, storyboard, segment plan, prompts
- Final assets (later phases): video 9:16 + 1:1, subtitles, voiceover, cover, caption, export bundle

## Node Order

1. input-validator
2. brief-analyzer
3. brand-dna-extractor
4. creative-direction-generator
5. hook-generator-scorer
6. script-writer
7. storyboard-planner
8. segment-planner
9. seedance-prompt-builder
10. seedance-segment-generator
11. segment-normalizer
12. video-stitching-agent
13. voiceover-generator
14. subtitle-burn-in-agent
15. cover-caption-title-generator
16. evaluation-agent
17. editor-revision-router
18. export-packager

## MVP Status (Now)

- Implemented: nodes 1–18 (mock-first full workflow shape)
- Remaining for real production behavior: provider integrations, FFmpeg execution, selective rerun execution, and final packaging ZIP
