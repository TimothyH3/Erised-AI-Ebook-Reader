/**
 * Verification test for GeminiSynthesizer & Fallback synthesis
 */

import { ART_STYLES, cleanAspectRatio, aspectRatioToDimensions, parseSynthesisJson, fallbackSynthesize } from '../../src/ai/prompt-architect.js';
import { SAMPLE_BOOKS } from '../fixtures/sample-books.js';

console.log('=== TESTING GEMINI SYNTHESIZER & ASPECT RATIO SPECIFICATIONS ===\n');

// 1. Verify Art Styles (Only style is user-fed)
console.log('--- 1. Testing Art Styles Palette ---');
console.log('Total Art Styles:', Object.keys(ART_STYLES).length);
if (Object.keys(ART_STYLES).length !== 8) {
  throw new Error('Expected 8 art styles');
}
console.log('✓ All 8 masterstyles present.\n');

// 2. Test Fallback Synthesis for Page 2 of Frankenstein
console.log('--- 2. Testing Page Analysis & Prominent Moment Selection (Fallback) ---');
const p2 = SAMPLE_BOOKS[0].pages[1]; // Chapter IV
const synthP2 = fallbackSynthesize({
  pageText: p2.text,
  bookTitle: SAMPLE_BOOKS[0].title,
  author: SAMPLE_BOOKS[0].author,
  styleId: 'chiaroscuro_oil',
  variationIndex: 0
});

console.log('Synthesis Result:');
console.log('  Moment Title:      ', synthP2.momentTitle);
console.log('  Moment Description:', synthP2.momentDescription.substring(0, 100) + '...');
console.log('  Theme:             ', synthP2.theme);
console.log('  Focal Range:       ', synthP2.focalRange);
console.log('  Aspect Ratio:      ', synthP2.aspectRatio);
console.log('  Dimensions:        ', aspectRatioToDimensions(synthP2.aspectRatio));
console.log('  Image Prompt:      ', synthP2.imagePrompt.substring(0, 150) + '...');

if (!synthP2.imagePrompt || !synthP2.aspectRatio) {
  throw new Error('Synthesis result missing imagePrompt or aspectRatio');
}
console.log('✓ Synthesis produced complete moment & prompt.\n');

// 3. Test Variation Index for Different Moment
console.log('--- 3. Testing Variation Index (#1 vs #0) ---');
const synthP2Var1 = fallbackSynthesize({
  pageText: p2.text,
  bookTitle: SAMPLE_BOOKS[0].title,
  author: SAMPLE_BOOKS[0].author,
  styleId: 'chiaroscuro_oil',
  variationIndex: 1
});

console.log('Variation #0 Moment Title:', synthP2.momentTitle);
console.log('Variation #1 Moment Title:', synthP2Var1.momentTitle);
if (synthP2.momentDescription === synthP2Var1.momentDescription) {
  throw new Error('Variation 1 should choose an alternative moment from the page');
}
console.log('✓ Variation index chooses alternative moment from page.\n');

// 4. Test Aspect Ratio Dimension Mapping
console.log('--- 4. Testing Aspect Ratio Dimension Mapping ---');
const ratios = ['16:9', '3:4', '4:3', '1:1', '2:3', '21:9'];
for (const r of ratios) {
  const dims = aspectRatioToDimensions(r);
  console.log(`  ${r} -> width: ${dims.width}, height: ${dims.height}`);
  if (!dims.width || !dims.height) throw new Error(`Invalid dimensions for ${r}`);
}
console.log('✓ Aspect ratio dimension mapping verified.\n');

console.log('=== ALL SYNTHESIZER UNIT TESTS PASSED ===');

