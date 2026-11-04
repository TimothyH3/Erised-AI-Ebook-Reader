/**
 * Erised AI - Headless Zero-Developer-Key Gemini Provider
 *
 * Implements AIProvider contract for Google Gemini 3.8 and Imagen 3 via headless session.
 */

import { AIProvider } from './provider-interface.js';
import { geminiClient } from '../gemini-headless.js';

export class GeminiProvider extends AIProvider {
  constructor() {
    super('gemini');
    this.client = geminiClient;
  }

  async checkSession() {
    return this.client.checkSession();
  }

  async resetSession() {
    return this.client.resetSession();
  }

  async synthesizeScene(options) {
    return this.client.synthesizePagePrompt(options);
  }

  async generateImage(prompt, options = {}) {
    return this.client.generateImage(prompt, options);
  }

  async gatherCharacterDescriptions(options) {
    return this.client.gatherCharacterDescriptions(options);
  }

  async analyzeBookCharactersSection(options) {
    return this.client.analyzeBookCharactersSection(options);
  }
}

export const geminiProvider = new GeminiProvider();

