/**
 * Local Memory & IndexedDB Storage Layer
 * 
 * Manages zero-latency offline caching for books, segmented text pages,
 * reading preferences, and generated fine-art plates.
 */

const DB_NAME = 'IlluminatedReaderDB';
const DB_VERSION = 1;

export class StorageManager {
  constructor() {
    this.db = null;
    this.memoryStore = new Map();
    this.initPromise = this.initDB();
  }

  async initDB() {
    if (typeof indexedDB === 'undefined') {
      return null;
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        // Books Store
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }

        // Illustrations Cache Store: compound key [bookId, pageNumber, flank]
        if (!db.objectStoreNames.contains('illustrations')) {
          const illStore = db.createObjectStore('illustrations', { keyPath: 'cacheKey' });
          illStore.createIndex('by_book', 'bookId', { unique: false });
        }

        // Settings / Progress Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('[StorageManager] IndexedDB error:', e);
        reject(e);
      };
    });
  }

  async ready() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  // ==================== BOOKS ====================

  async saveBook(book) {
    const db = await this.ready();
    if (!db) {
      if (!this.memoryStore.has('books')) this.memoryStore.set('books', new Map());
      this.memoryStore.get('books').set(book.id, book);
      return true;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      store.put(book);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getBook(bookId) {
    const db = await this.ready();
    if (!db) {
      const map = this.memoryStore.get('books');
      return map ? (map.get(bookId) || null) : null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readonly');
      const store = tx.objectStore('books');
      const req = store.get(bookId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllBooks() {
    const db = await this.ready();
    if (!db) {
      const map = this.memoryStore.get('books');
      if (!map) return [];
      return Array.from(map.values()).map(b => ({
        id: b.id,
        title: b.title,
        author: b.author,
        coverUrl: b.coverUrl,
        totalPages: b.pages ? b.pages.length : (b.totalPages || 0),
        createdAt: b.createdAt
      }));
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readonly');
      const store = tx.objectStore('books');
      const req = store.getAll();
      req.onsuccess = () => {
        // Return without heavy page arrays for list display
        const books = (req.result || []).map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          coverUrl: b.coverUrl,
          totalPages: b.pages ? b.pages.length : (b.totalPages || 0),
          createdAt: b.createdAt
        }));
        resolve(books);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteBook(bookId) {
    const db = await this.ready();
    if (!db) {
      if (this.memoryStore.has('books')) {
        this.memoryStore.get('books').delete(bookId);
      }
      if (this.memoryStore.has('illustrations')) {
        const illMap = this.memoryStore.get('illustrations');
        for (const [key, val] of illMap.entries()) {
          if (val.bookId === bookId) {
            illMap.delete(key);
          }
        }
      }
      return true;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['books', 'illustrations'], 'readwrite');
      tx.objectStore('books').delete(bookId);

      // Delete illustrations for this book
      const illStore = tx.objectStore('illustrations');
      const index = illStore.index('by_book');
      const req = index.openCursor(IDBKeyRange.only(bookId));
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==================== ILLUSTRATION CACHING ====================

  /**
   * Caches an illustration for instant zero-latency retrieval
   * @param {string} bookId
   * @param {number} pageNumber
   * @param {'left'|'right'} flank
   * @param {Object} data { imageUrl, prompt, optics, engine, timestamp }
   */
  async cacheIllustration(bookId, pageNumber, flank, data) {
    const db = await this.ready();
    const cacheKey = `${bookId}_p${pageNumber}_${flank}`;
    const record = {
      cacheKey,
      bookId,
      pageNumber,
      flank,
      ...data,
      timestamp: Date.now()
    };

    if (!db) {
      if (!this.memoryStore.has('illustrations')) {
        this.memoryStore.set('illustrations', new Map());
      }
      this.memoryStore.get('illustrations').set(cacheKey, record);
      return record;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('illustrations', 'readwrite');
      const store = tx.objectStore('illustrations');
      store.put(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCachedIllustration(bookId, pageNumber, flank) {
    const db = await this.ready();
    const cacheKey = `${bookId}_p${pageNumber}_${flank}`;
    if (!db) {
      const map = this.memoryStore.get('illustrations');
      return map ? (map.get(cacheKey) || null) : null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('illustrations', 'readonly');
      const store = tx.objectStore('illustrations');
      const req = store.get(cacheKey);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getPageIllustrations(bookId, pageNumber) {
    const db = await this.ready();
    if (!db) {
      const map = this.memoryStore.get('illustrations');
      if (!map) return [];
      const results = [];
      for (const rec of map.values()) {
        if (rec.bookId === bookId && rec.pageNumber === pageNumber) {
          results.push(rec);
        }
      }
      return results;
    }
    return new Promise((resolve) => {
      const tx = db.transaction('illustrations', 'readonly');
      const store = tx.objectStore('illustrations');
      const index = store.index('by_book');
      const req = index.openCursor(IDBKeyRange.only(bookId));
      const results = [];
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (cursor.value.pageNumber === pageNumber) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => resolve([]);
    });
  }

  async getBookIllustrationCount(bookId) {
    const db = await this.ready();
    return new Promise((resolve) => {
      const tx = db.transaction('illustrations', 'readonly');
      const store = tx.objectStore('illustrations');
      const index = store.index('by_book');
      const req = index.count(IDBKeyRange.only(bookId));
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  }

  async clearBookIllustrations(bookId) {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('illustrations', 'readwrite');
      const store = tx.objectStore('illustrations');
      const index = store.index('by_book');
      const req = index.openCursor(IDBKeyRange.only(bookId));
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==================== SETTINGS & PROGRESS ====================

  async saveSetting(key, value) {
    const db = await this.ready();
    if (!db) {
      this.memoryStore.set(key, value);
      return true;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key, value });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSetting(key, defaultValue = null) {
    const db = await this.ready();
    if (!db) {
      return this.memoryStore.has(key) ? this.memoryStore.get(key) : defaultValue;
    }
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const req = tx.objectStore('settings').get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : defaultValue);
      req.onerror = () => resolve(defaultValue);
    });
  }

  // ==================== CHARACTERS & DRAMATIS PERSONAE ====================

  /**
   * Retrieves all recognized characters and visual dossiers for a specific book
   * @param {string} bookId
   * @returns {Promise<Array<Object>>}
   */
  async getCharacters(bookId) {
    if (!bookId) return [];
    return await this.getSetting(`characters_${bookId}`, []);
  }

  /**
   * Persists the character list for a book
   * @param {string} bookId
   * @param {Array<Object>} characters
   */
  async saveCharacters(bookId, characters) {
    if (!bookId) return false;
    return await this.saveSetting(`characters_${bookId}`, characters || []);
  }

  /**
   * Adds or merges a character into the book's character dossier
   * @param {string} bookId
   * @param {Object} character
   */
  async addOrUpdateCharacter(bookId, character) {
    if (!bookId || !character || !character.name) return [];
    const list = await this.getCharacters(bookId);
    const charName = character.name.trim().toLowerCase();
    
    const idx = list.findIndex(c => {
      if (c.id && character.id && c.id === character.id) return true;
      if (c.name && c.name.trim().toLowerCase() === charName) return true;
      if (Array.isArray(c.aliases) && c.aliases.some(a => a.toLowerCase() === charName)) return true;
      if (Array.isArray(character.aliases) && character.aliases.some(a => a.toLowerCase() === (c.name || '').toLowerCase())) return true;
      return false;
    });

    if (idx >= 0) {
      const existing = list[idx];
      const mergedAliases = Array.from(new Set([
        ...(existing.aliases || []),
        ...(character.aliases || []),
        character.name
      ])).filter(Boolean);

      // Keep richer/longer description or newly provided one
      const description = (character.description && character.description.length >= (existing.description || '').length)
        ? character.description
        : (existing.description || character.description || '');

      list[idx] = {
        ...existing,
        ...character,
        id: existing.id || character.id || `char_${Date.now()}`,
        name: existing.name || character.name,
        aliases: mergedAliases,
        description,
        updatedAt: Date.now()
      };
    } else {
      const newChar = {
        id: character.id || `char_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: character.name.trim(),
        aliases: Array.from(new Set([character.name.trim(), ...(character.aliases || [])])),
        description: character.description || '',
        shortReference: character.shortReference || '',
        introducedAtPage: character.introducedAtPage || 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      list.push(newChar);
    }

    await this.saveCharacters(bookId, list);
    return list;
  }
}

export const storage = new StorageManager();

