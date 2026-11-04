/**
 * Gemini Page Synthesizer & Visual Director
 * 
 * Scraps legacy hardcoded sentence-scoring heuristics in favor of direct
 * LLM-powered literary analysis via Google Gemini:
 * 1. Feeds the entire page text to Gemini to pick out a prominent moment or description.
 * 2. Autonomously determines the visual theme (lighting, focal range, setting, colors, atmosphere).
 * 3. Incorporates ONLY the user-selected fine-art style.
 * 4. Determines the ideal composition aspect ratio (16:9, 3:4, 4:3, 1:1, etc.).
 * 5. Generates the final high-resolution masterpiece prompt.
 */

import { substituteNamesWithDescriptions, sanitizePopCultureTropes } from './character-tracker.js';

export const ART_STYLES = {
  chiaroscuro_oil: {
    id: 'chiaroscuro_oil',
    name: 'Caravaggio Chiaroscuro Oil',
    description: 'Deep shadows, luminous golden key lights, rich impasto and glazes',
    promptSnippet: 'masterpiece dramatic oil painting in the chiaroscuro tradition of Caravaggio and Rembrandt, deep shadows, luminous amber key lighting, rich visible brushwork, timeless museum fine art quality',
    negativeSnippet: 'flat lighting, modern digital cartoon, oversaturated neon, 3D render'
  },
  gothic_romanticism: {
    id: 'gothic_romanticism',
    name: 'Gothic & Dark Romanticism',
    description: 'Sublime atmospheric vistas, melancholic beauty, Turner & Friedrich',
    promptSnippet: '19th-century dark romanticism oil painting, atmospheric grandeur reminiscent of Caspar David Friedrich and J.M.W. Turner, sublime melancholic mood, textured canvas, moody palette',
    negativeSnippet: 'cheesy cartoon, flat vector, bright cheerful daylight, modern plastic'
  },
  illuminated_manuscript: {
    id: 'illuminated_manuscript',
    name: 'Illuminated Medieval Folio',
    description: 'Gilded gold leaf borders, rich lapis lazuli and vermilion tempera',
    promptSnippet: 'exquisite illuminated manuscript painting, delicate gold leaf foil gilding, ornate borders, lapis lazuli and madder pigments, hand-painted vellum parchment texture, medieval masterwork',
    negativeSnippet: 'photograph, modern CGI, lens flare, film grain'
  },
  golden_age_illustration: {
    id: 'golden_age_illustration',
    name: 'Golden Age Book Illustration',
    description: 'Arthur Rackham and N.C. Wyeth pen-and-ink with watercolor wash',
    promptSnippet: 'Golden Age literary book illustration in the style of Arthur Rackham and N.C. Wyeth, intricate fine pen-and-ink cross-hatching, luminous watercolor washes, storybook magic',
    negativeSnippet: '3D CGI render, vector art, smooth digital gradients, photograph'
  },
  cinematic_35mm: {
    id: 'cinematic_35mm',
    name: 'Cinematic 35mm Panavision',
    description: 'Anamorphic widescreen, organic Kodak grain, high-end film direction',
    promptSnippet: 'cinematic 35mm film still, shot on Panavision anamorphic lenses, organic Kodak 5219 film grain, shallow depth of field, Roger Deakins lighting, color graded for theatrical cinema',
    negativeSnippet: 'video game screenshot, amateur phone photo, oversaturated HDR, bad lighting'
  },
  ethereal_watercolor: {
    id: 'ethereal_watercolor',
    name: 'Ethereal Watercolor & Gouache',
    description: 'Fluid pigments, soft atmospheric blooms, poetic dreamscape',
    promptSnippet: 'master ethereal watercolor and gouache on heavy cold-press cotton paper, soft poetic color bleeding, fluid wet-on-wet washes, luminous natural highlights',
    negativeSnippet: 'sharp digital vector, hard CGI edges, plastic 3D, noise'
  },
  cyberpunk_noir: {
    id: 'cyberpunk_noir',
    name: 'Neo-Gothic Cyberpunk Noir',
    description: 'Obsidian shadows, amber volumetric haze, rain-slicked reflections',
    promptSnippet: 'neo-gothic aesthetic, deep obsidian shadows pierced by directional amber and teal volumetric rays, rain-slicked reflective surfaces, blade runner noir atmosphere',
    negativeSnippet: 'pastel, cartoon, daytime sunshine, blurry smudge'
  },
  ukiyo_e: {
    id: 'ukiyo_e',
    name: 'Ukiyo-e Woodblock Print',
    description: 'Traditional Japanese woodcut, flowing linework, mineral washes',
    promptSnippet: 'traditional Japanese Edo-period ukiyo-e woodblock print, elegant calligraphic ink outlines, bokashi mineral pigment gradients, washi paper fibrous texture',
    negativeSnippet: 'western oil painting, 3D CGI, noisy photography'
  }
};

export const UNIVERSAL_NEGATIVE_PROMPT = 
  'letters, typography, words, script, text, watermark, signature, artist name, logo, username, blurry, out of focus, low resolution, ugly, distorted anatomy, deformed fingers, extra limbs, extra hands, missing fingers, malformed face, mutated hands, bad proportions, amateur drawing, oversaturated plastic, cartoonish when realistic requested, pop-culture tropes, movie adaptations, hollywood film cliches, green skin, neck bolts, halloween costume, actor likeness';

/**
 * Normalizes aspect ratio strings into standard formats
 */
export function cleanAspectRatio(ar) {
  if (!ar) return '3:4';
  const clean = ar.trim().toLowerCase();
  if (clean.includes('16:9') || clean.includes('16/9') || clean.includes('landscape') || clean.includes('wide')) return '16:9';
  if (clean.includes('21:9') || clean.includes('21/9') || clean.includes('panoramic')) return '21:9';
  if (clean.includes('3:4') || clean.includes('3/4') || clean.includes('portrait')) return '3:4';
  if (clean.includes('4:3') || clean.includes('4/3')) return '4:3';
  if (clean.includes('1:1') || clean.includes('1/1') || clean.includes('square')) return '1:1';
  if (clean.includes('2:3') || clean.includes('2/3')) return '2:3';
  if (clean.includes('4:5') || clean.includes('4/5')) return '3:4';
  return '3:4';
}

/**
 * Maps standard aspect ratios to high-resolution pixel dimensions for fallback generation (Pollinations Flux.1)
 */
export function aspectRatioToDimensions(ar) {
  const normalized = cleanAspectRatio(ar);
  switch (normalized) {
    case '16:9': return { width: 1280, height: 720 };
    case '21:9': return { width: 1344, height: 576 };
    case '3:4':  return { width: 768, height: 1024 };
    case '2:3':  return { width: 680, height: 1024 };
    case '4:3':  return { width: 1024, height: 768 };
    case '1:1':  return { width: 1024, height: 1024 };
    default:     return { width: 1280, height: 720 };
  }
}

/**
 * Robust JSON and structured text extractor for Gemini's page analysis response
 */
export function parseSynthesisJson(rawText) {
  if (!rawText) return null;

  // 1. Try markdown code block or direct JSON
  const jsonBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonCandidate = jsonBlock ? jsonBlock[1] : rawText;

  const braceMatch = jsonCandidate.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch[0]);
      if (parsed && (parsed.imagePrompt || parsed.prompt)) {
        return {
          momentTitle: parsed.momentTitle || 'Prominent Scene',
          selectedExcerpt: parsed.selectedExcerpt || parsed.excerpt || parsed.momentDescription || parsed.sentence || '',
          momentDescription: parsed.momentDescription || 'Notable moment from page context',
          theme: parsed.theme || 'Atmospheric scene',
          focalRange: parsed.focalRange || '50mm natural lens',
          setting: parsed.setting || 'Detailed literary setting',
          colors: parsed.colors || 'Chiaroscuro golden and deep shadows',
          aspectRatio: cleanAspectRatio(parsed.aspectRatio),
          imagePrompt: parsed.imagePrompt || parsed.prompt || '',
          newCharacters: Array.isArray(parsed.newCharacters) ? parsed.newCharacters : []
        };
      }
    } catch (_) {}
  }

  // 2. Regex fallback for key fields
  const titleMatch = rawText.match(/"?momentTitle"?\s*:\s*"([^"]+)"/i);
  const excerptMatch = rawText.match(/"?selectedExcerpt"?\s*:\s*"([^"]+)"/i) || rawText.match(/"?excerpt"?\s*:\s*"([^"]+)"/i);
  const descMatch = rawText.match(/"?momentDescription"?\s*:\s*"([^"]+)"/i);
  const themeMatch = rawText.match(/"?theme"?\s*:\s*"([^"]+)"/i);
  const focalMatch = rawText.match(/"?focalRange"?\s*:\s*"([^"]+)"/i);
  const settingMatch = rawText.match(/"?setting"?\s*:\s*"([^"]+)"/i);
  const colorsMatch = rawText.match(/"?colors"?\s*:\s*"([^"]+)"/i);
  const arMatch = rawText.match(/"?aspectRatio"?\s*:\s*"([^"]+)"/i);
  const promptMatch = rawText.match(/"?imagePrompt"?\s*:\s*"([^"]+)"/i) || rawText.match(/"?prompt"?\s*:\s*"([^"]+)"/i);

  if (promptMatch && promptMatch[1]) {
    return {
      momentTitle: titleMatch ? titleMatch[1] : 'Prominent Scene',
      selectedExcerpt: excerptMatch ? excerptMatch[1] : (descMatch ? descMatch[1] : ''),
      momentDescription: descMatch ? descMatch[1] : 'Notable moment from page context',
      theme: themeMatch ? themeMatch[1] : 'Atmospheric scene',
      focalRange: focalMatch ? focalMatch[1] : '50mm natural lens',
      setting: settingMatch ? settingMatch[1] : 'Detailed literary setting',
      colors: colorsMatch ? colorsMatch[1] : 'Chiaroscuro golden and deep shadows',
      aspectRatio: cleanAspectRatio(arMatch ? arMatch[1] : '16:9'),
      imagePrompt: promptMatch[1]
    };
  }

  return null;
}

/**
 * Pure fallback synthesis in case Google session is unavailable or network is blocked.
 * Selects a prominent moment, determines aspect ratio, lighting/theme, applies the user's art style,
 * and substitutes character proper names with physical descriptions.
 */
export function fallbackSynthesize({ pageText = '', bookTitle = '', author = '', styleId = 'ethereal_watercolor', variationIndex = 0, characters = [], selectedExcerpt = '', aspectRatio: userRatio = '3:4', pageNumber = 1 }) {
  const style = ART_STYLES[styleId] || ART_STYLES.ethereal_watercolor;

  // Split into clean sentences
  const rawSentences = pageText
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25 && !s.startsWith('"') && !s.startsWith('http'));

  const sentences = (rawSentences.length > 0) 
    ? rawSentences 
    : [pageText.slice(0, 200)];

  // Use selectedExcerpt if provided, else use variation index to pick candidate
  const pickedIndex = Math.min(variationIndex % sentences.length, sentences.length - 1);
  const sentence = (selectedExcerpt && selectedExcerpt.trim()) 
    ? selectedExcerpt.trim() 
    : (sentences[pickedIndex] || sentences[0]);

  // Default to 3:4 unless user configured another aspect ratio
  const chosenRatio = userRatio || '3:4';
  let aspectRatio = chosenRatio;
  let focalRange = 'Classic fine-art book plate framing with natural depth of field';
  let setting = 'Atmospheric literary environment and period setting';

  const lower = sentence.toLowerCase() + ' ' + pageText.toLowerCase().slice(0, 300);

  if (chosenRatio === '3:4') {
    focalRange = 'Classic fine-art book plate framing with natural depth of field';
    setting = 'Atmospheric literary environment and period setting';
  } else if (chosenRatio === '4:3') {
    focalRange = '50mm natural eye-level lens';
    setting = 'Detailed atmospheric interior setting';
  } else if (chosenRatio === '16:9') {
    focalRange = '24mm environmental wide shot';
    setting = 'Natural or architectural landscape from the passage';
  } else {
    focalRange = '50mm natural eye-level lens';
    setting = 'Classic book plate interior and environmental composition';
  }

  // Derive lighting & color theme with refined restraint
  let theme = 'Moody chiaroscuro key lighting with soft shadows and warm highlights';
  let colors = 'Warm golden amber and muted charcoal shadows';

  if (/candle|candlelight|flame|lamp|fire/i.test(lower)) {
    theme = 'Warm flickering candlelight with gentle rim lighting and soft shadows';
    colors = 'Subtle honey amber, warm candlelight, soft sepia';
  } else if (/moon|moonlight|night|rain|storm|dark|midnight/i.test(lower)) {
    theme = 'Cool ethereal moonlight filtering through dark windows with quiet reflections';
    colors = 'Muted silver-blue, soft slate grey, midnight shadows';
  } else if (/sun|sunlight|morning|dawn|garden|blossom|summer/i.test(lower)) {
    theme = 'Natural golden hour daylight with gentle warmth and soft atmosphere';
    colors = 'Warm ochre, soft rose, gentle daylight gold';
  } else if (/lightning|galvanic|electricity|spark/i.test(lower)) {
    theme = 'Dramatic galvanic glow with deep shadowy contrast';
    colors = 'Luminous cyan highlights, deep atmospheric shadows';
  }

  // Construct short moment title
  const words = sentence.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).slice(0, 6).join(' ');
  const momentTitle = words.length > 5 ? words : `${bookTitle} Scene`;

  // Refined, grounded prompt avoiding comical melodrama
  let imagePrompt = `Fine-art book plate illustration depicting: ${sentence.replace(/["']/g, '')}. Grounded literary scene set in ${setting}. Atmospheric lighting: ${theme}. Color tones: ${colors}. Camera optics: ${focalRange}. Style: ${style.promptSnippet}. Aspect ratio: ${aspectRatio}. Subtle, authentic, refined composition with natural human proportions, strictly zero typography, words, or letters.`;

  // Substitute character proper names with rich physical visual descriptions from extracted data for this specific page
  if (Array.isArray(characters) && characters.length > 0) {
    imagePrompt = substituteNamesWithDescriptions(imagePrompt, characters, pageNumber);
  }

  // Purge any pop-culture or cinematic tropes to enforce pure textual fidelity
  imagePrompt = sanitizePopCultureTropes(imagePrompt);

  return {
    momentTitle,
    selectedExcerpt: sentence,
    momentDescription: sentence,
    theme,
    focalRange,
    setting,
    colors,
    aspectRatio,
    imagePrompt
  };
}

/**
 * Backward compatibility alias for any remaining legacy callers
 */
export class PromptArchitect {
  static fallbackSynthesize(options) {
    return fallbackSynthesize(options);
  }

  static synthesizePrompts({ pageText = '', bookTitle = '', author = '', styleId = 'chiaroscuro_oil', variationIndex = 0, characters = [] }) {
    const single = fallbackSynthesize({ pageText, bookTitle, author, styleId, variationIndex, characters });
    return {
      plate: single,
      leftPlate: { prompt: single.imagePrompt, optics: single.focalRange, title: single.momentTitle, sceneSummary: single.momentDescription, negativePrompt: UNIVERSAL_NEGATIVE_PROMPT },
      rightPlate: { prompt: single.imagePrompt, optics: single.focalRange, title: single.momentTitle, sceneSummary: single.momentDescription, negativePrompt: UNIVERSAL_NEGATIVE_PROMPT },
      analysis: {
        climaxSummary: single.momentTitle,
        settingSummary: single.theme,
        bestDramaticSentence: single.momentDescription,
        bestSettingSentence: single.setting
      }
    };
  }
}
