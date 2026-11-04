/**
 * PDF Document Ingestion Engine
 * 
 * Uses PDF.js to extract text layers, reconstruct paragraphs,
 * and segment into single-page reading folios (1,800 to 2,400 characters).
 */

export class PdfParser {
  /**
   * Parses a PDF File / ArrayBuffer
   * @param {ArrayBuffer|Blob|File} fileData
   * @param {string} fileName
   */
  static async parse(fileData, fileName = 'Document.pdf') {
    let arrayBuffer = fileData;
    if (fileData instanceof Blob || (typeof File !== 'undefined' && fileData instanceof File)) {
      arrayBuffer = await fileData.arrayBuffer();
    }

    let pdfjs = window.pdfjsLib;
    if (!pdfjs) {
      try {
        pdfjs = await import('../vendor/pdf.min.mjs');
      } catch (err) {
        console.error('Failed to import local pdf.min.mjs:', err);
      }
    }

    if (!pdfjs) {
      throw new Error('PDF.js engine is not available');
    }

    // Set worker source
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = chrome?.runtime?.getURL
        ? chrome.runtime.getURL('vendor/pdf.worker.min.mjs')
        : './vendor/pdf.worker.min.mjs';
    }

    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    // Extract PDF metadata
    let title = fileName.replace(/\.[^/.]+$/, '');
    let author = 'Unknown Author';
    try {
      const meta = await pdfDoc.getMetadata();
      if (meta && meta.info) {
        if (meta.info.Title && meta.info.Title.trim().length > 1) {
          title = meta.info.Title.trim();
        }
        if (meta.info.Author && meta.info.Author.trim().length > 1) {
          author = meta.info.Author.trim();
        }
      }
    } catch (_) {}

    // Extract first page as visual cover thumbnail
    let coverUrl = null;
    try {
      coverUrl = await this.renderPageThumbnail(pdfDoc, 1);
    } catch (e) {
      console.warn('Could not render PDF cover thumbnail:', e);
    }

    if (!coverUrl) {
      coverUrl = this.createDefaultPdfCoverSvg(title, author);
    }

    // Extract text from all pages
    const rawBlocks = [];
    for (let pNum = 1; pNum <= numPages; pNum++) {
      const page = await pdfDoc.getPage(pNum);
      const textContent = await page.getTextContent();
      
      let pageText = '';
      let lastY = null;
      for (const item of textContent.items) {
        if (!item.str) continue;
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = item.transform[5];
      }

      const paragraphs = pageText.split(/\n\s*\n/).map(s => s.trim()).filter(s => s.length > 0);
      paragraphs.forEach(para => {
        rawBlocks.push({
          type: 'paragraph',
          text: para,
          html: `<p>${this.escapeHtml(para)}</p>`
        });
      });
    }

    // Single-Page Chapter Segmentation (1,800 to 2,400 chars)
    const rawChapters = [{
      index: 0,
      title: title,
      blocks: rawBlocks
    }];

    const pages = this.segmentIntoPages(rawChapters, title, author, coverUrl);
    const totalWords = pages.reduce((acc, p) => acc + (p.wordCount || 0), 0);
    const readingTimeMinutes = Math.ceil(totalWords / 200);

    const bookId = 'pdf_' + this.hashCode(title + author) + '_' + Date.now();

    return {
      id: bookId,
      title,
      author,
      language: 'en',
      coverUrl,
      pages,
      totalPages: pages.length,
      stats: {
        totalWords,
        readingTimeMinutes,
        originalPdfPages: numPages
      },
      createdAt: Date.now()
    };
  }

  static async renderPageThumbnail(pdfDoc, pageNum) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.2 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.85);
  }

  static segmentIntoPages(rawChapters, bookTitle, author, coverUrl) {
    const pages = [];

    // Dedicated Page 1 (Title Page with ZERO AI calls)
    pages.push({
      pageNumber: 1,
      isTitlePage: true,
      chapterTitle: 'Frontispiece & Title Folio',
      text: `[TITLE FOLIO: ${bookTitle} by ${author}. PDF Edition.]`,
      html: `
        <div class="sanctuary-title-folio">
          <div class="folio-ornament-top">✦ ✦ ✦</div>
          <div class="folio-cover-frame">
            <img class="folio-cover-img" src="${coverUrl}" alt="${this.escapeHtml(bookTitle)} Cover" />
          </div>
          <h1 class="folio-title">${this.escapeHtml(bookTitle)}</h1>
          <div class="folio-divider">❖</div>
          <h2 class="folio-author">By ${this.escapeHtml(author)}</h2>
          <p class="folio-edition-note">Illuminated Sanctuary &bull; Document Edition</p>
          <div class="folio-start-action">
            <button class="folio-start-btn" id="btn-start-reading-folio">Begin Reading Folio &rarr;</button>
          </div>
          <div class="folio-ornament-bottom">✦ ✦ ✦</div>
        </div>
      `,
      charCount: 200,
      wordCount: 30
    });

    let currentPageNumber = 2;
    const MIN_CHARS = 1800;
    const MAX_CHARS = 2400;

    for (const chapter of rawChapters) {
      let currentBlocks = [];
      let currentLen = 0;

      for (const block of chapter.blocks) {
        const blen = block.text.length;

        if (blen > MAX_CHARS) {
          const sentences = this.splitIntoSentences(block.text);
          for (const s of sentences) {
            if (currentLen + s.length > MAX_CHARS && currentLen >= MIN_CHARS) {
              pages.push(this.compilePage({
                pageNumber: currentPageNumber++,
                chapterTitle: chapter.title,
                blocks: currentBlocks
              }));
              currentBlocks = [];
              currentLen = 0;
            }
            currentBlocks.push({ type: 'paragraph', text: s, html: `<p>${this.escapeHtml(s)}</p>` });
            currentLen += s.length;
          }
          continue;
        }

        if (currentLen + blen > MAX_CHARS && currentLen >= MIN_CHARS) {
          pages.push(this.compilePage({
            pageNumber: currentPageNumber++,
            chapterTitle: chapter.title,
            blocks: currentBlocks
          }));
          currentBlocks = [];
          currentLen = 0;
        }

        currentBlocks.push(block);
        currentLen += blen;
      }

      if (currentBlocks.length > 0) {
        pages.push(this.compilePage({
          pageNumber: currentPageNumber++,
          chapterTitle: chapter.title,
          blocks: currentBlocks
        }));
      }
    }

    return pages;
  }

  static compilePage({ pageNumber, chapterTitle, blocks }) {
    const rawText = blocks.map(b => b.text).join('\n\n');
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;

    let htmlContent = '';
    blocks.forEach((block, idx) => {
      if (idx === 0 && block.text.length > 0) {
        const firstLetter = block.text.charAt(0);
        const rest = block.text.slice(1);
        htmlContent += `<p class="lead-drop-cap"><span class="drop-cap">${this.escapeHtml(firstLetter)}</span>${this.escapeHtml(rest)}</p>`;
      } else {
        htmlContent += `<p>${this.escapeHtml(block.text)}</p>`;
      }
    });

    return {
      pageNumber,
      isTitlePage: false,
      chapterTitle,
      text: rawText,
      html: `
        <div class="sanctuary-page-prose">
          <header class="prose-chapter-header">
            <span class="chapter-label">${this.escapeHtml(chapterTitle)}</span>
            <div class="header-flourish">❦</div>
          </header>
          <div class="prose-body">
            ${htmlContent}
          </div>
          <footer class="prose-footer">
            <span class="footer-dot">✦</span>
            <span class="footer-page">Page ${pageNumber}</span>
            <span class="footer-dot">✦</span>
          </footer>
        </div>
      `,
      charCount: rawText.length,
      wordCount
    };
  }

  static splitIntoSentences(text) {
    const matches = text.match(/[^.!?]+[.!?]+["']?(?=\s|$)/g);
    if (!matches || matches.length === 0) return [text];
    return matches.map(s => s.trim()).filter(Boolean);
  }

  static escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  static createDefaultPdfCoverSvg(title, author) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
        <rect width="600" height="900" fill="#1e293b"/>
        <rect x="30" y="30" width="540" height="840" rx="8" fill="none" stroke="#e2e8f0" stroke-width="2"/>
        <text x="300" y="400" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#f8fafc" text-anchor="middle">
          ${this.escapeHtml(title.slice(0, 32))}
        </text>
        <text x="300" y="480" font-family="Georgia, serif" font-size="20" fill="#94a3b8" text-anchor="middle">
          ${this.escapeHtml(author)}
        </text>
        <text x="300" y="750" font-family="Georgia, serif" font-size="14" fill="#64748b" text-anchor="middle">
          PDF ILLUMINATED READER
        </text>
      </svg>
    `;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
  }
}

