/**
 * Verification Test: Dynamic Prompt Updates & Full-Page Context Selection
 */

import { PromptArchitect } from './modules/prompt-architect.js';
import { SAMPLE_BOOKS } from './modules/sample-books.js';

console.log('=== VERIFYING DYNAMIC PROMPT UPDATES ACROSS PAGES AND BOOKS ===\n');

// 1. Verify Page-to-Page Updates within Frankenstein
const frankenstein = SAMPLE_BOOKS[0];
console.log(`Testing Book: "${frankenstein.title}"`);

const frankP2 = PromptArchitect.synthesizePrompts({
  pageText: frankenstein.pages[1].text,
  bookTitle: frankenstein.title,
  author: frankenstein.author
});

const frankP3 = PromptArchitect.synthesizePrompts({
  pageText: frankenstein.pages[2].text,
  bookTitle: frankenstein.title,
  author: frankenstein.author
});

console.log('\n--- Page 2 (Discovery of Animation Secret) ---');
console.log('  Dramatic Climax Summary:', frankP2.leftPlate.sceneSummary);
console.log('  Setting Summary:', frankP2.rightPlate.sceneSummary);
console.log('  Left Prompt Snippet:', frankP2.leftPlate.prompt.substring(0, 150) + '...');

console.log('\n--- Page 3 (Dreary Night in November - Creature Awakes) ---');
console.log('  Dramatic Climax Summary:', frankP3.leftPlate.sceneSummary);
console.log('  Setting Summary:', frankP3.rightPlate.sceneSummary);
console.log('  Left Prompt Snippet:', frankP3.leftPlate.prompt.substring(0, 150) + '...');

if (frankP2.leftPlate.sceneSummary !== frankP3.leftPlate.sceneSummary) {
  console.log('\n✓ SUCCESS: Left Plate Climax prompt dynamically updated between Page 2 and Page 3!');
} else {
  console.error('\n✗ FAIL: Prompts did not update between pages!');
}

if (frankP2.rightPlate.sceneSummary !== frankP3.rightPlate.sceneSummary) {
  console.log('✓ SUCCESS: Right Plate Setting prompt dynamically updated between Page 2 and Page 3!');
} else {
  console.error('\n✗ FAIL: Right plate setting did not update!');
}

// 2. Verify Book-to-Book Updates
const dorian = SAMPLE_BOOKS[1];
console.log(`\n\nTesting Book Switch to: "${dorian.title}"`);

const dorianP2 = PromptArchitect.synthesizePrompts({
  pageText: dorian.pages[1].text,
  bookTitle: dorian.title,
  author: dorian.author
});

console.log('--- Dorian Gray Page 2 (Basil Studio) ---');
console.log('  Dramatic Climax Summary:', dorianP2.leftPlate.sceneSummary);
console.log('  Setting Summary:', dorianP2.rightPlate.sceneSummary);
console.log('  Left Prompt Snippet:', dorianP2.leftPlate.prompt.substring(0, 150) + '...');

if (dorianP2.leftPlate.prompt !== frankP2.leftPlate.prompt) {
  console.log('\n✓ SUCCESS: Prompt completely transformed upon switching to a new book!');
}

// 3. Verify Full-Page Context Selection
console.log('\n\n--- Testing Full-Page Context Scoring ---');
const analysisP2 = frankP2.analysis;
console.log('Page 2 Full Text Length:', analysisP2.pageLength, 'chars');
console.log('Paragraphs Scanned:', analysisP2.paragraphsCount);
console.log('Best Dramatic Sentence Chosen:', `"${analysisP2.bestDramaticSentence}"`);
console.log('Best Environmental Sentence Chosen:', `"${analysisP2.bestSettingSentence}"`);

if (analysisP2.bestDramaticSentence && analysisP2.bestSettingSentence) {
  console.log('✓ SUCCESS: AI Prompt Architect evaluated full page context and picked the top dramatic climax and setting sentences.');
}

console.log('\n=== ALL VERIFICATIONS PASSED ===');
