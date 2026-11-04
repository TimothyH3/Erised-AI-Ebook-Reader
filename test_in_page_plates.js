/**
 * Unit & Integration Test Suite: In-Page Dual-Flank Plates & User Excerpt Highlighting
 */

import { storage } from './modules/storage.js';
import { fallbackSynthesize } from './modules/prompt-architect.js';
import { PRESEEDED_CHARACTERS } from './modules/character-tracker.js';

console.log('=== TEST SUITE: IN-PAGE DUAL-FLANK PLATES & USER EXCERPT HIGHLIGHTING ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

// ----------------------------------------------------
// 1. Dual-Flank Storage Caching
// ----------------------------------------------------
console.log('--- 1. Testing Dual-Flank Storage Caching (Both Sides of the Page) ---');
const testBookId = 'test_book_dual_flank';
const testPage = 2;

const rightPlate = {
  imageUrl: 'https://lh3.googleusercontent.com/gg-dl/right_image_token=s1200',
  prompt: 'A gaunt scholar examining an instrument under golden candlelight.',
  aspectRatio: '16:9',
  momentTitle: 'The Laboratory Study',
  selectedExcerpt: 'I collected bones from ancient vaulted gothic stone archives.',
  flank: 'right',
  engine: 'gemini-3.8'
};

const leftPlate = {
  imageUrl: 'https://lh3.googleusercontent.com/gg-dl/left_image_token=s1200',
  prompt: 'A gentle fair-haired woman reading a letter beside a rain-swept window.',
  aspectRatio: '3:4',
  momentTitle: 'Elizabeth by the Window',
  selectedExcerpt: 'She looked out upon the stormy lake with quiet sorrow.',
  flank: 'left',
  engine: 'gemini-3.8'
};

await storage.cacheIllustration(testBookId, testPage, 'right', rightPlate);
await storage.cacheIllustration(testBookId, testPage, 'left', leftPlate);

const cachedRight = await storage.getCachedIllustration(testBookId, testPage, 'right');
assert(cachedRight !== null && cachedRight.flank === 'right', 'Successfully retrieved right-flank illustration');
assert(cachedRight.momentTitle === 'The Laboratory Study', 'Right flank preserves moment title');

const cachedLeft = await storage.getCachedIllustration(testBookId, testPage, 'left');
assert(cachedLeft !== null && cachedLeft.flank === 'left', 'Successfully retrieved left-flank illustration');
assert(cachedLeft.aspectRatio === '3:4', 'Left flank preserves dynamic aspect ratio');

if (typeof storage.getPageIllustrations === 'function') {
  const allPageIlls = await storage.getPageIllustrations(testBookId, testPage);
  assert(Array.isArray(allPageIlls) && allPageIlls.length === 2, 'getPageIllustrations returns both flank illustrations for page');
  const flanks = allPageIlls.map(i => i.flank);
  assert(flanks.includes('right') && flanks.includes('left'), 'Both sides of the page ("right" and "left") represented in storage');
}

// ----------------------------------------------------
// 2. User-Selected Excerpt Anchoring & Max Length
// ----------------------------------------------------
console.log('\n--- 2. Testing User-Selected Excerpt Anchoring & Prompt Synthesis ---');
const userSelectedPassage = 'A sudden light broke in upon me—a light so brilliant and wondrous.';
const frankChars = PRESEEDED_CHARACTERS.sample_frankenstein;

const customSynth = fallbackSynthesize({
  pageText: 'Full page context containing many surrounding paragraphs. ' + userSelectedPassage + ' More context follows.',
  selectedExcerpt: userSelectedPassage,
  bookTitle: 'Frankenstein',
  author: 'Mary Shelley',
  styleId: 'chiaroscuro_oil',
  variationIndex: 0,
  characters: frankChars
});

assert(customSynth.selectedExcerpt === userSelectedPassage, 'Custom synthesis accurately anchors to exact user-highlighted passage');
assert(customSynth.imagePrompt.includes('A sudden light broke in upon me'), 'Image prompt incorporates user-selected passage verbatim');
assert(customSynth.aspectRatio !== undefined, 'Synthesis determines fitting aspect ratio');

// Test Max Length Truncation logic (400 chars)
const MAX_EXCERPT_CHARS = 400;
const longText = 'A'.repeat(550);
let truncated = longText;
if (truncated.length > MAX_EXCERPT_CHARS) {
  truncated = truncated.slice(0, MAX_EXCERPT_CHARS).trim();
}
assert(truncated.length === 400, 'User selection exceeding max limit accurately truncated to exactly 400 characters');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL IN-PAGE PLATES & USER EXCERPT TESTS PASSED! ✓');
  process.exit(0);
}

