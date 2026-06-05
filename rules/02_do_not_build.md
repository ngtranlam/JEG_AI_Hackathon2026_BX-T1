# Rule 02 — Do Not Build

This file prevents the AI from drifting into unnecessary work.

## Do not build these features

Do not build:

```text
- User authentication
- Billing / subscription
- Team management
- Complex analytics dashboard
- Social media auto-posting
- TikTok API publishing
- Instagram publishing
- YouTube publishing
- Full campaign management platform
- CRM
- Content calendar
- Multi-user permissions
- Chatbot support widget
- Marketplace
- Template store
- Complex admin panel
```

These are outside the hackathon scope.

## Do not over-engineer

Avoid over-complicated architecture unless needed.

Do not introduce:

```text
- Kubernetes
- Microservices
- Kafka
- Complex distributed tracing
- Multi-region storage
- Heavy cloud infra
- Overly abstract plugin systems
```

Recommended MVP architecture:

```text
Next.js
Node.js API
BullMQ + Redis
SQLite/PostgreSQL
FFmpeg
Local storage or R2/S3
ModelArk Seed 2.0
Seedance 2.0
```

## Do not generate text inside AI video

Do not ask Seedance to render text overlays, subtitles, or logo directly inside the generated video.

Correct approach:

```text
Seedance generates clean visual footage.
FFmpeg/ASS/Sharp overlays subtitle, text, cover, and logo in post-production.
```

## Do not make both variants too similar

Do not create two outputs that only differ by:

```text
- Caption
- Hashtag
- Music
- Color filter
- One sentence
```

Variants must differ by:

```text
- Creative angle
- Hook
- Story structure
- Visual direction
- CTA strategy
- A/B testing hypothesis
```

## Do not skip intermediate artifacts

Do not only output video files.

The system must store and expose:

```text
- Brief analysis
- Brand DNA
- Hook list
- Selected hook
- Script
- Storyboard
- Segment plan
- Seedance prompts
- Evaluation score
```

## Do not block the UI during video generation

Seedance generation is async and may take time.

Use queue/status polling.

The UI should show progress instead of freezing.

## Do not build a generic AI video generator

This product is not:

```text
Prompt in → video out
```

This product is:

```text
Brief + brand kit
→ strategy
→ hooks
→ scripts
→ storyboards
→ video segments
→ final publish-ready package
```
