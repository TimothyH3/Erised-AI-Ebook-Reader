/**
 * Test Suite: Multi-Era Page-Ranged Character Tracking (Aging, Wardrobe Shifts & Flashbacks)
 */
import fs from 'fs';
import assert from 'assert';
import {
  parseCharacterCodexJson,
  getCharacterDescriptionForPage,
  getActiveEraForPage,
  substituteNamesWithDescriptions,
  CharacterTracker
} from '../../src/ai/character-tracker.js';
import { fallbackSynthesize } from '../../src/ai/prompt-architect.js';

console.log('=== TEST SUITE: MULTI-ERA CHARACTER TRACKING (AGING & WARDROBE) ===\n');

// 1. Test parsing of characters with multi-era timelines
console.log('--- 1. Testing parseCharacterCodexJson with Multi-Era Timelines ---');
const sampleGeminiMultiEraJson = `
\`\`\`json
{
  "characters": [
    {
      "name": "Victor Frankenstein",
      "aliases": ["Victor", "Frankenstein"],
      "eras": [
        {
          "startPage": 2,
          "endPage": 45,
          "context": "Student at Ingolstadt",
          "description": "a slender, pale young Swiss scholar in his early twenties with disheveled dark brown hair, intense dark eyes, wearing an early 19th-century linen cravat and dark wool frock coat"
        },
        {
          "startPage": 46,
          "endPage": 82,
          "context": "Post-creation exhaustion & fever",
          "description": "a gaunt, hollow-cheeked young man in an unbuttoned rumpled linen shirt, with feverish dark circles under sunken eyes"
        },
        {
          "startPage": 83,
          "endPage": 85,
          "context": "Childhood memory / flashback",
          "description": "a lively ten-year-old Swiss boy with bright curious dark eyes and neat dark brown hair, dressed in a simple period linen tunic and breeches"
        },
        {
          "startPage": 86,
          "endPage": 210,
          "context": "Travels through Britain",
          "description": "a brooding man in his mid-twenties in a travel-stained dark greatcoat and leather riding boots, hollow-eyed with an anxious bearing"
        },
        {
          "startPage": 211,
          "endPage": null,
          "context": "Arctic pursuit",
          "description": "a prematurely aged, frostbitten, hollow-eyed man bundled in thick Arctic furs, heavy woolen scarves, and iced gloves"
        }
      ]
    }
  ]
}
\`\`\`
`;

const parsed = parseCharacterCodexJson(sampleGeminiMultiEraJson, 2);
assert.strictEqual(parsed.length, 1);
const victor = parsed[0];
assert.strictEqual(victor.name, 'Victor Frankenstein');
assert.strictEqual(victor.eras.length, 5);
assert.strictEqual(victor.eras[0].context, 'Student at Ingolstadt');
assert.strictEqual(victor.eras[2].context, 'Childhood memory / flashback');
assert.strictEqual(victor.eras[4].context, 'Arctic pursuit');
console.log('  ✓ Successfully parsed character with 5 chronological visual eras and page ranges\n');

// 2. Test getCharacterDescriptionForPage across different pages
console.log('--- 2. Testing getCharacterDescriptionForPage Dynamic Resolution ---');

// Page 10: Should be Student era
const descPage10 = getCharacterDescriptionForPage(victor, 10);
assert.ok(descPage10.includes('scholar in his early twenties'), 'Page 10 uses early twenties student');
assert.ok(descPage10.includes('linen cravat and dark wool frock coat'), 'Page 10 uses student frock coat');

// Page 60: Should be Post-creation fever era
const descPage60 = getCharacterDescriptionForPage(victor, 60);
assert.ok(descPage60.includes('unbuttoned rumpled linen shirt'), 'Page 60 uses unbuttoned shirt wardrobe');
assert.ok(descPage60.includes('hollow-cheeked young man'), 'Page 60 uses feverish state');

// Page 84: Should be Bounded Childhood Flashback
const descPage84 = getCharacterDescriptionForPage(victor, 84);
assert.ok(descPage84.includes('ten-year-old Swiss boy'), 'Page 84 flashback uses 10-year-old boy');
assert.ok(descPage84.includes('linen tunic and breeches'), 'Page 84 flashback uses childhood tunic');

// Page 150: Should be British Travels era
const descPage150 = getCharacterDescriptionForPage(victor, 150);
assert.ok(descPage150.includes('travel-stained dark greatcoat and leather riding boots'), 'Page 150 uses travel cloak & riding boots');
assert.ok(descPage150.includes('mid-twenties'), 'Page 150 reflects aging into mid-twenties');

// Page 230: Should be Arctic Pursuit era
const descPage230 = getCharacterDescriptionForPage(victor, 230);
assert.ok(descPage230.includes('thick Arctic furs'), 'Page 230 uses Arctic winter furs');
assert.ok(descPage230.includes('prematurely aged, frostbitten'), 'Page 230 reflects frostbite & premature aging');

console.log('  ✓ Page 10:  Resolved Student Frock Coat (p. 2–45)');
console.log('  ✓ Page 60:  Resolved Unbuttoned Fever Shirt (p. 46–82)');
console.log('  ✓ Page 84:  Resolved 10-Year-Old Childhood Flashback (p. 83–85)');
console.log('  ✓ Page 150: Resolved Travel Riding Cloak & Mid-Twenties (p. 86–210)');
console.log('  ✓ Page 230: Resolved Arctic Pursuit Furs & Frostbite (p. 211+)\n');

// 3. Test getActiveEraForPage metadata
console.log('--- 3. Testing getActiveEraForPage metadata ---');
const era84 = getActiveEraForPage(victor, 84);
assert.strictEqual(era84.context, 'Childhood memory / flashback');
assert.strictEqual(era84.startPage, 83);
assert.strictEqual(era84.endPage, 85);

const era230 = getActiveEraForPage(victor, 230);
assert.strictEqual(era230.context, 'Arctic pursuit');
assert.strictEqual(era230.startPage, 211);
assert.strictEqual(era230.endPage, null);
console.log('  ✓ Correctly returns era metadata objects for UI badges and timeline rendering\n');

// 4. Test substituteNamesWithDescriptions with Page Number
console.log('--- 4. Testing substituteNamesWithDescriptions with Page Accuracy ---');
const testPrompt = 'Victor stared out the frost-covered window, his hands trembling as Frankenstein pondered his destiny.';

// Test substitution on Page 10 (Student)
const substitutedP10 = substituteNamesWithDescriptions(testPrompt, [victor], 10);
assert.ok(!substitutedP10.includes('Victor'), 'Victor name eliminated on page 10');
assert.ok(!substitutedP10.includes('Frankenstein'), 'Frankenstein name eliminated on page 10');
assert.ok(substitutedP10.includes('scholar in his early twenties'), 'Page 10 prompt contains student description');

// Test substitution on Page 84 (Childhood Flashback)
const substitutedP84 = substituteNamesWithDescriptions(testPrompt, [victor], 84);
assert.ok(substitutedP84.includes('ten-year-old Swiss boy'), 'Page 84 prompt contains 10-year-old child description');
assert.ok(substitutedP84.includes('period linen tunic and breeches'), 'Page 84 prompt contains childhood tunic wardrobe');

// Test substitution on Page 230 (Arctic Furs)
const substitutedP230 = substituteNamesWithDescriptions(testPrompt, [victor], 230);
assert.ok(substitutedP230.includes('thick Arctic furs'), 'Page 230 prompt contains Arctic furs wardrobe');
assert.ok(substitutedP230.includes('frostbitten'), 'Page 230 prompt contains frostbitten state');

console.log('  ✓ substituteNamesWithDescriptions seamlessly injects page-accurate wardrobe & age\n');

// 5. Test fallbackSynthesize integration with Page Number
console.log('--- 5. Testing fallbackSynthesize Integration with pageNumber ---');
const synthPage84 = fallbackSynthesize({
  pageText: 'Victor laughed as he ran through the meadow toward Geneva.',
  bookTitle: 'Frankenstein',
  author: 'Mary Shelley',
  pageNumber: 84,
  characters: [victor]
});
assert.ok(!synthPage84.imagePrompt.includes('Victor'));
assert.ok(synthPage84.imagePrompt.includes('ten-year-old Swiss boy'));

const synthPage220 = fallbackSynthesize({
  pageText: 'Frankenstein pursued his quarry across the frozen ice fields.',
  bookTitle: 'Frankenstein',
  author: 'Mary Shelley',
  pageNumber: 220,
  characters: [victor]
});
assert.ok(!synthPage220.imagePrompt.includes('Frankenstein'));
assert.ok(synthPage220.imagePrompt.includes('thick Arctic furs'));

console.log('  ✓ fallbackSynthesize respects pageNumber and applies era-accurate description\n');

// 6. Test CharacterTracker Era Merging
console.log('--- 6. Testing CharacterTracker.mergeCharacters Era Merging ---');
const mockStorage = {
  getCharacters: async () => [victor],
  saveCharacters: async () => {},
  addOrUpdateCharacter: async (bookId, char) => [char]
};
const tracker = new CharacterTracker(mockStorage);

const newTurnEra = [
  {
    name: 'Victor Frankenstein',
    eras: [
      {
        startPage: 250,
        endPage: null,
        context: 'Walton cabin deathbed',
        description: 'an emaciated, dying man wrapped in coarse blankets in a wooden cabin, his voice weak and eyes dim'
      }
    ]
  }
];

const merged = await tracker.mergeCharacters('book_test', newTurnEra, 250);
const mergedVictor = merged.find(c => c.name === 'Victor Frankenstein');
assert.ok(mergedVictor.eras.length >= 6, 'New era appended to existing character timeline');
const deathbedEra = getActiveEraForPage(mergedVictor, 255);
assert.strictEqual(deathbedEra.context, 'Walton cabin deathbed');
assert.ok(deathbedEra.description.includes('emaciated, dying man'));

console.log('  ✓ CharacterTracker merges new eras and maintains chronological continuity\n');

// 7. Verify Page Demarcation Markers in gemini-headless.js
console.log('--- 7. Verifying Page Demarcation Markers in gemini-headless.js & reader.js ---');
const headlessSrc = fs.readFileSync('modules/gemini-headless.js', 'utf-8');
const readerSrc = fs.readFileSync('reader.js', 'utf-8');

assert.ok(headlessSrc.includes('=== [PAGE '), 'gemini-headless.js inserts === [PAGE X] === markers');
assert.ok(readerSrc.includes('=== [PAGE '), 'reader.js inserts === [PAGE X] === markers');
assert.ok(headlessSrc.includes('TRACK VISUAL ERAS, AGING, AND WARDROBE SHIFTS'), 'Prompt instructs Gemini to monitor wardrobe shifts and aging');
assert.ok(headlessSrc.includes('FLASHBACKS & MEMORIES'), 'Prompt instructs Gemini to detect flashbacks and page ranges');

console.log('  ✓ Page demarcation markers and wardrobe tracking directives verified in sources\n');

console.log('================================================================');
console.log('ALL MULTI-ERA & WARDROBE TIMELINE TESTS PASSED! ✓');
console.log('================================================================');

