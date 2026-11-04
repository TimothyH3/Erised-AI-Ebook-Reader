/**
 * Test extraction of Google Imagen 3 image URLs from various Gemini StreamGenerate response formats.
 */

function cleanGoogleImageUrl(url) {
  if (!url) return null;
  // Unescape slashes and common escapes
  let clean = url
    .replace(/\\+(\/)/g, '/')
    .replace(/\\u003d/g, '=')
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&');

  // Strip trailing punctuation or escape artifacts
  clean = clean.replace(/["'\\,\]\)\>]+$/, '');

  // Ensure high resolution
  if (clean.includes('=s')) {
    clean = clean.replace(/=s\d+.*$/, '=s1200');
  } else if (clean.includes('=w')) {
    clean = clean.replace(/=w\d+.*$/, '=w1200-h1200');
  } else if (!clean.includes('=') && !clean.includes('?')) {
    clean += '=s1200';
  }
  return clean;
}

function extractGoogleImageUrl(text) {
  if (!text) return null;

  // Case 1: Markdown image ![...](url)
  const mdMatches = text.match(/!\[.*?\]\((https?:\/\/[^\s"')]+)\)/g);
  if (mdMatches) {
    for (const m of mdMatches) {
      const match = m.match(/!\[.*?\]\((https?:\/\/[^\s"')]+)\)/);
      if (match && match[1] && match[1].includes('googleusercontent.com')) {
        return cleanGoogleImageUrl(match[1]);
      }
    }
  }

  // Case 2: Escaped or unescaped googleusercontent.com URLs
  // Handles:
  // https://lh3.googleusercontent.com/gg-dl/AF9QhPQ...
  // https:\/\/lh3.googleusercontent.com\/gg-dl\/AF9QhPQ...
  // https:\\\/\\\/lh3.googleusercontent.com\\\/gg-dl\\\/AF9QhPQ...
  const urlRegex = /https?(?::\\*\/\\*\/|:\/\/)[a-zA-Z0-9_\-.]*googleusercontent\.com(?::\d+)?(?:\\*\/[^\s"'`\(\)\[\]<>\\]+)+/g;
  const matches = text.match(urlRegex);

  if (matches && matches.length > 0) {
    // Filter and prioritize high quality generated image paths
    const candidates = matches.map(m => cleanGoogleImageUrl(m));

    // Priority 1: gg-dl or pw or u/0/d or photo assets (generated images)
    const preferred = candidates.find(u => 
      (u.includes('/gg-dl/') || u.includes('/pw/') || u.includes('/p/') || u.includes('/d/')) &&
      !u.includes('image_generation_content') &&
      !u.includes('photo.jpg') &&
      !u.includes('/a/')
    );
    if (preferred) return preferred;

    // Priority 2: Any googleusercontent URL that isn't a placeholder
    const valid = candidates.find(u => 
      !u.includes('image_generation_content') &&
      !u.includes('/a/')
    );
    if (valid) return valid;

    return candidates[0];
  }

  // Case 3: Look for JSON structured array with URLs [0][3][3]
  try {
    const jsonMatches = text.match(/\["(https?:\/\/[^"]+googleusercontent[^"]+)"/g);
    if (jsonMatches) {
      for (const jm of jsonMatches) {
        const u = jm.slice(2, -1);
        if (!u.includes('image_generation_content')) {
          return cleanGoogleImageUrl(u);
        }
      }
    }
  } catch (_) {}

  return null;
}

// Test cases
const testSamples = [
  {
    name: 'Escaped JSON slashes with gg-dl path',
    raw: `)]}'\n1234\n[["wrb.fr",null,"[[\\\"c_123\\\"],[\\\"https:\\\/\\\/lh3.googleusercontent.com\\\/gg-dl\\\/AF9QhPQtest123456789=s0\\\",1024,1024]]]"]`,
    expectedPart: 'https://lh3.googleusercontent.com/gg-dl/AF9QhPQtest123456789=s1200'
  },
  {
    name: 'Double escaped JSON slashes',
    raw: `[[\\"https:\\\\\\/\\\\\\/lh4.googleusercontent.com\\\\\\/gg-dl\\\\\\/XYZ987654321=w500-h500\\"]]`,
    expectedPart: 'https://lh4.googleusercontent.com/gg-dl/XYZ987654321=w1200-h1200'
  },
  {
    name: 'Unescaped standard URL',
    raw: `Some text here https://lh3.googleusercontent.com/gg-dl/ABCD1234EFGH5678 and more text`,
    expectedPart: 'https://lh3.googleusercontent.com/gg-dl/ABCD1234EFGH5678=s1200'
  },
  {
    name: 'Markdown image tag',
    raw: `Here is the illustration:\n![Generated Scene](https://lh5.googleusercontent.com/p/AF1QipMNO987654321)\nHope you like it!`,
    expectedPart: 'https://lh5.googleusercontent.com/p/AF1QipMNO987654321=s1200'
  },
  {
    name: 'Placeholder present alongside real gg-dl asset',
    raw: `http://googleusercontent.com/image_generation_content/0 ... and later [["wrb.fr",null,"https:\\\/\\\/lh3.googleusercontent.com\\\/gg-dl\\\/REAL_IMAGE_KEY_999=s0"]]`,
    expectedPart: 'https://lh3.googleusercontent.com/gg-dl/REAL_IMAGE_KEY_999=s1200'
  }
];

let allPassed = true;
for (const sample of testSamples) {
  const result = extractGoogleImageUrl(sample.raw);
  const pass = result && result.includes('googleusercontent.com') && result === sample.expectedPart;
  console.log(`Test "${sample.name}":`, pass ? 'PASS' : 'FAIL');
  if (!pass) {
    console.log('  Expected:', sample.expectedPart);
    console.log('  Got:     ', result);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n✓ ALL TEST CASES PASSED CLEANLY!');
} else {
  process.exit(1);
}

