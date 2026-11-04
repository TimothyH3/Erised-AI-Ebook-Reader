/**
 * Test extracting text responses from Gemini StreamGenerate responses.
 */

function extractGeminiText(streamText) {
  if (!streamText) return null;

  let bestText = '';

  // 1. Try structured wrb.fr parsing
  const lines = streamText.split('\n');
  for (const line of lines) {
    if (!line.includes('"wrb.fr"')) continue;
    try {
      const firstBracket = line.indexOf('[[');
      if (firstBracket === -1) continue;
      const parsed = JSON.parse(line.substring(firstBracket));
      for (const item of parsed) {
        if (item && item[0] === 'wrb.fr' && typeof item[2] === 'string') {
          const inner = JSON.parse(item[2]);
          
          // Helper to search for candidate text strings
          const findStrings = (obj, depth = 0) => {
            if (depth > 8 || !obj) return;
            if (typeof obj === 'string') {
              // Ignore short tokens, URLs, IDs
              if (obj.length > 40 && !obj.startsWith('http') && !obj.startsWith('c_') && !obj.startsWith('r_') && !obj.startsWith('rc_')) {
                if (obj.length > bestText.length) {
                  bestText = obj;
                }
              }
              return;
            }
            if (Array.isArray(obj)) {
              for (const elem of obj) findStrings(elem, depth + 1);
            } else if (typeof obj === 'object') {
              for (const k of Object.keys(obj)) findStrings(obj[k], depth + 1);
            }
          };

          findStrings(inner);
        }
      }
    } catch (_) {}
  }

  if (bestText) {
    return cleanResponseText(bestText);
  }

  // 2. Regex fallback for candidate text: ["rc_...",["The generated text...
  const candidateMatch = streamText.match(/\["rc_[a-zA-Z0-9_\-]+",\s*\["((?:[^"\\]|\\.)+)"/);
  if (candidateMatch && candidateMatch[1]) {
    try {
      const unescaped = JSON.parse(`"${candidateMatch[1]}"`);
      if (unescaped && unescaped.length > 20) {
        return cleanResponseText(unescaped);
      }
    } catch (_) {}
  }

  return null;
}

function cleanResponseText(text) {
  if (!text) return '';
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .trim();
}

// Test sample payload
const mockStream = `)]}'
1520
[["wrb.fr",null,"[[\\"c_9999\\",\\"r_8888\\",null,null,null,1],null,null,null,[[\\"rc_12345\\",[\\"PROMPT: Victor Frankenstein leaning feverishly over the galvanic battery\\\\nSETTING: Atmospheric candlelit gothic attic\\\\nASPECT_RATIO: 16:9\\\\nCOLORS: Deep amber and electric cyan\\\\nTHEME: Manic discovery\\",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[\\"image_generation_content/0\\"]]]]]]"]]`;

const result = extractGeminiText(mockStream);
console.log('Extracted text:\n', result);

if (result && result.includes('Victor Frankenstein leaning feverishly')) {
  console.log('\n✓ PASS: Gemini text successfully parsed from StreamGenerate payload!');
} else {
  console.error('\n✗ FAIL: Could not extract text');
  process.exit(1);
}

