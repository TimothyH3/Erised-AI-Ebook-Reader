/**
 * Test Suite: Erised AI Rebranding, Cinzel Bold Typography, Dedicated Full-Page Focus,
 * Import/Remove Book Actions, and New Preloaded Masterpieces.
 */

import fs from 'fs';
import path from 'path';
import { SAMPLE_BOOKS } from './modules/sample-books.js';
import { PRESEEDED_CHARACTERS } from './modules/character-tracker.js';
import { storage } from './modules/storage.js';

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

console.log('=== TEST SUITE: ERISED AI REBRAND & USER REQUIREMENTS ===\n');

// 1. Manifest V3 Rebrand & Sidebar Removal
console.log('--- 1. Testing manifest.json Rebrand & Sidebar Removal ---');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
assert(manifest.name === 'Erised AI', `manifest.json name is 'Erised AI'`);
assert(manifest.icons['16'] === 'icons/Light_Logo.png', `manifest.json 16px icon points to 'icons/Light_Logo.png'`);
assert(manifest.icons['128'] === 'icons/Light_Logo.png', `manifest.json 128px icon points to 'icons/Light_Logo.png'`);
assert(manifest.action.default_title === 'Erised AI', `manifest.json action title is 'Erised AI'`);
assert(!manifest.side_panel, `manifest.json completely removed side_panel configuration`);
assert(!manifest.permissions.includes('sidePanel'), `manifest.json permissions omit 'sidePanel'`);

// 2. Cinzel Bold Typography
console.log('\n--- 2. Testing Cinzel Bold Title Font in reader.css ---');
const readerCss = fs.readFileSync('reader.css', 'utf-8');
assert(readerCss.includes("family=Cinzel:wght@600;700;800;900") || readerCss.includes("family=Cinzel:wght@700"), `reader.css imports Cinzel Google Font`);
assert(readerCss.includes("--font-title: 'Cinzel'"), `reader.css defines --font-title with Cinzel`);
assert(readerCss.includes("font-family: var(--font-title);"), `reader.css applies --font-title across title elements`);
assert(readerCss.includes(".erised-brand-title"), `reader.css styles .erised-brand-title`);

// 3. Logo & Favicon Integration
console.log('\n--- 3. Testing Logo & Favicon Integration ---');
const readerHtml = fs.readFileSync('reader.html', 'utf-8');
assert(readerHtml.includes('href="icons/Light_Logo.png"'), `reader.html includes favicon linking to 'icons/Light_Logo.png'`);
assert(readerHtml.includes('class="erised-brand"'), `reader.html contains .erised-brand container`);
assert(readerHtml.includes('class="erised-logo-img"'), `reader.html contains .erised-logo-img element`);
assert(readerHtml.includes('Erised AI'), `reader.html contains 'Erised AI' branding title`);
assert(readerCss.includes("Dark_Logo_BG.jpg"), `reader.css configures Dark_Logo_BG.jpg for dark theme`);
assert(readerCss.includes("Light_Logo.png"), `reader.css configures Light_Logo.png for light themes`);

// 4. Sidebar Removal in Background & Popup
console.log('\n--- 4. Testing Sidebar Function Removal in background.js & popup ---');
const bgJs = fs.readFileSync('background.js', 'utf-8');
assert(!bgJs.includes('chrome.sidePanel'), `background.js has zero chrome.sidePanel API invocations`);
assert(!bgJs.includes('case \'OPEN_SIDEPANEL\':'), `background.js has removed OPEN_SIDEPANEL message action`);

const popupHtml = fs.readFileSync('popup.html', 'utf-8');
assert(!popupHtml.includes('btn-open-sidepanel'), `popup.html has removed dock-in-sidepanel button`);
assert(popupHtml.includes('Erised AI'), `popup.html branded as Erised AI`);

const popupJs = fs.readFileSync('popup.js', 'utf-8');
assert(!popupJs.includes('btnSidepanel'), `popup.js has removed btnSidepanel listener`);

// 5. Import Book & Remove Book Options
console.log('\n--- 5. Testing Import Book & Remove Book Options ---');
assert(readerHtml.includes('Import Book'), `reader.html contains 'Import Book' label`);
assert(!readerHtml.includes('Ingest Book'), `reader.html replaced 'Ingest Book'`);
assert(readerHtml.includes('id="btn-remove-book"'), `reader.html contains #btn-remove-book button`);

const readerJs = fs.readFileSync('reader.js', 'utf-8');
assert(readerJs.includes('removeCurrentBook()'), `reader.js implements removeCurrentBook()`);
assert(readerJs.includes('this.btnRemoveBook = document.getElementById(\'btn-remove-book\');'), `reader.js caches btn-remove-book`);

// 6. Preloaded Books: Harry Potter, Magician's Nephew, The Hobbit
console.log('\n--- 6. Testing Default Preloaded Literary Masterpieces ---');
const bookIds = SAMPLE_BOOKS.map(b => b.id);
assert(bookIds.includes('sample_harry_potter'), `SAMPLE_BOOKS contains 'sample_harry_potter'`);
assert(bookIds.includes('sample_magicians_nephew'), `SAMPLE_BOOKS contains 'sample_magicians_nephew'`);
assert(bookIds.includes('sample_hobbit'), `SAMPLE_BOOKS contains 'sample_hobbit'`);

const hp = SAMPLE_BOOKS.find(b => b.id === 'sample_harry_potter');
assert(hp && hp.title.includes("Harry Potter and the Philosopher's Stone"), `Harry Potter title verified`);
assert(hp && hp.pages.some(p => p.chapterTitle.includes('The Mirror of Erised')), `Harry Potter contains iconic Chapter XII: The Mirror of Erised`);

const mn = SAMPLE_BOOKS.find(b => b.id === 'sample_magicians_nephew');
assert(mn && mn.title.includes("The Magician's Nephew"), `The Magician's Nephew title verified`);
assert(mn && mn.pages.some(p => p.chapterTitle.includes('The Wood between the Worlds')), `The Magician's Nephew contains The Wood between the Worlds`);

const hobbit = SAMPLE_BOOKS.find(b => b.id === 'sample_hobbit');
assert(hobbit && hobbit.title.includes('The Hobbit'), `The Hobbit title verified`);
assert(hobbit && hobbit.pages.some(p => p.chapterTitle.includes('Riddles in the Dark')), `The Hobbit contains Riddles in the Dark`);

// 7. Character Dossiers for New Books
console.log('\n--- 7. Testing Character Tracker Dossiers for New Books ---');
assert(Array.isArray(PRESEEDED_CHARACTERS.sample_harry_potter), `PRESEEDED_CHARACTERS has sample_harry_potter`);
assert(PRESEEDED_CHARACTERS.sample_harry_potter.some(c => c.name === 'Harry Potter'), `Character dossier contains Harry Potter`);
assert(PRESEEDED_CHARACTERS.sample_harry_potter.some(c => c.name === 'Albus Dumbledore'), `Character dossier contains Albus Dumbledore`);

assert(Array.isArray(PRESEEDED_CHARACTERS.sample_magicians_nephew), `PRESEEDED_CHARACTERS has sample_magicians_nephew`);
assert(PRESEEDED_CHARACTERS.sample_magicians_nephew.some(c => c.name === 'Aslan'), `Character dossier contains Aslan`);

assert(Array.isArray(PRESEEDED_CHARACTERS.sample_hobbit), `PRESEEDED_CHARACTERS has sample_hobbit`);
assert(PRESEEDED_CHARACTERS.sample_hobbit.some(c => c.name === 'Bilbo Baggins'), `Character dossier contains Bilbo Baggins`);
assert(PRESEEDED_CHARACTERS.sample_hobbit.some(c => c.name === 'Gandalf'), `Character dossier contains Gandalf`);

console.log(`\n====================================================`);
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`====================================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nALL ERISED AI REBRAND & USER REQUIREMENT TESTS PASSED! ✓');
}

