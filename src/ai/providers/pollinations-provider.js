/**
 * Erised AI - Pollinations Flux.1 Public Provider
 *
 * Implements fallback image generation with client-side rate limit cooldowns.
 */

import { AIProvider } from './provider-interface.js';
import { pollinationsClient } from '../pollinations-client.js';

export class PollinationsProvider extends AIProvider {
  constructor() {
    super('pollinations');
    this.client = pollinationsClient;
  }

  async checkSession() {
    return { loggedIn: true, message: 'Public Pollinations Flux.1 active (zero-key)' };
  }

  async generateImage(prompt, options = {}) {
    return this.client.generateImage(prompt, options);
  }

  getCooldownStatus() {
    return this.client.getCooldownStatus();
  }
}

export const pollinationsProvider = new PollinationsProvider();

