/**
 * Test Suite: Font Size Controls on Default Pages, Hover Pill Over-Top Positioning,
 * and Scene-Specific Wardrobe Eras with Page Numbers.
 */

import assert from 'assert';
import fs from 'fs';
import {
  splitCompoundWardrobe,
  parseCharacterCodexJson,
  getCharacterDescriptionForPage,
  getActiveEraForPage,
  CharacterTracker
} from '../../src/ai/character-tracker.js';

console.log('=== TEST SUITE: FONT SIZE, HOVER PILL, AND SCENE WARDROBE FIXES ===\n');

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// -------------------------------------------------------------
// 1. VERIFY FONT SIZE AND FORMATTING CONTROLS FOR DEFAULT PAGES
// -------------------------------------------------------------
console.log('--- 1. Testing Font Size & Prose Formatting Controls ---');
const readerCss = fs.readFileSync('reader.css', 'utf-8');
const readerJs = fs.readFileSync('reader.js', 'utf-8');

check(readerCss.includes('.prose-content-area,'), 'reader.css styles .prose-content-area base typography');
check(readerCss.includes('.prose-content-area p,'), 'reader.css styles .prose-content-area paragraphs with formatting (indents & margins)');
check(readerCss.includes('.chapter-header,'), 'reader.css styles .chapter-header for default pages');
check(readerCss.includes('.chapter-number,'), 'reader.css styles .chapter-number for default pages');
check(readerJs.includes('this.proseContentArea.style.fontSize = `${this.fontSize}px`'), 'reader.js dynamically updates proseContentArea.style.fontSize');

// -------------------------------------------------------------
// 2. VERIFY HOVER PILL OVER-TOP POSITIONING & STABILITY
// -------------------------------------------------------------
console.log('\n--- 2. Testing Hover Pill Over-Top Positioning & Bridge ---');

check(readerCss.includes('top: -14px;'), 'Hover pill is positioned directly over-top (-14px) the selected text');
check(readerCss.includes('.excerpt-hover-pill::before'), 'Hover pill has invisible hit-test bridge (::before) preventing mouse flicker');
check(readerJs.includes('scheduleHidePill'), 'reader.js implements mouseenter/mouseleave grace period for hover pill stability');

// -------------------------------------------------------------
// 3. VERIFY SCENE-SPECIFIC WARDROBE DECOMPOSITION & PROMPT RULES
// -------------------------------------------------------------
console.log('\n--- 3. Testing Scene-Specific Wardrobe Decompositions & Page Numbers ---');

const compoundSample = "A young boy with untidy black hair, bright green eyes, round spectacles, a lightning-bolt scar on his forehead, wearing Hogwarts student robes in the underground chambers and hospital pajamas in the infirmary bed.";

const decomp = splitCompoundWardrobe(compoundSample, 12);
check(decomp !== null, 'splitCompoundWardrobe successfully detected compound summary');
check(!decomp.corePhysicalOnly.includes('wearing Hogwarts'), 'Core physical traits isolated without composite outfits');
check(decomp.eras.length === 2, 'Decomposed into exactly 2 scene-specific eras');
check(decomp.eras[0].context.includes('Underground chambers') && decomp.eras[0].description.includes('student robes'), 'Era 1 mapped to underground chambers with robes');
check(decomp.eras[1].context.includes('Infirmary bed') && decomp.eras[1].description.includes('hospital pajamas'), 'Era 2 mapped to infirmary bed with pajamas');

// Test parseCharacterCodexJson decomposition
const rawJson = `
\`\`\`json
{
  "characters": [
    {
      "name": "Harry Potter",
      "aliases": ["Harry"],
      "description": "${compoundSample}"
    }
  ]
}
\`\`\`
`;

const parsed = parseCharacterCodexJson(rawJson, 12);
check(parsed.length === 1, 'parseCharacterCodexJson parsed character');
check(parsed[0].eras.length === 2, 'parseCharacterCodexJson decomposed compound into 2 distinct scene eras');
check(parsed[0].eras[0].startPage === 12, 'Era 1 starts on page 12');
check(parsed[0].eras[1].startPage === 13, 'Era 2 starts on page 13');

// Test resolution for each scene page
const page12Desc = getCharacterDescriptionForPage(parsed[0], 12);
check(page12Desc.includes('wearing Hogwarts student robes in the underground chambers'), 'Page 12 resolves student robes in underground chambers');
check(!page12Desc.includes('hospital pajamas'), 'Page 12 does NOT contain hospital pajamas');

const page13Desc = getCharacterDescriptionForPage(parsed[0], 13);
check(page13Desc.includes('hospital pajamas in the infirmary bed'), 'Page 13 resolves hospital pajamas in infirmary bed');
check(!page13Desc.includes('underground chambers'), 'Page 13 does NOT contain underground chambers');

// Verify Gemini prompt instructions
const headlessSrc = fs.readFileSync('modules/gemini-headless.js', 'utf-8');
check(headlessSrc.includes('FORBIDDEN WARDROBE SUMMARY ANTI-PATTERN'), 'gemini-headless.js explicitly forbids composite wardrobe summaries');
check(headlessSrc.includes('MANDATORY SCENE DECOMPOSITION'), 'gemini-headless.js mandates scene-by-scene era decomposition with page numbers');
check(headlessSrc.includes('wearing Hogwarts student robes in the underground chambers and hospital pajamas in the infirmary bed'), 'gemini-headless.js warns against the exact anti-pattern');

// -------------------------------------------------------------
// 4. TEST CharacterTracker.mergeCharacters WITHOUT RUN-ON OUTFITS
// -------------------------------------------------------------
console.log('\n--- 4. Testing CharacterTracker.mergeCharacters Multi-Outfit Prevention ---');

const mockStorage = {
  getCharacters: async () => [
    {
      id: 'char_harry',
      name: 'Harry Potter',
      aliases: ['Harry'],
      description: 'a young boy with untidy black hair, bright green eyes, round spectacles, a lightning-bolt scar on his forehead, wearing Hogwarts student robes in the underground chambers',
      eras: [
        {
          startPage: 12,
          endPage: 14,
          context: 'Underground Chambers',
          description: 'a young boy with untidy black hair, bright green eyes, round spectacles, a lightning-bolt scar on his forehead, wearing Hogwarts student robes in the underground chambers'
        }
      ]
    }
  ],
  saveCharacters: async () => {},
  addOrUpdateCharacter: async (bookId, char) => [char]
};

const tracker = new CharacterTracker(mockStorage);
const incomingSectionUpdate = [
  {
    name: 'Harry Potter',
    description: 'wearing hospital pajamas in the infirmary bed',
    eras: [
      {
        startPage: 15,
        endPage: 16,
        context: 'Hospital Wing Infirmary',
        description: 'a young boy with untidy black hair, bright green eyes, round spectacles, a lightning-bolt scar on his forehead, wearing hospital pajamas in the infirmary bed'
      }
    ]
  }
];

const mergedList = await tracker.mergeCharacters('test_book', incomingSectionUpdate, 15);
const mergedHarry = mergedList.find(c => c.name === 'Harry Potter');

check(mergedHarry.eras.length === 2, 'mergedHarry contains exactly 2 distinct scene eras');
check(!mergedHarry.description.includes('wearing Hogwarts student robes in the underground chambers, wearing hospital pajamas'), 'Base description does NOT concatenate multiple conflicting outfits');

console.log(`\n=============================================================`);
console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
console.log(`=============================================================`);

if (failed > 0) {
  process.exit(1);
}

