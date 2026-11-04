# Erised AI • Configuration & Deployment Guide

Erised AI provides flexible options for running visual literary synthesis across zero-cost headless sessions, local offline privacy engines, and cloud APIs.

---

## 1. Zero-Key Headless Google Gemini (Default Mode)

Erised AI works out of the box with zero API keys and zero billing accounts by communicating directly with your active Google One / Gemini consumer session at `gemini.google.com`.

### How It Works
- **Authentication**: When signed into Google in your browser, the extension transparently leverages your session cookies (`__Secure-1PSID`, `__Secure-3PSID`, `SID`).
- **CSRF Token Extraction**: The background worker extracts the rotating `SNlM0e` anti-CSRF token directly from `gemini.google.com/app`.
- **Model Pipeline**:
  - **Stage 1 (Text Analysis)**: Fastest Gemini model analyzes full-page prose (~1.2s).
  - **Stage 2 (Plate Generation)**: Google Imagen 3 synthesizes high-resolution fine-art illustrations (~15–25s).
- **Service Worker Keep-Alive**: The background worker maintains a 4-second runtime heartbeat to prevent Chrome Manifest V3 from prematurely idling the service worker during Imagen 3 rendering.

### Troubleshooting Session Detection
1. Visit [gemini.google.com](https://gemini.google.com) and verify you are signed in.
2. In Erised AI, open the popup and click **↻ Reset Session** to purge cached tokens and re-authenticate.
3. If still disconnected, refresh `gemini.google.com` to refresh Google session tokens.

---

## 2. Public Free-Tier Flux.1 (Automatic Fallback)

If Google Gemini is unavailable or not signed in, Erised AI automatically falls back to **Pollinations Flux.1**:

- **Zero-Key Access**: No account required.
- **Client-Side Cooldown**: Implements a 45-second reactive rate limiter between requests to respect public free-tier infrastructure.
- **Negative Prompts**: Flux.1 prompts are automatically appended with anti-caricature and anti-text filters.

---

## 3. Local Offline Models (Ollama / vLLM / LM Studio)

For zero cloud telemetry and complete offline reading, Erised AI can route text distillation through local LLM servers.

### Prerequisites
Install [Ollama](https://ollama.ai) and pull a recommended model:
```bash
ollama run llama3.2
# Or for larger GPU rigs:
ollama run mistral-nemo
```

### Configuration (`.env`)
```ini
AI_SYNTHESIS_ENGINE=local_llm
LOCAL_MODEL_ENDPOINT=http://localhost:11434
LOCAL_MODEL_NAME=llama3.2
```

> **Note on Local Image Generation**: Text models like Llama 3.2 handle Stage 1 scene analysis locally. If a local Stable Diffusion / ComfyUI endpoint is running (e.g. `http://localhost:8188`), plate synthesis can be routed locally as well.

---

## 4. Fine-Art Visual Styles

Erised AI includes 6 pre-crafted fine-art visual styles configured in `src/ai/prompt-architect.js`:

| Style ID | Name | Artistic Influence |
| :--- | :--- | :--- |
| `chiaroscuro_oil` | Caravaggio Chiaroscuro Oil | Deep shadows, warm amber candlelights, Caravaggio, Rembrandt |
| `gothic_romanticism` | Gothic & Dark Romanticism | Moody mist, cold moonlight, Friedrich, Turner |
| `ethereal_watercolor` | Ethereal Classical Watercolor | Soft translucent washes, Turner landscapes, gold-leaf accents |
| `renaissance_fresco` | Renaissance Fresco | Matte mineral pigments, classical proportions, Raphael, Da Vinci |
| `victorian_etching` | Victorian Pen & Ink | Fine cross-hatching, engraved book plate, Doré, Rackham |
| `pre_raphaelite` | Pre-Raphaelite Tapestry | Luminous jewel tones, botanical detail, Waterhouse, Rossetti |

