/**
 * Background Service Worker (Manifest V3)
 * 
 * Orchestrates Headless Gemini session authentication, streaming generation dispatch,
 * and Chrome Side Panel / Tab navigation.
 */

import { GeminiHeadlessClient } from './modules/gemini-headless.js';
import { fallbackSynthesize } from './modules/prompt-architect.js';

const geminiClient = new GeminiHeadlessClient();

// Active operation heartbeat for Manifest V3:
// Prevents service worker from idling and terminating while Gemini network requests are in-flight.
let activePipelines = 0;
let pipelineKeepAliveInterval = null;

function startPipelineKeepAlive() {
  activePipelines++;
  if (!pipelineKeepAliveInterval) {
    pipelineKeepAliveInterval = setInterval(() => {
      try {
        if (chrome.runtime?.id) {
          chrome.runtime.getPlatformInfo(() => {});
        }
      } catch (_) {}
    }, 4000);
  }
}

function stopPipelineKeepAlive() {
  activePipelines = Math.max(0, activePipelines - 1);
  if (activePipelines === 0 && pipelineKeepAliveInterval) {
    clearInterval(pipelineKeepAliveInterval);
    pipelineKeepAliveInterval = null;
  }
}

// Background alarm as second-layer fallback
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    void chrome.storage.session?.get?.('_');
  }
});

// Initialize extension events
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Erised AI] Extension installed successfully.');
});

// Runtime Message Dispatcher
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, payload } = message;

  switch (action) {
    case 'CHECK_GOOGLE_SESSION': {
      geminiClient.checkSession()
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ loggedIn: false, error: err.message }));
      return true; // async sendResponse
    }

    case 'RESET_GOOGLE_SESSION': {
      geminiClient.resetSession()
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, loggedIn: false, error: err.message }));
      return true;
    }

    case 'GATHER_PAGE_CHARACTERS': {
      geminiClient.gatherCharacterDescriptions(payload)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, characters: [], error: err.message }));
      return true;
    }

    case 'ANALYZE_BOOK_SECTION': {
      startPipelineKeepAlive();
      geminiClient.analyzeBookCharactersSection(payload)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, characters: [], error: err.message }))
        .finally(() => stopPipelineKeepAlive());
      return true;
    }

    case 'ANALYZE_BOOK_CHARACTERS': {
      startPipelineKeepAlive();
      geminiClient.analyzeBookCharacters(payload, (progress) => {
        try {
          chrome.runtime.sendMessage({
            action: 'CHARACTER_SCAN_PROGRESS',
            payload: progress
          }).catch(() => {});
        } catch (_) {}
      })
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, characters: [], error: err.message }))
        .finally(() => stopPipelineKeepAlive());
      return true;
    }

    case 'SYNTHESIZE_PAGE_PROMPT': {
      startPipelineKeepAlive();
      geminiClient.synthesizePagePrompt(payload)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, error: err.message }))
        .finally(() => stopPipelineKeepAlive());
      return true;
    }

    case 'GENERATE_GEMINI_IMAGE': {
      startPipelineKeepAlive();
      geminiClient.generateImage(payload)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, error: err.message }))
        .finally(() => stopPipelineKeepAlive());
      return true;
    }

    /**
     * RUN_FULL_PIPELINE: Consolidates all 3 pipeline stages into a SINGLE background message.
     * This prevents Manifest V3 service worker idle termination between chained sendMessage calls.
     *
     * Stages:
     *   1. synthesizePagePrompt (15s) — generates the literary image prompt using book character dossiers
     *   2. generateImage (55s)        — renders the illustration via Gemini Imagen 3
     *
     * Returns a single response object with the image URL and all prompt metadata.
     */
    case 'RUN_FULL_PIPELINE': {
      (async () => {
        startPipelineKeepAlive();
        try {
          const {
            pageText, bookTitle, author, pageNumber,
            existingCharacters = [], styleId, variationIndex,
            selectedExcerpt, aspectRatio, flank
          } = payload || {};

          // Character dossiers are cataloged upfront at the whole-book level.
          // Use existing book characters directly — skipping per-page scanning for blazing speed.
          const characters = existingCharacters || [];

          // Stage 2: Synthesize prompt
          let synthData = null;
          let synthError = null;
          try {
            const synthRes = await geminiClient.synthesizePagePrompt({
              pageText, bookTitle, author, pageNumber, styleId, variationIndex,
              characters, selectedExcerpt, aspectRatio
            });
            console.log(`[Background] Stage 2 prompt synthesis: engine=${synthRes?.engine}, success=${synthRes?.success}`, synthRes?.error ? `(note: ${synthRes.error})` : '');
            if (synthRes?.success && synthRes?.imagePrompt) {
              synthData = synthRes;
            } else if (synthRes?.data?.imagePrompt) {
              synthData = synthRes.data;
            }
            if (synthRes?.error) synthError = synthRes.error;
          } catch (synthErr) {
            console.warn('[Background] Stage 2 synthesis exception:', synthErr.message);
            synthError = synthErr.message;
          }

          // Fallback if synthesis didn't produce a prompt
          if (!synthData?.imagePrompt) {
            synthData = fallbackSynthesize({ pageText, bookTitle, author, pageNumber, styleId, variationIndex, characters, selectedExcerpt, aspectRatio });
          }

          // Broadcast Stage 2 completion: notify reader so it can animate text self-highlighting,
          // smoothly fade the prose layout, and mount the color-gradient-wave-fog box
          // BEFORE Stage 3 image generation begins (which takes 30-45s)
          const excerptNotification = {
            action: 'PIPELINE_EXCERPT_CHOSEN',
            payload: {
              pageNumber,
              flank,
              momentTitle: synthData.momentTitle || 'Illuminated Scene',
              selectedExcerpt: synthData.selectedExcerpt || synthData.momentDescription || '',
              sceneSummary: synthData.sceneSummary || synthData.momentDescription || '',
              theme: synthData.theme || '',
              focalRange: synthData.focalRange || '',
              aspectRatio: synthData.aspectRatio || aspectRatio || '3:4',
              imagePrompt: synthData.imagePrompt,
              newCharacters: characters.filter(c => !existingCharacters.some(e => e.name === c.name))
            }
          };

          try {
            chrome.runtime.sendMessage(excerptNotification).catch(() => {});
          } catch (_) {}
          if (sender?.tab?.id) {
            try {
              chrome.tabs.sendMessage(sender.tab.id, excerptNotification).catch(() => {});
            } catch (_) {}
          }

          // Stage 3: Generate image
          console.log(`[Background] Stage 3 generating image with prompt (${synthData.imagePrompt.length} chars)...`);
          const imgRes = await geminiClient.generateImage({
            prompt: synthData.imagePrompt,
            aspectRatio: synthData.aspectRatio || aspectRatio || '3:4'
          });
          console.log(`[Background] Stage 3 image result: success=${imgRes.success}, engine=${imgRes.engine || 'none'}`, imgRes.error ? `(error: ${imgRes.error})` : '');

          sendResponse({
            success: imgRes.success,
            imageUrl: imgRes.imageUrl,
            originalUrl: imgRes.originalUrl,
            aspectRatio: synthData.aspectRatio || aspectRatio || '3:4',
            engine: imgRes.engine || 'gemini-3.8',
            momentTitle: synthData.momentTitle,
            selectedExcerpt: synthData.selectedExcerpt || synthData.momentDescription || '',
            sceneSummary: synthData.sceneSummary || synthData.momentDescription || '',
            theme: synthData.theme || '',
            focalRange: synthData.focalRange || '',
            imagePrompt: synthData.imagePrompt,
            data: {
              momentTitle: synthData.momentTitle,
              selectedExcerpt: synthData.selectedExcerpt || synthData.momentDescription || '',
              sceneSummary: synthData.sceneSummary || synthData.momentDescription || '',
              theme: synthData.theme || '',
              focalRange: synthData.focalRange || '',
              setting: synthData.setting || '',
              colors: synthData.colors || '',
              aspectRatio: synthData.aspectRatio || aspectRatio || '3:4',
              imagePrompt: synthData.imagePrompt
            },
            newCharacters: characters.filter(c => !existingCharacters.some(e => e.name === c.name)),
            allCharacters: characters,
            flank,
            error: imgRes.error || (imgRes.success ? null : 'Image generation failed'),
            message: imgRes.message,
            reason: imgRes.reason,
            geminiText: imgRes.geminiText,
            status: imgRes.status,
            stack: imgRes.stack,
            details: imgRes.details,
            rawSnippet: imgRes.rawSnippet,
            synthError
          });
        } catch (err) {
          console.error('[Background] RUN_FULL_PIPELINE error:', err);
          sendResponse({ success: false, error: err.message });
        } finally {
          stopPipelineKeepAlive();
        }
      })();
      return true;
    }

    case 'ABORT_GENERATION': {
      geminiClient.abortActiveRequests();
      sendResponse({ success: true, aborted: true });
      return false;
    }

    case 'OPEN_FULLSCREEN_READER': {
      chrome.tabs.create({ url: chrome.runtime.getURL('reader.html') }, (tab) => {
        sendResponse({ success: true, tabId: tab.id });
      });
      return true;
    }

    default:
      sendResponse({ success: false, error: `Unknown action: ${action}` });
      return false;
  }
});

