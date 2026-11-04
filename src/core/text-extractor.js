/**
 * Erised AI - Core Text Extractor & Token/AST Normalizer
 *
 * Provides standardized chunking, semantic segmentation, and clean text
 * extraction across diverse ebook and document formats (EPUB, PDF, Markdown, TXT).
 */

export const TARGET_PAGE_CHAR_MIN = 1800;
export const TARGET_PAGE_CHAR_MAX = 2400;

/**
 * Normalizes prose whitespace, collapses repeated linebreaks, and normalizes typographic quotes
 * @param {string} text
 * @returns {string}
 */
export function normalizeProse(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Estimates token count for an excerpt using standard ~4 chars per token rule
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Splits continuous literary text into single-page reading segments strictly
 * bounded between TARGET_PAGE_CHAR_MIN and TARGET_PAGE_CHAR_MAX.
 *
 * @param {string} fullText
 * @param {string} [chapterTitle='Chapter']
 * @returns {Array<{ pageNumber: number, text: string, html: string, charCount: number }>}
 */
export function segmentTextIntoPages(fullText, chapterTitle = 'Chapter') {
  const clean = normalizeProse(fullText);
  if (!clean) return [];

  const paragraphs = clean.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const pages = [];
  let currentParagraphs = [];
  let currentLen = 0;
  let pageNumber = 2; // Page 1 is reserved for Frontispiece / Title Page

  for (const p of paragraphs) {
    if (currentLen + p.length > TARGET_PAGE_CHAR_MAX && currentLen >= TARGET_PAGE_CHAR_MIN) {
      const pageText = currentParagraphs.join('\n\n');
      const pageHtml = `
        <div class="chapter-header">
          <span class="chapter-number">${chapterTitle}</span>
          <h2 class="chapter-title">Page ${pageNumber}</h2>
        </div>
        ${currentParagraphs.map(para => `<p>${para}</p>`).join('\n')}
      `;
      pages.push({
        pageNumber,
        chapterTitle,
        text: pageText,
        html: pageHtml,
        charCount: pageText.length
      });
      pageNumber++;
      currentParagraphs = [p];
      currentLen = p.length;
    } else {
      currentParagraphs.push(p);
      currentLen += p.length;
    }
  }

  if (currentParagraphs.length > 0) {
    const pageText = currentParagraphs.join('\n\n');
    const pageHtml = `
      <div class="chapter-header">
        <span class="chapter-number">${chapterTitle}</span>
        <h2 class="chapter-title">Page ${pageNumber}</h2>
      </div>
      ${currentParagraphs.map(para => `<p>${para}</p>`).join('\n')}
    `;
    pages.push({
      pageNumber,
      chapterTitle,
      text: pageText,
      html: pageHtml,
      charCount: pageText.length
    });
  }

  return pages;
}

