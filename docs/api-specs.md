# Erised AI • API Specifications & Prompt Schemas

This document defines the underlying prompt architectures, message protocols, and data models powering Erised AI's 2-stage visual synthesis pipeline.

---

## 1. Background Service Worker Message Protocol

Erised AI employs Manifest V3 asynchronous messaging between UI views (`reader.js`, `popup.js`) and the background orchestrator (`background.js`).

| Action | Payload Parameters | Response Structure | Purpose |
| :--- | :--- | :--- | :--- |
| `CHECK_GOOGLE_SESSION` | None | `{ loggedIn: boolean, message: string }` | Verifies active session token at `gemini.google.com/app`. |
| `RESET_GOOGLE_SESSION` | None | `{ success: boolean, loggedIn: boolean, message: string }` | Purges cached CSRF tokens and re-probes Google consumer session. |
| `RUN_FULL_PIPELINE` | `{ pageText, targetFlank, bookTitle, author, pageNumber, customExcerpt, customStyle }` | `{ success: boolean, imageUrl: string, moment: object, prompt: string, flank: string, data: object }` | Executes Stage 1 (Text Analysis) followed by Stage 2 (Imagen 3 Plate Creation). |
| `ANALYZE_BOOK_SECTION` | `{ sectionText, bookTitle, author, startPage, endPage, sectionIndex, totalSections, existingCharacters }` | `{ success: boolean, characters: Array<Character>, conversationContext: object }` | Analyzes 30-page text chunks for named character dossiers and visual wardrobe eras. |
| `RE_RENDER_PLATE` | `{ prompt, customStyle, aspectRatio }` | `{ success: boolean, imageUrl: string }` | Re-generates illustration plate using an updated or modified prompt. |

---

## 2. Stage 1: Literary Scene Synthesis Schema

The Stage 1 prompt instructs Gemini to act as a Literary Visual Director, analyzing the raw prose of the active page without relying on simplistic regexes.

```json
{
  "sceneExcerpt": "Exact verbatim excerpt from the page representing the most prominent dramatic climax or rich visual setting (15 to 40 words)",
  "prominentMoment": "Concise 1-sentence visual description of the dramatic action, focal subjects, and immediate environment",
  "theme": "Atmospheric lighting and environmental mood (e.g., 'Chiaroscuro key lighting with deep candlelight shadows')",
  "optics": "Cinematographic focal length and framing (e.g., '50mm classic literary plate framing with soft background falloff')",
  "aspectRatio": "Ideal aspect ratio: '16:9' (cinematic landscapes/halls), '4:3' (balanced book plates), '3:4' (tall portraits), or '1:1' (square intimate focus)",
  "prompt": "Complete fine-art generation prompt strictly incorporating physical visual traits, period setting, lighting, and selected art style, with ZERO character proper names"
}
```

---

## 3. Character Codex & Multi-Era Wardrobe Schema

Character visual tracking maintains a persistent Dramatis Personae per book. To prevent model confusion and caricature, character proper names are strictly eliminated from prompts and replaced by their physical visual dossier.

### Response Schema from Gemini (`ANALYZE_BOOK_SECTION`)

```json
{
  "characters": [
    {
      "name": "Full Proper Name (e.g., Victor Frankenstein)",
      "aliases": ["Victor", "Frankenstein", "M. Frankenstein"],
      "description": "Core permanent physical visual traits and initial attire (NO multi-scene wardrobe summaries)",
      "eras": [
        {
          "startPage": 2,
          "endPage": 45,
          "context": "Student at Ingolstadt - Frock Coat",
          "description": "a slender, pale young Swiss scholar in his early twenties with disheveled dark brown hair, intense dark eyes, wearing an early 19th-century linen cravat and dark wool frock coat"
        },
        {
          "startPage": 46,
          "endPage": 82,
          "context": "Post-Creation Illness - Disheveled Shirt",
          "description": "a gaunt, hollow-cheeked young man in an unbuttoned rumpled linen shirt, with feverish dark circles under sunken eyes"
        }
      ]
    }
  ]
}
```

### The Forbidden Wardrobe Summary Anti-Pattern

Gemini is explicitly instructed never to produce a composite run-on wardrobe summary such as:
> *"A young boy with untidy black hair, bright green eyes, round spectacles, a lightning-bolt scar, wearing Hogwarts student robes in the underground chambers and hospital pajamas in the infirmary bed."*

Instead, Erised AI enforces **Mandatory Scene Decomposition**: each outfit change or setting shift is emitted as an isolated entry in `eras` bound to its explicit `startPage` and `endPage`.

---

## 4. Stage 2: Imagen 3 Prompt Formulation

Before dispatching to the image generation backend, prompts are processed through three safety and quality gates:

1. **Zero-Name Substitution**: Character names are replaced by their page-accurate era visual description.
2. **Pop-Culture Sanitization**: Unwritten tropes (e.g. green skin or neck bolts on Frankenstein's creation) are purged.
3. **Imperative Direct Dispatch**:
   ```
   Generate an image: Fine-art book plate illustration depicting: [Page-Accurate Character Dossier] [Scene Excerpt Action]. Grounded literary scene set in [Atmospheric Environment]. Atmospheric lighting: [Lighting Theme]. Color tones: [Palette]. Camera optics: [Optics]. Style: [Selected Art Style]. Aspect ratio: [Derived Ratio]. Subtle, authentic, refined composition with natural human proportions, strictly zero typography, words, or letters.
   ```

