/**
 * Extension Popup Script
 */

import { storage } from './modules/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const sessionDesc = document.getElementById('session-desc');
  const sessionActionWrap = document.getElementById('session-action-wrap');
  const miniTitle = document.getElementById('mini-title');
  const miniProgress = document.getElementById('mini-progress');
  const miniCover = document.getElementById('mini-cover');
  const engineBadge = document.getElementById('engine-badge');

  const btnFullscreen = document.getElementById('btn-open-fullscreen');
  const btnReset = document.getElementById('btn-popup-reset-session');

  function checkSession() {
    statusDot.className = 'status-dot checking';
    statusText.textContent = 'Checking Google Session...';
    chrome.runtime.sendMessage({ action: 'CHECK_GOOGLE_SESSION' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        setFallbackState();
        return;
      }

      if (response.loggedIn) {
        statusDot.className = 'status-dot active';
        statusText.textContent = 'Google Session Active';
        sessionDesc.textContent = 'Zero-Key Gemini 3.8 Image & fastest text analysis active.';
        sessionActionWrap.style.display = 'none';
        engineBadge.textContent = 'Gemini 3.8';
      } else {
        setFallbackState(response.message);
      }
    });
  }

  // Initial check
  checkSession();

  // Reset Session
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      btnReset.textContent = '↻ Resetting...';
      btnReset.disabled = true;
      chrome.runtime.sendMessage({ action: 'RESET_GOOGLE_SESSION' }, (res) => {
        btnReset.textContent = '↻ Reset';
        btnReset.disabled = false;
        if (res && res.loggedIn) {
          statusDot.className = 'status-dot active';
          statusText.textContent = 'Google Session Active';
          sessionDesc.textContent = res.message || 'Zero-Key Gemini 3.8 re-authenticated successfully!';
          sessionActionWrap.style.display = 'none';
          engineBadge.textContent = 'Gemini 3.8';
        } else {
          setFallbackState(res?.message || 'Session not detected after reset. Please sign into gemini.google.com');
        }
      });
    });
  }

  function setFallbackState(customMsg) {
    statusDot.className = 'status-dot warning';
    statusText.textContent = 'Google Session Not Detected';
    sessionDesc.textContent = customMsg || 'Please sign into your Google account at gemini.google.com to enable zero-key illustration. Public Flux.1 fallback active.';
    sessionActionWrap.style.display = 'block';
    engineBadge.textContent = 'Flux.1 (45s Limit)';
  }

  // Load Active Book
  try {
    const lastBookId = await storage.getSetting('activeBookId', 'sample_harry_potter');
    const lastPageNum = await storage.getSetting(`progress_${lastBookId}`, 2);
    const book = await storage.getBook(lastBookId);

    if (book) {
      miniTitle.textContent = book.title;
      const curPage = (book.pages || []).find(p => p.pageNumber === lastPageNum) || book.pages?.[1];
      miniProgress.textContent = `Page ${lastPageNum} of ${book.totalPages} ${curPage ? '• ' + (curPage.chapterTitle || '') : ''}`;
      if (book.coverUrl) {
        miniCover.innerHTML = `<img src="${book.coverUrl}" style="width:100%;height:100%;object-fit:cover;" />`;
      }
    }
  } catch (err) {
    console.warn('Could not load current progress:', err);
  }

  // Bind Open Reader Button
  btnFullscreen.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('reader.html') });
    window.close();
  });
});

