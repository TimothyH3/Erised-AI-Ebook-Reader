/**
 * Erised AI - Unified Provider Registry
 */

import { geminiProvider } from './gemini-provider.js';
import { pollinationsProvider } from './pollinations-provider.js';
import { localLLMProvider } from './local-provider.js';

export const PROVIDERS = {
  gemini: geminiProvider,
  pollinations: pollinationsProvider,
  local: localLLMProvider
};

/**
 * Returns provider instance by ID
 * @param {string} providerId
 * @returns {import('./provider-interface.js').AIProvider}
 */
export function getProvider(providerId = 'gemini') {
  return PROVIDERS[providerId] || PROVIDERS.gemini;
}

export { geminiProvider, pollinationsProvider, localLLMProvider };

