/**
 * Verification Test: End-to-End Synthesis Flow & Anti-Stuck Safeguards
 */

import { PromptArchitect, fallbackSynthesize } from './modules/prompt-architect.js';
import { GeminiHeadlessClient } from './modules/gemini-headless.js';
import { SAMPLE_BOOKS } from './modules/sample-books.js';

console.log('=== TESTING SYNTHESIS FLOW & ANTI-STUCK SAFEGUARDS ===\n');

// 1. Verify fallbackSynthesize produces complete data structure
console.log('--- 1. Testing fallbackSynthesize directly and via PromptArchitect static ---');
const samplePage = SAMPLE_BOOKS[0].pages[1];

const res1 = fallbackSynthesize({
  pageText: samplePage.text,
  bookTitle: SAMPLE_BOOKS[0].title,
  author: SAMPLE_BOOKS[0].author,
  styleId: 'chiaroscuro_oil',
  variationIndex: 0
});

console.log('Direct fallbackSynthesize result:');
console.log('  Moment Title:', res1.momentTitle);
console.log('  Selected Excerpt:', res1.selectedExcerpt?.slice(0, 60) + '...');
console.log('  Aspect Ratio:', res1.aspectRatio);
console.log('  Has Image Prompt:', Boolean(res1.imagePrompt));

if (!res1.momentTitle || !res1.imagePrompt || !res1.aspectRatio || !res1.selectedExcerpt) {
  throw new Error('res1 missing required fields including selectedExcerpt!');
}

const res2 = PromptArchitect.fallbackSynthesize({
  pageText: samplePage.text,
  bookTitle: SAMPLE_BOOKS[0].title,
  author: SAMPLE_BOOKS[0].author,
  styleId: 'chiaroscuro_oil',
  variationIndex: 0
});

console.log('\nPromptArchitect.fallbackSynthesize static result:');
console.log('  Moment Title:', res2.momentTitle);
if (res2.momentTitle !== res1.momentTitle) {
  throw new Error('Static method mismatch!');
}
console.log('✓ Both direct and static method calls work identically without TypeError!\n');

// 2. Verify GeminiHeadlessClient synthesizePagePrompt return structure
console.log('--- 2. Testing GeminiHeadlessClient synthesizePagePrompt output structure ---');
const client = new GeminiHeadlessClient();

// When in Node.js test environment, checkSession returns loggedIn: false
client.synthesizePagePrompt({
  pageText: samplePage.text,
  bookTitle: SAMPLE_BOOKS[0].title,
  author: SAMPLE_BOOKS[0].author,
  styleId: 'chiaroscuro_oil',
  variationIndex: 0
}).then(synthRes => {
  console.log('synthesizePagePrompt Result Structure:');
  console.log('  success:', synthRes.success);
  console.log('  has .data property:', Boolean(synthRes.data));
  console.log('  data.momentTitle:', synthRes.data?.momentTitle);
  console.log('  data.aspectRatio:', synthRes.data?.aspectRatio);
  console.log('  top-level momentTitle (for convenience):', synthRes.momentTitle);
  console.log('  engine:', synthRes.engine);

  if (!synthRes.success || !synthRes.data || !synthRes.data.imagePrompt) {
    throw new Error('synthesizePagePrompt output does not include required .data property!');
  }

  // 3. Verify reader.js resolution logic
  console.log('\n--- 3. Verifying reader.js synthesis response resolver ---');
  const synthData = synthRes?.data || (synthRes?.success && synthRes?.imagePrompt ? synthRes : null);
  if (!synthData || !synthData.selectedExcerpt) {
    throw new Error('Resolution logic failed to extract synthData or selectedExcerpt!');
  }
  console.log('✓ reader.js and sidepanel.js will successfully resolve synthData with selectedExcerpt!');

  // 4. Verify excerpt exists in page text
  console.log('\n--- 4. Verifying excerpt presence in page text for highlighting ---');
  console.log('  Selected Excerpt text snippet:', `"${synthData.selectedExcerpt.slice(0, 50)}..."`);
  const containsExcerpt = samplePage.text.includes(synthData.selectedExcerpt);
  console.log('  Excerpt found in original page text:', containsExcerpt);
  if (!containsExcerpt) {
    throw new Error('Selected excerpt is not a subset of page text!');
  }
  console.log('✓ Highlighting engine can accurately anchor and mark the excerpt on the reader page!');

  console.log('\n=== ALL SYNTHESIS FLOW SAFEGUARD TESTS PASSED ===');
}).catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});

