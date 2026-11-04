/**
 * Illuminated Sanctuary - Reader View Controller
 * 
 * Features:
 * - 2-Stage Gemini Pipeline:
 *   Stage 1: Fastest Gemini model analyzes full page text to extract a prominent moment,
 *            theme, atmosphere, focal range, and fitting aspect ratio.
 *   Stage 2: Prompts are fed into Gemini Imagen 3 for high-resolution plate creation.
 * - Single Grand Plate: Big, prominent, dynamic aspect ratio (16:9, 3:4, 4:3, 1:1, etc.).
 * - Zero developer API keys & zero per-token costs (headless Google session).
 * - Zero AI calls on Page 1 (Dedicated Title Page).
 * - Zero-latency IndexedDB local memory caching.
 * - Public Flux.1 fallback with 45s reactive rate limiter.
 */

import { storage } from './modules/storage.js';
import { SAMPLE_BOOKS } from './modules/sample-books.js';
import { ART_STYLES, fallbackSynthesize } from './modules/prompt-architect.js';
import { EpubParser } from './modules/epub-parser.js';
import { PdfParser } from './modules/pdf-parser.js';
import { characterTracker, containsAnyCharacterName, getCharacterDescriptionForPage, getActiveEraForPage } from './modules/character-tracker.js';

class SanctuaryReader {
  constructor() {
    this.currentBook = null;
    this.currentPageNumber = 1;
    this.booksList = [];

    // Character Tracker & Visual Dossiers
    this.characterTracker = characterTracker;
    this.currentCharacters = [];
    this.editingCharId = null;

    // User Preferences
    this.theme = 'obsidian';
    this.fontSize = 18;
    this.artStyle = 'ethereal_watercolor';
    this.engine = 'gemini';
    this.aspectRatio = '3:4';
    this.studioOpen = false;

    // Active Prompt & Synthesis State
    this.currentPromptData = null; // { momentTitle, sceneSummary, theme, focalRange, aspectRatio, imagePrompt, negativePrompt }
    this.promptVariationIndex = 0;
    this.isSynthesizing = false;

    // Dwell Timer & Page Skipping Safeguards (2-second dwell before prompt synthesis)
    this.pageDwellTimer = null;
    this.PAGE_DWELL_DELAY_MS = 2000;
    this.generationSessionToken = 0;

    // Dual-Flank In-Page Illustrations & User Selection
    this.activePageIllustrations = new Map(); // flank ('right' | 'left') -> illustration record
    this.currentLightboxIllustration = null;
    this.MAX_EXCERPT_CHARS = 400;
  }

  async init() {
    this.cacheDomElements();
    this.bindEvents();
    this.setupArtStyleGrid();

    // 1. Initialize Sample Books in Local Storage if empty
    await this.ensureInitialBooks();

    // 2. Load Preferences
    await this.loadPreferences();

    // 3. Verify Headless Google Session
    await this.verifyGoogleSession();

    // 4. Load Active Book & Page
    await this.loadActiveBook();

    // 5. Update Cache Stats
    this.updateCacheStats();
  }

  cacheDomElements() {
    // Header & Navigation
    this.bookSelect = document.getElementById('book-select');
    this.btnRemoveBook = document.getElementById('btn-remove-book');
    this.fileUploader = document.getElementById('file-uploader');
    this.btnPrev = document.getElementById('btn-prev-page');
    this.btnNext = document.getElementById('btn-next-page');
    this.lblPageCurrent = document.getElementById('lbl-page-current');
    this.lblPageTotal = document.getElementById('lbl-page-total');
    this.progressFill = document.getElementById('reading-progress-fill');
    this.btnFontDec = document.getElementById('btn-font-decrease');
    this.btnFontInc = document.getElementById('btn-font-increase');
    this.lblFontSize = document.getElementById('lbl-font-size');
    this.themeBtns = document.querySelectorAll('.theme-btn');
    this.btnToggleStudio = document.getElementById('btn-toggle-studio');
    this.btnFloatingStudio = document.getElementById('btn-floating-studio');

    // Google Login Banner
    this.googleBanner = document.getElementById('google-login-banner');
    this.btnDismissBanner = document.getElementById('btn-dismiss-banner');
    this.btnBannerRecheck = document.getElementById('btn-banner-recheck');

    // Sanctuary Stage & Prose
    this.sanctuaryStage = document.getElementById('sanctuary-stage');
    this.proseContentArea = document.getElementById('prose-content-area');

    // AI Studio Drawer
    this.studioDrawer = document.getElementById('ai-studio-drawer');
    this.btnCloseStudio = document.getElementById('btn-close-studio');
    this.lblPromptPageBadge = document.getElementById('lbl-prompt-page-badge');
    this.engineGemini = document.getElementById('engine-gemini');
    this.studioSessionStatus = document.getElementById('studio-session-status');
    this.studioSessionText = document.getElementById('studio-session-text');
    this.btnResetSession = document.getElementById('btn-reset-session');
    this.lblActiveStyle = document.getElementById('lbl-active-style');
    this.styleCardsGrid = document.getElementById('style-cards-grid');
    this.aspectRatioGrid = document.getElementById('aspect-ratio-grid');
    this.lblActiveAspectRatio = document.getElementById('lbl-active-aspect-ratio');
    this.aspectRatioBtns = document.querySelectorAll('.ratio-btn');
    this.studioMomentTitle = document.getElementById('studio-moment-title');
    this.studioMomentRatio = document.getElementById('studio-moment-ratio');
    this.studioMomentDesc = document.getElementById('studio-moment-desc');
    this.studioMomentExcerpt = document.getElementById('studio-moment-excerpt');
    this.studioMomentOptics = document.getElementById('studio-moment-optics');
    this.studioMomentTheme = document.getElementById('studio-moment-theme');
    this.txtPromptPlate = document.getElementById('txt-prompt-plate');
    this.btnStudioRegenPrompt = document.getElementById('btn-studio-regen-prompt');
    this.btnStudioGenerate = document.getElementById('btn-studio-generate');
    this.btnCopyPrompt = document.getElementById('btn-copy-prompt');
    this.txtPromptNegative = document.getElementById('txt-prompt-negative');
    this.statCachedCount = document.getElementById('stat-cached-count');
    this.statLatency = document.getElementById('stat-latency');
    this.btnClearCache = document.getElementById('btn-clear-cache');

    // Character Codex Elements
    this.characterCardsList = document.getElementById('character-cards-list');
    this.lblCharacterCount = document.getElementById('lbl-character-count');
    this.btnAddCharacterToggle = document.getElementById('btn-add-character-toggle');
    this.btnScanCharacters = document.getElementById('btn-scan-characters');
    this.btnExportTxt = document.getElementById('btn-export-txt');
    this.characterScanStatus = document.getElementById('character-scan-status');
    this.characterEditForm = document.getElementById('character-edit-form');
    this.charFormTitle = document.getElementById('char-form-title');
    this.inputCharId = document.getElementById('input-char-id');
    this.inputCharName = document.getElementById('input-char-name');
    this.inputCharAliases = document.getElementById('input-char-aliases');
    this.inputCharDesc = document.getElementById('input-char-desc');
    this.btnCharCancel = document.getElementById('btn-char-cancel');
    this.btnCharSave = document.getElementById('btn-char-save');

    // Lightbox Modal
    this.lightboxModal = document.getElementById('lightbox-modal');
    this.lightboxBackdrop = document.getElementById('lightbox-backdrop');
    this.lightboxClose = document.getElementById('btn-lightbox-close');
    this.lightboxImg = document.getElementById('lightbox-img');
    this.lightboxCaption = document.getElementById('lightbox-caption');
    this.lightboxExcerpt = document.getElementById('lightbox-excerpt');
    this.btnLightboxInspect = document.getElementById('btn-lightbox-inspect');
    this.btnLightboxCopy = document.getElementById('btn-lightbox-copy');
    this.linkLightboxDownload = document.getElementById('link-lightbox-download');
    this.lightboxPromptBox = document.getElementById('lightbox-prompt-box');
    this.lightboxPromptText = document.getElementById('lightbox-prompt-text');
    this.lightboxPromptFlank = document.getElementById('lightbox-prompt-flank');

    // Floating Text Selection Toolbar
    this.floatingSelectionToolbar = document.getElementById('floating-selection-toolbar');
    this.btnCreateSelectionPrompt = document.getElementById('btn-create-selection-prompt');
    this.lblSelectionPromptText = document.getElementById('lbl-selection-prompt-text');
    this.lblSelectionCharCount = document.getElementById('lbl-selection-char-count');

    // Table of Contents (TOC)
    this.btnToc = document.getElementById('btn-toc');
    this.tocModal = document.getElementById('toc-modal');
    this.tocBackdrop = document.getElementById('toc-backdrop');
    this.btnTocClose = document.getElementById('btn-toc-close');
    this.tocBookTitle = document.getElementById('toc-book-title');
    this.tocPageInput = document.getElementById('toc-page-input');
    this.tocPageLimit = document.getElementById('toc-page-limit');
    this.btnTocJump = document.getElementById('btn-toc-jump');
    this.tocChaptersList = document.getElementById('toc-chapters-list');
  }

  bindEvents() {
    // Navigation
    this.btnPrev.addEventListener('click', () => this.navigatePage(-1));
    this.btnNext.addEventListener('click', () => this.navigatePage(1));

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.navigatePage(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        this.navigatePage(1);
      } else if ((e.ctrlKey || e.altKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        this.toggleStudioDrawer();
      } else if (e.key === 'Escape') {
        this.closeLightbox();
        this.closeToc();
      }
    });

    // Screen Leave & Visibility Change Listeners
    // If user leaves the screen before the 2s dwell completes, cancel the timer to avoid generating images for skipped pages.
    // If the reader returns to the tab on an unillustrated page, restart the dwell delay.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        if (this.pageDwellTimer) {
          clearTimeout(this.pageDwellTimer);
          this.pageDwellTimer = null;
        }
      } else if (document.visibilityState === 'visible') {
        if (this.currentPageNumber > 1 && this.currentBook && !this.isSynthesizing && this.activePageIllustrations.size === 0 && !this.pageDwellTimer) {
          const pageIndex = this.currentPageNumber - 1;
          const pageData = this.currentBook.pages[pageIndex];
          if (pageData && pageData.text) {
            this.loadOrGeneratePlate(this.currentBook.id, this.currentPageNumber, pageData.text);
          }
        }
      }
    });
    window.addEventListener('pagehide', () => this.cancelPendingGenerations('page_hide'));
    window.addEventListener('beforeunload', () => this.cancelPendingGenerations('before_unload'));

    // Pipeline Stage 2 broadcast listener (immediate excerpt self-highlighting & fog loader mount)
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg?.action === 'PIPELINE_EXCERPT_CHOSEN' && msg.payload) {
        this.handleExcerptChosen(msg.payload);
      }
    });

    // Table of Contents (TOC) Events
    if (this.btnToc) {
      this.btnToc.addEventListener('click', () => this.openToc());
    }
    if (this.btnTocClose) {
      this.btnTocClose.addEventListener('click', () => this.closeToc());
    }
    if (this.tocBackdrop) {
      this.tocBackdrop.addEventListener('click', () => this.closeToc());
    }
    if (this.btnTocJump) {
      this.btnTocJump.addEventListener('click', () => this.handleTocPageJump());
    }
    if (this.tocPageInput) {
      this.tocPageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleTocPageJump();
        }
      });
    }

    // Book Dropdown Change
    this.bookSelect.addEventListener('change', async (e) => {
      await this.selectBook(e.target.value);
    });

    // Remove Book Button
    if (this.btnRemoveBook) {
      this.btnRemoveBook.addEventListener('click', () => this.removeCurrentBook());
    }

    // File Upload
    this.fileUploader.addEventListener('change', (e) => this.handleFileUpload(e));

    // Typography Controls
    this.btnFontDec.addEventListener('click', () => this.adjustFontSize(-1));
    this.btnFontInc.addEventListener('click', () => this.adjustFontSize(1));

    // Theme Switchers
    this.themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.setTheme(btn.getAttribute('data-theme'));
      });
    });

    // Studio Drawer Toggles
    this.btnToggleStudio.addEventListener('click', () => this.toggleStudioDrawer());
    this.btnFloatingStudio.addEventListener('click', () => this.toggleStudioDrawer());
    this.btnCloseStudio.addEventListener('click', () => this.toggleStudioDrawer(false));

    // Studio Drawer Generation & Re-craft Triggers
    if (this.btnStudioRegenPrompt) {
      this.btnStudioRegenPrompt.addEventListener('click', () => this.regeneratePrompt());
    }
    if (this.btnStudioGenerate) {
      this.btnStudioGenerate.addEventListener('click', () => this.reRenderPlate(this.txtPromptPlate.value));
    }
    if (this.btnCopyPrompt) {
      this.btnCopyPrompt.addEventListener('click', () => this.copyToClipboard(this.txtPromptPlate.value));
    }

    // Aspect Ratio Selection
    if (this.aspectRatioGrid) {
      this.aspectRatioGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.ratio-btn');
        if (btn && btn.dataset.ratio) {
          this.setAspectRatio(btn.dataset.ratio);
        }
      });
    }

    // Clear Cache Button
    this.btnClearCache.addEventListener('click', async () => {
      if (this.currentBook) {
        await storage.clearBookIllustrations(this.currentBook.id);
        this.updateCacheStats();
        this.renderCurrentPage();
      }
    });

    // Character Codex Events
    if (this.btnAddCharacterToggle) {
      this.btnAddCharacterToggle.addEventListener('click', () => this.toggleCharacterForm());
    }
    if (this.btnScanCharacters) {
      this.btnScanCharacters.addEventListener('click', () => this.scanBookCharacters());
    }
    if (this.btnExportTxt) {
      this.btnExportTxt.addEventListener('click', () => this.exportCurrentBookAsTxt());
    }
    if (this.btnCharCancel) {
      this.btnCharCancel.addEventListener('click', () => this.hideCharacterForm());
    }
    if (this.btnCharSave) {
      this.btnCharSave.addEventListener('click', () => this.saveCharacterForm());
    }

    // Lightbox Modal Controls
    this.lightboxClose.addEventListener('click', () => this.closeLightbox());
    this.lightboxBackdrop.addEventListener('click', () => this.closeLightbox());

    // Lightbox Modal Actions (Inspect Prompt in Studio & Copy)
    if (this.btnLightboxInspect) {
      this.btnLightboxInspect.addEventListener('click', () => {
        const ill = this.currentLightboxIllustration;
        this.closeLightbox();
        this.toggleStudioDrawer(true);
        if (ill?.prompt && this.txtPromptPlate) {
          this.txtPromptPlate.value = ill.prompt;
          this.txtPromptPlate.scrollIntoView({ behavior: 'smooth', block: 'center' });
          this.txtPromptPlate.focus();
          this.highlightPromptUpdate();
        }
      });
    }

    if (this.btnLightboxCopy) {
      this.btnLightboxCopy.addEventListener('click', () => {
        const promptText = this.currentLightboxIllustration?.prompt || this.txtPromptPlate.value;
        if (promptText) {
          this.copyToClipboard(promptText);
        }
      });
    }

    // User Text Selection Toolbar Events
    this.setupTextSelectionHandler();

    // Banner Dismiss
    this.btnDismissBanner.addEventListener('click', () => {
      this.googleBanner.style.display = 'none';
    });

    // Reset & Re-check Session Buttons
    if (this.btnResetSession) {
      this.btnResetSession.addEventListener('click', () => this.resetGoogleSession());
    }
    if (this.btnBannerRecheck) {
      this.btnBannerRecheck.addEventListener('click', () => this.resetGoogleSession());
    }
  }

  setupArtStyleGrid() {
    this.styleCardsGrid.innerHTML = '';
    Object.values(ART_STYLES).forEach(style => {
      const card = document.createElement('div');
      card.className = `style-card-btn ${style.id === this.artStyle ? 'active' : ''}`;
      card.dataset.styleId = style.id;
      card.innerHTML = `
        <span class="style-card-name">${style.name}</span>
        <span class="style-card-desc">${style.description}</span>
      `;
      card.addEventListener('click', () => {
        this.setArtStyle(style.id);
      });
      this.styleCardsGrid.appendChild(card);
    });
  }

  async ensureInitialBooks() {
    const existing = await storage.getAllBooks();
    if (existing.length === 0) {
      for (const sample of SAMPLE_BOOKS) {
        await storage.saveBook(sample);
      }
    }
  }

  async loadPreferences() {
    this.theme = await storage.getSetting('theme', 'obsidian');
    this.fontSize = await storage.getSetting('fontSize', 18);
    this.artStyle = await storage.getSetting('artStyle', 'ethereal_watercolor');
    this.engine = await storage.getSetting('engine', 'gemini');
    this.aspectRatio = await storage.getSetting('aspectRatio', '3:4');

    this.setTheme(this.theme, false);
    this.setFontSize(this.fontSize, false);
    this.setArtStyle(this.artStyle, false);
    this.setEngine(this.engine, false);
    this.setAspectRatio(this.aspectRatio, false);
  }

  async verifyGoogleSession() {
    try {
      chrome.runtime.sendMessage({ action: 'CHECK_GOOGLE_SESSION' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.loggedIn) {
          this.studioSessionStatus.innerHTML = `
            <span class="dot-online" style="background:#f59e0b;box-shadow:0 0 6px #f59e0b;"></span>
            <span>Google Session: Not Logged In</span>
          `;
          this.googleBanner.style.display = 'block';
        } else {
          this.studioSessionStatus.innerHTML = `
            <span class="dot-online"></span>
            <span>Google Session: Connected (Zero-Key Active)</span>
          `;
          this.googleBanner.style.display = 'none';
        }
      });
    } catch (_) {}
  }

  async resetGoogleSession() {
    if (this.btnResetSession) {
      this.btnResetSession.textContent = '↻ Resetting...';
      this.btnResetSession.disabled = true;
    }
    if (this.btnBannerRecheck) {
      this.btnBannerRecheck.textContent = '↻ Checking...';
      this.btnBannerRecheck.disabled = true;
    }

    if (this.studioSessionStatus) {
      this.studioSessionStatus.innerHTML = `
        <span class="dot-online" style="background:#3b82f6;box-shadow:0 0 6px #3b82f6;"></span>
        <span>Re-authenticating Google session...</span>
      `;
    }

    chrome.runtime.sendMessage({ action: 'RESET_GOOGLE_SESSION' }, (response) => {
      if (this.btnResetSession) {
        this.btnResetSession.textContent = '↻ Reset Session';
        this.btnResetSession.disabled = false;
      }
      if (this.btnBannerRecheck) {
        this.btnBannerRecheck.textContent = '↻ Re-Check Session';
        this.btnBannerRecheck.disabled = false;
      }

      if (response && response.loggedIn) {
        this.studioSessionStatus.innerHTML = `
          <span class="dot-online"></span>
          <span>Google Session: Connected (Zero-Key Active)</span>
        `;
        this.googleBanner.style.display = 'none';
        alert('Gemini Session Reset: Successfully re-authenticated with active Google account! Zero-key Gemini 3.8 synthesis is active.');
      } else {
        this.studioSessionStatus.innerHTML = `
          <span class="dot-online" style="background:#f59e0b;box-shadow:0 0 6px #f59e0b;"></span>
          <span>Google Session: Not Logged In</span>
        `;
        this.googleBanner.style.display = 'block';
        alert(response?.message || 'Google session not detected after reset. Please sign into gemini.google.com in Chrome and try again.');
      }
    });
  }

  async loadActiveBook() {
    this.booksList = await storage.getAllBooks();
    this.populateBookDropdown();

    const activeBookId = await storage.getSetting('activeBookId', this.booksList[0]?.id || SAMPLE_BOOKS[0].id);
    await this.selectBook(activeBookId);
  }

  populateBookDropdown() {
    this.bookSelect.innerHTML = '';
    this.booksList.forEach(book => {
      const opt = document.createElement('option');
      opt.value = book.id;
      opt.textContent = `${book.title} (${book.author})`;
      this.bookSelect.appendChild(opt);
    });
  }

  async selectBook(bookId) {
    const book = await storage.getBook(bookId);
    if (!book) return;

    this.currentBook = book;
    this.bookSelect.value = bookId;
    await storage.saveSetting('activeBookId', bookId);

    // Load character dossier for this book & render Character Codex
    this.currentCharacters = await this.characterTracker.loadBookCharacters(bookId);
    this.renderCharacterList();

    // Retrieve last read page for this book
    const savedPage = await storage.getSetting(`progress_${bookId}`, 1);
    this.currentPageNumber = Math.min(Math.max(1, savedPage), book.totalPages || 1);

    this.cancelPendingGenerations('book_change');
    this.renderCurrentPage();
    this.updateCacheStats();
  }

  async removeCurrentBook() {
    if (!this.currentBook) return;
    const title = this.currentBook.title || 'this book';
    const confirmed = (typeof window !== 'undefined' && window.confirm)
      ? window.confirm(`Remove "${title}" from your library?`)
      : true;
    if (!confirmed) return;

    const bookIdToDelete = this.currentBook.id;
    await storage.deleteBook(bookIdToDelete);

    // Refresh books list
    this.booksList = await storage.getAllBooks();

    // If all books were removed, re-seed defaults
    if (this.booksList.length === 0) {
      for (const sample of SAMPLE_BOOKS) {
        await storage.saveBook(sample);
      }
      this.booksList = await storage.getAllBooks();
    }

    this.populateBookDropdown();
    const nextBookId = this.booksList[0]?.id || SAMPLE_BOOKS[0].id;
    await this.selectBook(nextBookId);
  }

  /**
   * Cancels any pending dwell timer and active in-flight prompt/image generations.
   * Invoked when user turns pages, changes books, or leaves the screen/tab.
   */
  cancelPendingGenerations(reason = 'page_leave') {
    if (this.pageDwellTimer) {
      clearTimeout(this.pageDwellTimer);
      this.pageDwellTimer = null;
    }
    this.generationSessionToken++;
    this.isSynthesizing = false;

    try {
      chrome.runtime.sendMessage({ action: 'ABORT_GENERATION', reason }, () => {
        if (chrome.runtime.lastError) {}
      });
    } catch (_) {}
  }

  // ==================== PAGE RENDERING & SYNTHESIS ====================

  async renderCurrentPage() {
    if (!this.currentBook) return;

    // Immediately stop & cancel any in-flight generation or dwell timer from previous page
    this.cancelPendingGenerations('page_turn');

    // Reset prompt variation counter & clear active page illustrations map
    this.promptVariationIndex = 0;
    this.activePageIllustrations.clear();

    const totalPages = this.currentBook.totalPages || this.currentBook.pages.length;
    const pageIndex = this.currentPageNumber - 1;
    const pageData = this.currentBook.pages[pageIndex] || this.currentBook.pages[0];

    // 1. Update Navigation UI
    this.lblPageCurrent.textContent = this.currentPageNumber;
    this.lblPageTotal.textContent = totalPages;
    this.btnPrev.disabled = (this.currentPageNumber <= 1);
    this.btnNext.disabled = (this.currentPageNumber >= totalPages);

    const progressPct = Math.round((this.currentPageNumber / totalPages) * 100);
    this.progressFill.style.width = `${progressPct}%`;

    // Save reading progress & refresh character codex active eras for current page
    await storage.saveSetting(`progress_${this.currentBook.id}`, this.currentPageNumber);
    this.renderCharacterList();

    // Hide floating selection toolbar on page turn
    if (this.floatingSelectionToolbar) {
      this.floatingSelectionToolbar.style.display = 'none';
    }

    // Scroll reader smoothly to top of prose
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 2. Handle Page 1 vs Reading Pages (Page 2+)
    if (pageData.isTitlePage || this.currentPageNumber === 1) {
      // ==========================================
      // CRITICAL CONSTRAINT: ZERO TITLE PAGE AI CALLS
      // Page 1 is strictly dedicated Title Page.
      // Displays edition colophon & codex card.
      // ZERO AI CALLS or image synthesis take place on Page 1.
      // ==========================================
      this.proseContentArea.innerHTML = `
        <div class="page1-editorial-card" style="margin: 0 auto; max-width: 620px; padding: 48px 36px; border: 1px solid var(--border-gold); border-radius: 12px; background: rgba(0,0,0,0.25); text-align: center;">
          <div class="editorial-crest" style="font-size: 42px; color: var(--gold-accent); margin-bottom: 14px;">✦</div>
          <h2 class="editorial-title" style="font-family: var(--font-title, 'Cinzel', serif); font-size: 22px; font-weight: 700; color: var(--gold-glow); margin-bottom: 8px;">${this.escapeHtml(this.currentBook.title)}</h2>
          <div style="font-size: 14px; color: var(--text-muted); font-style: italic; margin-bottom: 24px;">By ${this.escapeHtml(this.currentBook.author)}</div>
          <p class="editorial-body" style="font-size: 13px; line-height: 1.8; color: var(--text-main); margin-bottom: 24px;">
            Erised AI Master Edition. Fine-art book illustrations autonomously anchored to prominent passages and user highlights on both sides of the page.
          </p>
          <div class="editorial-meta-list" style="margin-bottom: 28px; text-align: left; background: rgba(255,255,255,0.03); border: 1px solid var(--border-gold); border-radius: 6px; padding: 12px;">
            <div class="meta-item" style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span class="meta-label" style="color: var(--text-muted);">Typography:</span> Cinzel Bold &amp; Classical Serif</div>
            <div class="meta-item" style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span class="meta-label" style="color: var(--text-muted);">Engine:</span> Zero-Key Headless Gemini 3.8</div>
            <div class="meta-item" style="display: flex; justify-content: space-between;"><span class="meta-label" style="color: var(--text-muted);">Folio Layout:</span> In-Page Dual-Flank Illuminations</div>
          </div>
          <button class="btn-jump-page2" id="btn-start-reading-page2" style="background: linear-gradient(135deg, var(--gold-dark), var(--gold-accent)); color: #fff; border: 1px solid var(--gold-glow); padding: 12px 24px; border-radius: 6px; font-family: var(--font-title, 'Cinzel', serif); font-size: 14px; font-weight: 700; cursor: pointer;">Begin Reading Chapter I &rarr;</button>
        </div>
      `;

      const startReadingBtn = document.getElementById('btn-start-reading-page2');
      if (startReadingBtn) {
        startReadingBtn.addEventListener('click', () => this.jumpToPage(2));
      }

      if (this.lblPromptPageBadge) {
        this.lblPromptPageBadge.textContent = `Page 1: Title Folio • ${this.currentBook.title}`;
      }
      this.studioMomentTitle.textContent = 'Dedicated Title Folio';
      this.studioMomentDesc.textContent = 'Zero AI calls on Page 1. Flip to Page 2 to begin real-time 2-stage Gemini illustration.';
      if (this.studioMomentExcerpt) {
        this.studioMomentExcerpt.textContent = 'Title Page: Zero AI calls.';
      }
      this.studioMomentRatio.textContent = 'Cover';
      this.studioMomentOptics.textContent = 'Optics: Master Typography';
      this.studioMomentTheme.textContent = 'Theme: Historical Colophon';
      this.txtPromptPlate.value = `[Page 1: Title Folio Active — Zero AI Calls on Title Page]\n\nBook: ${this.currentBook.title}\nAuthor: ${this.currentBook.author}\nTurn to Page 2 to activate headless Gemini prominent moment synthesis.`;
      this.txtPromptNegative.value = 'Universal Negative Prompt: text, watermark, low quality, deformed, blurry';
      return;
    }

    // ==========================================
    // PAGES 2+: IN-PAGE DUAL-FLANK ILLUMINATED PROSE
    // Render prose first, then mount illustrations next to target paragraphs.
    // ==========================================
    this.proseContentArea.innerHTML = pageData.html;
    this.proseContentArea.style.fontSize = `${this.fontSize}px`;

    // Load cached illustrations from IndexedDB or synthesize with Gemini
    await this.loadOrGeneratePlate(this.currentBook.id, this.currentPageNumber, pageData.text);
  }

  /**
   * Loads plates from zero-latency local IndexedDB memory cache, or triggers 2-stage Gemini synthesis.
   * Mounts illustrations directly next to their associated paragraphs on both sides of the page.
   */
  async loadOrGeneratePlate(bookId, pageNumber, fullPageText) {
    const startTime = performance.now();

    // 1. Check storage for all cached illustrations on this page
    let cachedList = [];
    if (typeof storage.getPageIllustrations === 'function') {
      cachedList = await storage.getPageIllustrations(bookId, pageNumber);
    }

    // Fallback checks for legacy keys ('right', 'left', 'plate')
    if (!cachedList || cachedList.length === 0) {
      const cachedRight = await storage.getCachedIllustration(bookId, pageNumber, 'right');
      const cachedLeft = await storage.getCachedIllustration(bookId, pageNumber, 'left');
      const cachedPlate = await storage.getCachedIllustration(bookId, pageNumber, 'plate');

      if (cachedRight) cachedList.push({ ...cachedRight, flank: 'right' });
      if (cachedLeft) cachedList.push({ ...cachedLeft, flank: 'left' });
      if (cachedPlate && !cachedRight) cachedList.push({ ...cachedPlate, flank: 'right' });
    }

    if (cachedList && cachedList.length > 0) {
      const latency = Math.round(performance.now() - startTime);
      this.statLatency.textContent = `${latency}ms`;

      // Mount each cached illustration next to its associated paragraph
      for (const cached of cachedList) {
        const flank = (cached.flank === 'left') ? 'left' : 'right';
        this.activePageIllustrations.set(flank, cached);

        const excerpt = cached.selectedExcerpt || cached.sceneSummary || cached.momentDescription || '';
        this.highlightProseExcerpt(excerpt, flank);

        const targetP = this.proseContentArea.querySelector(`mark.illuminated-excerpt[data-flank="${flank}"]`)?.closest('p')
          || (flank === 'right' ? this.proseContentArea.querySelector('.prose-body p, p') : this.proseContentArea.querySelectorAll('.prose-body p, p')[1] || this.proseContentArea.querySelector('p'));

        if (targetP) {
          this.mountInlinePlate(targetP, flank, cached, false);
        }
      }

      // Update AI Studio with the primary illustration prompt
      const primaryIll = cachedList[0];
      if (primaryIll) {
        const momentTitle = primaryIll.momentTitle || 'Illuminated Scene';
        if (this.lblPromptPageBadge) {
          this.lblPromptPageBadge.textContent = `Page ${pageNumber} • ${this.currentBook.title}`;
        }
        this.studioMomentTitle.textContent = momentTitle;
        this.studioMomentDesc.textContent = primaryIll.sceneSummary || '';
        if (this.studioMomentExcerpt) {
          this.studioMomentExcerpt.textContent = primaryIll.selectedExcerpt ? `“${primaryIll.selectedExcerpt}”` : 'Illustrated passage from page context';
        }
        this.studioMomentRatio.textContent = primaryIll.aspectRatio || this.aspectRatio || '3:4';
        this.studioMomentOptics.textContent = `Optics: ${primaryIll.optics || 'Cinematic'}`;
        this.studioMomentTheme.textContent = `Theme: ${primaryIll.theme || 'Autonomous'}`;
        this.txtPromptPlate.value = primaryIll.prompt || '';
        this.txtPromptNegative.value = 'Universal Negative Prompt: text, watermark, low quality, deformed, blurry';
      }
    } else {
      // 2-Second Dwell Delay: Wait until reader has dwelt on the page for 2 seconds before initiating prompt generation.
      // Avoids creating vast amounts of images if user is skipping through pages.
      const currentToken = this.generationSessionToken;
      const targetPageNum = pageNumber;
      const targetBookId = bookId;

      this.pageDwellTimer = setTimeout(async () => {
        if (this.generationSessionToken !== currentToken) return;
        if (this.currentPageNumber !== targetPageNum || this.currentBook?.id !== targetBookId) return;
        if (document.visibilityState === 'hidden') return;

        this.runFullPipeline(fullPageText, { sessionToken: currentToken });
      }, this.PAGE_DWELL_DELAY_MS);
    }

    this.updateCacheStats();
  }

  /**
   * Mounts an inline image plate next to a paragraph with zero visible text/buttons by default.
   * On hover, ONLY "↻ Re-Render" appears.
   * Clicking the picture pulls up the enlarged lightbox view where "Inspect Prompt" is accessed.
   */
  mountInlinePlate(targetParagraph, flank, data, isLoading = false) {
    if (!targetParagraph) return;

    // Remove existing plate for this flank if present
    const existing = document.getElementById(`inline-plate-${flank}`);
    if (existing) {
      existing.remove();
    }

    const plate = document.createElement('figure');
    plate.className = `page-inline-plate flank-${flank}`;
    plate.id = `inline-plate-${flank}`;
    plate.dataset.flank = flank;

    const aspectRatio = data?.aspectRatio || this.aspectRatio || '3:4';
    const ratioCss = aspectRatio.replace(':', ' / ');

    const hasImageUrl = Boolean(data?.imageUrl && !isLoading);
    const momentTitle = data?.momentTitle ? this.truncate(data.momentTitle, 28) : '';
    plate.innerHTML = `
      <div class="inline-plate-canvas" style="--inline-aspect-ratio: ${ratioCss};">
        <div class="inline-plate-loader" style="${isLoading ? 'display:flex;' : 'display:none;'}">
          <div class="fog-plate-content">
            <div class="celestial-spinner-mini"></div>
            <div class="fog-plate-status">Illuminating Scene...</div>
            <div class="fog-plate-subtext">${momentTitle ? `“${momentTitle}”` : 'Gemini Imagen 3 generating plate'}</div>
          </div>
        </div>
        <img class="inline-plate-img" ${hasImageUrl ? `src="${data.imageUrl}"` : ''} alt="Book Illustration" style="${isLoading || !data?.imageUrl ? 'display:none;' : 'display:block;'}" />
      </div>
      <div class="inline-plate-off-canvas-dock">
        <button class="btn-inline-rerender" data-flank="${flank}" title="Re-render illustration">↻ Re-Render</button>
      </div>
    `;

    // Click handler for Re-Render button
    const btnRerender = plate.querySelector('.btn-inline-rerender');
    if (btnRerender) {
      btnRerender.addEventListener('click', (e) => {
        e.stopPropagation();
        this.reRenderInlinePlate(flank);
      });
    }

    // Click handler for picture: pulls up enlarged view where inspect prompt button can be accessed
    const imgEl = plate.querySelector('.inline-plate-img');
    const canvasEl = plate.querySelector('.inline-plate-canvas');
    const handlePlateClick = (e) => {
      if (e.target.closest('.btn-inline-rerender') || e.target.closest('.inline-plate-off-canvas-dock') || e.target.closest('.inline-plate-error-card')) return;
      const illData = this.activePageIllustrations.get(flank) || data;
      if (illData && illData.imageUrl) {
        this.openLightbox(illData.imageUrl, illData.momentTitle || 'Illuminated Scene', illData);
      }
    };

    if (imgEl) {
      imgEl.addEventListener('load', () => {
        const currentSrc = imgEl.getAttribute('src');
        if (!currentSrc) return;
        imgEl.style.display = 'block';
        imgEl.style.opacity = '1';
        const loader = plate.querySelector('.inline-plate-loader');
        if (loader) loader.style.display = 'none';
        const errCard = plate.querySelector('.inline-plate-error-card');
        if (errCard) errCard.remove();
      });

      imgEl.addEventListener('error', () => {
        // Prevent spurious error triggers when mounting in loading state without an image URL
        const currentSrc = imgEl.getAttribute('src');
        if (!currentSrc || isLoading) return;
        if (!currentSrc.startsWith('http') && !currentSrc.startsWith('data:')) return;

        if (imgEl.src && !imgEl.src.endsWith('/') && !imgEl.src.endsWith('about:blank') && !imgEl.src.startsWith('data:image/svg')) {
          console.warn(`[SanctuaryReader] Image failed to render/load on flank ${flank}:`, imgEl.src);
          this.showInlinePlateError(flank, {
            title: 'Image Load Failed',
            message: 'Unable to render the illustration. Click retry to refresh the plate.',
            canRetry: true
          });
        }
      });

      imgEl.addEventListener('click', handlePlateClick);
    }
    if (canvasEl) canvasEl.addEventListener('click', handlePlateClick);

    // Insert directly into the paragraph so it docks next to the text
    targetParagraph.insertAdjacentElement('afterbegin', plate);
  }

  /**
   * Displays an elegant error recovery card inside the inline plate canvas instead of leaving a black void.
   */
  showInlinePlateError(flank, errorInfo = {}) {
    let plate = document.getElementById(`inline-plate-${flank}`);
    if (!plate && this.proseContentArea) {
      const targetP = flank === 'right'
        ? this.proseContentArea.querySelector('.prose-body p, p')
        : (this.proseContentArea.querySelectorAll('.prose-body p, p')[1] || this.proseContentArea.querySelector('p'));
      if (targetP) {
        this.mountInlinePlate(targetP, flank, { aspectRatio: this.aspectRatio || '3:4' }, false);
        plate = document.getElementById(`inline-plate-${flank}`);
      }
    }
    if (!plate) return;

    const loader = plate.querySelector('.inline-plate-loader');
    if (loader) loader.style.display = 'none';

    const img = plate.querySelector('.inline-plate-img');
    if (img) img.style.display = 'none';

    const canvas = plate.querySelector('.inline-plate-canvas');
    if (!canvas) return;

    const existingCard = canvas.querySelector('.inline-plate-error-card');
    if (existingCard) existingCard.remove();

    const title = errorInfo.title || 'Illustration Paused';
    const message = errorInfo.message || errorInfo.error || 'Gemini did not return an image for this passage.';
    const isNotLoggedIn = Boolean(errorInfo.isNotLoggedIn);
    const errorDetail = errorInfo.error || '';
    const statusText = errorInfo.status ? `HTTP ${errorInfo.status}` : '';
    const stack = errorInfo.stack || '';
    const details = errorInfo.details || '';
    const rawSnippet = errorInfo.rawSnippet || '';
    const synthError = errorInfo.synthError || '';

    const debugItems = [
      statusText ? `Status: ${statusText}` : null,
      errorDetail ? `Error: ${errorDetail}` : null,
      synthError ? `Stage 2 Prompt Synthesis: ${synthError}` : null,
      details ? `Diagnostics:\n${details}` : null,
      stack ? `Stacktrace:\n${stack}` : null,
      rawSnippet ? `Google Response Snippet:\n${rawSnippet}` : null
    ].filter(Boolean);

    const debugText = debugItems.join('\n\n');

    const card = document.createElement('div');
    card.className = 'inline-plate-error-card';
    card.innerHTML = `
      <div class="inline-error-icon">✦</div>
      <div class="inline-error-title">${this.escapeHtml(title)}</div>
      <div class="inline-error-msg">${this.escapeHtml(message)}</div>
      ${debugText ? `
        <details class="inline-error-debug-details">
          <summary class="inline-error-debug-summary">View Error Diagnostics & Stacktrace</summary>
          <div class="inline-error-stack-wrapper">
            <pre class="inline-error-stack">${this.escapeHtml(debugText)}</pre>
            <button type="button" class="btn-inline-copy-stack">Copy Diagnostics</button>
          </div>
        </details>
      ` : ''}
      <div class="inline-error-actions">
        ${isNotLoggedIn ? `<a href="https://gemini.google.com" target="_blank" rel="noopener" class="btn-inline-signin">Sign into Google</a>` : ''}
        <button class="btn-inline-retry" data-flank="${flank}">↻ Retry Generation</button>
        <button class="btn-inline-inspect" data-flank="${flank}">Inspect Prompt</button>
      </div>
    `;

    const btnCopy = card.querySelector('.btn-inline-copy-stack');
    if (btnCopy) {
      btnCopy.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(debugText).then(() => {
          btnCopy.textContent = '✓ Copied!';
          setTimeout(() => { if (btnCopy) btnCopy.textContent = 'Copy Diagnostics'; }, 2000);
        }).catch(() => {
          btnCopy.textContent = 'Failed to copy';
        });
      });
    }

    const btnRetry = card.querySelector('.btn-inline-retry');
    if (btnRetry) {
      btnRetry.addEventListener('click', (e) => {
        e.stopPropagation();
        card.remove();
        if (loader) loader.style.display = 'flex';
        this.reRenderInlinePlate(flank);
      });
    }

    const btnInspect = card.querySelector('.btn-inline-inspect');
    if (btnInspect) {
      btnInspect.addEventListener('click', (e) => {
        e.stopPropagation();
        this.inspectPrompt();
      });
    }

    canvas.appendChild(card);
  }

  /**
   * Highlights the specific sentence or paragraph on the page used to craft the illustration prompt.
   * Injects the hover "New Prompt" button over the highlighted text.
   * 
   * @param {string|null} excerptText
   * @param {'right'|'left'} [flank='right']
   * @param {boolean} [animateSweep=false]
   */
  highlightProseExcerpt(excerptText, flank = 'right', animateSweep = false) {
    if (!this.proseContentArea) return;

    // Clean any prior highlight for this specific flank
    const priorMarks = this.proseContentArea.querySelectorAll(`mark.illuminated-excerpt[data-flank="${flank}"]`);
    priorMarks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        // Remove hover pill before unwrapping text
        const pill = mark.querySelector('.excerpt-hover-pill');
        if (pill) pill.remove();
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
        parent.normalize();
      }
    });

    if (!excerptText || typeof excerptText !== 'string' || !excerptText.trim()) return;

    const clean = excerptText.trim();
    const normClean = clean.replace(/\s+/g, ' ');
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const paragraphs = Array.from(this.proseContentArea.querySelectorAll('.prose-body p, p'));
    let matched = false;

    const createMarkHtml = (text) => `
      <mark class="illuminated-excerpt${animateSweep ? ' illuminating-sweep' : ''}" data-flank="${flank}" id="excerpt-${flank}">
        ${text}
        <span class="excerpt-hover-pill">
          <button class="btn-excerpt-new-prompt" data-flank="${flank}" title="Re-craft prompt for this excerpt">New Prompt</button>
        </span>
      </mark>
    `;

    for (const p of paragraphs) {
      const pInner = p.innerHTML;

      // Case 1: Direct match
      const directRegex = new RegExp(escapeRegex(normClean).replace(/\\s\+/g, '\\s+'), 'i');
      if (directRegex.test(pInner)) {
        p.innerHTML = pInner.replace(directRegex, (match) => createMarkHtml(match));
        matched = true;
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
            const replaced = restHtml.replace(restRegex, (m) => createMarkHtml(m));
            p.innerHTML = `${dropCapMatch[1]}${replaced}`;
            matched = true;
            break;
          }
        }
      }

      // Case 3: Sub-phrase match (first 6 words)
      const words = clean.split(/\s+/).filter(w => w.length > 2);
      if (words.length >= 4) {
        const subPhrase = words.slice(0, Math.min(words.length, 6)).join(' ');
        const subRegex = new RegExp(escapeRegex(subPhrase).replace(/\\s\+/g, '\\s+'), 'i');
        if (subRegex.test(pInner)) {
          p.innerHTML = pInner.replace(subRegex, (match) => createMarkHtml(match));
          matched = true;
          break;
        }
      }

      // Case 4: Paragraph match
      const pNorm = p.textContent.replace(/\s+/g, ' ').toLowerCase();
      const excerptNorm = clean.replace(/\s+/g, ' ').toLowerCase();
      if (pNorm.length > 40 && (pNorm.includes(excerptNorm.slice(0, 40)) || excerptNorm.includes(pNorm.slice(0, 40)))) {
        p.classList.add('paragraph-highlighted-excerpt');
        matched = true;
        break;
      }
    }

    // Clean up sweep animation class after initial animation completes
    if (matched && animateSweep) {
      setTimeout(() => {
        const mark = this.proseContentArea?.querySelector(`mark.illuminated-excerpt[data-flank="${flank}"]`);
        if (mark) mark.classList.remove('illuminating-sweep');
      }, 1600);
    }

    // Bind click events on the newly injected "New Prompt" hover buttons
    this.bindExcerptPromptButtons(flank, clean);
  }

  /**
   * Binds click and hover stability events to the "New Prompt" hover button over highlighted excerpts
   */
  bindExcerptPromptButtons(flank, excerptText) {
    const markEl = this.proseContentArea?.querySelector(`mark.illuminated-excerpt[data-flank="${flank}"]`);
    if (markEl) {
      const pillEl = markEl.querySelector('.excerpt-hover-pill');
      let hideTimeout = null;

      const showPill = () => {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        if (pillEl) {
          pillEl.style.opacity = '1';
          pillEl.style.pointerEvents = 'auto';
        }
      };

      const scheduleHidePill = () => {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          if (pillEl) {
            pillEl.style.opacity = '';
            pillEl.style.pointerEvents = '';
          }
        }, 350);
      };

      markEl.addEventListener('mouseenter', showPill);
      markEl.addEventListener('mouseleave', scheduleHidePill);
      if (pillEl) {
        pillEl.addEventListener('mouseenter', showPill);
        pillEl.addEventListener('mouseleave', scheduleHidePill);
      }

      const btnNewPrompt = markEl.querySelector('.btn-excerpt-new-prompt');
      if (btnNewPrompt) {
        btnNewPrompt.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.regeneratePromptForExcerpt(flank, excerptText);
        });
      }
    }
  }

  /**
   * Sets up mouse selection listener allowing the reader to highlight new text on the page
   * (with a maximum length) and generate a new illustration next to the associated paragraph,
   * utilizing both sides of the page.
   */
  setupTextSelectionHandler() {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !this.proseContentArea) {
        if (this.floatingSelectionToolbar) {
          this.floatingSelectionToolbar.style.display = 'none';
        }
        return;
      }

      // Only respond if selection is within the prose area
      const anchor = sel.anchorNode;
      const focus = sel.focusNode;
      if (!this.proseContentArea.contains(anchor) || !this.proseContentArea.contains(focus)) {
        if (this.floatingSelectionToolbar) {
          this.floatingSelectionToolbar.style.display = 'none';
        }
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 5) {
        if (this.floatingSelectionToolbar) {
          this.floatingSelectionToolbar.style.display = 'none';
        }
        return;
      }

      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const top = rect.top + window.scrollY - 46;
        const left = rect.left + window.scrollX + rect.width / 2;

        if (this.floatingSelectionToolbar) {
          this.floatingSelectionToolbar.style.top = `${Math.max(10, top)}px`;
          this.floatingSelectionToolbar.style.left = `${left}px`;
          this.floatingSelectionToolbar.style.display = 'block';

          if (text.length <= this.MAX_EXCERPT_CHARS) {
            this.lblSelectionPromptText.textContent = 'Generate Image from Selection';
            this.lblSelectionCharCount.textContent = `${text.length}/${this.MAX_EXCERPT_CHARS}`;
            this.btnCreateSelectionPrompt.style.borderColor = 'var(--gold-accent)';
          } else {
            this.lblSelectionPromptText.textContent = 'Truncate & Generate Image';
            this.lblSelectionCharCount.textContent = `${this.MAX_EXCERPT_CHARS} max (${text.length})`;
            this.btnCreateSelectionPrompt.style.borderColor = '#ef4444';
          }
        }
      } catch (_) {}
    };

    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('mouseup', handleSelection);

    if (this.btnCreateSelectionPrompt) {
      this.btnCreateSelectionPrompt.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;

        let selectedText = sel.toString().trim();
        if (!selectedText) return;

        if (selectedText.length > this.MAX_EXCERPT_CHARS) {
          selectedText = selectedText.slice(0, this.MAX_EXCERPT_CHARS).trim();
        }

        // Identify paragraph
        const range = sel.getRangeAt(0);
        let targetP = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? range.commonAncestorContainer.closest('p')
          : range.commonAncestorContainer.parentElement.closest('p');

        // Clear selection and hide floating toolbar
        sel.removeAllRanges();
        if (this.floatingSelectionToolbar) {
          this.floatingSelectionToolbar.style.display = 'none';
        }

        // Determine flank ("Use both sides of the page")
        // If an illustration exists on 'right', choose 'left'; else 'right'
        const existingRight = this.activePageIllustrations.get('right');
        const targetFlank = existingRight ? 'left' : 'right';

        // Highlight selection on the page
        this.highlightProseExcerpt(selectedText, targetFlank);

        // Mount loading inline plate next to target paragraph
        if (!targetP) {
          targetP = this.proseContentArea.querySelector(`mark.illuminated-excerpt[data-flank="${targetFlank}"]`)?.closest('p')
            || this.proseContentArea.querySelector('p');
        }

        if (targetP) {
          this.mountInlinePlate(targetP, targetFlank, { aspectRatio: this.aspectRatio || '3:4' }, true);
        }

        // Trigger Gemini Stage 1 & 2 for this explicit excerpt
        const pageIndex = this.currentPageNumber - 1;
        const fullPageText = this.currentBook.pages[pageIndex]?.text || selectedText;

        this.runFullPipeline(fullPageText, {
          targetFlank,
          selectedExcerpt: selectedText
        });
      });
    }
  }

  /**
   * Smoothly crossfades prose during layout reflows (e.g. when an excerpt is selected
   * and the inline plate loader is mounted or shifted).
   */
  fadeProseTransition(layoutChangeCallback) {
    if (!this.proseContentArea) {
      if (layoutChangeCallback) layoutChangeCallback();
      return;
    }

    this.proseContentArea.classList.remove('prose-layout-fading-in');
    this.proseContentArea.classList.add('prose-layout-fading');

    setTimeout(() => {
      try {
        if (layoutChangeCallback) layoutChangeCallback();
      } catch (err) {
        console.warn('[SanctuaryReader] Layout change callback error:', err);
      }
      requestAnimationFrame(() => {
        this.proseContentArea.classList.remove('prose-layout-fading');
        this.proseContentArea.classList.add('prose-layout-fading-in');
        setTimeout(() => {
          this.proseContentArea?.classList.remove('prose-layout-fading-in');
        }, 500);
      });
    }, 200);
  }

  /**
   * Handles Stage 2 completion broadcast (PIPELINE_EXCERPT_CHOSEN).
   * Animates text self-highlighting, fades prose layout, and mounts the color-gradient-wave-fog box
   * next to the chosen excerpt paragraph 30+ seconds before Stage 3 image generation finishes.
   */
  handleExcerptChosen(payload) {
    if (!this.currentBook || this.currentPageNumber !== payload?.pageNumber) return;

    const targetFlank = payload.flank || (this.activePageIllustrations.get('right') ? 'left' : 'right');
    const excerpt = payload.selectedExcerpt || payload.sceneSummary || '';

    // Merge any new character physical descriptions
    if (Array.isArray(payload.newCharacters) && payload.newCharacters.length > 0) {
      this.characterTracker.mergeCharacters(this.currentBook.id, payload.newCharacters, this.currentPageNumber)
        .then(() => {
          this.currentCharacters = this.characterTracker.getCharactersForBook(this.currentBook.id);
          this.renderCharacterList();
        }).catch(() => {});
    }

    this.currentPromptData = payload;
    if (this.lblPromptPageBadge) this.lblPromptPageBadge.textContent = `Page ${this.currentPageNumber} • ${this.currentBook.title}`;
    if (this.studioMomentTitle) this.studioMomentTitle.textContent = payload.momentTitle || 'Illuminated Scene';
    if (this.studioMomentDesc) this.studioMomentDesc.textContent = payload.sceneSummary || '';
    if (this.studioMomentExcerpt) this.studioMomentExcerpt.textContent = excerpt ? `“${excerpt}”` : 'Illustrated passage from page context';
    if (this.studioMomentRatio) this.studioMomentRatio.textContent = payload.aspectRatio || this.aspectRatio || '3:4';
    if (this.studioMomentOptics) this.studioMomentOptics.textContent = `Optics: ${payload.focalRange || 'Dynamic'}`;
    if (this.studioMomentTheme) this.studioMomentTheme.textContent = `Theme: ${payload.theme || 'Autonomous'}`;
    if (this.txtPromptPlate) this.txtPromptPlate.value = payload.imagePrompt || '';
    this.highlightPromptUpdate();

    // Smoothly fade prose layout, self-highlight selected excerpt with glowing sweep, and dock fog box in target paragraph
    this.fadeProseTransition(() => {
      this.highlightProseExcerpt(excerpt, targetFlank, true);
      const targetP = this.proseContentArea.querySelector(`mark.illuminated-excerpt[data-flank="${targetFlank}"]`)?.closest('p')
        || (targetFlank === 'right'
          ? this.proseContentArea.querySelector('.prose-body p, p')
          : (this.proseContentArea.querySelectorAll('.prose-body p, p')[1] || this.proseContentArea.querySelector('p')));

      if (targetP) {
        this.mountInlinePlate(targetP, targetFlank, payload, true);
      }
    });
  }

  /**
   * Unified Single-Message Pipeline (RUN_FULL_PIPELINE)
   *
   * Sends a SINGLE chrome.runtime.sendMessage to background.js which runs all 3 stages
   * sequentially inside the service worker — preventing MV3 idle termination between calls.
   *
   * Stage 1: gatherCharacterDescriptions — extracts named character physical descriptions
   * Stage 2: synthesizePagePrompt        — generates the literary image prompt
   * Stage 3: generateImage               — renders the illustration via Gemini Imagen 3
   */
  runFullPipeline(pageText, options = {}) {
    if (!this.currentBook || this.currentPageNumber === 1) return;

    const sessionToken = options.sessionToken ?? null;
    if (sessionToken !== null && sessionToken !== this.generationSessionToken) return;

    const targetPage = this.currentPageNumber;
    const targetFlank = options.targetFlank || (this.activePageIllustrations.get('right') ? 'left' : 'right');
    this.isSynthesizing = true;

    // If an excerpt was manually pre-selected by the reader, fade and mount loading plate at that excerpt immediately
    if (options.selectedExcerpt) {
      let placeholderP = this.proseContentArea.querySelector(`mark.illuminated-excerpt[data-flank="${targetFlank}"]`)?.closest('p');
      if (!placeholderP) {
        const clean = options.selectedExcerpt.trim();
        const paras = Array.from(this.proseContentArea.querySelectorAll('.prose-body p, p'));
        placeholderP = paras.find(p => p.textContent.includes(clean.slice(0, 40)));
      }
      if (!placeholderP) {
        placeholderP = targetFlank === 'right'
          ? this.proseContentArea.querySelector('.prose-body p, p')
          : (this.proseContentArea.querySelectorAll('.prose-body p, p')[1] || this.proseContentArea.querySelector('p'));
      }
      if (placeholderP && !document.getElementById(`inline-plate-${targetFlank}`)) {
        this.fadeProseTransition(() => {
          this.highlightProseExcerpt(options.selectedExcerpt, targetFlank, true);
          this.mountInlinePlate(placeholderP, targetFlank, { aspectRatio: options.aspectRatio || this.aspectRatio || '3:4' }, true);
        });
      }
    }

    chrome.runtime.sendMessage({
      action: 'RUN_FULL_PIPELINE',
      payload: {
        pageText,
        bookTitle: this.currentBook.title,
        author: this.currentBook.author,
        pageNumber: this.currentPageNumber,
        existingCharacters: this.currentCharacters,
        styleId: this.artStyle,
        variationIndex: this.promptVariationIndex,
        selectedExcerpt: options.selectedExcerpt || '',
        aspectRatio: options.aspectRatio || this.aspectRatio || '3:4',
        flank: targetFlank
      }
    }, async (res) => {
      this.isSynthesizing = false;

      try {
        // Session guard: if the user navigated away, silently discard
        if (sessionToken !== null && sessionToken !== this.generationSessionToken) {
          const plate = document.getElementById(`inline-plate-${targetFlank}`);
          if (plate && !this.activePageIllustrations.has(targetFlank)) plate.remove();
          return;
        }
        if (this.currentPageNumber !== targetPage) return;

        if (chrome.runtime.lastError) {
          console.warn('[SanctuaryReader] RUN_FULL_PIPELINE error:', chrome.runtime.lastError);
          this.showInlinePlateError(targetFlank, {
            title: 'Pipeline Communication Error',
            message: 'Chrome runtime message dropped: ' + chrome.runtime.lastError.message,
            error: chrome.runtime.lastError.message,
            stack: 'chrome.runtime.lastError at sendMessage(RUN_FULL_PIPELINE)',
            canRetry: true
          });
          return;
        }

        if (res?.aborted) {
          const plate = document.getElementById(`inline-plate-${targetFlank}`);
          if (plate && !this.activePageIllustrations.has(targetFlank)) plate.remove();
          return;
        }

        // Save any newly discovered named characters (physical descriptions only)
        if (Array.isArray(res?.newCharacters) && res.newCharacters.length > 0) {
          await this.characterTracker.mergeCharacters(this.currentBook.id, res.newCharacters, this.currentPageNumber);
          this.currentCharacters = this.characterTracker.getCharactersForBook(this.currentBook.id);
          this.renderCharacterList();
        }

        // Build synthData from pipeline response for UI update (supports both .data and flat properties)
        const rawSynth = res?.data || res;
        const synthData = {
          momentTitle: rawSynth?.momentTitle || 'Illuminated Scene',
          selectedExcerpt: rawSynth?.selectedExcerpt || rawSynth?.momentDescription || '',
          sceneSummary: rawSynth?.sceneSummary || rawSynth?.momentDescription || '',
          theme: rawSynth?.theme || '',
          focalRange: rawSynth?.focalRange || '',
          aspectRatio: rawSynth?.aspectRatio || this.aspectRatio || '3:4',
          imagePrompt: rawSynth?.imagePrompt || ''
        };

        this.currentPromptData = synthData;

        // Ensure excerpt is highlighted if not already marked
        const excerpt = synthData.selectedExcerpt || synthData.sceneSummary || '';
        const existingMark = this.proseContentArea.querySelector(`mark.illuminated-excerpt[data-flank="${targetFlank}"]`);
        if (!existingMark && excerpt) {
          this.highlightProseExcerpt(excerpt, targetFlank, false);
        }

        // Find associated paragraph for the plate
        const targetP = this.proseContentArea.querySelector(`mark.illuminated-excerpt[data-flank="${targetFlank}"]`)?.closest('p')
          || (targetFlank === 'right'
            ? this.proseContentArea.querySelector('.prose-body p, p')
            : this.proseContentArea.querySelectorAll('.prose-body p, p')[1] || this.proseContentArea.querySelector('p'));

        // Update AI Studio Drawer
        if (this.lblPromptPageBadge) this.lblPromptPageBadge.textContent = `Page ${this.currentPageNumber} • ${this.currentBook.title}`;
        this.studioMomentTitle.textContent = synthData.momentTitle;
        this.studioMomentDesc.textContent = synthData.sceneSummary;
        if (this.studioMomentExcerpt) this.studioMomentExcerpt.textContent = excerpt ? `“${excerpt}”` : 'Illustrated passage from page context';
        this.studioMomentRatio.textContent = synthData.aspectRatio;
        this.studioMomentOptics.textContent = `Optics: ${synthData.focalRange || 'Dynamic'}`;
        this.studioMomentTheme.textContent = `Theme: ${synthData.theme || 'Autonomous'}`;
        this.txtPromptPlate.value = synthData.imagePrompt;
        this.txtPromptNegative.value = 'Universal Negative Prompt: text, watermark, low quality, deformed, blurry';
        this.highlightPromptUpdate();

        if (res?.success && res?.imageUrl) {
          const illRecord = {
            imageUrl: res.imageUrl,
            prompt: synthData.imagePrompt,
            aspectRatio: synthData.aspectRatio,
            momentTitle: synthData.momentTitle,
            selectedExcerpt: synthData.selectedExcerpt,
            sceneSummary: synthData.sceneSummary,
            theme: synthData.theme,
            optics: synthData.focalRange,
            flank: targetFlank,
            engine: res.engine || 'gemini-3.8'
          };
          this.activePageIllustrations.set(targetFlank, illRecord);
          await storage.cacheIllustration(this.currentBook.id, this.currentPageNumber, targetFlank, illRecord);
          this.updateCacheStats();

          // If plate was already docked in targetP by Stage 2 excerpt chosen notification,
          // smoothly reveal image directly into the existing fog box without layout jump
          const plate = document.getElementById(`inline-plate-${targetFlank}`);
          if (plate && targetP && plate.parentElement === targetP) {
            const errCard = plate.querySelector('.inline-plate-error-card');
            if (errCard) errCard.remove();
            const loader = plate.querySelector('.inline-plate-loader');
            const img = plate.querySelector('.inline-plate-img');
            if (img) {
              img.src = res.imageUrl;
              img.style.display = 'block';
              if (img.complete && img.naturalWidth > 0) {
                img.style.opacity = '1';
                if (loader) loader.style.display = 'none';
              }
            }
          } else if (targetP) {
            this.mountInlinePlate(targetP, targetFlank, illRecord, false);
          } else {
            const fallbackPlate = document.getElementById(`inline-plate-${targetFlank}`);
            if (fallbackPlate) {
              const errCard = fallbackPlate.querySelector('.inline-plate-error-card');
              if (errCard) errCard.remove();
              const loader = fallbackPlate.querySelector('.inline-plate-loader');
              const img = fallbackPlate.querySelector('.inline-plate-img');
              if (loader) loader.style.display = 'none';
              if (img) { img.src = res.imageUrl; img.style.display = 'block'; img.style.opacity = '1'; }
            }
          }
        } else {
          console.warn('[SanctuaryReader] RUN_FULL_PIPELINE did not return image:', res?.message || res?.error);
          const isNotLoggedIn = res?.reason === 'NOT_LOGGED_IN' || (res?.message && res.message.toLowerCase().includes('sign in'));
          const isTimeout = Boolean(res?.error && res.error.includes('timed out'));
          let displayMsg = res?.message || res?.error || 'Gemini did not return an image for this passage.';
          if (!isNotLoggedIn && !isTimeout && displayMsg.includes('Please check your session')) {
            displayMsg = res?.geminiText
              ? `Gemini notice: "${res.geminiText}"`
              : 'Gemini declined this specific passage. Try clicking "Inspect Prompt" to simplify or highlight a different excerpt.';
          } else if (isTimeout) {
            displayMsg = 'Gemini image generation took longer than expected. Click Retry to re-generate.';
          }
          this.showInlinePlateError(targetFlank, {
            title: isNotLoggedIn ? 'Google Session Required' : (isTimeout ? 'Generation Timed Out' : (res?.status ? `Gemini Error (HTTP ${res.status})` : 'Illustration Failed')),
            message: displayMsg,
            error: res?.error,
            status: res?.status,
            stack: res?.stack,
            details: res?.details,
            rawSnippet: res?.rawSnippet,
            synthError: res?.synthError,
            geminiText: res?.geminiText,
            isNotLoggedIn,
            canRetry: true
          });
        }
      } catch (pipelineCallbackErr) {
        console.error('[SanctuaryReader] Error processing RUN_FULL_PIPELINE response:', pipelineCallbackErr);
        this.showInlinePlateError(targetFlank, {
          title: 'Display Error',
          message: 'An error occurred while updating the illustration: ' + pipelineCallbackErr.message,
          error: pipelineCallbackErr.message,
          stack: pipelineCallbackErr.stack,
          canRetry: true
        });
      }
    });
  }

  /**
   * Compatibility wrappers for legacy/test callers
   */
  async gatherCharactersAndSynthesize(pageText, sessionToken = null) {
    return this.runFullPipeline(pageText, { sessionToken });
  }

  async synthesizeAndGenerate(pageText, options = {}) {
    return this.runFullPipeline(pageText, options);
  }

  /**
   * Re-renders the plate for a specific flank with its current prompt or edited prompt.
   * On hover: ONLY "↻ Re-Render" appears.
   */
  async reRenderInlinePlate(flank) {
    let illData = this.activePageIllustrations.get(flank);

    const plate = document.getElementById(`inline-plate-${flank}`);
    if (plate) {
      const errCard = plate.querySelector('.inline-plate-error-card');
      if (errCard) errCard.remove();
      const loader = plate.querySelector('.inline-plate-loader');
      const img = plate.querySelector('.inline-plate-img');
      if (loader) loader.style.display = 'flex';
      if (img) img.style.opacity = '0.35';
    }

    if (!illData) {
      // Recovery for failed generations: if no active illustration yet for this flank,
      // re-trigger synthesis and generation from the current page text or current prompt data!
      const pageIndex = this.currentPageNumber - 1;
      const pageData = this.currentBook?.pages[pageIndex];
      if (pageData && pageData.text) {
        await this.synthesizeAndGenerate(pageData.text, { targetFlank: flank });
      }
      return;
    }

    let prompt = illData.prompt;
    if (this.currentCharacters && this.currentCharacters.length > 0 && prompt) {
      if (containsAnyCharacterName(prompt, this.currentCharacters)) {
        prompt = this.characterTracker.substituteNames(prompt, this.currentCharacters);
      }
    }

    const aspectRatio = illData.aspectRatio || this.aspectRatio || '3:4';

    chrome.runtime.sendMessage({
      action: 'GENERATE_GEMINI_IMAGE',
      payload: {
        prompt,
        aspectRatio,
        pageNumber: this.currentPageNumber,
        fullPageText: illData.selectedExcerpt || '',
        bookTitle: this.currentBook.title,
        author: this.currentBook.author,
        flank
      }
    }, async (res) => {
      if (res && res.success && res.imageUrl) {
        illData.imageUrl = res.imageUrl;
        await storage.cacheIllustration(this.currentBook.id, this.currentPageNumber, flank, illData);
        this.updateCacheStats();

        if (plate) {
          const errCard = plate.querySelector('.inline-plate-error-card');
          if (errCard) errCard.remove();
          const loader = plate.querySelector('.inline-plate-loader');
          const img = plate.querySelector('.inline-plate-img');
          if (loader) loader.style.display = 'none';
          if (img) {
            img.src = res.imageUrl;
            img.style.display = 'block';
            img.style.opacity = '1';
          }
        }
      } else {
        const isNotLoggedIn = res?.reason === 'NOT_LOGGED_IN' || (res?.message && res.message.toLowerCase().includes('sign in'));
        let displayMsg = res?.message || res?.error || 'Gemini did not return an image for re-render.';
        if (!isNotLoggedIn && displayMsg.includes('Please check your session or try re-crafting the prompt')) {
          displayMsg = res?.geminiText
            ? `Gemini notice: "${res.geminiText}"`
            : 'Gemini declined this prompt. Click "Inspect Prompt" to simplify or rephrase.';
        }
        this.showInlinePlateError(flank, {
          title: isNotLoggedIn ? 'Google Session Required' : (res?.status ? `Gemini Error (HTTP ${res.status})` : 'Re-Render Failed'),
          message: displayMsg,
          error: res?.error,
          status: res?.status,
          stack: res?.stack,
          details: res?.details,
          rawSnippet: res?.rawSnippet,
          isNotLoggedIn,
          canRetry: true
        });
      }
    });
  }

  /**
   * Re-crafts the prominent scene prompt from the AI Studio drawer.
   */
  async regeneratePrompt() {
    if (!this.currentBook || this.currentPageNumber === 1) return;
    this.promptVariationIndex++;
    const pageIndex = this.currentPageNumber - 1;
    const pageData = this.currentBook.pages[pageIndex];
    if (!pageData) return;
    const primaryFlank = this.activePageIllustrations.has('left') && !this.activePageIllustrations.has('right') ? 'left' : 'right';
    this.runFullPipeline(pageData.text, { targetFlank: primaryFlank });
  }

  /**
   * Re-crafts the prompt when the user clicks "New Prompt" on hover over a highlighted excerpt.
   */
  async regeneratePromptForExcerpt(flank, excerptText) {
    if (!this.currentBook || this.currentPageNumber === 1) return;

    this.promptVariationIndex++;

    const plate = document.getElementById(`inline-plate-${flank}`);
    if (plate) {
      const loader = plate.querySelector('.inline-plate-loader');
      const img = plate.querySelector('.inline-plate-img');
      if (loader) loader.style.display = 'flex';
      if (img) img.style.opacity = '0.35';
    }

    const pageIndex = this.currentPageNumber - 1;
    const pageData = this.currentBook.pages[pageIndex];
    if (!pageData) return;

    this.runFullPipeline(pageData.text, {
      targetFlank: flank,
      selectedExcerpt: excerptText
    });
  }

  /**
   * Legacy re-render trigger (e.g. from studio drawer generate button)
   */
  async reRenderPlate(customPrompt = null) {
    const primaryFlank = this.activePageIllustrations.has('right') ? 'right' : 'left';
    const illData = this.activePageIllustrations.get(primaryFlank);
    if (illData && customPrompt) {
      illData.prompt = customPrompt;
    }
    await this.reRenderInlinePlate(primaryFlank);
  }

  inspectPrompt() {
    this.toggleStudioDrawer(true);
    if (this.txtPromptPlate) {
      this.txtPromptPlate.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.txtPromptPlate.focus();
      this.txtPromptPlate.style.boxShadow = '0 0 12px var(--gold-accent)';
      setTimeout(() => { if (this.txtPromptPlate) this.txtPromptPlate.style.boxShadow = ''; }, 1200);
    }
  }

  truncate(str, max = 32) {
    if (!str) return '';
    return str.length <= max ? str : str.slice(0, max) + '...';
  }

  highlightPromptUpdate() {
    if (this.txtPromptPlate) {
      this.txtPromptPlate.classList.add('prompt-updated');
      setTimeout(() => {
        this.txtPromptPlate?.classList.remove('prompt-updated');
      }, 700);
    }
  }

  scrollToHighlightedExcerpt() {
    const el = this.proseContentArea?.querySelector('#active-illuminated-excerpt, mark.illuminated-excerpt, .paragraph-highlighted-excerpt');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.outline = '2px solid var(--gold-accent)';
      el.style.outlineOffset = '4px';
      setTimeout(() => { if (el) el.style.outline = ''; }, 1600);
    }
  }

  // ==================== NAVIGATION ====================

  navigatePage(delta) {
    if (!this.currentBook) return;
    const totalPages = this.currentBook.totalPages || this.currentBook.pages.length;
    const targetPage = this.currentPageNumber + delta;

    if (targetPage >= 1 && targetPage <= totalPages) {
      this.currentPageNumber = targetPage;
      this.renderCurrentPage();
    }
  }

  jumpToPage(pageNumber) {
    if (!this.currentBook) return;
    const totalPages = this.currentBook.totalPages || this.currentBook.pages.length;
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      this.currentPageNumber = pageNumber;
      this.renderCurrentPage();
    }
  }

  // ==================== PREFERENCES & STYLES ====================

  setTheme(themeName, persist = true) {
    this.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);

    // Update Erised logo to match light or dark mode
    const logoImg = document.querySelector('.erised-logo-img');
    if (logoImg) {
      logoImg.src = themeName === 'obsidian' ? 'icons/Dark_Logo_BG.jpg' : 'icons/Light_Logo.png';
    }

    this.themeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === themeName);
    });

    if (persist) storage.saveSetting('theme', themeName);
  }

  adjustFontSize(delta) {
    this.setFontSize(this.fontSize + delta);
  }

  setFontSize(sizePx, persist = true) {
    this.fontSize = Math.max(14, Math.min(28, sizePx));
    document.documentElement.style.setProperty('--font-size-base', `${this.fontSize}px`);
    if (this.proseContentArea) {
      this.proseContentArea.style.fontSize = `${this.fontSize}px`;
    }
    if (this.lblFontSize) {
      this.lblFontSize.textContent = `${this.fontSize}px`;
    }
    if (persist) storage.saveSetting('fontSize', this.fontSize);
  }

  setArtStyle(styleId = 'ethereal_watercolor', persist = true) {
    this.artStyle = styleId;
    const style = ART_STYLES[styleId] || ART_STYLES.ethereal_watercolor;
    if (this.lblActiveStyle) {
      this.lblActiveStyle.textContent = style.name.split(' ')[0];
    }

    document.querySelectorAll('.style-card-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.styleId === styleId);
    });

    if (persist) {
      storage.saveSetting('artStyle', styleId);
      // If currently on reading page >= 2, re-synthesize prompt with the new art style
      if (this.currentBook && this.currentPageNumber > 1) {
        const pageIndex = this.currentPageNumber - 1;
        const pageData = this.currentBook.pages[pageIndex];
        if (pageData) {
          this.runFullPipeline(pageData.text);
        }
      }
    }
  }

  setEngine(engineName = 'gemini', persist = true) {
    this.engine = 'gemini';
    if (this.engineGemini) this.engineGemini.checked = true;
    if (persist) storage.saveSetting('engine', 'gemini');
  }

  setAspectRatio(ratio = '3:4', persist = true) {
    this.aspectRatio = ratio;
    if (this.lblActiveAspectRatio) {
      this.lblActiveAspectRatio.textContent = ratio;
    }
    if (this.aspectRatioBtns) {
      this.aspectRatioBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-ratio') === ratio);
      });
    }
    if (persist) {
      storage.saveSetting('aspectRatio', ratio);
    }
  }

  toggleStudioDrawer(forceState = null) {
    this.studioOpen = (forceState !== null) ? forceState : !this.studioOpen;
    document.body.classList.toggle('studio-open', this.studioOpen);
  }

  // ==================== FILE INGESTION ====================

  async handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let parsedBook = null;
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.epub')) {
        const buffer = await file.arrayBuffer();
        parsedBook = await EpubParser.parse(buffer);
      } else if (fileName.endsWith('.pdf')) {
        parsedBook = await PdfParser.parse(file, file.name);
      } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        const text = await file.text();
        parsedBook = this.parsePlainText(text, file.name);
      } else {
        alert('Supported formats: .epub, .pdf, .txt, .md');
        return;
      }

      if (parsedBook) {
        // Extract full book text into a single unified string
        const fullText = (parsedBook.pages || [])
          .filter(p => p.pageNumber > 1)
          .map(p => p.text)
          .join('\n\n');
        parsedBook.fullText = fullText;

        await storage.saveBook(parsedBook);
        this.booksList = await storage.getAllBooks();
        this.populateBookDropdown();
        await this.selectBook(parsedBook.id);

        // Analyze whole book for named characters automatically on upload
        this.scanBookCharacters(parsedBook);
      }
    } catch (err) {
      console.error('File parsing error:', err);
      alert(`Failed to ingest book: ${err.message}`);
    } finally {
      this.fileUploader.value = '';
    }
  }

  parsePlainText(rawText, fileName) {
    const title = fileName.replace(/\.[^/.]+$/, '');
    const paragraphs = rawText.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    const rawChapters = [{
      index: 0,
      title: title,
      blocks: paragraphs.map(p => ({ type: 'paragraph', text: p, html: `<p>${p}</p>` }))
    }];

    const coverUrl = EpubParser.createOrnamentalCoverSvg(title, 'Imported Document');
    const pages = EpubParser.segmentIntoPages(rawChapters, title, 'Imported Document', coverUrl);

    return {
      id: 'txt_' + Date.now(),
      title,
      author: 'Imported Document',
      language: 'en',
      coverUrl,
      pages,
      totalPages: pages.length,
      stats: { totalWords: pages.reduce((a, b) => a + (b.wordCount || 0), 0) },
      createdAt: Date.now()
    };
  }

  // ==================== CHARACTER CODEX & DRAMATIS PERSONAE ====================

  renderCharacterList() {
    if (!this.characterCardsList) return;
    this.characterCardsList.innerHTML = '';
    const chars = this.currentCharacters || [];

    if (this.lblCharacterCount) {
      this.lblCharacterCount.textContent = `${chars.length} Tracked`;
    }

    if (chars.length === 0) {
      this.characterCardsList.innerHTML = `
        <div style="font-size: 11px; color: var(--text-muted); font-style: italic; padding: 6px 0;">
          No characters detected yet. Character introductions will be recognized automatically as you read, or you can add them manually.
        </div>
      `;
      return;
    }

    chars.forEach(c => {
      const card = document.createElement('div');
      card.className = 'character-card';
      const aliasesStr = (c.aliases || []).filter(a => a && a.toLowerCase() !== c.name.toLowerCase()).join(', ');

      const activeEra = getActiveEraForPage(c, this.currentPageNumber);
      const activeDesc = getCharacterDescriptionForPage(c, this.currentPageNumber) || c.description || 'No physical description recorded';
      const hasMultipleEras = Array.isArray(c.eras) && c.eras.length > 1;

      let eraPillHtml = '';
      if (activeEra) {
        const pageSpan = activeEra.endPage ? `p. ${activeEra.startPage}–${activeEra.endPage}` : `p. ${activeEra.startPage}+`;
        eraPillHtml = `
          <div class="char-era-badge" style="display: inline-block; font-size: 10px; background: rgba(217, 119, 6, 0.2); border: 1px solid var(--border-gold); color: var(--gold-accent); padding: 2px 7px; border-radius: 4px; margin-bottom: 6px; font-weight: 600;">
            Page ${this.currentPageNumber} State: ${this.escapeHtml(activeEra.context || 'Current Era')} (${pageSpan})
          </div>
        `;
      }

      let erasTimelineHtml = '';
      if (hasMultipleEras) {
        const erasItems = c.eras.map(e => {
          const isCurrent = (e === activeEra);
          const span = e.endPage ? `p. ${e.startPage}–${e.endPage}` : `p. ${e.startPage}+`;
          return `
            <div style="padding: 4px 6px; margin-bottom: 4px; background: ${isCurrent ? 'rgba(217, 119, 6, 0.15)' : 'rgba(255,255,255,0.03)'}; border-left: 2px solid ${isCurrent ? 'var(--gold-accent)' : 'var(--border-color)'}; font-size: 10.5px;">
              <span style="font-weight: 600; color: ${isCurrent ? 'var(--gold-accent)' : 'var(--text-main)'};">${this.escapeHtml(e.context || 'Era')} (${span})</span>
              <div style="color: var(--text-muted); font-size: 10px; margin-top: 2px;">${this.escapeHtml(e.description)}</div>
            </div>
          `;
        }).join('');

        erasTimelineHtml = `
          <details style="margin-top: 6px; font-size: 10px; color: var(--text-muted); cursor: pointer;">
            <summary style="color: var(--gold-glow); font-weight: 600; padding: 2px 0;">View all ${c.eras.length} wardrobe & era changes throughout book</summary>
            <div style="margin-top: 6px; padding-left: 4px;">
              ${erasItems}
            </div>
          </details>
        `;
      }

      card.innerHTML = `
        <div class="char-header-row">
          <span class="char-name">${this.escapeHtml(c.name)}</span>
          <span class="char-page-badge">Page ${c.introducedAtPage || 1}+</span>
        </div>
        ${aliasesStr ? `<div class="char-aliases">Aliases: ${this.escapeHtml(aliasesStr)}</div>` : ''}
        ${eraPillHtml}
        <div class="char-desc-snippet" title="Active visual description & wardrobe substituted into image prompts for Page ${this.currentPageNumber}">
          ${this.escapeHtml(activeDesc)}
        </div>
        ${erasTimelineHtml}
        <div class="char-actions-row">
          <button class="btn-char-action btn-char-edit" data-id="${c.id}">✎ Edit</button>
          <button class="btn-char-action btn-char-delete" data-id="${c.id}">✕ Remove</button>
        </div>
      `;

      card.querySelector('.btn-char-edit')?.addEventListener('click', () => this.editCharacter(c.id));
      card.querySelector('.btn-char-delete')?.addEventListener('click', () => this.deleteCharacter(c.id));
      this.characterCardsList.appendChild(card);
    });
  }

  toggleCharacterForm(forceShow = null) {
    if (!this.characterEditForm) return;
    const shouldShow = forceShow !== null ? forceShow : (this.characterEditForm.style.display === 'none');
    this.characterEditForm.style.display = shouldShow ? 'block' : 'none';
    if (shouldShow && !this.editingCharId) {
      this.charFormTitle.textContent = 'Add Character Visual Dossier';
      this.inputCharId.value = '';
      this.inputCharName.value = '';
      this.inputCharAliases.value = '';
      this.inputCharDesc.value = '';
      this.inputCharName.focus();
    }
  }

  hideCharacterForm() {
    if (!this.characterEditForm) return;
    this.characterEditForm.style.display = 'none';
    this.editingCharId = null;
    this.inputCharId.value = '';
    this.inputCharName.value = '';
    this.inputCharAliases.value = '';
    this.inputCharDesc.value = '';
  }

  editCharacter(charId) {
    const char = (this.currentCharacters || []).find(c => c.id === charId);
    if (!char || !this.characterEditForm) return;

    this.editingCharId = charId;
    this.charFormTitle.textContent = `Edit Dossier: ${char.name}`;
    this.inputCharId.value = char.id || '';
    this.inputCharName.value = char.name || '';
    this.inputCharAliases.value = (char.aliases || []).filter(a => a !== char.name).join(', ');
    this.inputCharDesc.value = char.description || '';

    this.toggleCharacterForm(true);
    this.inputCharDesc.focus();
  }

  async deleteCharacter(charId) {
    if (!this.currentBook) return;
    const char = (this.currentCharacters || []).find(c => c.id === charId);
    if (!char) return;

    if (!confirm(`Remove "${char.name}" from this book's character dossier?`)) return;

    this.currentCharacters = (this.currentCharacters || []).filter(c => c.id !== charId);
    await storage.saveCharacters(this.currentBook.id, this.currentCharacters);
    this.characterTracker.activeCharactersCache.set(this.currentBook.id, this.currentCharacters);
    this.renderCharacterList();
  }

  async saveCharacterForm() {
    if (!this.currentBook) return;

    const name = this.inputCharName.value.trim();
    const desc = this.inputCharDesc.value.trim();
    if (!name) {
      alert('Please enter a character name.');
      this.inputCharName.focus();
      return;
    }
    if (!desc) {
      alert('Please enter a physical visual description for this character.');
      this.inputCharDesc.focus();
      return;
    }

    const aliasesRaw = this.inputCharAliases.value.trim();
    const aliases = Array.from(new Set([
      name,
      ...aliasesRaw.split(',').map(s => s.trim()).filter(Boolean)
    ]));

    const charObj = {
      id: this.inputCharId.value || `char_${Date.now()}`,
      name,
      aliases,
      description: desc,
      introducedAtPage: this.currentPageNumber || 1
    };

    await this.characterTracker.addOrUpdateCharacter(this.currentBook.id, charObj);
    this.currentCharacters = this.characterTracker.getCharactersForBook(this.currentBook.id);
    this.renderCharacterList();
    this.hideCharacterForm();

    // If currently displaying a prompt, re-substitute names
    if (this.txtPromptPlate && this.txtPromptPlate.value && !this.txtPromptPlate.value.includes('Page 1: Title Folio')) {
      this.txtPromptPlate.value = this.characterTracker.substituteNames(this.txtPromptPlate.value, this.currentCharacters);
      this.highlightPromptUpdate();
    }
  }

  /**
   * Scans the full text of the ebook by dividing it into sequential 30-page sections
   * and scanning each section in a SINGLE continuous Gemini chat thread.
   */
  async scanBookCharacters(bookToScan = null) {
    const book = bookToScan || this.currentBook;
    if (!book) return;

    // 1. Divide book into 30-page sections
    const readingPages = (book.pages || []).filter(p => !p.isTitlePage && (p.pageNumber || 0) > 1);
    const targetPages = readingPages.length > 0 ? readingPages : (book.pages || []);
    const BATCH_SIZE = 30;
    const sections = [];

    if (targetPages.length > 0) {
      for (let i = 0; i < targetPages.length; i += BATCH_SIZE) {
        const batch = targetPages.slice(i, i + BATCH_SIZE);
        const startPage = batch[0].pageNumber || (i + 2);
        const endPage = batch[batch.length - 1].pageNumber || (i + batch.length + 1);
        const sectionText = batch.map(p => `=== [PAGE ${p.pageNumber || (i + 2)}] ===\n${(p.text || '').trim()}`).join('\n\n');
        if (sectionText.trim().length >= 20) {
          sections.push({ startPage, endPage, sectionText, sectionIndex: sections.length });
        }
      }
    } else if (book.fullText) {
      const fullText = book.fullText;
      const CHUNK_CHARS = 60000;
      for (let i = 0; i < fullText.length; i += CHUNK_CHARS) {
        const chunkText = fullText.slice(i, i + CHUNK_CHARS);
        const startPage = Math.floor(i / 2000) + 2;
        const endPage = Math.floor(Math.min(i + CHUNK_CHARS, fullText.length) / 2000) + 1;
        const markedText = `=== [PAGE ${startPage}] ===\n${chunkText.trim()}`;
        if (chunkText.trim().length >= 20) {
          sections.push({ startPage, endPage: Math.max(startPage, endPage), sectionText: markedText, sectionIndex: sections.length });
        }
      }
    }

    if (sections.length === 0) return;

    if (this.characterScanStatus) {
      this.characterScanStatus.style.display = 'block';
      this.characterScanStatus.textContent = `Segmented into ${sections.length} sections (30 pages each). Initializing single Gemini chat...`;
    }
    if (this.btnScanCharacters) this.btnScanCharacters.disabled = true;

    try {
      let conversationContext = null;
      let lastScanError = null;

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        if (this.characterScanStatus) {
          this.characterScanStatus.textContent = `Scanning pages ${sec.startPage}–${sec.endPage} (Section ${i + 1} of ${sections.length}) in single chat...`;
        }

        const res = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'ANALYZE_BOOK_SECTION',
            payload: {
              sectionText: sec.sectionText,
              bookTitle: book.title,
              author: book.author,
              startPage: sec.startPage,
              endPage: sec.endPage,
              sectionIndex: i,
              totalSections: sections.length,
              conversationContext,
              existingCharacters: this.currentCharacters || []
            }
          }, (response) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(response || { success: false, error: 'No response from background' });
            }
          });
        });

        if (res?.conversationContext?.conversationId) {
          conversationContext = res.conversationContext;
        }

        if (res?.success && Array.isArray(res.characters) && res.characters.length > 0) {
          await this.characterTracker.mergeCharacters(book.id, res.characters, sec.startPage);
          if (this.currentBook?.id === book.id) {
            this.currentCharacters = this.characterTracker.getCharactersForBook(book.id);
            this.renderCharacterList();
          }
        } else if (!res?.success && res?.error) {
          console.warn(`[SanctuaryReader] Section ${i + 1} error:`, res.error);
          lastScanError = res.error;
        }
      }

      const finalCharacters = this.characterTracker.getCharactersForBook(book.id);
      if (this.characterScanStatus) {
        if (finalCharacters.length > 0) {
          this.characterScanStatus.textContent = `✓ Scan complete! ${finalCharacters.length} named characters cataloged in single chat across ${sections.length} sections.`;
        } else {
          this.characterScanStatus.textContent = lastScanError
            ? `Scan error: ${lastScanError}. Please check your active Gemini session.`
            : `Scan finished: No named characters extracted. Please verify your active Gemini session at gemini.google.com.`;
        }
        setTimeout(() => {
          if (this.characterScanStatus) this.characterScanStatus.style.display = 'none';
        }, 10000);
      }
    } catch (err) {
      console.warn('[SanctuaryReader] 30-page section character scan failed:', err);
      if (this.characterScanStatus) {
        this.characterScanStatus.textContent = err.message || 'Character scan interrupted.';
        setTimeout(() => {
          if (this.characterScanStatus) this.characterScanStatus.style.display = 'none';
        }, 5000);
      }
    } finally {
      if (this.btnScanCharacters) this.btnScanCharacters.disabled = false;
    }
  }

  /**
   * Converts and exports the active ebook as a clean, formatted .TXT file download.
   */
  exportCurrentBookAsTxt() {
    if (!this.currentBook) {
      alert('Please select or upload a book first.');
      return;
    }

    const fullText = this.currentBook.fullText || (this.currentBook.pages || [])
      .filter(p => p.pageNumber > 1)
      .map(p => p.text)
      .join('\n\n');

    if (!fullText) {
      alert('No book text found to export.');
      return;
    }

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (this.currentBook.title || 'book').replace(/[^a-zA-Z0-9_\-]/g, '_');
    a.download = `${safeTitle}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==================== LIGHTBOX & UTILITIES ====================

  openLightbox(src, caption, illustrationData = null) {
    this.lightboxImg.src = src;
    this.lightboxCaption.textContent = caption || 'Illuminated Fine-Art Scene';
    this.currentLightboxIllustration = illustrationData || this.activePageIllustrations.get('right') || this.activePageIllustrations.get('left');

    if (this.lightboxExcerpt && this.currentLightboxIllustration?.selectedExcerpt) {
      this.lightboxExcerpt.textContent = `“${this.currentLightboxIllustration.selectedExcerpt}”`;
      this.lightboxExcerpt.style.display = 'block';
    } else if (this.lightboxExcerpt) {
      this.lightboxExcerpt.style.display = 'none';
    }

    if (this.lightboxPromptBox && this.currentLightboxIllustration?.prompt) {
      if (this.lightboxPromptText) {
        this.lightboxPromptText.textContent = this.currentLightboxIllustration.prompt;
      }
      if (this.lightboxPromptFlank) {
        const flankName = (this.currentLightboxIllustration.flank === 'left') ? 'Left Flank' : 'Right Flank';
        this.lightboxPromptFlank.textContent = `${flankName} • ${this.currentLightboxIllustration.aspectRatio || this.aspectRatio || '3:4'}`;
      }
      this.lightboxPromptBox.style.display = 'block';
    } else if (this.lightboxPromptBox) {
      this.lightboxPromptBox.style.display = 'none';
    }

    if (this.linkLightboxDownload) {
      this.linkLightboxDownload.href = src;
    }

    this.lightboxModal.style.display = 'flex';
  }

  closeLightbox() {
    this.lightboxModal.style.display = 'none';
  }

  // ==================== TABLE OF CONTENTS (TOC) ====================

  openToc() {
    if (!this.currentBook || !this.tocModal) return;

    const totalPages = this.currentBook.totalPages || this.currentBook.pages.length;

    // Set Book Title in TOC header
    if (this.tocBookTitle) {
      this.tocBookTitle.textContent = `${this.currentBook.title} — ${this.currentBook.author}`;
    }

    // Set direct page jump limits & value
    if (this.tocPageInput) {
      this.tocPageInput.min = '1';
      this.tocPageInput.max = String(totalPages);
      this.tocPageInput.value = String(this.currentPageNumber);
    }
    if (this.tocPageLimit) {
      this.tocPageLimit.textContent = `of ${totalPages}`;
    }

    // Populate chapters list
    if (this.tocChaptersList) {
      this.tocChaptersList.innerHTML = '';

      const chapters = [];
      let lastSeenTitle = null;

      this.currentBook.pages.forEach((page, idx) => {
        const pageNum = page.pageNumber || (idx + 1);
        let title = page.chapterTitle;
        if (!title) {
          title = (page.isTitlePage || pageNum === 1) ? 'Frontispiece & Title Folio' : `Section Page ${pageNum}`;
        }
        if (title !== lastSeenTitle || page.isTitlePage) {
          chapters.push({
            title,
            startPage: pageNum,
            isTitlePage: Boolean(page.isTitlePage || pageNum === 1)
          });
          lastSeenTitle = title;
        }
      });

      // Find which chapter corresponds to current page
      let activeChapterIdx = 0;
      for (let i = 0; i < chapters.length; i++) {
        if (this.currentPageNumber >= chapters[i].startPage) {
          activeChapterIdx = i;
        } else {
          break;
        }
      }

      chapters.forEach((ch, idx) => {
        const item = document.createElement('div');
        const isActive = (idx === activeChapterIdx);
        item.className = `toc-chapter-item ${isActive ? 'active' : ''}`;
        item.innerHTML = `
          <div class="toc-chapter-title">${this.escapeHtml(ch.title)}</div>
          <span class="toc-chapter-page-badge">Page ${ch.startPage}</span>
        `;
        item.addEventListener('click', () => {
          this.jumpToPage(ch.startPage);
          this.closeToc();
        });
        this.tocChaptersList.appendChild(item);
      });
    }

    this.tocModal.style.display = 'flex';
    if (this.tocPageInput) {
      setTimeout(() => this.tocPageInput.focus(), 80);
    }
  }

  closeToc() {
    if (this.tocModal) {
      this.tocModal.style.display = 'none';
    }
  }

  handleTocPageJump() {
    if (!this.currentBook || !this.tocPageInput) return;
    const totalPages = this.currentBook.totalPages || this.currentBook.pages.length;
    const targetPage = parseInt(this.tocPageInput.value, 10);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      this.jumpToPage(targetPage);
      this.closeToc();
    } else {
      this.tocPageInput.style.borderColor = '#ef4444';
      setTimeout(() => {
        if (this.tocPageInput) this.tocPageInput.style.borderColor = '';
      }, 1000);
    }
  }

  async updateCacheStats() {
    if (!this.currentBook) return;
    const count = await storage.getBookIllustrationCount(this.currentBook.id);
    this.statCachedCount.textContent = count;
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Prompt copied to clipboard!');
    });
  }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const reader = new SanctuaryReader();
  reader.init();
});
