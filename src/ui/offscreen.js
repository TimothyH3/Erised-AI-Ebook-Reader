/**
 * Offscreen Document Helper
 * Handles streaming DOM parsing and Blob manipulation if background worker needs DOM access.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return;

  if (message.action === 'PARSE_HTML') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(message.html, 'text/html');
      sendResponse({ success: true, text: doc.body.textContent });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }
});

