---
name: tinyship-ai
description: >-
  Configure AI features in TinyShip: chat (Qwen, DeepSeek, OpenAI, Gemini,
  Volcengine; plus Workers AI on Cloudflare), image generation (Qwen, fal.ai,
  OpenAI, Gemini, Volcengine), and video generation (Volcengine, Qwen Wan,
  fal.ai). Includes the admin AI config UI, encrypted keys, and credit cost
  setup. Use when the user asks to "configure AI", "add AI chat",
  "set up image generation", "video generation", "AI provider",
  "admin AI config", "add AI feature", or "configure AI credits".
---

# TinyShip AI Integration

Guide for configuring AI capabilities in TinyShip. Built on Vercel AI SDK.

First-run setup can still bootstrap from environment variables (or recipe env
keys). After the first add or remove in admin, the provider list shows only
providers that have been added.

## Admin AI Config (2.11.0 / tinyship-cf 1.4.0)

Admins manage providers at `/{lang}/admin/ai`. This is the preferred way to
add, remove, and override keys after the first run.

- You can only add or remove providers that are already integrated in the
  built-in catalog. Users cannot add a brand-new, unintegrated vendor from
  the admin UI.
- Main catalog: `qwen`, `openai`, `deepseek`, `fal`, `gemini`, `volcengine`.
  Cloudflare also has `workers-ai` (AI binding; no upstream key; no
  connection test). `workers-ai` is treated as added while the binding is
  present, until it is removed in admin.
- After the first add or remove, the list shows only added providers.
  Un-added providers do not appear in user selectors (`GET /api/ai/catalog`).
- Saved admin keys are encrypted in the database (AES-256-GCM) and take
  precedence over environment variables. Clearing an admin key falls back to
  the env var. Use `AI_SECRETS_ENCRYPTION_KEY` (at least 32 characters); if
  it is unset or empty, `BETTER_AUTH_SECRET` is used and must also be at
  least 32 characters. A dedicated key that is set but too short fails closed
  and does not fall back.
- Built-in models can be enabled, disabled, repriced, or set as default, but
  not deleted. Admins can add a custom model ID under an already-added
  provider that officially supports that capability.
- Connection test uses the already-saved admin key or env var, plus the
  resolved address. It does not send unsaved request-body keys. It makes a
  lightweight official auth request (for example, listing models), does not
  start chat/image/video, and does not deduct credits.
- Qwen absorbs Aliyun: the old `aliyun` id still maps to `qwen`. Chat, image,
  and Wan video share one DashScope key.
- Run migration **0011** on the main repo (`ai_provider_setting` /
  `ai_model_setting`) before deploy. On tinyship-cf the matching migration is
  **0010** (`0010_ai_provider_settings`); table names are the same. CF still
  does not include main-repo #50 AI credit billing or a persistent
  `ai_video_task` table (video tasks stay in process memory).

See `docs/user-guide/ai/admin-config.md` in the project, and the Chinese docs
site pages under `user-guide/ai`.

## Available Capabilities

The built-in catalog is slimmed to official latest models, at most two per
provider (a flagship and a cheaper default). Custom model IDs can still be
added in admin.

| Capability | Providers | Config File |
|-----------|-----------|-------------|
| **AI Chat** | Qwen, DeepSeek, OpenAI, Gemini, Volcengine (plus Workers AI on Cloudflare) | `config/ai.ts` |
| **Image Generation** | Qwen, fal.ai, OpenAI, Gemini, Volcengine | `config/aiImage.ts` |
| **Video Generation** | Volcengine Seedance, Qwen Wan, fal.ai (Kling / Veo) | `config/aiVideo.ts` |

Ask the user which capabilities they want to enable.

Built-in chat IDs on the main repo: Qwen `qwen4-max` / `qwen3.8-flash`
(default); DeepSeek `deepseek-flash`; OpenAI `gpt-6-astra` / `gpt-6-luna`
(default); Gemini `gemini-4-argon` / `gemini-3.8-flash` (default);
Volcengine `doubao-seed-2-1-pro-260915` / `doubao-seed-2-1-lite-260915`
(default).

Built-in image IDs: Qwen `qwen-image-3.0-pro` / `qwen-image-3.0`; Fal
`reve/2.1/text-to-image` (default) / `fal-ai/flux-2-pro`; OpenAI
`gpt-image-2.6-flare` (default) / `gpt-image-2.6-sunburst`; Gemini
`gemini-3.1-flash-image` (default) / `gemini-3-pro-image`; Volcengine
`doubao-seedream-5-5-261028` (default) / `doubao-seedream-5-0-flash-260915`.

Built-in video IDs: Volcengine `doubao-seedance-2-5-260628` (default) /
`doubao-seedance-2-5-flash-261115`; Qwen Wan `wan3.0-video` /
`wan3.0-video-prime`; Fal `fal-ai/kling-video/v3/pro/text-to-video`,
`fal-ai/kling-video/v3/pro/image-to-video`, `fal-ai/veo3.1`,
`fal-ai/veo3.1/image-to-video`.

On Cloudflare, `workers-ai` / `@cf/` models always use AI Gateway. Official
SDKs are used when a snapshot key exists; OpenAI / DeepSeek still use
Gateway when no key is present. Some CF catalog IDs may still differ from
the main repo—read `config/ai.ts`, `config/aiImage.ts`, and `config/aiVideo.ts`
in that project.

## AI Chat Setup

### Step 1: Choose Provider

| Provider | Strengths | Cost | API Key Source |
|----------|-----------|------|----------------|
| **Qwen** (recommended) | Chinese/English, cost-effective | Low | [Aliyun DashScope](https://dashscope.aliyun.com/) |
| **DeepSeek** | Strong coding, very cheap | Very Low | [DeepSeek Platform](https://platform.deepseek.com/) |
| **OpenAI** | Best overall performance | High | [OpenAI Platform](https://platform.openai.com/) |
| **Gemini** | Multimodal, long context | Medium | Google AI Studio / Gemini API |
| **Volcengine** | Doubao Seed 2.1, Chinese/agent | Medium | Volcengine Ark console |
| **Workers AI** (Cloudflare only) | Native `@cf/` models, no third-party key | Low | Cloudflare AI binding |

### Step 2: Configure Environment (first-run bootstrap)

Add the chosen provider's API key to `.env` (or
`apps/tanstack-app/.dev.vars` on Cloudflare). This is still valid for
first run; afterwards the admin UI can override keys.

```bash
# Default provider selection
AI_PROVIDER="qwen"  # or "deepseek", "openai", "gemini", "volcengine"

# Optional. Encrypts admin-saved keys (AES-256-GCM).
# When unset, BETTER_AUTH_SECRET is used and must be at least 32 characters.
# AI_SECRETS_ENCRYPTION_KEY="replace-with-a-random-32-character-minimum-secret"

# Qwen
QWEN_API_KEY="sk-xxxxx"
QWEN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"

# DeepSeek
DEEPSEEK_API_KEY="sk-xxxxx"

# OpenAI
OPENAI_API_KEY="sk-xxxxx"
OPENAI_BASE_URL=""  # optional: custom gateway URL

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY="xxxxx"
# GOOGLE_GENERATIVE_AI_BASE_URL=""  # optional third-party Gemini gateway

# Volcengine
VOLCENGINE_ACCESS_KEY_ID="xxxxx"
# VOLCENGINE_BASE_URL="https://ark.cn-beijing.volces.com"
```

### Step 3: Verify

1. Start the dev server
2. (Recommended) Open `/{lang}/admin/ai`, add the provider if needed, and
   run **Test connection**
3. Navigate to `/ai`
4. Send a test message
5. Verify streaming response works

## Image Generation Setup

Add the chosen provider's API key to `.env` (or `.dev.vars`):

```bash
# fal.ai
FAL_API_KEY="xxxxx"

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY="xxxxx"
GOOGLE_GENERATIVE_AI_BASE_URL=""  # optional: custom gateway

# OpenAI (reuses OPENAI_API_KEY from chat setup)
# Qwen (reuses QWEN_API_KEY from chat setup)
# Volcengine (reuses VOLCENGINE_ACCESS_KEY_ID)
```

Configure available models in `config/aiImage.ts`. The config file defines
the built-in catalog; admin can still add custom model IDs.

Verify at `/image-generate`.

## Video Generation Setup

Add the chosen provider's API key to `.env` (or `.dev.vars`):

```bash
# Qwen/DashScope (reuses QWEN_API_KEY)
# No additional config needed if Qwen chat is already set up

# Volcengine
VOLCENGINE_ACCESS_KEY_ID="xxxxx"
# VOLCENGINE_BASE_URL="https://ark.cn-beijing.volces.com"  # optional

# fal.ai (Kling / Veo)
FAL_API_KEY="xxxxx"
```

Configure available models in `config/aiVideo.ts`.

Verify at `/video-generate`.

## Credit Costs (Optional)

If you want AI features to consume credits, configure `config/credits.ts`
(and optionally override per-model fees in admin). Keep model IDs in sync
with the current catalog; do not reuse retired ids such as `qwen-turbo` or
`gpt-4`.

```typescript
credits: {
  consumptionMode: 'dynamic',
  dynamicChatCostPerKiloToken: 1,
  modelMultipliers: {
    'qwen3.8-flash': 0.6,
    'qwen4-max': 1.5,
    'deepseek-flash': 0.6,
    'gpt-6-luna': 0.6,
    'gpt-6-astra': 2.0,
    'default': 1.0
  },
  imageGenerationCost: 5,   // credits per image
  videoGenerationCost: 20,  // credits per video
}
```

Make sure credit purchase plans are set up (use `tinyship-payment` skill).
Note: tinyship-cf still does not include main-repo #50 AI credit billing.

## Adding a New AI Provider

The admin UI can only add or remove vendors that are already integrated.
It cannot register a brand-new vendor. To integrate a new provider in code,
read `libs/ai/AGENTS.md` for the full pattern. Summary:

1. Install the SDK: `pnpm add @ai-sdk/new-provider`
2. Update types in `libs/ai/types.ts` and the static catalog in
   `config/ai.ts` / `config/aiImage.ts` / `config/aiVideo.ts`
3. Add env key mapping in `libs/ai/config.ts`
4. Implement provider in `libs/ai/providers.ts`
5. Add env vars to `env.example` (or `.dev.vars.example` on Cloudflare)
6. After the code ships, admins can add that provider in `/{lang}/admin/ai`

## Reference Files in TinyShip Repo

- `config/ai.ts` — chat provider configuration
- `config/aiImage.ts` — image generation configuration
- `config/aiVideo.ts` — video generation configuration
- `config/credits.ts` — credit costs for AI features
- `libs/ai/AGENTS.md` — AI library architecture and provider patterns
- `libs/credits/AGENTS.md` — credit system architecture
- `docs/user-guide/ai/admin-config.md` — admin AI configuration
- `docs/user-guide/ai/chat.md` — AI chat documentation
- `docs/user-guide/ai/image.md` — image generation documentation
- `docs/user-guide/ai/video.md` — video generation documentation
