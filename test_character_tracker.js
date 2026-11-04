/**
 * Unit & Integration Test Suite: Character Tracker & Zero-Name Prompt Substitution
 */

import {
  CharacterTracker,
  parseCharacterCodexJson,
  substituteNamesWithDescriptions,
  containsAnyCharacterName,
  deriveShortReference,
  PRESEEDED_CHARACTERS
} from './modules/character-tracker.js';
import { storage } from './modules/storage.js';
import { fallbackSynthesize, parseSynthesisJson } from './modules/prompt-architect.js';
import { GeminiHeadlessClient } from './modules/gemini-headless.js';
import { SAMPLE_BOOKS } from './modules/sample-books.js';

console.log('=== TEST SUITE: CHARACTER TRACKER & ZERO-NAME PROMPT GENERATOR ===\n');

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
// 1. Verify Pre-Seeded Classic Characters
// ----------------------------------------------------
console.log('--- 1. Testing Pre-Seeded Character Dossiers ---');
const frankChars = PRESEEDED_CHARACTERS.sample_frankenstein;
assert(Array.isArray(frankChars) && frankChars.length >= 5, 'Frankenstein has at least 5 canonical characters');

const victor = frankChars.find(c => c.name === 'Victor Frankenstein');
assert(victor !== undefined, 'Victor Frankenstein is present');
assert(victor.aliases.includes('Victor') && victor.aliases.includes('Frankenstein'), 'Victor aliases include Victor and Frankenstein');
assert(victor.description.includes('scholar') && victor.description.includes('hair') && victor.description.includes('eyes'), 'Victor description has physical attributes (scholar, hair, eyes)');

const creature = frankChars.find(c => c.name === 'The Creature');
assert(creature !== undefined, 'The Creature is present with superhuman physical description');

const dorianChars = PRESEEDED_CHARACTERS.sample_dorian_gray;
assert(Array.isArray(dorianChars) && dorianChars.length >= 4, 'Dorian Gray has canonical characters');
const dorian = dorianChars.find(c => c.name === 'Dorian Gray');
assert(dorian.description.includes('handsome') && dorian.description.includes('curls'), 'Dorian description contains physical traits');

// ----------------------------------------------------
// 2. Testing Dedicated Gemini Character Codex Parser
// ----------------------------------------------------
console.log('\n--- 2. Testing Dedicated Gemini Character Codex Parser ---');
const geminiCharResponse = `
\`\`\`json
{
  "characters": [
    {
      "name": "Henry Clerval",
      "aliases": ["Henry Clerval", "Clerval", "Henry"],
      "description": "a lively young gentleman with wavy brown hair, warm expressive eyes, wearing a dark wool travel coat and silk neckerchief"
    },
    {
      "name": "Lady Elizabeth Lavenza",
      "aliases": ["Lady Elizabeth Lavenza", "Elizabeth", "Elizabeth Lavenza"],
      "description": "a slender, graceful young woman with fair golden hair, clear blue eyes, and serene features, attired in a white muslin gown"
    }
  ]
}
\`\`\`
`;

const extracted = parseCharacterCodexJson(geminiCharResponse, 2);
console.log(`  Parsed ${extracted.length} characters from Gemini character response.`);
assert(extracted.length === 2, 'Successfully parsed 2 character introductions from dedicated Gemini prompt');

const extractedHenry = extracted.find(c => c.name.includes('Henry Clerval'));
assert(extractedHenry !== undefined, 'Recognized Henry Clerval');
assert(extractedHenry?.description.includes('gentleman') && extractedHenry?.description.includes('hair'), 'Henry Clerval extracted with physical attributes');
assert(extractedHenry?.shortReference.includes('gentleman'), 'Short reference generated: ' + extractedHenry?.shortReference);

const extractedElizabeth = extracted.find(c => c.name.includes('Elizabeth'));
assert(extractedElizabeth !== undefined, 'Recognized Lady Elizabeth Lavenza');
assert(extractedElizabeth?.description.includes('woman') && extractedElizabeth?.description.includes('golden hair'), 'Elizabeth extracted with physical traits');

// ----------------------------------------------------
// 3. Testing Strict Name Elimination & Replacement in Prompts
// ----------------------------------------------------
console.log('\n--- 3. Testing Strict Name Elimination & Substitution in Prompts ---');

// Test 3A: Single Character Replacement
const promptA = 'Victor Frankenstein sat in his dark laboratory, shivering as Victor looked at the instrument.';
const sanitizedA = substituteNamesWithDescriptions(promptA, frankChars);
console.log('  Original Prompt:', promptA);
console.log('  Sanitized Prompt:', sanitizedA);

assert(!containsAnyCharacterName(sanitizedA, [victor]), 'Sanitized prompt contains ZERO mentions of Victor or Frankenstein');
assert(!sanitizedA.includes('Victor') && !sanitizedA.includes('Frankenstein'), 'Neither "Victor" nor "Frankenstein" appears in the result');
assert(sanitizedA.includes('scholar') && sanitizedA.includes('hair'), 'Replaced with rich physical description of the scholar');

// Test 3B: Possessive Forms ("Victor's", "Dorian's")
const promptB = "Victor's hands trembled as Frankenstein's eyes opened wide.";
const sanitizedB = substituteNamesWithDescriptions(promptB, frankChars);
console.log('  Original Possessive:', promptB);
console.log('  Sanitized Possessive:', sanitizedB);
assert(!sanitizedB.includes("Victor's") && !sanitizedB.includes("Frankenstein's"), 'Possessive proper names eliminated');
assert(sanitizedB.includes("'s") || sanitizedB.includes("’s"), 'Preserved possessive grammar');

// Test 3C: Multiple Distinct Characters in Same Scene
const promptC = 'Dorian Gray smiled as Lord Henry whispered advice, while Basil Hallward mixed his pigments.';
const sanitizedC = substituteNamesWithDescriptions(promptC, dorianChars);
console.log('  Multi-Character Original:', promptC);
console.log('  Multi-Character Sanitized:', sanitizedC);
assert(!sanitizedC.includes('Dorian') && !sanitizedC.includes('Lord Henry') && !sanitizedC.includes('Basil Hallward') && !sanitizedC.includes('Basil'),
  'All 3 character proper names strictly eliminated');
assert(sanitizedC.includes('handsome') && sanitizedC.includes('beard') && sanitizedC.includes('painter'),
  'All 3 characters embodied by their respective visual physical descriptions');

// ----------------------------------------------------
// 4. Testing Storage Integration & Character Tracker Service
// ----------------------------------------------------
console.log('\n--- 4. Testing Character Tracker Service & Storage Persistence ---');
const tracker = new CharacterTracker(storage);

// Load book characters (triggers canonical pre-seed)
const bookChars = await tracker.loadBookCharacters('sample_frankenstein');
assert(bookChars.length >= 5, 'CharacterTracker loaded pre-seeded characters for Frankenstein');

// Add custom character
const customChar = {
  name: 'Professor Waldman',
  aliases: ['Professor Waldman', 'Waldman'],
  description: 'a short, dignified middle-aged scholar with a sweet-toned voice, grey-streaked dark hair, wearing a professor black academic gown',
  introducedAtPage: 3
};
await tracker.addOrUpdateCharacter('sample_frankenstein', customChar);

const reloaded = await tracker.loadBookCharacters('sample_frankenstein');
const foundWaldman = reloaded.find(c => c.name === 'Professor Waldman');
assert(foundWaldman !== undefined, 'Successfully saved and reloaded custom character');

// Test substitution using CharacterTracker instance method
const waldmanPrompt = 'Professor Waldman gave a lecture on chemistry as Victor listened attentively.';
const sanitizedWaldman = tracker.substituteNames(waldmanPrompt, 'sample_frankenstein');
assert(!sanitizedWaldman.includes('Waldman') && !sanitizedWaldman.includes('Victor'), 'Waldman and Victor eliminated using tracker.substituteNames()');
assert(sanitizedWaldman.includes('academic gown') && sanitizedWaldman.includes('scholar'), 'Physical descriptions substituted');

// ----------------------------------------------------
// 5. Testing Gemini Stage 1 Parsing of newCharacters
// ----------------------------------------------------
console.log('\n--- 5. Testing Synthesis JSON Parsing with newCharacters ---');
const geminiMockResponse = `
\`\`\`json
{
  "momentTitle": "The Galvanic Awakening",
  "selectedExcerpt": "It was on a dreary night of November that I beheld the accomplishment of my toils.",
  "momentDescription": "The scientist watches as the spark brings the creation to life.",
  "theme": "Chiaroscuro flickering candlelight with deep laboratory shadows",
  "focalRange": "50mm natural lens",
  "setting": "Ingolstadt attic workshop with glass apparatus and Leyden jars",
  "colors": "Golden candlelight and electric cyan sparks",
  "aspectRatio": "16:9",
  "imagePrompt": "A gaunt, pale young Swiss scholar in his early twenties with disheveled dark brown hair leans over an eight-foot-tall figure on a wooden slab under flickering candlelight.",
  "newCharacters": [
    {
      "name": "M. Krempe",
      "aliases": ["M. Krempe", "Krempe"],
      "description": "a squat, gruff academic man with a repulsive face, broad shoulders, piercing small eyes, and a wrinkled black coat"
    }
  ]
}
\`\`\`
`;

const parsedJson = parseSynthesisJson(geminiMockResponse);
assert(parsedJson !== null, 'Successfully parsed Gemini JSON');
assert(parsedJson.imagePrompt && !parsedJson.imagePrompt.includes('Victor'), 'imagePrompt contains physical description without character name');
assert(Array.isArray(parsedJson.newCharacters) && parsedJson.newCharacters.length === 1, 'Extracted newCharacters array from Gemini response');
assert(parsedJson.newCharacters[0].name === 'M. Krempe', 'Parsed M. Krempe as newly introduced character');

// Merge Gemini characters into tracker
await tracker.mergeGeminiCharacters('sample_frankenstein', parsedJson.newCharacters, 3);
const updatedChars = tracker.getCharactersForBook('sample_frankenstein');
assert(updatedChars.some(c => c.name === 'M. Krempe'), 'M. Krempe successfully merged into active character dossier');

// ----------------------------------------------------
// 6. Testing Fallback Synthesizer with Zero-Name Guarantee
// ----------------------------------------------------
console.log('\n--- 6. Testing fallbackSynthesize Zero-Name Guarantee ---');
const pageTextWithNames = 'Dorian Gray entered the studio. Lord Henry smiled from the divan.';
const synthResult = fallbackSynthesize({
  pageText: pageTextWithNames,
  bookTitle: 'The Picture of Dorian Gray',
  author: 'Oscar Wilde',
  styleId: 'chiaroscuro_oil',
  variationIndex: 0,
  characters: dorianChars
});

console.log('  fallbackSynthesize imagePrompt:', synthResult.imagePrompt);
assert(!synthResult.imagePrompt.includes('Dorian') && !synthResult.imagePrompt.includes('Lord Henry'),
  'fallbackSynthesize strictly eliminated proper names from imagePrompt');
assert(synthResult.imagePrompt.includes('handsome') || synthResult.imagePrompt.includes('gentleman'),
  'fallbackSynthesize included character physical descriptions');

// ----------------------------------------------------
// 7. Testing Named vs. Unnamed Character Validation
// ----------------------------------------------------
console.log('\n--- 7. Testing Named vs. Unnamed Character Validation & Alias Stopwords ---');
import { isNamedCharacter, isValidAlias, sanitizePhysicalDescription, extractProperAliases, ALIAS_STOPWORDS } from './modules/character-tracker.js';

assert(!isNamedCharacter('An older man'), 'Rejects generic "An older man"');
assert(!isNamedCharacter('The stranger'), 'Rejects generic "The stranger"');
assert(!isNamedCharacter('A middle-aged man'), 'Rejects generic "A middle-aged man"');
assert(!isNamedCharacter('a cloaked figure'), 'Rejects generic "a cloaked figure"');
assert(!isNamedCharacter('people on the street'), 'Rejects generic "people on the street"');
assert(isNamedCharacter('Mr. Vernon Dursley'), 'Accepts named "Mr. Vernon Dursley"');
assert(isNamedCharacter('Vernon Dursley'), 'Accepts named "Vernon Dursley"');
assert(isNamedCharacter('Victor Frankenstein'), 'Accepts named "Victor Frankenstein"');

// Stopword validation
assert(!isValidAlias('man'), 'Stopword "man" rejected as alias');
assert(!isValidAlias('older'), 'Stopword "older" rejected as alias');
assert(!isValidAlias('suit'), 'Stopword "suit" rejected as alias');
assert(!isValidAlias('cloak'), 'Stopword "cloak" rejected as alias');
assert(isValidAlias('Vernon'), 'Proper noun "Vernon" accepted as alias');
assert(isValidAlias('Dursley'), 'Proper noun "Dursley" accepted as alias');

// ----------------------------------------------------
// 8. Testing Action & Personality Sanitization
// ----------------------------------------------------
console.log('\n--- 8. Testing Action & Personality Sanitization ---');
const actionHeavyDesc = 'An older man past middle age standing in a huddle on a street corner, whispering excitedly and displaying an eccentric appearance highlighted by a vibrant emerald-green cloak.';
const sanitizedActionDesc = sanitizePhysicalDescription(actionHeavyDesc);
console.log('  Sanitized Action Desc:', sanitizedActionDesc);
assert(!sanitizedActionDesc.includes('standing in a huddle'), 'Removed "standing in a huddle" action');
assert(!sanitizedActionDesc.includes('whispering excitedly'), 'Removed "whispering excitedly" action');
assert(!sanitizedActionDesc.includes('on a street corner'), 'Removed "on a street corner" location');

const personalityDesc = 'of conventional and rigid bearing with a stern, easily enraged expression, dressed in a neat dark wool business suit of the late 20th century, steps out through the glass doors of a nineth-floor office building onto a grey city pavement at dusk. He wears a preoccupied expression, his hand touching his mustache in thought.';
const sanitizedPersonalityDesc = sanitizePhysicalDescription(personalityDesc);
console.log('  Sanitized Personality Desc:', sanitizedPersonalityDesc);
assert(!sanitizedPersonalityDesc.includes('easily enraged'), 'Removed "easily enraged" personality trait');
assert(!sanitizedPersonalityDesc.includes('steps out through the glass doors'), 'Removed "steps out..." action');
assert(!sanitizedPersonalityDesc.includes('his hand touching his mustache in thought'), 'Removed transitory gesture in thought');
assert(sanitizedPersonalityDesc.includes('neat dark wool business suit'), 'Preserved physical attire description');

// ----------------------------------------------------
// 9. Testing Description Appending Without Overwriting
// ----------------------------------------------------
console.log('\n--- 9. Testing Description Appending Without Overwrite in mergeCharacters ---');
const testTracker = new CharacterTracker(storage);
const testBookId = 'test_book_harry_potter';

// Initial introduction of Mr. Dursley
await testTracker.mergeCharacters(testBookId, [
  {
    name: 'Mr. Vernon Dursley',
    aliases: ['Vernon', 'Mr. Dursley'],
    description: 'a large, beefy man with hardly any neck and a very large black mustache, dressed in a dark wool business suit'
  }
], 1);

let bookDossier = testTracker.getCharactersForBook(testBookId);
const initialDursley = bookDossier.find(c => c.name.includes('Dursley'));
assert(initialDursley !== undefined, 'Initial Vernon Dursley recorded');
const initialDesc = initialDursley.description;

// Subsequent page provides NEW physical appearance info: round tortoiseshell glasses and a beige mackintosh
await testTracker.mergeCharacters(testBookId, [
  {
    name: 'Vernon Dursley',
    description: 'wearing round tortoiseshell reading glasses and a heavy beige mackintosh coat'
  }
], 2);

bookDossier = testTracker.getCharactersForBook(testBookId);
const updatedDursley = bookDossier.find(c => c.name.includes('Dursley'));
assert(updatedDursley.description.includes('mustache'), 'Original physical traits (mustache) preserved (not overwritten)');
assert(updatedDursley.description.includes('glasses') || updatedDursley.description.includes('mackintosh'), 'New physical traits appended in addition');

// Page with NO new physical info (only actions or mention)
const descBeforeNoOp = updatedDursley.description;
await testTracker.mergeCharacters(testBookId, [
  {
    name: 'Vernon Dursley',
    description: 'stepping out through the glass doors onto a pavement' // only actions!
  }
], 3);

bookDossier = testTracker.getCharactersForBook(testBookId);
const unchangedDursley = bookDossier.find(c => c.name.includes('Dursley'));
assert(unchangedDursley.description === descBeforeNoOp, 'Character description remains unchanged when page contains only actions/no new physical traits');

// ----------------------------------------------------
// 10. Prevention of User's Exact Prompt Formatting Corruption Bug
// ----------------------------------------------------
console.log('\n--- 10. Prevention of Prompt Corruption & Recursive Nesting ---');
const promptWithCommonWords = 'A middle-aged man in a dark wool suit walks past an older man on a street corner under muted late afternoon lighting.';
// Even if active characters exist with aliases, common words like "man", "older", "suit" must never be substituted
const sanitizedPromptResult = testTracker.substituteNames(promptWithCommonWords, testBookId);
console.log('  Sanitized Prompt Result:', sanitizedPromptResult);
assert(!sanitizedPromptResult.includes('An older An older man'), 'Zero recursive nesting of "An older An older man"');
assert(!sanitizedPromptResult.includes('past middle age standing in a huddle on a street corner, whispering excitedly'), 'No background character contamination into prompt');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL CHARACTER TRACKER & ZERO-NAME PROMPT TESTS PASSED! ✓');
  process.exit(0);
}

