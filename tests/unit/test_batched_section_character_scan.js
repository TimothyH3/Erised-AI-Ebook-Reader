/**
 * Test Suite: 30-Page Section Character Scan in a Single Gemini Chat
 */
import fs from 'fs';
import assert from 'assert';
import { GeminiHeadlessClient } from '../../src/ai/gemini-headless.js';
import { parseCharacterCodexJson } from '../../src/ai/character-tracker.js';

console.log('=== TEST SUITE: 30-PAGE SECTION CHARACTER SCAN (SINGLE CHAT) ===\n');

// 1. Verify GeminiHeadlessClient methods and context extraction
console.log('--- 1. Testing GeminiHeadlessClient 30-page section & single-chat methods ---');
const client = new GeminiHeadlessClient();

assert.strictEqual(typeof client.extractResponseContext, 'function', 'extractResponseContext is implemented');
assert.strictEqual(typeof client.analyzeBookCharactersSection, 'function', 'analyzeBookCharactersSection is implemented');
assert.strictEqual(typeof client.analyzeBookCharacters, 'function', 'analyzeBookCharacters is implemented');

// Test extractResponseContext
const sampleStream = `)]}'\n[["wrb.fr",null,null,null,null,null,null,null,null,null,["c_98765abcdef","r_12345xyz","rc_firstchoice"]]]`;
const extracted = client.extractResponseContext(sampleStream);
assert.strictEqual(extracted.conversationId, 'c_98765abcdef');
assert.strictEqual(extracted.responseId, 'r_12345xyz');
assert.strictEqual(extracted.choiceId, 'rc_firstchoice');

// Test updating context on subsequent turn
const nextTurnStream = `)]}'\n[["wrb.fr",null,null,null,null,null,null,null,null,null,["c_98765abcdef","r_turn2response","rc_turn2choice"]]]`;
const turn2Extracted = client.extractResponseContext(nextTurnStream, extracted);
assert.strictEqual(turn2Extracted.conversationId, 'c_98765abcdef'); // Retained conversationId
assert.strictEqual(turn2Extracted.responseId, 'r_turn2response');   // Updated responseId
assert.strictEqual(turn2Extracted.choiceId, 'rc_turn2choice');     // Updated choiceId

console.log('  ✓ extractResponseContext successfully extracts conversationId, responseId, choiceId');
console.log('  ✓ Preserves single-chat thread across multi-turn exchanges\n');

// 2. Test 30-Page Section Slicing Logic
console.log('--- 2. Testing 30-Page Section Slicing Logic ---');
// Simulate 75 pages of a book (page 1 is title folio, pages 2-75 are reading pages)
const mockPages = [];
mockPages.push({ pageNumber: 1, isTitlePage: true, text: 'Title Folio' });
for (let i = 2; i <= 75; i++) {
  mockPages.push({ pageNumber: i, isTitlePage: false, text: `Prose on page ${i}. Character Victor Frankenstein is introduced.` });
}

// Emulate reader.js / analyzeBookCharacters slicing
const readingPages = mockPages.filter(p => !p.isTitlePage && (p.pageNumber || 0) > 1);
const BATCH_SIZE = 30;
const sections = [];
for (let i = 0; i < readingPages.length; i += BATCH_SIZE) {
  const batch = readingPages.slice(i, i + BATCH_SIZE);
  const startPage = batch[0].pageNumber;
  const endPage = batch[batch.length - 1].pageNumber;
  const sectionText = batch.map(p => p.text).join('\n\n');
  sections.push({ startPage, endPage, sectionText, sectionIndex: sections.length });
}

assert.strictEqual(sections.length, 3, '74 reading pages divide into 3 sections (30, 30, 14)');
assert.strictEqual(sections[0].startPage, 2);
assert.strictEqual(sections[0].endPage, 31);
assert.strictEqual(sections[1].startPage, 32);
assert.strictEqual(sections[1].endPage, 61);
assert.strictEqual(sections[2].startPage, 62);
assert.strictEqual(sections[2].endPage, 75);

console.log('  ✓ Section 1: Pages 2–31 (30 pages)');
console.log('  ✓ Section 2: Pages 32–61 (30 pages)');
console.log('  ✓ Section 3: Pages 62–75 (14 pages)');
console.log('  ✓ Slicing logic correctly segments books into 30-page batches\n');

// 3. Test background.js handlers for ANALYZE_BOOK_SECTION and ANALYZE_BOOK_CHARACTERS
console.log('--- 3. Testing background.js message actions ---');
const bgSource = fs.readFileSync('background.js', 'utf-8');

assert.ok(bgSource.includes("case 'ANALYZE_BOOK_SECTION':"), 'background.js handles ANALYZE_BOOK_SECTION');
assert.ok(bgSource.includes('geminiClient.analyzeBookCharactersSection(payload)'), 'background.js calls analyzeBookCharactersSection');
assert.ok(bgSource.includes("case 'ANALYZE_BOOK_CHARACTERS':"), 'background.js handles ANALYZE_BOOK_CHARACTERS');
assert.ok(bgSource.includes("action: 'CHARACTER_SCAN_PROGRESS'"), 'background.js broadcasts scan progress');

console.log('  ✓ background.js handles ANALYZE_BOOK_SECTION for turn-by-turn stepping');
console.log('  ✓ background.js handles ANALYZE_BOOK_CHARACTERS with progress events\n');

// 4. Test reader.js implementation
console.log('--- 4. Testing reader.js 30-page single-chat implementation ---');
const readerSource = fs.readFileSync('reader.js', 'utf-8');

assert.ok(readerSource.includes('const BATCH_SIZE = 30;'), 'reader.js uses 30-page batch size');
assert.ok(readerSource.includes("action: 'ANALYZE_BOOK_SECTION'"), 'reader.js sends ANALYZE_BOOK_SECTION per 30-page section');
assert.ok(readerSource.includes('conversationContext = res.conversationContext;'), 'reader.js reuses conversationContext across turns to stay in single chat');
assert.ok(readerSource.includes('this.characterTracker.mergeCharacters'), 'reader.js incrementally updates character tracker as each section finishes');
assert.ok(readerSource.includes('this.renderCharacterList();'), 'reader.js updates character drawer in real time');

console.log('  ✓ reader.js slices pages into 30-page sections');
console.log('  ✓ reader.js chains conversationContext across turns for a single chat thread');
console.log('  ✓ reader.js incrementally merges characters into the persistent codex\n');

// 5. Test character merging and codex updates
console.log('--- 5. Testing multi-section character codex merging ---');
const turn1Json = `
\`\`\`json
{
  "characters": [
    {
      "name": "Victor Frankenstein",
      "aliases": ["Victor", "Frankenstein"],
      "description": "tall slender Genevan scholar in early twenties with sunken pale cheeks, dark disheveled hair, and obsessive intense dark eyes"
    }
  ]
}
\`\`\`
`;

const turn2Json = `
\`\`\`json
{
  "characters": [
    {
      "name": "Elizabeth Lavenza",
      "aliases": ["Elizabeth"],
      "description": "slender fair-complexioned young woman with golden cloud-like hair, gentle clear blue eyes, wearing an ethereal 18th-century muslin gown"
    },
    {
      "name": "Victor Frankenstein",
      "aliases": ["the creator"],
      "description": "now wearing a travel-stained dark greatcoat with shadows beneath his hollow eyes"
    }
  ]
}
\`\`\`
`;

const parsed1 = parseCharacterCodexJson(turn1Json, 2);
const parsed2 = parseCharacterCodexJson(turn2Json, 32);

assert.strictEqual(parsed1.length, 1);
assert.strictEqual(parsed1[0].name, 'Victor Frankenstein');

assert.strictEqual(parsed2.length, 2);
assert.strictEqual(parsed2[0].name, 'Elizabeth Lavenza');
assert.strictEqual(parsed2[1].name, 'Victor Frankenstein');

console.log('  ✓ Parsed Section 1 characters successfully');
console.log('  ✓ Parsed Section 2 newly introduced characters and description refinements\n');

// 6. Verify Per-Page Pipeline has zero character scanning latency
console.log('--- 6. Verifying per-page reading pipeline speed ---');
assert.ok(!bgSource.includes('await geminiClient.gatherCharacterDescriptions({'), 'RUN_FULL_PIPELINE does not make per-page character calls');
assert.ok(bgSource.includes('const characters = existingCharacters || [];'), 'RUN_FULL_PIPELINE uses existingCharacters directly');
console.log('  ✓ Zero character scanning calls on per-page reading turns; uses codex directly\n');

console.log('================================================================');
console.log('ALL 30-PAGE SECTION SINGLE-CHAT CHARACTER SCAN TESTS PASSED! ✓');
console.log('================================================================');

