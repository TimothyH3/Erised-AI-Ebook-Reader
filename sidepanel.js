/**
 * Chrome Side Panel Controller
 * 
 * Features:
 * - 2-Stage Gemini Pipeline:
 *   Stage 1: Prominent moment, theme & aspect ratio chosen by fastest Gemini model.
 *   Stage 2: Gemini Imagen 3 fine-art plate generation.
 * - Single Grand Plate with dynamic aspect ratio.
 * - Zero AI calls on Page 1 (Title Folio).
 * - Instant retrieval from IndexedDB cache.
 * - Sidecar companion for Kindle Cloud Reader / Gutenberg text selection.
 */

import { storage } from './modules/storage.js';
import { fallbackSynthesize } from './modules/prompt-architect.js';
import { SAMPLE_BOOKS } from './modules/sample-books.js';
import { characterTracker, containsAnyCharacterName } from './modules/character-tracker.js';

class SidePanelController {
  constructor() {
    this.currentBook = null;
    this.currentPageNumber = 1;
    this.books = [];
    this.currentPromptData = null;
    this.promptVariationIndex = 0;
    this.characterTracker = characterTracker;
    this.currentCharacters = [];
  }

  async init() {
    this.cacheDom();
    this.bindEvents();
    await this.loadBooks();
  }

  cacheDom() {
    this.btnFullscreen = document.getElementById('btn-sp-fullscreen');
    this.btnReset = document.getElementById('btn-sp-reset-session');
    this.bookSelect = document.getElementById('sp-book-select');
    this.btnPrev = document.getElementById('btn-sp-prev');
    this.btnNext = document.getElementById('btn-sp-next');
    this.lblPage = document.getElementById('lbl-sp-page');
    this.tabBtns = document.querySelectorAll('.sp-tab-btn');
    this.tabPanes = document.querySelectorAll('.sp-tab-pane');
    this.proseContainer = document.getElementById('sp-prose-container');

    // Single Plate Elements
    this.plateFrame = document.getElementById('sp-plate-frame');
    this.plateImg = document.getElementById('sp-plate-img');
    this.plateLoader = document.getElementById('sp-plate-loader');
    this.loaderText = document.getElementById('sp-loader-text');
    this.loaderSubtext = document.getElementById('sp-loader-subtext');
    this.titlePageCard = document.getElementById('sp-title-page-card');
    this.plateTag = document.getElementById('sp-plate-tag');
    this.ratioBadge = document.getElementById('sp-ratio-badge');
    this.captionMoment = document.getElementById('sp-caption-moment');
    this.captionDesc = document.getElementById('sp-caption-desc');
    this.btnRegenPrompt = document.getElementById('btn-sp-regen-prompt');
    this.btnRegenImage = document.getElementById('btn-sp-regen-image');

    // Sidecar Companion Elements
    this.btnCapture = document.getElementById('btn-capture-selection');
    this.txtSidecar = document.getElementById('txt-sidecar-passage');
    this.btnIllustrate = document.getElementById('btn-illustrate-passage');
  }

  bindEvents() {
    this.btnFullscreen.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('reader.html') });
    });

    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        this.btnReset.textContent = '↻ Resetting...';
        this.btnReset.disabled = true;
        chrome.runtime.sendMessage({ action: 'RESET_GOOGLE_SESSION' }, (res) => {
          this.btnReset.textContent = '↻ Reset AI';
          this.btnReset.disabled = false;
          if (res?.loggedIn) {
            alert('Gemini Session Reset: Re-authenticated with active Google account!');
            this.loadOrGeneratePlate(true);
          } else {
            alert(res?.message || 'Not signed in. Please log in at gemini.google.com');
          }
        });
      });
    }

    this.btnPrev.addEventListener('click', () => this.navigate(-1));
    this.btnNext.addEventListener('click', () => this.navigate(1));

    this.bookSelect.addEventListener('change', async (e) => {
      await this.selectBook(e.target.value);
    });

    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.tabBtns.forEach(b => b.classList.remove('active'));
        this.tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(`pane-${btn.dataset.tab}`);
        if (target) target.classList.add('active');
      });
    });

    this.btnCapture.addEventListener('click', () => this.captureActiveTabSelection());
    this.btnIllustrate.addEventListener('click', () => this.illustrateCustomPassage());

    if (this.btnRegenPrompt) {
      this.btnRegenPrompt.addEventListener('click', () => {
        this.promptVariationIndex++;
        this.loadOrGeneratePlate(true);
      });
    }

    if (this.btnRegenImage) {
      this.btnRegenImage.addEventListener('click', () => {
        this.reRenderCurrentPlate();
      });
    }
  }

  async loadBooks() {
    this.books = await storage.getAllBooks();
    if (this.books.length === 0) {
      for (const sample of SAMPLE_BOOKS) {
        await storage.saveBook(sample);
      }
      this.books = await storage.getAllBooks();
    }

    this.bookSelect.innerHTML = '';
    this.books.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.title;
      this.bookSelect.appendChild(opt);
    });

    const activeId = await storage.getSetting('activeBookId', this.books[0]?.id);
    await this.selectBook(activeId);
  }

  async selectBook(id) {
    const book = await storage.getBook(id);
    if (!book) return;
    this.currentBook = book;
    this.bookSelect.value = id;

    // Load character dossier
    this.currentCharacters = await this.characterTracker.loadBookCharacters(id);

    const savedPage = await storage.getSetting(`progress_${id}`, 1);
    this.currentPageNumber = Math.min(Math.max(1, savedPage), book.totalPages || 1);
    this.renderPage();
  }

  navigate(delta) {
    if (!this.currentBook) return;
    const total = this.currentBook.totalPages || this.currentBook.pages.length;
    const target = this.currentPageNumber + delta;
    if (target >= 1 && target <= total) {
      this.currentPageNumber = target;
      this.promptVariationIndex = 0;
      this.renderPage();
    }
  }

  async renderPage() {
    if (!this.currentBook) return;
    const total = this.currentBook.totalPages || this.currentBook.pages.length;
    this.lblPage.textContent = `${this.currentPageNumber} / ${total}`;

    const page = this.currentBook.pages[this.currentPageNumber - 1];
    if (page) {
      this.proseContainer.innerHTML = page.html;
    }

    if (this.currentPageNumber === 1) {
      // Page 1 Zero AI rule
      this.highlightProseExcerpt(null);
      this.plateImg.style.display = 'none';
      this.plateLoader.style.display = 'none';
      if (this.titlePageCard) this.titlePageCard.style.display = 'flex';
      this.plateTag.textContent = 'EDITION COLOPHON';
      this.ratioBadge.textContent = 'Cover';
      this.captionMoment.textContent = this.currentBook.title;
      this.captionDesc.textContent = 'Dedicated Title Folio (Zero AI Calls). Flip to Page 2 to begin real-time illustration.';
      return;
    }

    if (this.titlePageCard) this.titlePageCard.style.display = 'none';
    await this.loadOrGeneratePlate();
  }

  async loadOrGeneratePlate(force = false) {
    if (!this.currentBook || this.currentPageNumber === 1) return;

    const page = this.currentBook.pages[this.currentPageNumber - 1];
    if (!page) return;

    // Check IndexedDB local memory cache first
    let cached = !force && await storage.getCachedIllustration(this.currentBook.id, this.currentPageNumber, 'plate');
    if (!cached && !force) {
      cached = await storage.getCachedIllustration(this.currentBook.id, this.currentPageNumber, 'left');
    }

    if (cached) {
      const aspectRatio = cached.aspectRatio || '16:9';
      const ratioCss = aspectRatio.replace(':', ' / ');
      this.plateFrame.style.setProperty('--sp-plate-aspect', ratioCss);
      this.ratioBadge.textContent = aspectRatio;
      this.plateTag.textContent = (cached.momentTitle || 'ILLUMINATED SCENE').toUpperCase();
      this.captionMoment.textContent = cached.momentTitle || 'Illuminated Scene';
      const excerpt = cached.selectedExcerpt || cached.sceneSummary || cached.momentDescription || '';
      this.captionDesc.textContent = excerpt ? `“${this.truncate(excerpt, 80)}”` : (cached.theme || 'Gemini autonomous synthesis');
      this.highlightProseExcerpt(excerpt);

      this.plateImg.onload = () => {
        this.plateImg.style.display = 'block';
        this.plateLoader.style.display = 'none';
      };
      this.plateImg.src = cached.imageUrl;
      if (this.plateImg.complete && this.plateImg.naturalWidth > 0) {
        this.plateImg.style.display = 'block';
        this.plateLoader.style.display = 'none';
      }
      return;
    }

    // Step 1: Dispatches dedicated Gemini prompt to gather character descriptions on page
    this.plateImg.style.display = 'none';
    this.plateLoader.style.display = 'flex';
    this.loaderText.textContent = 'Gathering character descriptions...';
    if (this.loaderSubtext) this.loaderSubtext.textContent = 'Fastest Gemini model analyzing characters';

    chrome.runtime.sendMessage({
      action: 'GATHER_PAGE_CHARACTERS',
      payload: {
        pageText: page.text,
        bookTitle: this.currentBook.title,
        author: this.currentBook.author,
        pageNumber: this.currentPageNumber,
        existingCharacters: this.currentCharacters
      }
    }, async (charRes) => {
      try {
        if (charRes && charRes.success && Array.isArray(charRes.characters) && charRes.characters.length > 0) {
          await this.characterTracker.mergeCharacters(this.currentBook.id, charRes.characters, this.currentPageNumber);
          this.currentCharacters = this.characterTracker.getCharactersForBook(this.currentBook.id);
        }
      } catch (_) {}

      // Step 2 & 3: Run the prompt generator with saved character list
      this.loaderText.textContent = 'Stage 1: Gemini analyzing page...';
      if (this.loaderSubtext) this.loaderSubtext.textContent = 'Selecting prominent scene, theme & aspect ratio';

      const artStyle = await storage.getSetting('artStyle', 'chiaroscuro_oil');

      // Stage 1: Text Prompt Synthesis
      chrome.runtime.sendMessage({
        action: 'SYNTHESIZE_PAGE_PROMPT',
        payload: {
          pageText: page.text,
          bookTitle: this.currentBook.title,
          author: this.currentBook.author,
          styleId: artStyle,
          variationIndex: this.promptVariationIndex,
          characters: this.currentCharacters
        }
      }, async (synthRes) => {
      try {
        if (chrome.runtime.lastError) {
          console.warn('[SanctuarySidecar] sendMessage lastError:', chrome.runtime.lastError);
        }
        let synthData = synthRes?.data || (synthRes?.success && synthRes?.imagePrompt ? synthRes : null);
        if (!synthData) {
          synthData = fallbackSynthesize({
            pageText: page.text,
            bookTitle: this.currentBook.title,
            author: this.currentBook.author,
            styleId: artStyle,
            variationIndex: this.promptVariationIndex,
            characters: this.currentCharacters
          });
        }

        // Process any new characters returned from Stage 1
        if (Array.isArray(synthData.newCharacters) && synthData.newCharacters.length > 0) {
          await this.characterTracker.mergeGeminiCharacters(this.currentBook.id, synthData.newCharacters, this.currentPageNumber);
          this.currentCharacters = this.characterTracker.getCharactersForBook(this.currentBook.id);
        }

        // Strictly eliminate proper names from prompt
        if (this.currentCharacters && this.currentCharacters.length > 0 && synthData.imagePrompt) {
          if (containsAnyCharacterName(synthData.imagePrompt, this.currentCharacters)) {
            synthData.imagePrompt = this.characterTracker.substituteNames(synthData.imagePrompt, this.currentCharacters);
          }
        }

        this.currentPromptData = synthData;
        const aspectRatio = synthData.aspectRatio || '16:9';
        const ratioCss = aspectRatio.replace(':', ' / ');
        this.plateFrame.style.setProperty('--sp-plate-aspect', ratioCss);
        this.ratioBadge.textContent = aspectRatio;
        this.plateTag.textContent = (synthData.momentTitle || 'ILLUMINATED SCENE').toUpperCase();
        this.captionMoment.textContent = synthData.momentTitle || 'Prominent Scene';
        const excerpt = synthData.selectedExcerpt || synthData.momentDescription || '';
        this.captionDesc.textContent = excerpt ? `“${this.truncate(excerpt, 80)}”` : (synthData.theme || '');
        this.highlightProseExcerpt(excerpt);

        // Stage 2: Fine-Art Plate Generation
        this.loaderText.textContent = 'Stage 2: Gemini 3.8 generating plate...';
        if (this.loaderSubtext) this.loaderSubtext.textContent = `Rendering "${synthData.momentTitle.substring(0, 24)}" (${aspectRatio})`;

        chrome.runtime.sendMessage({
          action: 'GENERATE_GEMINI_IMAGE',
          payload: {
            prompt: synthData.imagePrompt,
            aspectRatio: aspectRatio,
            fullPageText: synthData.sceneSummary || '',
            bookTitle: this.currentBook.title,
            author: this.currentBook.author,
            flank: 'plate'
          }
        }, async (imgRes) => {
          if (imgRes?.success && imgRes.imageUrl) {
            await storage.cacheIllustration(this.currentBook.id, this.currentPageNumber, 'plate', {
              imageUrl: imgRes.imageUrl,
              prompt: synthData.imagePrompt,
              aspectRatio: aspectRatio,
              momentTitle: synthData.momentTitle,
              selectedExcerpt: excerpt,
              sceneSummary: synthData.sceneSummary,
              theme: synthData.theme,
              engine: 'gemini-3.8'
            });

            this.plateImg.onload = () => {
              this.plateImg.style.display = 'block';
              this.plateLoader.style.display = 'none';
            };
            this.plateImg.onerror = () => {
              console.warn('[SanctuarySidecar] Failed to load plate image');
              this.plateLoader.style.display = 'none';
            };
            this.plateImg.src = imgRes.imageUrl;
            if (this.plateImg.complete && this.plateImg.naturalWidth > 0) {
              this.plateImg.style.display = 'block';
              this.plateLoader.style.display = 'none';
            }
          } else {
            console.warn('[SanctuarySidecar] Generation returned no image:', imgRes?.message || imgRes?.error);
            this.plateLoader.style.display = 'none';
            this.captionDesc.textContent = imgRes?.message || 'Gemini did not return an image. Click Re-render or Re-craft Prompt.';
          }
        });
      } catch (err) {
        console.error('[SanctuarySidecar] Error handling synthesis:', err);
        this.plateLoader.style.display = 'none';
      }
    });
  });
}

  async reRenderCurrentPlate() {
    if (!this.currentPromptData) return;
    this.plateImg.style.display = 'none';
    this.plateLoader.style.display = 'flex';
    this.loaderText.textContent = 'Re-rendering plate...';

    chrome.runtime.sendMessage({
      action: 'GENERATE_GEMINI_IMAGE',
      payload: {
        prompt: this.currentPromptData.imagePrompt,
        aspectRatio: this.currentPromptData.aspectRatio || '16:9',
        flank: 'plate'
      }
    }, (res) => {
      if (res?.success && res.imageUrl) {
        this.plateImg.src = res.imageUrl;
        this.plateImg.style.display = 'block';
        this.plateLoader.style.display = 'none';
      } else {
        this.plateLoader.style.display = 'none';
      }
    });
  }

  async captureActiveTabSelection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString()
      });

      const text = results[0]?.result;
      if (text && text.trim().length > 0) {
        this.txtSidecar.value = text.trim();
      } else {
        alert('No text currently selected in active tab. Highlight a passage and try again!');
      }
    } catch (err) {
      alert(`Could not capture selection: ${err.message}`);
    }
  }

  async illustrateCustomPassage() {
    const text = this.txtSidecar.value.trim();
    if (!text) {
      alert('Please enter or capture a text passage to illustrate.');
      return;
    }

    // Switch to plates tab
    document.querySelector('.sp-tab-btn[data-tab="plates"]').click();

    this.plateImg.style.display = 'none';
    this.plateLoader.style.display = 'flex';
    this.loaderText.textContent = 'Stage 1: Gemini analyzing passage...';

    const artStyle = await storage.getSetting('artStyle', 'chiaroscuro_oil');

    chrome.runtime.sendMessage({
      action: 'SYNTHESIZE_PAGE_PROMPT',
      payload: {
        pageText: text,
        bookTitle: 'Web Excerpt',
        author: 'Active Tab',
        styleId: artStyle,
        variationIndex: 0
      }
    }, (synthRes) => {
      if (chrome.runtime.lastError) {
        console.warn('[SanctuarySidecar] sendMessage lastError:', chrome.runtime.lastError);
      }
      let synthData = synthRes?.data || (synthRes?.success && synthRes?.imagePrompt ? synthRes : null) || fallbackSynthesize({
        pageText: text,
        bookTitle: 'Web Excerpt',
        author: 'Active Tab',
        styleId: artStyle,
        variationIndex: 0,
        characters: this.currentCharacters
      });

      if (this.currentCharacters && this.currentCharacters.length > 0 && synthData.imagePrompt) {
        synthData.imagePrompt = this.characterTracker.substituteNames(synthData.imagePrompt, this.currentCharacters);
      }

      this.currentPromptData = synthData;
      const aspectRatio = synthData.aspectRatio || '16:9';
      const ratioCss = aspectRatio.replace(':', ' / ');
      this.plateFrame.style.setProperty('--sp-plate-aspect', ratioCss);
      this.ratioBadge.textContent = aspectRatio;
      this.plateTag.textContent = (synthData.momentTitle || 'ILLUMINATED SCENE').toUpperCase();
      this.captionMoment.textContent = synthData.momentTitle || 'Prominent Scene';
      this.captionDesc.textContent = synthData.sceneSummary || synthData.theme || '';

      this.loaderText.textContent = 'Stage 2: Gemini generating plate...';

      chrome.runtime.sendMessage({
        action: 'GENERATE_GEMINI_IMAGE',
        payload: {
          prompt: synthData.imagePrompt,
          aspectRatio: aspectRatio,
          flank: 'plate'
        }
      }, (res) => {
        if (res?.success && res.imageUrl) {
          this.plateImg.src = res.imageUrl;
          this.plateImg.style.display = 'block';
          this.plateLoader.style.display = 'none';
        } else {
          this.plateLoader.style.display = 'none';
        }
      });
    });
  }

  highlightProseExcerpt(excerptText) {
    if (!this.proseContainer) return;

    // 1. Remove existing highlights cleanly
    const existingMarks = this.proseContainer.querySelectorAll('mark.illuminated-excerpt');
    existingMarks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
        parent.normalize();
      }
    });

    this.proseContainer.querySelectorAll('.paragraph-highlighted-excerpt').forEach(p => {
      p.classList.remove('paragraph-highlighted-excerpt');
    });

    if (!excerptText || typeof excerptText !== 'string' || !excerptText.trim()) return;

    const clean = excerptText.trim();
    const normClean = clean.replace(/\s+/g, ' ');

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const paragraphs = Array.from(this.proseContainer.querySelectorAll('.prose-body p, p'));

    for (const p of paragraphs) {
      const pInner = p.innerHTML;

      // Case 1: Direct regex search within p.innerHTML
      const directRegex = new RegExp(escapeRegex(normClean).replace(/\\s\+/g, '\\s+'), 'i');
      if (directRegex.test(pInner)) {
        p.innerHTML = pInner.replace(directRegex, (match) => `<mark class="illuminated-excerpt" title="Passage illustrated in current art plate">${match}</mark>`);
        break;
      }

      // Case 2: Drop cap match
      const dropCapMatch = pInner.match(/^(\s*<span class="drop-cap">([A-Za-z])<\/span>)([a-zA-Z\s\S]*)/i);
      if (dropCapMatch) {
        const dropLetter = dropCapMatch[2];
        if (clean.toLowerCase().startsWith(dropLetter.toLowerCase())) {
          const restOfExcerpt = clean.slice(dropLetter.length).trim();
          const restRegex = new RegExp('^(' + escapeRegex(restOfExcerpt).replace(/\\s\+/g, '\\s+') + ')', 'i');
          const restHtml = dropCapMatch[3];
          if (restRegex.test(restHtml.trimStart())) {
            const replaced = restHtml.replace(restRegex, (m) => `<mark class="illuminated-excerpt" title="Passage illustrated in current art plate">${m}</mark>`);
            p.innerHTML = `${dropCapMatch[1]}${replaced}`;
            break;
          }
        }
      }

      // Case 3: Sub-phrase matching
      const words = clean.split(/\s+/).filter(w => w.length > 2);
      if (words.length >= 4) {
        const subPhrase = words.slice(0, Math.min(words.length, 6)).join(' ');
        const subRegex = new RegExp(escapeRegex(subPhrase).replace(/\\s\+/g, '\\s+'), 'i');
        if (subRegex.test(pInner)) {
          p.innerHTML = pInner.replace(subRegex, (match) => `<mark class="illuminated-excerpt" title="Passage illustrated in current art plate">${match}</mark>`);
          break;
        }
      }

      // Case 4: Full paragraph match
      const pNorm = p.textContent.replace(/\s+/g, ' ').toLowerCase();
      const excerptNorm = clean.replace(/\s+/g, ' ').toLowerCase();
      if (pNorm.length > 40 && (pNorm.includes(excerptNorm.slice(0, 40)) || excerptNorm.includes(pNorm.slice(0, 40)))) {
        p.classList.add('paragraph-highlighted-excerpt');
        break;
      }
    }
  }

  truncate(str, max = 32) {
    if (!str) return '';
    return str.length <= max ? str : str.slice(0, max) + '...';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const panel = new SidePanelController();
  panel.init();
});
