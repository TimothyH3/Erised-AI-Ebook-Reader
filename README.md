# Erised AI &bull; Fine-Art Literary Reader (Chrome Extension Manifest V3)

> **Erised AI is a modern, illuminated fine-art book reader browser extension that automatically illustrates literary masterworks in real-time using a 2-Stage Headless Google Gemini pipeline via the user's active session with ZERO developer API keys and ZERO per-token costs.**

---

## ✦ Key Architectural Pillars

### 1. 2-Stage Headless Gemini Pipeline
- **Stage 1 — Grounded Excerpt Extraction & Autonomous Page Analysis**:
  - The full page text (1,800–2,400 characters) is fed headlessly to the fastest Gemini model.
  - **Specific Excerpt Anchor**: The model selects ONE specific sentence or concise passage as the visual anchor of the illustration, returning the verbatim text in `selectedExcerpt`.
  - **Refined Literary Restraint**: Replaces over-dramatized comic melodrama with grounded realism, authentic period body language, natural expressions, and fine-art restraint honoring classical literature.
  - **Contextual Scenography & Theme**: Autonomously incorporates physical setting, architecture, natural lighting (e.g. soft window light, gentle candlelight, muted dawn), and fitting aspect ratio (`3:4`, `4:3`, `16:9`, `1:1`) drawn from the wider page context.
  - **Character Dossier Fidelity**: Character physical visual descriptions are extracted strictly from the author's words (tracking wardrobe, age, and visual eras) and substituted into prompts, eliminating model confusion and pop-culture caricatures.
  - **User-Selected Art Style Only**: Only the user-selected fine-art style (e.g. Ethereal Watercolor & Gouache, Chiaroscuro Oil, Gothic Romanticism, Cinematic 35mm, etc.) is fed from user settings.
- **In-Reader Text Highlighting**:
  - The exact chosen sentence or paragraph used in the prompt is **automatically highlighted with an illuminated golden sweep** directly within the reader's prose column.
  - When the user hovers over the highlight, a "✨ New Prompt" action lets readers select an alternative dramatic scene from the page.

- **Stage 2 — High-Resolution Fine-Art Plate Creation**:
  - The crafted prompt and aspect ratio are dispatched headlessly to Gemini's streaming service (`StreamGenerate`).
  - Intercepts and extracts the generated high-resolution **Imagen 3** plate directly from Google's CDN (`*.googleusercontent.com/gg-dl/*`).
  - Converts the asset into a permanent **Base64 Data URL** (`data:image/png;base64,...`), eliminating cross-origin cookie restrictions, 403 Forbidden errors, and link expirations.

---

### 2. Zero-API-Key Headless Google Session
- **Zero Developer API Keys & Zero Token Costs**:
  - Operates completely through the reader's active Google browser session (consumer Google account / Google One on `gemini.google.com`).
  - Uses Manifest V3 permissions: `host_permissions: ["https://gemini.google.com/*", "https://*.google.com/*", "https://*.googleapis.com/*", "https://*.googleusercontent.com/*"]`, `permissions: ["cookies", "storage", "alarms"]`.
  - Reads session cookies (`__Secure-1PSID`, `SID`, `HSID`) and acquires internal anti-forgery tokens (`SNlM0e`).
- **Session Reset & Account Switcher**:
  - Dedicated **"↻ Reset Session"** buttons in the AI Studio drawer, Top Banner, and Extension Popup.
  - Purges cached CSRF tokens and stale conversation state, re-inspects active browser cookies, and re-authenticates on the fly whenever the user switches Google accounts or logs back in.

---

### 3. Dedicated Full-Page Reading Experience
- **Focus Solely on the Full Page View**:
  - Tailored specifically for deep narrative immersion in `reader.html`.
  - In-page dual-flank illustrations docked cleanly next to their associated paragraphs with off-image hover controls (`↻ Re-Render`).
  - Smooth prose fade transitions and animated golden sweep text self-highlighting.
- **Cinzel Bold Typography**:
  - Classical architectural title font: **Cinzel Bold** is applied to headers, chapter titles, edition colophons, and dialogs.
  - Body prose formatted with high-legibility serif typefaces, drop caps, and customizable font sizing.
- **Preloaded Iconic Literary Works**:
  - **Harry Potter and the Philosopher's Stone** (J.K. Rowling) — Featuring the iconic arrival at Privet Drive, the mysterious Mirror of Erised, and Ollivanders wand shop.
  - **The Magician's Nephew** (C.S. Lewis) — Featuring the Wood between the Worlds, the ruined city of Charn, and the founding of Narnia.
  - **The Hobbit; or, There and Back Again** (J.R.R. Tolkien) — Featuring Bag End, Riddles in the Dark, and the dragon Smaug atop the treasure hoard.
- **Import & Book Management**:
  - **Import Book**: Easily import EPUB, PDF, TXT, and Markdown files.
  - **Remove Book**: 1-click removal of any book from the library dropdown.
- **Reading Themes**:
  - **Obsidian Dark** (Deep slate/black `#0B0F19`, gold foil accents `#F59E0B`, dark logo).
  - **Warm Parchment** (Sepia `#F6EEDF`, rich umber typography `#2D2319`, light logo).
  - **Paper White** (Clean high-contrast editorial monochrome `#FFFFFF` and `#111827`).
