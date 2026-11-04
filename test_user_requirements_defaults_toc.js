/**
 * Test Suite for:
 * 1. Default Art Style: Ethereal Watercolor & Gouache
 * 2. Default Aspect Ratio: 3:4
 * 3. 2-second Page Dwell Timer before prompt generation & Abort / Cancellation logic on screen/page leave
 * 4. Removal of app name and tagline from top-left corner
 * 5. Table of Contents (TOC) with chapter list & direct page jumper
 */

import { ART_STYLES, fallbackSynthesize } from './modules/prompt-architect.js';
import { GeminiHeadlessClient } from './modules/gemini-headless.js';
import { storage } from './modules/storage.js';
import fs from 'fs';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('=== TEST SUITE: DEFAULTS (3:4, WATERCOLOR), DWELL DELAY & TOC ===\n');

// 1. Default Art Style Verification
console.log('--- 1. Testing Default Art Style (Ethereal Watercolor & Gouache) ---');
assert(ART_STYLES.ethereal_watercolor !== undefined, `ART_STYLES has ethereal_watercolor`);
assert(ART_STYLES.ethereal_watercolor.name === 'Ethereal Watercolor & Gouache', `Name is 'Ethereal Watercolor & Gouache'`);

const synthDefaultStyle = fallbackSynthesize({
  pageText: 'The morning mist drifted through the ancient valley with quiet radiance.',
  bookTitle: 'Test Book',
  author: 'Author'
});
assert(synthDefaultStyle.imagePrompt.toLowerCase().includes('watercolor and gouache'), `fallbackSynthesize default style is Ethereal Watercolor & Gouache`);

// 2. Default Aspect Ratio 3:4 Verification
console.log('\n--- 2. Testing Default Aspect Ratio (3:4) ---');
assert(synthDefaultStyle.aspectRatio === '3:4', `fallbackSynthesize output aspectRatio is '3:4' (got ${synthDefaultStyle.aspectRatio})`);
assert(synthDefaultStyle.imagePrompt.includes('Aspect ratio: 3:4'), `Image prompt includes 'Aspect ratio: 3:4'`);

// 3. User Overrides Still Respected
console.log('\n--- 3. Testing Explicit Aspect Ratio Overrides ---');
const synth43 = fallbackSynthesize({
  pageText: 'The laboratory interior had brass apparatuses and stone archways.',
  bookTitle: 'Test Book',
  author: 'Author',
  aspectRatio: '4:3'
});
assert(synth43.aspectRatio === '4:3', `Custom 4:3 setting respected`);

const synth169 = fallbackSynthesize({
  pageText: 'The laboratory interior had brass apparatuses and stone archways.',
  bookTitle: 'Test Book',
  author: 'Author',
  aspectRatio: '16:9'
});
assert(synth169.aspectRatio === '16:9', `Custom 16:9 setting respected`);

// 4. GeminiHeadlessClient Abort & Defaults
console.log('\n--- 4. Testing GeminiHeadlessClient Abort & Defaults ---');
const client = new GeminiHeadlessClient();
assert(typeof client.abortActiveRequests === 'function', `client has abortActiveRequests() method`);
client.abortActiveRequests();
assert(client.userAborted === true, `abortActiveRequests() sets userAborted = true`);

// 5. Verification of Top-Left Branding Removal
console.log('\n--- 5. Testing Top-Left App Name & Tagline Removal ---');
const htmlContent = fs.readFileSync('reader.html', 'utf-8');
assert(!htmlContent.includes('<span class="crest-title">ILLUMINATED SANCTUARY</span>'), `App name 'ILLUMINATED SANCTUARY' removed from header`);
assert(!htmlContent.includes('<span class="crest-subtitle">Zero-Key Headless Gemini Reader</span>'), `Tagline removed from header`);
assert(!htmlContent.includes('class="brand-crest"'), `brand-crest element removed from header-left`);

// 6. Verification of Table of Contents in HTML & CSS
console.log('\n--- 6. Testing Table of Contents (TOC) HTML & CSS Elements ---');
assert(htmlContent.includes('id="btn-toc"'), `reader.html contains #btn-toc button`);
assert(htmlContent.includes('id="toc-modal"'), `reader.html contains #toc-modal`);
assert(htmlContent.includes('id="toc-page-input"'), `reader.html contains #toc-page-input direct page jumper`);
assert(htmlContent.includes('id="btn-toc-jump"'), `reader.html contains #btn-toc-jump`);
assert(htmlContent.includes('id="toc-chapters-list"'), `reader.html contains #toc-chapters-list`);

const cssContent = fs.readFileSync('reader.css', 'utf-8');
assert(cssContent.includes('.toc-modal'), `reader.css styles .toc-modal`);
assert(cssContent.includes('.toc-dialog'), `reader.css styles .toc-dialog`);
assert(cssContent.includes('.toc-chapter-item'), `reader.css styles .toc-chapter-item`);
assert(cssContent.includes('aspect-ratio: var(--inline-aspect-ratio, 3 / 4);'), `reader.css default canvas aspect ratio is 3 / 4`);

// 7. Verification of Reader Controller Implementation
console.log('\n--- 7. Testing Reader Controller Dwell Timer, Cancellation & TOC ---');
const readerJs = fs.readFileSync('reader.js', 'utf-8');
assert(readerJs.includes("this.artStyle = 'ethereal_watercolor';"), `reader.js defaults this.artStyle to 'ethereal_watercolor'`);
assert(readerJs.includes("this.aspectRatio = '3:4';"), `reader.js defaults this.aspectRatio to '3:4'`);
assert(readerJs.includes("this.PAGE_DWELL_DELAY_MS = 2000;"), `reader.js has 2000ms PAGE_DWELL_DELAY_MS`);
assert(readerJs.includes("this.pageDwellTimer = setTimeout"), `reader.js sets pageDwellTimer on un-cached page`);
assert(readerJs.includes("cancelPendingGenerations"), `reader.js implements cancelPendingGenerations()`);
assert(readerJs.includes("this.cancelPendingGenerations('page_turn');"), `reader.js cancels on page turn`);
assert(readerJs.includes("visibilitychange"), `reader.js listens to visibilitychange to cancel when leaving screen`);
assert(readerJs.includes("openToc()"), `reader.js implements openToc()`);
assert(readerJs.includes("closeToc()"), `reader.js implements closeToc()`);
assert(readerJs.includes("handleTocPageJump()"), `reader.js implements handleTocPageJump()`);

console.log(`\n====================================================`);
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`====================================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nALL DEFAULT STYLES, DWELL DELAY & TOC TESTS PASSED! ✓');
}

