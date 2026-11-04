/**
 * Test Gemini Page Analysis Synthesizer and JSON Extraction
 */

function parseSynthesisJson(rawText) {
  if (!rawText) return null;

  // 1. Try direct JSON match from markdown code block or braces
  const jsonBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonBlock ? jsonBlock[1] : rawText;

  const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch[0]);
      if (parsed && (parsed.imagePrompt || parsed.prompt)) {
        return normalizeSynthesisResult(parsed);
      }
    } catch (_) {}
  }

  // 2. Fallback key-value extraction if JSON is slightly malformed
  const momentTitleMatch = rawText.match(/"?momentTitle"?\s*:\s*"([^"]+)"/i);
  const descMatch = rawText.match(/"?momentDescription"?\s*:\s*"([^"]+)"/i);
  const themeMatch = rawText.match(/"?theme"?\s*:\s*"([^"]+)"/i);
  const focalMatch = rawText.match(/"?focalRange"?\s*:\s*"([^"]+)"/i);
  const settingMatch = rawText.match(/"?setting"?\s*:\s*"([^"]+)"/i);
  const colorsMatch = rawText.match(/"?colors"?\s*:\s*"([^"]+)"/i);
  const arMatch = rawText.match(/"?aspectRatio"?\s*:\s*"([^"]+)"/i);
  const promptMatch = rawText.match(/"?imagePrompt"?\s*:\s*"([^"]+)"/i) || rawText.match(/"?prompt"?\s*:\s*"([^"]+)"/i);

  if (promptMatch && promptMatch[1]) {
    return {
      momentTitle: momentTitleMatch ? momentTitleMatch[1] : 'Prominent Scene',
      momentDescription: descMatch ? descMatch[1] : 'Selected scene from page context',
      theme: themeMatch ? themeMatch[1] : 'Atmospheric literary lighting',
      focalRange: focalMatch ? focalMatch[1] : '35mm cinematic lens',
      setting: settingMatch ? settingMatch[1] : 'Atmospheric scene',
      colors: colorsMatch ? colorsMatch[1] : 'Chiaroscuro amber and deep shadows',
      aspectRatio: cleanAspectRatio(arMatch ? arMatch[1] : '16:9'),
      imagePrompt: promptMatch[1]
    };
  }

  return null;
}

function cleanAspectRatio(ar) {
  if (!ar) return '16:9';
  const clean = ar.trim().toLowerCase();
  if (clean.includes('16:9') || clean.includes('16/9') || clean.includes('landscape') || clean.includes('wide')) return '16:9';
  if (clean.includes('3:4') || clean.includes('3/4') || clean.includes('portrait')) return '3:4';
  if (clean.includes('4:3') || clean.includes('4/3')) return '4:3';
  if (clean.includes('1:1') || clean.includes('1/1') || clean.includes('square')) return '1:1';
  if (clean.includes('2:3') || clean.includes('2/3')) return '2:3';
  if (clean.includes('21:9') || clean.includes('21/9')) return '21:9';
  return '16:9';
}

function normalizeSynthesisResult(data) {
  return {
    momentTitle: data.momentTitle || 'Prominent Scene',
    momentDescription: data.momentDescription || 'Selected scene from page context',
    theme: data.theme || 'Atmospheric literary lighting',
    focalRange: data.focalRange || '35mm cinematic lens',
    setting: data.setting || 'Atmospheric scene',
    colors: data.colors || 'Chiaroscuro amber and deep shadows',
    aspectRatio: cleanAspectRatio(data.aspectRatio),
    imagePrompt: data.imagePrompt || data.prompt || ''
  };
}

// Test cases
const sample1 = `\`\`\`json
{
  "momentTitle": "The Infusion of Life",
  "momentDescription": "Victor Frankenstein beholds the dull yellow eye of the creature fluttering open by dim candlelight.",
  "theme": "Gothic dread and awe, flickering candlelight against torrential rain",
  "focalRange": "85mm f/1.4 portrait lens",
  "setting": "Cavernous gothic attic laboratory with Leyden jars and galvanic wires",
  "colors": "Cold silver-blue moonlight and warm amber candlelight",
  "aspectRatio": "3:4",
  "imagePrompt": "masterpiece dramatic oil painting in the chiaroscuro tradition, Victor Frankenstein standing back in breathless horror as a towering stitched creature opens a watery dull yellow eye on a wooden dissecting table, flickering amber candlelight, rain pattering on dark leaded windows, 85mm f/1.4 lens, timeless fine art museum plate"
}
\`\`\``;

const parsed1 = parseSynthesisJson(sample1);
console.log('Test 1 (Markdown JSON block):', parsed1);
console.log('Passed 1:', parsed1 && parsed1.aspectRatio === '3:4' && parsed1.momentTitle === 'The Infusion of Life');

const sample2 = `Here is the synthesis:
{
  "momentTitle": "Basil Hallward's Studio",
  "momentDescription": "The rich scent of roses and lilac filling the artist's sunlit studio with summer breeze.",
  "theme": "Lush summer afternoon, rich botanical warmth",
  "focalRange": "24mm anamorphic wide-angle",
  "setting": "Victorian artist studio with tall arched windows and silk curtains",
  "colors": "Warm golden sunlight, rose pink, olive green",
  "aspectRatio": "16:9",
  "imagePrompt": "A sunlit Victorian painter's studio filled with blooming roses and lilacs, an easel holding a canvas in the center, 24mm wide angle vista, golden hour lighting"
}`;

const parsed2 = parseSynthesisJson(sample2);
console.log('\nTest 2 (Plain JSON with surrounding text):', parsed2);
console.log('Passed 2:', parsed2 && parsed2.aspectRatio === '16:9' && parsed2.momentTitle === "Basil Hallward's Studio");

