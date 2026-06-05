# Skill 14 — DevOps and Setup

## Objective

Set up the project so judges or developers can run it locally.

## Required files

```text
README.md
.env.example
package.json
docker-compose.yml if Redis is used
examples/fnb-brief.json
docs/workflow-one-page.md
```

## Environment variables

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

## Local setup

README should include:

```bash
npm install
cp .env.example .env
docker compose up -d redis
npm run dev
```

## Workflow CLI

Nice to have:

```bash
npm run workflow -- --brief examples/fnb-brief.json
```

## FFmpeg requirement

README must mention FFmpeg installation.

Mac:

```bash
brew install ffmpeg
```

Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

## Redis setup

docker-compose example:

```yaml
services:
  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

## Output folder

All generated artifacts should go to:

```text
outputs/{project_id}/
```

## GitHub repo quality

Repo should include:

```text
Clean README
Architecture explanation
Sample brief
Sample output screenshots
Demo video link placeholder
Clear setup steps
```

## Do not commit secrets

Do not commit:

```text
.env
API keys
Generated private credentials
```

Commit only:

```text
.env.example
```
