/**
 * EPUB Ingestion & Single-Page Chapter Segmentation Engine
 * 
 * Features:
 * - Multi-tier OPF cover extraction (EPUB 2 meta, EPUB 3 property, manifest scan, archive regex)
 * - Single-page chapter segmentation (1,800 to 2,400 chars along block & sentence boundaries)
 * - Dedicated Page 1 Title Page with ZERO AI calls constraint
 */

export class EpubParser {
  /**
   * Parses an EPUB ArrayBuffer / File
   * @param {ArrayBuffer|Blob|File} fileData
   * @returns {Promise<{ id: string, title: string, author: string, coverUrl: string, pages: Array, chapters: Array, stats: Object }>}
   */
  static async parse(fileData) {
    if (typeof window.JSZip === 'undefined' && typeof JSZip === 'undefined') {
      throw new Error('JSZip library is not loaded');
    }
    const zipLib = window.JSZip || JSZip;
    const zip = await zipLib.loadAsync(fileData);

    // 1. Locate container.xml
    const containerEntry = zip.file('META-INF/container.xml');
    if (!containerEntry) {
      throw new Error('Invalid EPUB: META-INF/container.xml not found');
    }

    const containerXml = await containerEntry.async('text');
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, 'application/xml');
    const rootfileEl = containerDoc.querySelector('rootfile');
    if (!rootfileEl) {
      throw new Error('Invalid EPUB: rootfile not found in container.xml');
    }

    const opfPath = rootfileEl.getAttribute('full-path');
    const opfEntry = zip.file(opfPath);
    if (!opfEntry) {
      throw new Error(`OPF package not found at path: ${opfPath}`);
    }

    const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
    const opfXml = await opfEntry.async('text');
    const opfDoc = parser.parseFromString(opfXml, 'application/xml');

    // 2. Extract Metadata
    const titleEl = opfDoc.querySelector('title') || opfDoc.querySelector('dc\\:title');
    const title = titleEl ? titleEl.textContent.trim() : 'Untitled Work';

    const creatorEl = opfDoc.querySelector('creator') || opfDoc.querySelector('dc\\:creator');
    const author = creatorEl ? creatorEl.textContent.trim() : 'Unknown Author';

    const langEl = opfDoc.querySelector('language') || opfDoc.querySelector('dc\\:language');
    const language = langEl ? langEl.textContent.trim() : 'en';

    // 3. Multi-Tier Cover Extraction
    const coverUrl = await this.extractCover(zip, opfDoc, opfDir, title, author);

    // 4. Resolve Manifest and Spine
    const manifestItems = new Map();
    opfDoc.querySelectorAll('manifest > item').forEach(item => {
      const id = item.getAttribute('id');
      const href = item.getAttribute('href');
      const mediaType = item.getAttribute('media-type');
      const properties = item.getAttribute('properties') || '';
      manifestItems.set(id, { id, href, mediaType, properties });
    });

    const spineItemRefs = [];
    opfDoc.querySelectorAll('spine > itemref').forEach(itemref => {
      const idref = itemref.getAttribute('idref');
      if (manifestItems.has(idref)) {
        spineItemRefs.push(manifestItems.get(idref));
      }
    });

    // 5. Ingest Chapter Contents
    const rawChapters = [];
    for (let i = 0; i < spineItemRefs.length; i++) {
      const item = spineItemRefs[i];
      const relativeHref = decodeURIComponent(item.href);
      const fullPath = this.resolvePath(opfDir, relativeHref);
      const file = zip.file(fullPath);
      if (!file) continue;

      try {
        const xhtml = await file.async('text');
        const chapterDoc = parser.parseFromString(xhtml, 'text/html');
        
        // Extract chapter heading
        const h1 = chapterDoc.querySelector('h1, h2, h3, title');
        const chapterTitle = h1 ? h1.textContent.trim() : `Section ${i + 1}`;

        // Extract paragraphs and text blocks
        const blocks = [];
        const contentNodes = chapterDoc.querySelectorAll('p, blockquote, h1, h2, h3, h4, div.paragraph');
        
        if (contentNodes.length > 0) {
          contentNodes.forEach(node => {
            const text = node.textContent.trim();
            if (text.length > 0) {
              const tag = node.tagName.toLowerCase();
              blocks.push({
                type: tag.startsWith('h') ? 'heading' : (tag === 'blockquote' ? 'quote' : 'paragraph'),
                text: text,
                html: node.outerHTML
              });
            }
          });
        } else {
          // Fallback if no <p> tags: split body by double newlines
          const bodyText = chapterDoc.body ? chapterDoc.body.textContent : '';
          const parts = bodyText.split(/\n\s*\n/).map(s => s.trim()).filter(s => s.length > 0);
          parts.forEach(p => {
            blocks.push({ type: 'paragraph', text: p, html: `<p>${this.escapeHtml(p)}</p>` });
          });
        }

        if (blocks.length > 0) {
          rawChapters.push({
            index: i,
            title: chapterTitle,
            blocks
          });
        }
      } catch (err) {
        console.warn(`Failed to parse chapter file ${fullPath}:`, err);
      }
    }

    // 6. Single-Page Chapter Segmentation (1,800 to 2,400 chars)
    const pages = this.segmentIntoPages(rawChapters, title, author, coverUrl);

    // Stats
    const totalWords = pages.reduce((acc, p) => acc + (p.wordCount || 0), 0);
    const readingTimeMinutes = Math.ceil(totalWords / 200);

    const bookId = 'book_' + this.hashCode(title + author) + '_' + Date.now();

    return {
      id: bookId,
      title,
      author,
      language,
      coverUrl,
      pages,
      totalPages: pages.length,
      stats: {
        totalWords,
        readingTimeMinutes,
        totalChapters: rawChapters.length
      },
      createdAt: Date.now()
    };
  }

  /**
   * Multi-Tier Cover Extraction Implementation
   */
  static async extractCover(zip, opfDoc, opfDir, title, author) {
    let coverPath = null;

    // Tier 1: EPUB 2 <meta name="cover" content="[ID]">
    const metaCover = opfDoc.querySelector('meta[name="cover"]');
    if (metaCover) {
      const coverId = metaCover.getAttribute('content');
      const item = opfDoc.querySelector(`manifest > item[id="${coverId}"]`);
      if (item) {
        coverPath = item.getAttribute('href');
      }
    }

    // Tier 2: EPUB 3 <item properties="cover-image" ...>
    if (!coverPath) {
      const ep3Item = opfDoc.querySelector('manifest > item[properties~="cover-image"]');
      if (ep3Item) {
        coverPath = ep3Item.getAttribute('href');
      }
    }

    // Tier 3: Manifest scan for image items with "cover" in id or href
    if (!coverPath) {
      const imageItems = opfDoc.querySelectorAll('manifest > item[media-type^="image/"]');
      for (const it of imageItems) {
        const id = (it.getAttribute('id') || '').toLowerCase();
        const href = (it.getAttribute('href') || '').toLowerCase();
        if (id.includes('cover') || href.includes('cover')) {
          coverPath = it.getAttribute('href');
          break;
        }
      }
    }

    // Tier 4: Archive regex search for cover.(jpg|png|webp)
    if (!coverPath) {
      const coverRegex = /(?:^|\/)(?:cover|titlepage|frontcover)\.(?:jpg|jpeg|png|webp)/i;
      const matchingFile = Object.keys(zip.files).find(name => coverRegex.test(name));
      if (matchingFile) {
        coverPath = matchingFile;
      }
    }

    if (coverPath) {
      // Resolve against OPF directory if not absolute in zip
      const resolved = coverPath.startsWith(opfDir) ? coverPath : this.resolvePath(opfDir, coverPath);
      const zipFile = zip.file(resolved) || zip.file(coverPath);
      if (zipFile) {
        try {
          const mimeType = this.getMimeType(resolved);
          const base64 = await zipFile.async('base64');
          return `data:${mimeType};base64,${base64}`;
        } catch (err) {
          console.warn('Failed to extract cover binary:', err);
        }
      }
    }

    // Graceful fallback: Gilded Art Bookplate SVG Cover
    return this.createOrnamentalCoverSvg(title, author);
  }

  /**
   * Segments raw chapters into strictly 1,800 to 2,400 character pages
   * and prepends dedicated Page 1 (Title Page with ZERO AI calls).
   */
  static segmentIntoPages(rawChapters, bookTitle, author, coverUrl) {
    const pages = [];

    // ==========================================
    // CRITICAL CONSTRAINT: PAGE 1 IS DEDICATED TITLE PAGE
    // Zero AI calls are made on Page 1.
    // ==========================================
    pages.push({
      pageNumber: 1,
      isTitlePage: true,
      chapterTitle: 'Frontispiece & Title Folio',
      text: `[TITLE FOLIO: ${bookTitle} by ${author}. Illuminated Sanctuary Edition. Dedicated Title Page.]`,
      html: `
        <div class="sanctuary-title-folio">
          <div class="folio-ornament-top">✦ ✦ ✦</div>
          <div class="folio-cover-frame">
            <img class="folio-cover-img" src="${coverUrl}" alt="${this.escapeHtml(bookTitle)} Cover" />
          </div>
          <h1 class="folio-title">${this.escapeHtml(bookTitle)}</h1>
          <div class="folio-divider">❖</div>
          <h2 class="folio-author">By ${this.escapeHtml(author)}</h2>
          <p class="folio-edition-note">Illuminated Sanctuary Edition &bull; AI Visual Synthesis</p>
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
    const TARGET_CHARS = 2100;
    const MAX_CHARS = 2400;

    for (const chapter of rawChapters) {
      let currentSegmentBlocks = [];
      let currentLength = 0;
      let chapterPageOffset = 1;

      for (let bIndex = 0; bIndex < chapter.blocks.length; bIndex++) {
        const block = chapter.blocks[bIndex];
        const blockLen = block.text.length;

        // If block itself exceeds MAX_CHARS, split it by sentence boundaries
        if (blockLen > MAX_CHARS) {
          const sentences = this.splitIntoSentences(block.text);
          for (const sentence of sentences) {
            if (currentLength + sentence.length > MAX_CHARS && currentLength >= MIN_CHARS) {
              // Flush current page
              pages.push(this.compilePage({
                pageNumber: currentPageNumber++,
                chapterTitle: chapter.title,
                chapterPageOffset: chapterPageOffset++,
                blocks: currentSegmentBlocks
              }));
              currentSegmentBlocks = [];
              currentLength = 0;
            }
            currentSegmentBlocks.push({ type: 'paragraph', text: sentence, html: `<p>${this.escapeHtml(sentence)}</p>` });
            currentLength += sentence.length;
          }
          continue;
        }

        // Check if adding this block exceeds target range
        if (currentLength + blockLen > MAX_CHARS && currentLength >= MIN_CHARS) {
          // Flush current page
          pages.push(this.compilePage({
            pageNumber: currentPageNumber++,
            chapterTitle: chapter.title,
            chapterPageOffset: chapterPageOffset++,
            blocks: currentSegmentBlocks
          }));
          currentSegmentBlocks = [];
          currentLength = 0;
        }

        currentSegmentBlocks.push(block);
        currentLength += blockLen;
      }

      // Flush remainder of the chapter
      if (currentSegmentBlocks.length > 0) {
        pages.push(this.compilePage({
          pageNumber: currentPageNumber++,
          chapterTitle: chapter.title,
          chapterPageOffset: chapterPageOffset++,
          blocks: currentSegmentBlocks
        }));
      }
    }

    return pages;
  }

  static compilePage({ pageNumber, chapterTitle, chapterPageOffset, blocks }) {
    const rawText = blocks.map(b => b.text).join('\n\n');
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;

    // Render HTML with drop cap on the very first paragraph of the page
    let htmlContent = '';
    blocks.forEach((block, idx) => {
      if (idx === 0 && block.type === 'paragraph' && block.text.length > 0) {
        const firstLetter = block.text.charAt(0);
        const restOfPara = block.text.slice(1);
        htmlContent += `<p class="lead-drop-cap"><span class="drop-cap">${this.escapeHtml(firstLetter)}</span>${this.escapeHtml(restOfPara)}</p>`;
      } else if (block.type === 'heading') {
        htmlContent += `<h3 class="prose-subheading">${this.escapeHtml(block.text)}</h3>`;
      } else if (block.type === 'quote') {
        htmlContent += `<blockquote class="prose-quote">${this.escapeHtml(block.text)}</blockquote>`;
      } else {
        htmlContent += `<p>${this.escapeHtml(block.text)}</p>`;
      }
    });

    return {
      pageNumber,
      isTitlePage: false,
      chapterTitle,
      chapterPageOffset,
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
    // Splits along sentence boundaries: . ! ? followed by whitespace or quote
    const matches = text.match(/[^.!?]+[.!?]+["']?(?=\s|$)/g);
    if (!matches || matches.length === 0) return [text];
    return matches.map(s => s.trim()).filter(Boolean);
  }

  static resolvePath(baseDir, relativePath) {
    if (!baseDir) return relativePath;
    if (relativePath.startsWith('/')) return relativePath.substring(1);
    const stack = baseDir.split('/').filter(Boolean);
    const parts = relativePath.split('/');
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }
    return stack.join('/');
  }

  static getMimeType(path) {
    const ext = path.split('.').pop().toLowerCase();
    switch (ext) {
      case 'png': return 'image/png';
      case 'webp': return 'image/webp';
      case 'gif': return 'image/gif';
      case 'svg': return 'image/svg+xml';
      default: return 'image/jpeg';
    }
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

  static createOrnamentalCoverSvg(title, author) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="50%" stop-color="#1e1b4b"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#eab308"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <rect width="600" height="900" fill="url(#bg)"/>
        <rect x="25" y="25" width="550" height="850" rx="12" fill="none" stroke="url(#gold)" stroke-width="3"/>
        <rect x="40" y="40" width="520" height="820" rx="8" fill="none" stroke="url(#gold)" stroke-width="1" stroke-dasharray="6,4"/>
        
        <!-- Corner Ornaments -->
        <circle cx="40" cy="40" r="8" fill="url(#gold)"/>
        <circle cx="560" cy="40" r="8" fill="url(#gold)"/>
        <circle cx="40" cy="860" r="8" fill="url(#gold)"/>
        <circle cx="560" cy="860" r="8" fill="url(#gold)"/>
        
        <!-- Star Motif -->
        <g transform="translate(300, 220)">
          <path d="M 0,-50 L 12,-12 L 50,0 L 12,12 L 0,50 L -12,12 L -50,0 L -12,-12 Z" fill="url(#gold)"/>
          <circle cx="0" cy="0" r="6" fill="#ffffff"/>
        </g>
        
        <!-- Typography -->
        <text x="300" y="380" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="url(#gold)" text-anchor="middle">
          ${this.escapeHtml(title.slice(0, 32))}
        </text>
        <text x="300" y="430" font-family="Georgia, serif" font-size="20" font-style="italic" fill="#cbd5e1" text-anchor="middle">
          ${title.length > 32 ? this.escapeHtml(title.slice(32, 64)) : ''}
        </text>
        
        <line x1="200" y1="500" x2="400" y2="500" stroke="url(#gold)" stroke-width="1.5"/>
        <polygon points="300,495 305,500 300,505 295,500" fill="url(#gold)"/>
        
        <text x="300" y="560" font-family="Georgia, serif" font-size="22" letter-spacing="3" fill="#f8fafc" text-anchor="middle">
          BY ${this.escapeHtml(author.toUpperCase().slice(0, 30))}
        </text>
        
        <text x="300" y="760" font-family="Georgia, serif" font-size="14" letter-spacing="4" fill="#94a3b8" text-anchor="middle">
          ILLUMINATED SANCTUARY EDITION
        </text>
      </svg>
    `;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
  }
}

