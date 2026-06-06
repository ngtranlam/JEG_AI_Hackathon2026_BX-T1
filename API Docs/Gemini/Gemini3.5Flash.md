Gemini 3.5 Flash delivers near-Pro intelligence at Flash-tier cost and speed: Pro-level coding proficiency, parallel agentic execution, all at the same price point as a Flash model.

<br />

To get started, view the [introductory notebook for Gemini 3.5 Flash](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/gemini/getting-started/intro_gemini_3_5_flash.ipynb).

For more information on using the latest Gemini models, see
[Get started with Gemini 3](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/get-started-with-gemini-3).


[Try in Agent Platform](https://console.cloud.google.com/vertex-ai/generative/multimodal/create/text?model=gemini-3.5-flash) [(Preview) Deploy example app](https://console.cloud.google.com/vertex-ai/studio/multimodal?suggestedPrompt=How+does+AI+work&deploy=true&model=gemini-3.5-flash)
Note: To use the "Deploy example app" feature, you need a Google Cloud project with billing and Agent Platform API enabled.

| Model ID | `gemini-3.5-flash` ||
| Supported inputs \& outputs | - Inputs: Text, Code, Images, Audio, Video, PDF - Outputs: Text ||
| Token limits | - Maximum input tokens: 1,048,576 - Maximum output tokens: 65,535 (default) ||
| Capabilities | - Supported - [Grounding with Google Search](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/grounding-with-google-search) - [Code execution](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tools/code-execution) - [System instructions](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/system-instruction-introduction) - [Function calling](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tools/function-calling) - [Count Tokens](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/get-token-count) - [Structured output](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/control-generated-output) - [Thinking](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/thinking) - [Implicit context caching](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/context-cache/context-cache-overview) - [Explicit context caching](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/context-cache/context-cache-overview) - [Chat completions](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/migrate/openai/overview) - Not supported - [Supervised fine-tuning](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini-supervised-tuning) - [Continuous tuning](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini-use-continuous-tuning) - [Preference tuning](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini-preference-tuning) - [Tuning checkpoints](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tuning-checkpoints) - [Gemini Live API](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api) - [Content Credentials (C2PA)](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/content-credentials) ||
| Consumption options | - Supported - [Provisioned Throughput](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/provisioned-throughput) - [Standard PayGo with Usage Tiers](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/standard-paygo) - [Flex PayGo](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/flex-paygo) - [Priority PayGo](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/priority-paygo) - [Batch inference](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/batch-inference) - Not supported ||
| Consumption options |
|---|---|---|
| See [Consumption options](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/deploy/consumption-options) for more information. ||
| **Images** | - Maximum images per prompt: 3,000 - Maximum file size per file for inline data or direct uploads through the console: 7 MB - Maximum file size per file from Google Cloud Storage: 30 MB - Maximum number of output images per prompt: 10 - Supported MIME types: `image/png`, `image/jpeg`, `image/webp`, `image/heic`, `image/heif` |
| **Documents** | - Maximum number of files per prompt: 3,000 - Maximum number of pages per file: 3,000 - Maximum file size per file for the API or Cloud Storage imports: 50 MB(application/pdf) or 7 MB(text/plain) - Maximum file size per file for direct uploads through the console: 7 MB - Supported MIME types: `application/pdf`, `text/plain` |
| **Video** | - Maximum video length (with audio): Approximately 45 minutes - Maximum video length (without audio): Approximately 1 hour - Maximum number of videos per prompt: 10 - Supported MIME types: `video/x-flv`, `video/quicktime`, `video/mpeg`, `video/mpegs`, `video/mpg`, `video/mp4`, `video/webm`, `video/wmv`, `video/3gpp` |
| **Audio** | - Maximum audio length per prompt: Approximately 8.4 hours, or up to 1 million tokens - Maximum number of audio files per prompt: 1 - Supported MIME types: `audio/x-aac`, `audio/flac`, `audio/mp3`, `audio/m4a`, `audio/mpeg`, `audio/mpga`, `audio/mp4`, `audio/ogg`, `audio/pcm`, `audio/wav`, `audio/webm` |
| **Parameter defaults** | - Temperature: 0.0-2.0 (default 1.0) - topP: 0.0-1.0 (default 0.95) - topK: 64 (fixed) - candidateCount: 1--8 (default 1) |
| Model availability | - Global - global - Multi-region (See [connection guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/locations#specify-an-endpoint)) - us - eu |
| ML processing | - United States - Multi-region - Europe - Multi-region |
| Provisioned throughput | - Global - global - Multi-region (See [connection guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/locations#specify-an-endpoint)) - us - eu |
| Standard pay-as-you-go | - Global - global - Multi-region (See [connection guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/locations#specify-an-endpoint)) - us - eu |
| See [Deployments and endpoints](https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/locations) for more information. ||
| **Online prediction** | - Data residency - CMEK - VPC-SC - AXT |
| **Batch inference** | - Data residency - CMEK - VPC-SC - AXT |
| **Tuning** | - Data residency - CMEK - VPC-SC - AXT |
| **Context caching** | - Data residency - CMEK - VPC-SC - AXT |
| See [Security controls](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/security-controls) for more information. ||