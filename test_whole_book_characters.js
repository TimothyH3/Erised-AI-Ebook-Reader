/**
 * Test Suite: Whole Book Character Extraction with .TXT File Upload to Gemini
 */
import fs from 'fs';
import assert from 'assert';
import { GeminiHeadlessClient } from './modules/gemini-headless.js';
import { parseCharacterCodexJson } from './modules/character-tracker.js';

console.log('=== TEST SUITE: WHOLE-BOOK CHARACTER EXTRACTION WITH .TXT UPLOAD ===\n');

// 1. Verify manifest.json host_permissions
console.log('--- 1. Testing manifest.json host_permissions for Google Uploads ---');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
assert.ok(manifest.host_permissions.includes('https://*.googleapis.com/*'), 'manifest.json permits https://*.googleapis.com/*');
console.log('  ✓ manifest.json includes https://*.googleapis.com/* for content-push upload access\n');

// 2. Verify GeminiHeadlessClient upload and analysis methods
console.log('--- 2. Testing GeminiHeadlessClient.uploadTextFileToGemini & analyzeBookCharacters ---');
const client = new GeminiHeadlessClient();
assert.strictEqual(typeof client.uploadTextFileToGemini, 'function', 'uploadTextFileToGemini is implemented');
assert.strictEqual(typeof client.analyzeBookCharacters, 'function', 'analyzeBookCharacters is implemented');

// Test empty text safety
const emptyUpload = await client.uploadTextFileToGemini('');
assert.strictEqual(emptyUpload.success, false);

const emptyAnalysis = await client.analyzeBookCharacters({ fullBookText: '' });
assert.strictEqual(emptyAnalysis.success, true);
assert.deepStrictEqual(emptyAnalysis.characters, []);

console.log('  ✓ uploadTextFileToGemini implemented and handles empty input safely');
console.log('  ✓ analyzeBookCharacters implemented and handles empty input safely\n');

// 3. Verify Background Message Action & No Per-Page Scanning
console.log('--- 3. Testing background.js Pipeline & Actions ---');
const backgroundJs = fs.readFileSync('background.js', 'utf-8');

assert.ok(backgroundJs.includes("case 'ANALYZE_BOOK_CHARACTERS':"), 'background.js handles ANALYZE_BOOK_CHARACTERS');
assert.ok(backgroundJs.includes('geminiClient.analyzeBookCharacters'), 'background.js invokes analyzeBookCharacters');
assert.ok(!backgroundJs.includes('await geminiClient.gatherCharacterDescriptions({'), 'RUN_FULL_PIPELINE does NOT call gatherCharacterDescriptions on each page');
assert.ok(backgroundJs.includes('const characters = existingCharacters || [];'), 'RUN_FULL_PIPELINE uses existingCharacters directly');

console.log('  ✓ background.js handles ANALYZE_BOOK_CHARACTERS');
console.log('  ✓ Per-page character scanning completely eliminated from RUN_FULL_PIPELINE\n');

// 4. Verify Reader HTML & JS
console.log('--- 4. Testing Reader UI & File Ingestion ---');
const readerHtml = fs.readFileSync('reader.html', 'utf-8');
const readerJs = fs.readFileSync('reader.js', 'utf-8');

assert.ok(readerHtml.includes('id="btn-scan-characters"'), 'reader.html contains btn-scan-characters');
assert.ok(readerHtml.includes('id="btn-export-txt"'), 'reader.html contains btn-export-txt');
assert.ok(readerJs.includes('parsedBook.fullText = fullText;'), 'handleFileUpload extracts full text into parsedBook.fullText');
assert.ok(readerJs.includes('this.scanBookCharacters(parsedBook);'), 'handleFileUpload triggers scanBookCharacters on upload');
assert.ok(readerJs.includes('scanBookCharacters('), 'reader.js implements scanBookCharacters()');
assert.ok(readerJs.includes('exportCurrentBookAsTxt('), 'reader.js implements exportCurrentBookAsTxt()');

console.log('  ✓ reader.html contains scan and export buttons');
console.log('  ✓ reader.js compiles full book text on upload and runs whole-book character scan\n');

// 5. Test JSON parsing for whole-book character outputs
console.log('--- 5. Testing Whole-Book Character Parser ---');
const sampleGeminiOutput = `
\`\`\`json
{
  "characters": [
    {
      "name": "Ebenezer Scrooge",
      "aliases": ["Scrooge", "old Scrooge"],
      "description": "a tight-fisted, squeezing, wrenching elderly gentleman with pointed nose, shriveled cheek, stiffened gait, red eyes, thin blue lips, and grating voice, dressed in a somber Victorian frock coat"
    },
    {
      "name": "Bob Cratchit",
      "aliases": ["Cratchit", "Bob"],
      "description": "a humble, slender Victorian clerk in his thirties with a threadbare coat, long white comforter dangling below his waist, and cold-chapped fingers"
    }
  ]
}
\`\`\`
`;

const parsed = parseCharacterCodexJson(sampleGeminiOutput, 1);
assert.strictEqual(parsed.length, 2);
assert.strictEqual(parsed[0].name, 'Ebenezer Scrooge');
assert.strictEqual(parsed[1].name, 'Bob Cratchit');
assert.ok(parsed[0].description.includes('tight-fisted'));
assert.ok(parsed[1].description.includes('threadbare coat'));
console.log('  ✓ Correctly parses whole-book character lists from Gemini markdown JSON\n');

console.log('====================================================');
console.log('ALL WHOLE-BOOK CHARACTER & .TXT UPLOAD TESTS PASSED! ✓');
console.log('====================================================');
