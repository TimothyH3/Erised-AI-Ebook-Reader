/**
 * Unit Test Suite: Verifying Image Rendering Fixes & Black Screen Elimination
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GeminiHeadlessClient } from '../../src/ai/gemini-headless.js';
import { cleanAspectRatio, ART_STYLES } from '../../src/ai/prompt-architect.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== TEST SUITE: IMAGE RENDERING FIXES & ERROR RECOVERY CARDS ===\n');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
  }
}

// ---------------------------------------------------------
// 1. GeminiHeadlessClient userAborted Flag Resets
// ---------------------------------------------------------
console.log('--- 1. Testing userAborted Flag Reset On New Requests ---');

const client = new GeminiHeadlessClient();

it('abortActiveRequests() sets userAborted to true', () => {
  client.abortActiveRequests();
  assert.strictEqual(client.userAborted, true);
});

it('synthesizePagePrompt resets userAborted to false', async () => {
  client.userAborted = true;
  await client.synthesizePagePrompt({ pageText: 'Short text for unit testing purposes.' });
  assert.strictEqual(client.userAborted, false);
});

it('gatherCharacterDescriptions resets userAborted to false', async () => {
  client.userAborted = true;
  await client.gatherCharacterDescriptions({ pageText: 'Short text for unit testing purposes.' });
  assert.strictEqual(client.userAborted, false);
});

it('generateImage resets userAborted to false', async () => {
  client.userAborted = true;
  await client.generateImage({ prompt: 'Test prompt' });
  assert.strictEqual(client.userAborted, false);
});

// ---------------------------------------------------------
// 2. Direct Imperative Command (No "with Gemini 3.8" intent confusion)
// ---------------------------------------------------------
console.log('\n--- 2. Testing Direct Imperative Intent Phrasing & Style Preservation ---');

const headlessPath = fs.existsSync(path.join(__dirname, '..', '..', 'src', 'ai', 'gemini-headless.js'))
  ? path.join(__dirname, '..', '..', 'src', 'ai', 'gemini-headless.js')
  : path.join(__dirname, '..', '..', 'modules', 'gemini-headless.js');
const headlessSource = fs.readFileSync(headlessPath, 'utf8');

it('modules/gemini-headless.js does not contain "with Gemini 3.8" in prompt dispatch', () => {
  assert.strictEqual(headlessSource.includes('with Gemini 3.8:'), false);
  assert.strictEqual(headlessSource.includes('using Gemini 3.8:'), false);
});

it('modules/gemini-headless.js uses standard Imagen 3 intent phrasing "Generate an image: "', () => {
  assert.strictEqual(headlessSource.includes('Generate an image: ${coreScene}'), true);
  assert.strictEqual(headlessSource.includes('Aspect ratio ${aspectRatio}.'), true);
});

// ---------------------------------------------------------
// 3. Bleeding Regex in Watercolor Style
// ---------------------------------------------------------
console.log('\n--- 3. Testing Safety Sanitization of Watercolor Bleeding Washes ---');

it('preserves "soft poetic color bleeding" in watercolor prompts', () => {
  const watercolorPrompt = 'Master ethereal watercolor and gouache on heavy cold-press cotton paper, soft poetic color bleeding, fluid wet-on-wet washes, luminous natural highlights.';
  const sanitized = client.sanitizePromptForImageSafety(watercolorPrompt);
  assert.strictEqual(sanitized.includes('soft poetic color bleeding'), true);
  assert.strictEqual(sanitized.includes('soft poetic color deep crimson pigment'), false);
});

it('preserves "bleeding washes"', () => {
  const prompt = 'Fluid pigments with bleeding washes on textured cold-press paper.';
  const sanitized = client.sanitizePromptForImageSafety(prompt);
  assert.strictEqual(sanitized.includes('bleeding washes'), true);
});

it('sanitizes genuine violent or gore terms', () => {
  const gorePrompt = 'The wounded man had a bleeding chest wound and bloody bandages.';
  const sanitized = client.sanitizePromptForImageSafety(gorePrompt);
  assert.strictEqual(sanitized.includes('deep crimson pigment'), true);
  assert.strictEqual(sanitized.includes('bloody bandages'), false);
});

// ---------------------------------------------------------
// 4. Default Aspect Ratio Normalization
// ---------------------------------------------------------
console.log('\n--- 4. Testing Default Aspect Ratio Normalization ---');

it('cleanAspectRatio defaults to 3:4 when empty or unspecified', () => {
  assert.strictEqual(cleanAspectRatio(''), '3:4');
  assert.strictEqual(cleanAspectRatio(null), '3:4');
  assert.strictEqual(cleanAspectRatio(undefined), '3:4');
});

it('cleanAspectRatio preserves explicit user selections (16:9, 4:3, 1:1, 3:4)', () => {
  assert.strictEqual(cleanAspectRatio('16:9'), '16:9');
  assert.strictEqual(cleanAspectRatio('4:3'), '4:3');
  assert.strictEqual(cleanAspectRatio('1:1'), '1:1');
  assert.strictEqual(cleanAspectRatio('3:4'), '3:4');
});

// ---------------------------------------------------------
// 5. Reader.js Error Card & Image Load Handling
// ---------------------------------------------------------
console.log('\n--- 5. Testing Reader Controller Error Handling & Plate Mounting ---');

const readerPath = fs.existsSync(path.join(__dirname, '..', '..', 'src', 'ui', 'reader.js'))
  ? path.join(__dirname, '..', '..', 'src', 'ui', 'reader.js')
  : path.join(__dirname, '..', '..', 'reader.js');
const readerSource = fs.readFileSync(readerPath, 'utf8');

it('reader.js implements showInlinePlateError() method', () => {
  assert.strictEqual(readerSource.includes('showInlinePlateError(flank, errorInfo = {})'), true);
});

it('reader.js adds error event listener to imgEl to prevent black screen', () => {
  assert.strictEqual(readerSource.includes("imgEl.addEventListener('error'"), true);
});

it('reader.js adds load event listener to imgEl to reveal image and clean loader', () => {
  assert.strictEqual(readerSource.includes("imgEl.addEventListener('load'"), true);
});

it('reader.js renders .inline-plate-error-card on generation failure instead of empty black box', () => {
  assert.strictEqual(readerSource.includes("this.showInlinePlateError(flank, {"), true);
  assert.strictEqual(readerSource.includes("card.className = 'inline-plate-error-card'"), true);
});

it('reader.js provides Google sign-in action when user is not logged in', () => {
  assert.strictEqual(readerSource.includes('btn-inline-signin'), true);
  assert.strictEqual(readerSource.includes('gemini.google.com'), true);
});

it('reader.js provides retry button on error card that triggers reRenderInlinePlate', () => {
  assert.strictEqual(readerSource.includes('btn-inline-retry'), true);
  assert.strictEqual(readerSource.includes('this.reRenderInlinePlate(flank)'), true);
});

it('reader.js provides Inspect Prompt button on error card to open AI Studio', () => {
  assert.strictEqual(readerSource.includes('btn-inline-inspect'), true);
  assert.strictEqual(readerSource.includes('this.inspectPrompt()'), true);
});

it('modules/gemini-headless.js sends clean null conversation turn rather than empty strings in reqPayload', () => {
  assert.strictEqual(headlessSource.includes("['', '', '']"), false);
});

it('modules/gemini-headless.js extractGeminiText captures short refusal messages under 30 characters', () => {
  const shortRefusalStream = `)]}'\n128\n[["wrb.fr",null,"[[\\"c_123\\"],[\\"I cannot generate that image.\\"]]"],null]`;
  const text = client.extractGeminiText(shortRefusalStream);
  assert.strictEqual(text, 'I cannot generate that image.');
});

// ---------------------------------------------------------
// 6. Reader.css Styling For Error Cards
// ---------------------------------------------------------
console.log('\n--- 6. Testing Reader CSS Error Card Styles ---');

const cssPath = fs.existsSync(path.join(__dirname, '..', '..', 'src', 'ui', 'reader.css'))
  ? path.join(__dirname, '..', '..', 'src', 'ui', 'reader.css')
  : path.join(__dirname, '..', '..', 'reader.css');
const cssSource = fs.readFileSync(cssPath, 'utf8');

it('reader.css defines .inline-plate-error-card', () => {
  assert.strictEqual(cssSource.includes('.inline-plate-error-card'), true);
});

it('reader.css defines .inline-error-icon', () => {
  assert.strictEqual(cssSource.includes('.inline-error-icon'), true);
});

it('reader.css defines .inline-error-title', () => {
  assert.strictEqual(cssSource.includes('.inline-error-title'), true);
});

it('reader.css defines .inline-error-msg', () => {
  assert.strictEqual(cssSource.includes('.inline-error-msg'), true);
});

it('reader.css defines .btn-inline-retry', () => {
  assert.strictEqual(cssSource.includes('.btn-inline-retry'), true);
});

it('reader.css defines .btn-inline-signin', () => {
  assert.strictEqual(cssSource.includes('.btn-inline-signin'), true);
});

// ---------------------------------------------------------
// 7. Timeout, 3:4 Book Plate Framing & Dwell Resilience
// ---------------------------------------------------------
console.log('\n--- 7. Testing Timeout, 3:4 Framing & Dwell Resilience ---');

const architectPath = fs.existsSync(path.join(__dirname, '..', '..', 'src', 'ai', 'prompt-architect.js'))
  ? path.join(__dirname, '..', '..', 'src', 'ai', 'prompt-architect.js')
  : path.join(__dirname, '..', '..', 'modules', 'prompt-architect.js');
const architectSource = fs.readFileSync(architectPath, 'utf8');

it('modules/gemini-headless.js uses 55000ms timeout for image generation instead of 25000ms', () => {
  assert.strictEqual(headlessSource.includes('55000'), true);
});

it('modules/prompt-architect.js 3:4 framing uses book plate composition rather than 85mm portrait', () => {
  assert.strictEqual(architectSource.includes('Classic fine-art book plate framing with natural depth of field'), true);
  assert.strictEqual(architectSource.includes('Atmospheric literary environment and period setting'), true);
});

it('modules/gemini-headless.js preserves environment and atmosphere in coreScene', () => {
  assert.strictEqual(headlessSource.includes('.replace(/(?:Atmospheric lighting:?\\s*[^.]+[\\.:]?\\s*)+/gi, \'\')'), false);
  assert.strictEqual(headlessSource.includes('.replace(/(?:Grounded literary scene set in\\s*[^.]+[\\.:]?\\s*)+/gi, \'\')'), false);
});

it('reader.js visibilitychange handles tab hiding without aborting in-flight image generation', () => {
  assert.strictEqual(readerSource.includes("if (this.pageDwellTimer) {"), true);
  assert.strictEqual(readerSource.includes("this.cancelPendingGenerations('tab_hidden');"), false);
});

it('reader.js reRenderInlinePlate recovers from un-cached plates by re-synthesizing for the flank', () => {
  assert.strictEqual(readerSource.includes('this.synthesizeAndGenerate(pageData.text, { targetFlank: flank })'), true);
});

// ---------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------
console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('====================================================\n');

if (passedTests === totalTests) {
  console.log('ALL IMAGE RENDERING & ERROR RECOVERY TESTS PASSED! ✓\n');
  process.exit(0);
} else {
  console.error('SOME TESTS FAILED! ✗\n');
  process.exit(1);
}

