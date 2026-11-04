/**
 * Test Autonomous Theme/Lighting Derivation and Prompt Regeneration (variationIndex)
 */

import { PromptArchitect, ART_STYLES } from './modules/prompt-architect.js';
import { SAMPLE_BOOKS } from './modules/sample-books.js';

console.log('=== TESTING AUTONOMOUS THEME SELECTION & PROMPT REGENERATION ===\n');

const pageText = SAMPLE_BOOKS[0].pages[2].text; // Frankenstein Page 3 (The infusion of life)
const bookTitle = SAMPLE_BOOKS[0].title;
const author = SAMPLE_BOOKS[0].author;

// 1. Verify Autonomous Lighting & Theme Selection (No user theme needed)
console.log('--- 1. Testing Autonomous Lighting & Atmospheric Theme Derivation ---');
const synthesisV0 = PromptArchitect.synthesizePrompts({
  pageText,
  bookTitle,
  author,
  styleId: 'chiaroscuro_oil',
  variationIndex: 0
});

console.log('Left Plate Autonomous Theme & Lighting in Prompt:');
const leftHasLighting = /candlelight|moonlight|lightning|chiaroscuro/i.test(synthesisV0.leftPlate.prompt);
console.log('  Detected Atmospheric Lighting in Left Prompt:', leftHasLighting);
console.log('  Left Prompt Excerpt:', synthesisV0.leftPlate.prompt.substring(0, 180) + '...\n');

console.log('Right Plate Autonomous Theme & Lighting in Prompt:');
const rightHasLighting = /candlelight|moonlight|lightning|chiaroscuro/i.test(synthesisV0.rightPlate.prompt);
console.log('  Detected Atmospheric Lighting in Right Prompt:', rightHasLighting);
console.log('  Right Prompt Excerpt:', synthesisV0.rightPlate.prompt.substring(0, 180) + '...\n');

if (!leftHasLighting || !rightHasLighting) {
  throw new Error('AI failed to autonomously derive atmospheric lighting from the page text');
}
console.log('✓ PASS: AI autonomously derives lighting & atmosphere without manual theme settings.\n');

// 2. Test Prompt Re-crafting / Regeneration Under Each Image (variationIndex > 0)
console.log('--- 2. Testing Prompt Regeneration / Re-crafting on the Same Page ---');
const synthesisV1 = PromptArchitect.synthesizePrompts({
  pageText,
  bookTitle,
  author,
  styleId: 'chiaroscuro_oil',
  variationIndex: 1
});

const synthesisV2 = PromptArchitect.synthesizePrompts({
  pageText,
  bookTitle,
  author,
  styleId: 'chiaroscuro_oil',
  variationIndex: 2
});

console.log('Variation 0 (Initial Climax):');
console.log('  Sentence:', synthesisV0.analysis.bestDramaticSentence);
console.log('  Summary:', synthesisV0.analysis.climaxSummary);

console.log('\nVariation 1 (Re-crafted Climax 1):');
console.log('  Sentence:', synthesisV1.analysis.bestDramaticSentence);
console.log('  Summary:', synthesisV1.analysis.climaxSummary);

console.log('\nVariation 2 (Re-crafted Climax 2):');
console.log('  Sentence:', synthesisV2.analysis.bestDramaticSentence);
console.log('  Summary:', synthesisV2.analysis.climaxSummary);

if (synthesisV0.leftPlate.prompt === synthesisV1.leftPlate.prompt) {
  throw new Error('Variation 1 prompt did not differ from Variation 0');
}
console.log('\n✓ PASS: Re-crafting prompt dynamically chooses alternative dramatic scenes from the full page.\n');

// 3. Verify Art Styles are preserved
console.log('--- 3. Testing Art Style Override ---');
const synthesisGothic = PromptArchitect.synthesizePrompts({
  pageText,
  bookTitle,
  author,
  styleId: 'gothic_romanticism',
  variationIndex: 0
});

console.log('Gothic Romanticism snippet detected:', synthesisGothic.leftPlate.prompt.includes('Caspar David Friedrich'));
if (!synthesisGothic.leftPlate.prompt.includes('Caspar David Friedrich')) {
  throw new Error('Art style snippet was not incorporated');
}
console.log('✓ PASS: Art style is customizable while theme/lighting is autonomously derived.\n');

console.log('=== ALL PROMPT REGENERATION TESTS PASSED ===');

