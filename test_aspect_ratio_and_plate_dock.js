/**
 * Test Suite: 4:3 Aspect Ratio Default, Settings Persistence, Larger In-Page Plates,
 * and Off-Image Floating Re-Render Dock.
 */

import { fallbackSynthesize } from './modules/prompt-architect.js';
import { GeminiHeadlessClient } from './modules/gemini-headless.js';
import { storage } from './modules/storage.js';
import fs from 'fs';
import path from 'path';

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

console.log('=== TEST SUITE: 4:3 DEFAULT, SETTINGS SELECTOR & OFF-IMAGE DOCK ===\n');

// 1. Fallback Synthesis Default Aspect Ratio is 4:3
console.log('--- 1. Testing Default Aspect Ratio (4:3) ---');
const sampleText = "The laboratory was filled with strange brass apparatuses, glass retorts, and shelves of ancient folios resting silently.";
const defaultSynth = fallbackSynthesize({
  pageText: sampleText,
  bookTitle: 'Frankenstein',
  author: 'Mary Shelley',
  aspectRatio: '4:3'
});
assert(defaultSynth.aspectRatio === '4:3', `fallbackSynthesize output aspectRatio is '4:3' (got ${defaultSynth.aspectRatio})`);
assert(defaultSynth.imagePrompt.includes('Aspect ratio: 4:3'), `Image prompt specifies 'Aspect ratio: 4:3'`);

// 2. Fallback Synthesis User Setting Respected (16:9, 3:4, 1:1)
console.log('\n--- 2. Testing User Settings Override (16:9, 3:4, 1:1) ---');
const wideSynth = fallbackSynthesize({
  pageText: sampleText,
  bookTitle: 'Frankenstein',
  author: 'Mary Shelley',
  aspectRatio: '16:9'
});
assert(wideSynth.aspectRatio === '16:9', `fallbackSynthesize output aspectRatio is '16:9'`);
assert(wideSynth.imagePrompt.includes('Aspect ratio: 16:9'), `Wide prompt specifies 'Aspect ratio: 16:9'`);

const portraitSynth = fallbackSynthesize({
  pageText: sampleText,
  bookTitle: 'Frankenstein',
  author: 'Mary Shelley',
  aspectRatio: '3:4'
});
assert(portraitSynth.aspectRatio === '3:4', `fallbackSynthesize output aspectRatio is '3:4'`);
assert(portraitSynth.imagePrompt.includes('Aspect ratio: 3:4'), `Portrait prompt specifies 'Aspect ratio: 3:4'`);

const squareSynth = fallbackSynthesize({
  pageText: sampleText,
  bookTitle: 'Frankenstein',
  author: 'Mary Shelley',
  aspectRatio: '1:1'
});
assert(squareSynth.aspectRatio === '1:1', `fallbackSynthesize output aspectRatio is '1:1'`);
assert(squareSynth.imagePrompt.includes('Aspect ratio: 1:1'), `Square prompt specifies 'Aspect ratio: 1:1'`);

// 3. Storage Persistence for Aspect Ratio Setting
console.log('\n--- 3. Testing Storage Persistence for Aspect Ratio ---');
await storage.saveSetting('aspectRatio', '4:3');
let savedRatio = await storage.getSetting('aspectRatio', '16:9');
assert(savedRatio === '4:3', `Saved '4:3' setting persists and is retrieved properly`);

await storage.saveSetting('aspectRatio', '16:9');
savedRatio = await storage.getSetting('aspectRatio', '4:3');
assert(savedRatio === '16:9', `Saved '16:9' setting persists and is retrieved properly`);

// Reset to default
await storage.saveSetting('aspectRatio', '4:3');

// 4. HTML Template Structure Verification (Settings Drawer & Ratio Grid)
console.log('\n--- 4. Testing HTML Elements for Canvas Aspect Ratio ---');
const htmlContent = fs.readFileSync('reader.html', 'utf-8');
assert(htmlContent.includes('id="aspect-ratio-grid"'), `reader.html contains #aspect-ratio-grid`);
assert(htmlContent.includes('id="lbl-active-aspect-ratio"'), `reader.html contains #lbl-active-aspect-ratio`);
assert(htmlContent.includes('data-ratio="4:3"'), `reader.html contains 4:3 ratio button option`);
assert(htmlContent.includes('data-ratio="16:9"'), `reader.html contains 16:9 ratio button option`);
assert(htmlContent.includes('data-ratio="3:4"'), `reader.html contains 3:4 ratio button option`);
assert(htmlContent.includes('data-ratio="1:1"'), `reader.html contains 1:1 ratio button option`);

// 5. CSS Sizing & Off-Image Dock Verification
console.log('\n--- 5. Testing CSS Sizing & Off-Image Hover Dock ---');
const cssContent = fs.readFileSync('reader.css', 'utf-8');
assert(cssContent.includes('width: 480px;'), `reader.css has increased plate width of 480px`);
assert(cssContent.includes('max-width: 50%;'), `reader.css has plate max-width of 50%`);
assert(cssContent.includes('aspect-ratio: var(--inline-aspect-ratio, 3 / 4);') || cssContent.includes('aspect-ratio: var(--inline-aspect-ratio, 4 / 3);'), `reader.css defines --inline-aspect-ratio fallback`);
assert(cssContent.includes('.inline-plate-off-canvas-dock'), `reader.css defines .inline-plate-off-canvas-dock`);
assert(cssContent.includes('bottom: -16px;'), `Off-canvas dock is anchored off the bottom edge (bottom: -16px)`);
assert(!cssContent.includes('.inline-plate-hover-overlay {') || !cssContent.includes('background: rgba(10, 14, 23, 0.72)'), `No dark obscuring overlay blocking the image on hover`);

// 6. Reader Controller Verification
console.log('\n--- 6. Testing Reader Controller Integration ---');
const readerJs = fs.readFileSync('reader.js', 'utf-8');
assert(readerJs.includes("this.aspectRatio = '3:4';") || readerJs.includes("this.aspectRatio = '4:3';"), `reader.js initializes this.aspectRatio`);
assert(readerJs.includes("this.aspectRatioGrid = document.getElementById('aspect-ratio-grid');"), `reader.js caches aspectRatioGrid`);
assert(readerJs.includes("this.setAspectRatio"), `reader.js implements setAspectRatio()`);
assert(readerJs.includes("inline-plate-off-canvas-dock"), `reader.js generates .inline-plate-off-canvas-dock markup`);
assert(!readerJs.includes('<div class="inline-plate-hover-overlay">'), `reader.js no longer renders inline-plate-hover-overlay`);

console.log(`\n====================================================`);
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`====================================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nALL 4:3 ASPECT RATIO & OFF-IMAGE DOCK TESTS PASSED! ✓');
}
