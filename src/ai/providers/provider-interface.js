/**
 * Erised AI - Standard AI Provider Interface
 *
 * Defines the unified contract for scene synthesis, character extraction,
 * and high-resolution illustration generation across all providers (Gemini, Pollinations, Local LLM/Ollama).
 */

export class AIProvider {
  constructor(name = 'base') {
    this.name = name;
  }

  /**
   * Check if provider session / credentials are active
   * @returns {Promise<{ loggedIn: boolean, message?: string }>}
   */
  async checkSession() {
    throw new Error('checkSession() must be implemented by subclass');
  }

  /**
   * Analyzes literary page text, distills prominent dramatic moment, atmosphere, and aspect ratio.
   * @param {Object} options
   * @returns {Promise<{ success: boolean, sceneMoment?: string, prompt?: string, aspectRatio?: string, error?: string }>}
   */
  async synthesizeScene(options) {
    throw new Error('synthesizeScene() must be implemented by subclass');
  }

  /**
   * Generates illustration plate from crafted prompt
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<{ success: boolean, imageUrl?: string, error?: string }>}
   */
  async generateImage(prompt, options) {
    throw new Error('generateImage() must be implemented by subclass');
  }
}

