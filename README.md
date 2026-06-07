# BX-T1 - Content Creation Video Factory

> 🚀 Hackathon Project by Team JEG  
> 🎯 Sponsor: BytePlus × TRAE  
> ⚡ Goal: Turn one brief into two publish-ready short-form video variants in under 60 minutes

## 👥 Team Information

**Team Name:** JEG

**Members:**

- Minh Tien
- Thuy Linh
- Anh Thu
- Hai Nam
- Tran Lam

## ✨ Overview

BX-T1 is an AI-powered content factory that transforms a single creative brief into two publish-ready short-form video variants for TikTok, Instagram Reels, or YouTube Shorts. The system orchestrates multiple AI agents to handle script generation, video creation, voiceover, subtitles, and export packaging automatically.

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 20+ 
- **Redis** (for job queue management)
- **FFmpeg** (for video processing)
- **Git** (for version control)

### 1. Clone Repository

```bash
git clone https://github.com/ngtranlam/JEG_AI_Hackathon2026_BX-T1.git
cd JEG_AI_Hackathon2026_BX-T1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create `.env.local` file from example:

```bash
cp .env.example .env.local
```

**Required API Keys:**

```env
# ModelArk (Seedance 2.0 video generation)
MODELARK_API_KEY=your_modelark_api_key
MODELARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3

# Seed 2.0 (AI text generation)
SEED_API_KEY=your_seed_api_key
SEED_BASE_URL=https://ark.cn-beijing.volces.com/api/v3

# ElevenLabs (Voiceover generation)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Database
DATABASE_URL=file:./dev.db

# Redis
REDIS_URL=redis://localhost:6379
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 5. Start Services

**Terminal 1 - Redis Server:**
```bash
redis-server
```

**Terminal 2 - Background Worker:**
```bash
npm run worker
```

**Terminal 3 - Web Application:**
```bash
npm run dev
```

Open browser: **http://localhost:3000**

---

## 📋 Complete Workflow Guide

### Workflow Overview

The system executes **14 sequential nodes** to transform a brief into publish-ready videos:

1. **Input Validator** - Validates brief and brand kit
2. **Brief Analyzer** - Analyzes audience, value proposition, objectives
3. **Brand DNA Extractor** - Extracts brand colors from logo
4. **Hook Generator** - Generates 3 hook variants (A, B, C)
5. **Hook Selector** - Selects best 2 hooks for variants
6. **Script Writer** - Writes full scripts with narration
7. **Segment Planner** - Plans video segments with timing
8. **Seedance Prompt Builder** - Builds visual prompts for each segment
9. **Seedance Segment Generator** - Generates video clips via Seedance 2.0
10. **Segment Normalizer** - Normalizes video format/quality
11. **Video Stitching Agent** - Concatenates segments into draft video
12. **Voiceover Generator** - Generates voiceover with ElevenLabs (optional)
13. **Subtitle Burn-in Agent** - Burns subtitles into video (optional)
14. **Export Packager** - Creates 1:1 and 9:16 exports with metadata

---

## 🎬 Step-by-Step Usage

### Step 1: Fill Project Brief

**Required Fields:**
- **Brand Name**: Your brand/product name
- **Product Name**: Specific product being promoted
- **Product Description**: Key features and benefits
- **Target Audience**: Who you're targeting (e.g., "Gen Z coffee lovers")
- **Platform**: TikTok / Instagram Reels / YouTube Shorts (single choice)
- **Duration**: 15s / 20s / 30s
- **Aspect Ratio**: 9:16 (vertical) or 1:1 (square)
- **Brand Tone**: Voice and personality (e.g., "Fun, energetic, youthful")
- **Main Message**: Core message to communicate
- **Compliance Constraints**: Any legal/regulatory requirements

**Optional Fields:**
- **Call to Action**: e.g., "Shop now", "Learn more"
- **Offer**: Special promotion or discount
- **Mandatory Claims**: Must-include statements
- **Prohibited Claims**: Avoid these statements

### Step 2: Upload Brand Assets

**Product Images (1-4 required):**
- Upload 1-4 product photos
- Used as reference for video generation
- Best: high-quality, well-lit product shots

**Optional Logo:**
- PNG, JPG, or SVG
- System extracts brand colors automatically

**Optional Moodboard:**
- Visual reference for style/composition
- PNG, JPG, or PDF

### Step 3: Configure Audio Settings

**Voiceover & Subtitles (Toggle):**
- **ON**: Generate AI voiceover + burn subtitles
  - **Voice Gender**: Choose Male (👨 Nam) or Female (👩 Nữ)
  - Male Voice ID: `876MHA6EtWKaHTEGzjy5`
  - Female Voice ID: `sScFwemjGrAkDDiTXWMH`
- **OFF**: Skip voiceover and subtitle generation

**Background Music (Optional):**
- Upload MP3, WAV, or AAC file
- Music loops automatically to fit video length
- Mixes at 30% volume over original video audio
- Does NOT replace video sound effects

### Step 4: Generate Videos

1. Click **"Generate"** button
2. System creates project and starts workflow
3. Monitor progress in **"Workflow Progress"** section
4. Each node shows:
   - ⏳ Running (orange spinner)
   - ✓ Completed (green checkmark)
   - ✗ Failed (red indicator)

**Estimated Time:** 5-15 minutes depending on video length and complexity

### Step 5: Review Generated Variants

**Variant A & B Cards:**
- Preview final video with controls
- View script, hook, and segment breakdown
- Check publishability score (if available)

**Seedance Clips Preview:**
- Click on **"Seedance Segment Generator"** node
- View all video segments in 3-column grid
- See generating status with skeleton loader
- Preview individual clips before final assembly

### Step 6: Download Exports

**Available Formats:**
- **9:16 Vertical** - Original aspect ratio
- **1:1 Square** - For Instagram feed posts
- **Prompts.txt** - All AI prompts used
- **Workflow Report** - Generation metadata

**Export Location:** `outputs/generated/{projectId}/`

---

## 🔧 Advanced Features

### Re-run from Specific Node

1. Expand any completed node in workflow
2. Click **"▶ Run again"** button
3. Workflow restarts from that node onwards
4. Useful for:
   - Regenerating videos with different settings
   - Fixing failed nodes
   - Testing prompt variations

### Manual Database Reset

If you need to clear all projects:

```bash
rm -f prisma/dev.db
npx prisma db push
```

### Audio Upload API

Background music uploads are handled via:
```
POST /api/uploads/audio
```

Accepts: MP3, WAV, OGG, AAC, M4A  
Returns: `{ filePath, fileName }`

---

## 🐛 Troubleshooting

### "Table 'main.Project' does not exist"

**Solution:**
```bash
npx prisma db push
# Restart dev server
```

### Redis Connection Error

**Solution:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running:
redis-server
```

### FFmpeg Not Found

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

### Seedance Generation Fails

**Common causes:**
- Invalid API key
- Reference image contains human faces (use product-only images)
- Network timeout (retry the node)

---

## 📁 Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── projects/      # Project CRUD
│   │   └── uploads/       # File upload handlers
│   └── page.tsx           # Main UI
├── components/            # React components
│   └── project-demo.tsx   # Main workflow interface
├── lib/
│   ├── server/
│   │   ├── workflow/      # Workflow orchestration
│   │   │   └── nodes/     # Individual workflow nodes
│   │   ├── media/         # FFmpeg video processing
│   │   ├── audio/         # ElevenLabs integration
│   │   └── modelark/      # Seedance API client
│   └── types/             # TypeScript types
├── workers/               # Background job processors
├── prisma/                # Database schema
└── outputs/               # Generated videos
```

---

## 🎯 Key Technologies

- **Next.js 15** - Web framework
- **Prisma** - Database ORM
- **BullMQ** - Job queue
- **Redis** - Queue storage
- **FFmpeg** - Video processing
- **Seedance 2.0** - AI video generation
- **Seed 2.0** - AI text generation
- **ElevenLabs** - AI voiceover
- **TypeScript** - Type safety

---

## 📝 License

MIT License - See LICENSE file for details
