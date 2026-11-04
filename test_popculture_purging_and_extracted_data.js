/**
 * Test Suite: Ensuring Image Prompts Pull Only from Extracted Character Data (Zero Pop-Culture / Online Tropes)
 */
import fs from 'fs';
import assert from 'assert';
import { substituteNamesWithDescriptions, sanitizePopCultureTropes } from './modules/character-tracker.js';
import { fallbackSynthesize, UNIVERSAL_NEGATIVE_PROMPT } from './modules/prompt-architect.js';
import { GeminiHeadlessClient } from './modules/gemini-headless.js';

console.log('=== TEST SUITE: EXTRACTED CHARACTER DATA ONLY (ZERO POP-CULTURE TROPES) ===\n');

// 1. Verify sanitizePopCultureTropes
console.log('--- 1. Testing sanitizePopCultureTropes utility ---');
const sampleContaminatedPrompt = 
  'Fine-art book plate depicting a green-skinned creature with metal neck bolts, a flat-top head, and movie adaptation style standing in a gothic laboratory.';

const cleansed = sanitizePopCultureTropes(sampleContaminatedPrompt);
assert.ok(!cleansed.toLowerCase().includes('green-skinned'), 'Green skin purged');
assert.ok(!cleansed.toLowerCase().includes('neck bolts'), 'Neck bolts purged');
assert.ok(!cleansed.toLowerCase().includes('flat-top head'), 'Flat-top head purged');
assert.ok(!cleansed.toLowerCase().includes('movie adaptation'), 'Movie adaptation meta text purged');
assert.ok(cleansed.includes('shriveled yellowish skin'), 'Replaced with book-accurate yellow skin');
console.log('  ✓ Purged Hollywood Frankenstein tropes (green skin, neck bolts, flat-top head, movie adaptation)');
console.log('  ✓ Result: ' + cleansed + '\n');

// 2. Verify substituteNamesWithDescriptions enforces extracted character attributes
console.log('--- 2. Testing substituteNamesWithDescriptions with extracted character data ---');
const extractedCharacters = [
  {
    name: 'The Creature',
    aliases: ['The Creature', 'The Monster', 'the creature', 'the monster'],
    description: 'a towering eight-foot-tall figure of superhuman stature with dull yellow watery eyes, shriveled yellowish skin, and lustrous flowing black hair, draped in dark coarse wool garments'
  },
  {
    name: 'Victor Frankenstein',
    aliases: ['Victor Frankenstein', 'Victor', 'Frankenstein'],
    description: 'a gaunt, pale young Swiss scholar in his early twenties with disheveled dark brown hair, feverish sunken dark eyes, wearing an early 19th-century linen cravat and dark wool frock coat'
  }
];

const inputPrompt = 'Victor watched in horror as The Monster with green skin and neck bolts stepped forward.';
const resultPrompt = substituteNamesWithDescriptions(inputPrompt, extractedCharacters);

assert.ok(!resultPrompt.includes('Victor'), 'Victor proper name eliminated');
assert.ok(!resultPrompt.includes('The Monster'), 'The Monster proper name eliminated');
assert.ok(resultPrompt.includes('towering eight-foot-tall figure'), 'Extracted character data used for the creature');
assert.ok(resultPrompt.includes('dull yellow watery eyes'), 'Extracted character eyes used');
assert.ok(resultPrompt.includes('gaunt, pale young Swiss scholar'), 'Extracted scholar description used');
assert.ok(!resultPrompt.includes('neck bolts'), 'Pop-culture neck bolts purged');
assert.ok(!resultPrompt.includes('green skin'), 'Pop-culture green skin purged');

console.log('  ✓ Generated prompt strictly pulls from extracted character dossier');
console.log('  ✓ Pop-culture contamination completely purged from character substitution\n');

// 3. Verify synthesis directives in gemini-headless.js
console.log('--- 3. Testing synthesis prompt directives in modules/gemini-headless.js ---');
const headlessSource = fs.readFileSync('modules/gemini-headless.js', 'utf-8');

assert.ok(headlessSource.includes('AUTHENTIC EXTRACTED BOOK DOSSIER'), 'charactersContext header designates authentic extracted dossier');
assert.ok(headlessSource.includes('EXCLUSIVELY and ONLY using'), 'Explicit exclusive use of extracted descriptions directive');
assert.ok(headlessSource.includes('Do NOT use any external, online, movie, TV, or pop-culture depictions'), 'Forbids external movie/TV/pop-culture depictions');
assert.ok(headlessSource.includes('STRICT MANDATORY RULE — PULL ONLY FROM EXTRACTED CHARACTER DATA (ZERO NAMES, ZERO POP CULTURE)'), 'Mandatory rule heading in synthesis prompt');
assert.ok(headlessSource.includes('parsed.imagePrompt = sanitizePopCultureTropes(parsed.imagePrompt);'), 'Gemini response sanitized through sanitizePopCultureTropes');
assert.ok(headlessSource.includes('clean = sanitizePopCultureTropes(clean);'), 'Imagen 3 dispatch sanitized through sanitizePopCultureTropes');

console.log('  ✓ synthesizePagePrompt explicitly binds model to extracted character data only');
console.log('  ✓ Forbids online, film, television, and comic book adaptations in prompt generation');
console.log('  ✓ Double-gated post-synthesis and pre-Imagen pop-culture sanitizers active\n');

// 4. Verify character extraction in analyzeBookCharactersSection
console.log('--- 4. Testing character extraction rules in analyzeBookCharactersSection ---');
assert.ok(headlessSource.includes('STRICT TEXTUAL FIDELITY (ZERO ONLINE OR POP-CULTURE INFLUENCE)'), 'Extraction prompt includes strict textual fidelity rule');
assert.ok(headlessSource.includes('EXCLUSIVELY and ONLY from what is written in the author\'s text'), 'Extracts only from author text');
assert.ok(headlessSource.includes('Do NOT import, borrow, or assume external knowledge, movie adaptations'), 'Forbids importing movie adaptations during book scanning');

console.log('  ✓ Character extraction codex builder restricted strictly to literal book text\n');

// 5. Verify fallback synthesis & UNIVERSAL_NEGATIVE_PROMPT in prompt-architect.js
console.log('--- 5. Testing prompt-architect.js fallback & negative prompt ---');
assert.ok(UNIVERSAL_NEGATIVE_PROMPT.includes('pop-culture tropes'), 'UNIVERSAL_NEGATIVE_PROMPT contains pop-culture tropes');
assert.ok(UNIVERSAL_NEGATIVE_PROMPT.includes('movie adaptations'), 'UNIVERSAL_NEGATIVE_PROMPT contains movie adaptations');
assert.ok(UNIVERSAL_NEGATIVE_PROMPT.includes('green skin'), 'UNIVERSAL_NEGATIVE_PROMPT bans green skin');
assert.ok(UNIVERSAL_NEGATIVE_PROMPT.includes('neck bolts'), 'UNIVERSAL_NEGATIVE_PROMPT bans neck bolts');

const fallbackRes = fallbackSynthesize({
  pageText: 'Victor Frankenstein beheld The Monster with green skin standing in the laboratory.',
  bookTitle: 'Frankenstein',
  author: 'Mary Shelley',
  characters: extractedCharacters
});

assert.ok(!fallbackRes.imagePrompt.includes('Victor'), 'Fallback has no proper names');
assert.ok(!fallbackRes.imagePrompt.includes('The Monster'), 'Fallback has no proper names');
assert.ok(fallbackRes.imagePrompt.includes('gaunt, pale young Swiss scholar'), 'Fallback uses extracted scholar data');
assert.ok(fallbackRes.imagePrompt.includes('towering eight-foot-tall figure'), 'Fallback uses extracted creature data');
assert.ok(!fallbackRes.imagePrompt.includes('green skin'), 'Fallback purges pop-culture green skin');

console.log('  ✓ Fallback synthesis strictly adheres to extracted character data');
console.log('  ✓ UNIVERSAL_NEGATIVE_PROMPT bans pop-culture, movie adaptations, and caricature\n');

console.log('================================================================');
console.log('ALL POP-CULTURE PURGING & EXTRACTED DATA TESTS PASSED! ✓');
console.log('================================================================');

