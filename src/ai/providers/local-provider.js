/**
 * Erised AI - Local LLM / Ollama / OpenAI-Compatible Provider
 *
 * Implements AIProvider contract for local zero-cloud private models (Ollama, vLLM, LM Studio)
 * or cloud OpenAI/Anthropic APIs.
 */

import { AIProvider } from './provider-interface.js';

export class LocalLLMProvider extends AIProvider {
  constructor(options = {}) {
    super('local_llm');
    this.endpoint = options.endpoint || process.env.LOCAL_MODEL_ENDPOINT || 'http://localhost:11434';
    this.model = options.model || process.env.LOCAL_MODEL_NAME || 'llama3:8b';
  }

  async checkSession() {
    try {
      const res = await fetch(`${this.endpoint}/api/tags`, { method: 'GET' });
      if (res.ok) {
        return { loggedIn: true, message: `Connected to local model endpoint at ${this.endpoint}` };
      }
      return { loggedIn: false, message: `Endpoint returned HTTP ${res.status}` };
    } catch (err) {
      return { loggedIn: false, message: `Could not reach local model at ${this.endpoint}` };
    }
  }

  async synthesizeScene(options = {}) {
    const { pageText = '', bookTitle = '', author = '' } = options;
    const prompt = `Analyze this excerpt from "${bookTitle}" by ${author} and describe the most dramatic visual moment in 1 sentence:\n\n${pageText}`;

    try {
      const res = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false
        })
      });
      if (!res.ok) throw new Error(`Local model error: ${res.statusText}`);
      const data = await res.json();
      return {
        success: true,
        sceneMoment: data.response || 'Dramatic scene',
        prompt: `masterpiece fine art illustration of ${data.response}`,
        aspectRatio: '3:4'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async generateImage(prompt, options = {}) {
    return {
      success: false,
      error: 'Local LLM text models do not synthesize images directly. Route image generation through Gemini Imagen 3 or Pollinations Flux.'
    };
  }
}

export const localLLMProvider = new LocalLLMProvider();

