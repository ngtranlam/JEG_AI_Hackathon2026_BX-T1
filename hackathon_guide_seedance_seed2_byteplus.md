# Hackathon Guide: Using Seedance 2.0, Seed 2.0 API & Prompt Best Practices from BytePlus

Author: Minh Tan  
Modified: Today  
Source: Feishu Docs export PDF

---

# Part 1: Seedance 2.0 API Reference

Document: https://docs.byteplus.com/en/docs/ModelArk/1520757

## Overview

The Seedance 2.0 API enables programmatic video generation through an asynchronous task-based system. You submit a generation request, receive a task ID, then poll for the result.

## Endpoint

```http
POST https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks
```

## Authentication

Bearer token (API Key)

```http
Authorization: Bearer $ARK_API_KEY
```

---

## Model Capabilities

**Model ID:** `dreamina-seedance-2-0-260128`

Seedance 2.0 supports multimodal reference-based video generation:

- **Text to Video:** Input text prompt to generate a video.
- **Image to Video (First Frame):** Input first frame image + optional text prompt.
- **Image to Video (First & Last Frames):** Input first frame + last frame images + optional text.
- **Multimodal Reference to Video:** Input reference images (0-9) + videos (0-3) + audio (0-3) + text prompt (optional).

Supported input combinations:

- Text only
- Text (optional) + image
- Text (optional) + video
- Text (optional) + image + audio
- Text (optional) + image + video
- Text (optional) + video + audio
- Text (optional) + image + video + audio

> Important: Audio cannot be input alone; at least one reference video or image must be included.

---

## Request Body Parameters

### `model` `(string, Required)`

The model ID to call. Use `dreamina-seedance-2-0-260128` for Seedance 2.0.

You can also use an endpoint ID to access rate limits, billing method, monitoring and security features.

### `content` `(object[], Required)`

The references provided to the model. Supports text, image, audio, video, and sample task ID.

---

## Text Object

| Field | Type | Required | Description |
|---|---|---|---|
| `content.type` | string | Yes | Set to `text` |
| `content.text` | string | Yes | Text prompt describing the expected video. Recommended under 1000 words. Supports English, Japanese, Indonesian, Spanish, and Portuguese. |

---

## Image Object

| Field | Type | Required | Description |
|---|---|---|---|
| `content.type` | string | Yes | Set to `image_url` |
| `content.image_url.url` | string | Yes | Image URL, Base64-encoded string (`data:image/png;base64,...`), or Asset ID (`asset://<ASSET_ID>`) |
| `content.role` | string | Conditional | `first_frame`, `last_frame`, or `reference_image` |

### Image requirements

- Formats: jpeg, png, webp, bmp, tiff, gif, heic, heif
- Aspect ratio (width/height): `(0.4, 2.5)`
- Width/height (px): `(300, 6000)`
- Size: single image `< 30 MB`, request body `< 64 MB`
- Number:
  - 1 for first frame
  - 2 for first + last frames
  - 1-9 for multimodal reference

---

## Video Object

| Field | Type | Required | Description |
|---|---|---|---|
| `content.type` | string | Yes | Set to `video_url` |
| `content.video_url.url` | string | Yes | Public video URL or Asset ID (`asset://<ASSET_ID>`) |
| `content.role` | string | Conditional | Set to `reference_video` |

### Video requirements

- Formats: mp4, mov (H.264/AVC, H.265/HEVC encoding)
- Resolution: 480p, 720p, 1080p
- Duration: each video `[2, 15]` seconds; total of all videos `≤ 15` seconds
- Up to 3 reference videos
- Aspect ratio (width/height): `[0.4, 2.5]`
- Width/height (px): `[300, 6000]`
- Size: each video `≤ 50 MB`
- Frame rate (FPS): `[24, 60]`

---

## Audio Object

| Field | Type | Required | Description |
|---|---|---|---|
| `content.type` | string | Yes | Set to `audio_url` |
| `content.audio_url.url` | string | Yes | Audio URL, Base64-encoded string (`data:audio/wav;base64,...`), or Asset ID |
| `content.role` | string | Conditional | Set to `reference_audio` |

### Audio requirements

- Formats: wav, mp3
- Duration: each audio `[2, 15]` seconds; total of all audio `≤ 15` seconds
- Up to 3 reference audio segments
- Size: each audio `≤ 15 MB`, request body `≤ 64 MB`

---

## Video Generation Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `resolution` | string | `720p` | Video resolution: `480p`, `720p`, `1080p`. `1080p` not supported by 2.0 Fast. |
| `ratio` | string | `adaptive` | Aspect ratio: `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9`, `adaptive` |
| `duration` | integer | `5` | Video duration in seconds: `[4, 15]` or `-1` (model auto-selects) |
| `generate_audio` | boolean | `true` | Whether to include synchronized audio. Put dialogue in double quotes for better results. |
| `seed` | integer | - | Random seed for reproducibility |
| `watermark` | boolean | - | Whether to include watermark |
| `camera_fixed` | boolean | - | Whether camera is fixed |
| `return_last_frame` | boolean | `false` | Return last frame PNG for generating consecutive videos |
| `callback_url` | string | - | URL for task status change notifications (POST) |
| `execution_expires_after` | integer | `172800` | Task timeout in seconds `[3600, 259200]` |
| `priority` | integer | `0` | Queue priority `[0-9]`; higher = higher priority |
| `safety_identifier` | string | - | Hashed end-user identifier for policy compliance |

---

## Resolution & Pixel Values (Seedance 2.0 series)

| Resolution | 16:9 | 4:3 | 1:1 | 3:4 | 9:16 | 21:9 |
|---|---:|---:|---:|---:|---:|---:|
| 480p | 864x496 | 752x560 | 640x640 | 560x752 | 496x864 | 992x432 |
| 720p | 1280x720 | 1112x834 | 960x960 | 834x1112 | 720x1280 | 1470x630 |
| 1080p | 1920x1080 | 1664x1248 | 1440x1440 | 1248x1664 | 1080x1920 | 2206x946 |

---

## Response Body

| Field | Type | Description |
|---|---|---|
| `id` | string | Video generation task ID. Stored for 7 days from creation timestamp. |

After receiving the task ID, poll the task status via the Retrieve a video generation task API.

Task statuses:

```text
queued → running → succeeded / failed / expired
```

---

## Code Example: Multimodal Reference Video

```bash
curl https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $ARK_API_KEY" \
-d '{
  "model": "dreamina-seedance-2-0-260128",
  "content": [
    {
      "type": "text",
      "text": "Use the first-person POV framing from [Video 1] throughout, and use"
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "https://example.com/reference_image_1.jpg"
      },
      "role": "reference_image"
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "https://example.com/reference_image_2.jpg"
      },
      "role": "reference_image"
    },
    {
      "type": "video_url",
      "video_url": {
        "url": "https://example.com/reference_video.mp4"
      },
      "role": "reference_video"
    },
    {
      "type": "audio_url",
      "audio_url": {
        "url": "https://example.com/reference_audio.mp3"
      },
      "role": "reference_audio"
    }
  ],
  "generate_audio": true,
  "ratio": "16:9",
  "duration": 11,
  "watermark": false
}'
```

Response:

```json
{
  "id": "cgt-2026******-****"
}
```

---

## Code Example: Text to Video

```bash
curl https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $ARK_API_KEY" \
-d '{
  "model": "dreamina-seedance-2-0-260128",
  "content": [
    {
      "type": "text",
      "text": "A kitten yawns at the camera"
    }
  ],
  "resolution": "720p",
  "ratio": "16:9",
  "duration": 5,
  "seed": 11,
  "camera_fixed": false,
  "watermark": true
}'
```

---

## Code Example: Image to Video (First Frame)

```bash
curl https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $ARK_API_KEY" \
-d '{
  "model": "dreamina-seedance-2-0-260128",
  "content": [
    {
      "type": "text",
      "text": "The scene slowly comes to life with gentle motion"
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "https://example.com/first_frame.jpg"
      },
      "role": "first_frame"
    }
  ],
  "resolution": "720p",
  "ratio": "adaptive",
  "duration": 5,
  "generate_audio": true
}'
```

---

## Code Example: Image to Video (First & Last Frames)

```bash
curl https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $ARK_API_KEY" \
-d '{
  "model": "dreamina-seedance-2-0-260128",
  "content": [
    {
      "type": "text",
      "text": "Smooth transition between the two scenes"
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "https://example.com/start_frame.jpg"
      },
      "role": "first_frame"
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "https://example.com/end_frame.jpg"
      },
      "role": "last_frame"
    }
  ],
  "resolution": "720p",
  "duration": 8,
  "generate_audio": false
}'
```

---

## Important Constraints

- Seedance 2.0 does not support direct upload of reference images/videos containing real human faces. Use digital characters, authorized assets, or model-generated outputs instead.
- Image to video (first frame), image to video (first and last frames), and multimodal reference video generation are mutually exclusive scenarios and cannot be mixed.
- All generated videos with audio are mono regardless of input audio channels.
- The adaptive ratio setting automatically selects the most appropriate aspect ratio based on input.
- Task IDs are stored for only 7 days from creation, then automatically cleared.
- No BGM sound.

---

## Important Links

- Create video generation task: https://docs.byteplus.com/en/docs/ModelArk/1520757
- Retrieve video generation task: https://docs.byteplus.com/en/docs/ModelArk/1521309
- List video generation task: https://docs.byteplus.com/en/docs/ModelArk/1521675
- Asset library: Hackathon Guide: Seedance 2.0 Virtual Portrait

---

# Part 2: Prompt Best Practices Seedance 2.0

Doc link: https://docs.byteplus.com/en/docs/ModelArk/2222480

## The Core Prompt Formula

Compared to the previous generation, Dreamina-Seedance-2.0 has achieved a generational leap in intent understanding, multimodal fusion, video editing, and physical realism. Therefore, when crafting prompts, you can more boldly combine multimodal materials, design complex shot connections and transitions, and trust the model's precise simulation of the physical world.

Formula:

```text
Subject + Action + Camera Language + @Reference Assets + Style & Aesthetics + Audio & SFX + Constraints
```

### Subject

Define the core character or object of the scene and their key features.

Examples:

```text
a girl wearing a red dress
a futuristic hovering sports car
```

### Action

Describe the behavior and motion of the subject, as well as interactions with other elements.

Examples:

```text
running
picking up a coffee cup from the table
```

### Camera Language

Define how the shot is filmed, including shot scale, angle, and movement.

Examples:

```text
close-up
low-angle shot
fast push-in
```

### @Reference Assets

Reference images, videos, or audio to precisely control character appearance, actions, scenes, or background music.

Examples:

```text
replace protagonist with @Image1
mimic action of @Video1
use background music from @Audio1
```

### Style & Aesthetics

Define the overall visual style of the scene.

Examples:

```text
Pixar animation style
Makoto Shinkai cinematic feel
Cyberpunk
```

### Audio & SFX

Describe specific requirements for dialogue, voiceover, sound effects, or background music.

Examples:

```text
voiceover is a steady male voice
accompanied by the sound of metal clashing
```

### Constraints (Negative Prompts)

Exclude unwanted elements or effects.

Examples:

```text
no xx text
avoid facial distortion
```

---

## Camera Language

| Category | Prompt Examples |
|---|---|
| Shot Scale | Close-up, Near Shot, Medium Shot, Full Shot, Long Shot, Extreme Long Shot |
| Camera Angle | Low Angle, High Angle, Eye-level Shot, Over-the-shoulder Shot |
| Camera Movement | Push-in, Pull-out, Pan, Dolly/Track, Following Shot, Orbit Shot |
| Others | Slow Motion, Time-lapse, Shallow Depth of Field, Handheld Feel |

---

## Aesthetic Styles

| Category | Prompt Examples |
|---|---|
| Animation/Game | Pixar Style, Disney Style, Ghibli/Miyazaki Style, Makoto Shinkai Style, Arcane Style, Claymation, Ink Wash Painting, Felt Art, Pixel Art |
| Film/Period | Cinematic, Wong Kar-wai Style, Quentin Tarantino Style, Cyberpunk, Steampunk, Film Grain, 80s Retro |
| Lighting/Color | High Contrast, Rembrandt Lighting, Neon Light, Soft Light, Tyndall Effect, High Saturation, Desaturated, Morandi Colors |
| Visual Effects | Surrealism, Minimalism, Gothic, Glitch Art, Fluid Effect |

---

## Text Rendering

Seedance 2.0 supports generating text in videos across T2V, I2V, R2V, and V2V scenarios.

### Slogan

Hand-drawn comic style: Two people are sitting around a table enjoying the roast chicken shown in Image 1, with a friendly and joyful atmosphere. The frame then gradually blurs, and the text `"Bite" "Laugh" "Dreamina Seedance"` in order appears in the center of the screen.

### Subtitle (Voiceover)

Camera pulls back and rotates, keeping the baby in Image 1 centered in the frame at all times, creating a commercial showcasing this handbag.

Voiceover (in a gentle, mature, intellectual female voice): Time pens poetry upon the leather...

Text Integration: Display the voiceover as subtitles centered at the bottom of the screen, with perfect timing synchronization to the audio.

### Subtitle (Dialogue)

An animated shot of these two people chatting in a fast-food restaurant in image 1. The man first speaks in a playful tone: `"You're always late..."` Then the woman smiles and replies: `"Don't meddle in my business."`

Text integration: Present the dialogue as subtitles at the bottom center of the screen.

### Speech Bubble

The two characters from Image 1, both dressed in sportswear, are running on the school playground. The girl looks at the boy, smiling confidently as she says: `"We can definitely do it!"` Cut to a close-up of the boy. He hesitates and replies: `"Are you sure?"` Speech bubbles containing the corresponding lines appear around the speaking character.

---

## Image Reference Techniques

Seedance 2.0 supports multi-perspective references for subjects and multi-image referencing for scene layouts and storyboards. Upload images in desired sequence and use identifiers like `[Image 1]`, `[Image 2]` in your prompt.

### Multi-View Subject Reference

Use the Projector shown in image 1, image 2 and image 3. Replace the original background with a commercial advertising background. The camera first focuses on a close-up shot, then quickly rotates 360° with Projector as the main subject, clearly showing the front, side and back.

### Multi-Subject Reference

Using the cat and dog from the reference Image 1 and Image 2 as prototypes, the scene unfolds in a cozy apartment. The dog is lying on the ground eating dog food when the cat approaches, extending a paw to nudge the dog.

### Multi-Element Reference

The scene is set in the restaurant from Image 4. The girl from Image 1, wearing the clothes from Image 2, is organizing items on the counter. The boy from Image 3 approaches to ask for her contact information. The logo from Image 5 remains in the bottom right corner throughout.

### Storyboard Reference

Refer to the storyboard in Image 1 to create an intense high-energy fight sequence. All storyboard frame compositions shall be presented in strict predefined order.

---

## Audio Reference Techniques

### Voice Cloning (Voiceover)

Fixed shot with shallow depth of field: The character from Image 1 stands motionless... Meanwhile, a female voiceover with the vocal timbre from Audio 1 delivers the line: `"Come, amidst the mountains and under the sun, embrace the gifts bestowed by the wilderness."`

### Voice Cloning (Dialogue)

The man from Image 1 and the woman from Image 2 are chatting at a sun-drenched outdoor cafe. The man speaks with the voice of Audio 2, saying: `"So, I was thinking, we should totally hit up that new spot tonight."` The woman responds with the voice of Audio 1: `"I'm down, but only if you're picking up the tab this time!"`

### BGM Integration

Extend the Video 1 duration. Tilt the camera upward, and play Audio1 simultaneously as the camera movement begins.

---

## Video Reference Techniques

### Motion Reference

Refer to the character movements and shot language in Video 1 to create a fight scene with the character from Image 2 on the left and the character from Image 1 on the right. Include intense background music.

### Camera Motion Reference

Referring to the camera movement in Video 1, create a concept video for a science and technology park, with the tall building in the image as the visual center, also using a first-person dive perspective.

### Visual Effects (VFX) Reference

Refer to the golden particle effects in Video 1, so that when the character in Image 1 plays the flute, the same particle effects surround their body.

Refer to the special effects shown in Video 1 to generate identical wings for the girl in Image 1, ensuring the wing formation trajectory follows the exact same motion path.

---

## Video Editing

### Add Elements

Add snacks such as fried chicken and pizza to the countertop in Video 1.

### Remove Elements

Remove everything that isn't office stuff from the table in Video 1, keeping the rest of the video content unchanged.

### Modify Elements

Replace the perfume featured in Video 1 with the face cream from Image 1, with all original motions and camera work preserved.

### Forward Extension

Generate the content after the Video 1: the two men who are late run towards them, the five people finally meet and have a friendly chat.

### Backward Extension

Extend the opening segment of Video 1: Set up an over-the-shoulder shot of the man in a hoodie, and the man says: `"It's not that bad. You're just stressed."`

### Video Track Completion

Video 1. The moment a leaf falls to the ground, it sets off a special effect of golden particles. A gust of wind blows by, leading into Video 2.

---

## Quick Reference Tips

1. Keep prompts under 1000 words - lengthy text leads to scattered information and missing elements.
2. Use natural language logic - the model follows sequential descriptions well.
3. Reference assets by order - use `[Image 1]`, `[Video 1]`, `[Audio 1]` identifiers matching upload order.
4. Put dialogue in double quotes - optimizes audio generation when `generate_audio: true`.
5. Specify camera and aesthetic - include camera movement, cuts, and visual style for cinematic results.
6. Mutually exclusive modes - first frame, first + last frames, and multimodal reference cannot be mixed.
7. Use `return_last_frame: true` for generating consecutive video clips.
8. `duration: -1` lets the model auto-select optimal length within `[4,15]` seconds.

---

# Part 3: Dola Seed 2.0 Lite model API reference

## Model details

**Model ID:** `seed-2-0-lite-260428`

## API guide

- Image understanding: https://docs.byteplus.com/en/docs/ModelArk/1362931
- Video understanding: https://docs.byteplus.com/en/docs/ModelArk/1895586

## Example

```bash
curl --location 'https://ark.ap-southeast.bytepluses.com/api/v3/responses' \
--header 'Authorization: Bearer API-KEY' \
--header 'Content-Type: application/json' \
--header 'ark-beta-mcp: true' \
--data '{
  "model": "seed-2-0-lite-260428",
  "stream": true,
  "tools": [
    {
      "type": "mcp",
      "server_label": "deepwiki",
      "server_url": "https://mcp.deepwiki.com/mcp",
      "require_approval": "never"
    }
  ],
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "check the repo structure expressjs/express "
        }
      ]
    }
  ]
}'
```

---

> Note: The content is generated by AI. Please use with caution.
