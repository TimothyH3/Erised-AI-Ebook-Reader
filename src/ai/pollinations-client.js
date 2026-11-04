/**
 * Pollinations AI (Flux.1) Free Public Fallback Engine
 * 
 * Enforces a strict 45-second rate limiter to respect public free-tier limits,
 * with reactive countdown timer support.
 */

export class PollinationsClient {
  constructor(cooldownMs = 45000) {
    this.cooldownMs = cooldownMs;
    this.lastRequestTimestamp = 0;
    this.activeTimerInterval = null;
    this.listeners = new Set();
  }

  /**
   * Adds a listener for cooldown ticks
   * @param {Function} callback - (status: { remainingSeconds: number, inCooldown: boolean, percent: number }) => void
   */
  subscribeCooldown(callback) {
    this.listeners.add(callback);
    // Initial emit
    const status = this.getCooldownStatus();
    callback(status);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const status = this.getCooldownStatus();
    for (const cb of this.listeners) {
      try { cb(status); } catch (_) {}
    }
  }

  getCooldownStatus() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTimestamp;
    if (elapsed >= this.cooldownMs) {
      return {
        remainingSeconds: 0,
        inCooldown: false,
        percent: 100
      };
    }

    const remainingMs = this.cooldownMs - elapsed;
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const percent = Math.min(100, Math.max(0, Math.round((elapsed / this.cooldownMs) * 100)));

    return {
      remainingSeconds,
      inCooldown: true,
      percent
    };
  }

  startCooldownTimer() {
    if (this.activeTimerInterval) clearInterval(this.activeTimerInterval);

    this.notifyListeners();
    this.activeTimerInterval = setInterval(() => {
      const status = this.getCooldownStatus();
      this.notifyListeners();
      if (!status.inCooldown) {
        clearInterval(this.activeTimerInterval);
        this.activeTimerInterval = null;
      }
    }, 1000);
  }

  /**
   * Requests an image from Pollinations Flux.1
   * @param {string} prompt - Clean synthesized prompt
   * @param {Object} [options]
   * @param {boolean} [options.bypassCooldown=false] - For manual override
   * @param {number} [options.width=768]
   * @param {number} [options.height=1024]
   */
  async generateImage(prompt, options = {}) {
    const { width = 768, height = 1024, bypassCooldown = false } = options;
    const status = this.getCooldownStatus();

    if (status.inCooldown && !bypassCooldown) {
      return {
        success: false,
        rateLimited: true,
        remainingSeconds: status.remainingSeconds,
        message: `Public Free-Tier Cooldown: ${status.remainingSeconds}s remaining to prevent rate limiting.`
      };
    }

    // Clean prompt for URL
    const cleanPrompt = prompt.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 950);
    const seed = Math.floor(Math.random() * 10000000);
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=${width}&height=${height}&nologo=true&seed=${seed}`;

    // Mark start of request
    this.lastRequestTimestamp = Date.now();
    this.startCooldownTimer();

    try {
      // Fetch image and verify it's valid
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: { 'Accept': 'image/*' }
      });

      if (!response.ok) {
        throw new Error(`Pollinations HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const base64DataUrl = await this.blobToDataUrl(blob);

      return {
        success: true,
        imageUrl: base64DataUrl,
        rawUrl: imageUrl,
        engine: 'pollinations-flux1',
        prompt: cleanPrompt,
        seed
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        fallbackUrl: imageUrl // Provide URL directly if CORS fetch failed
      };
    }
  }

  blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

