interface CachedScan {
  url: string;
  results: any;
  timestamp: number;
  expiresAt: number;
}

const CACHE_KEY = "accessibility_scan_cache";
const HISTORY_KEY = "accessibility_scan_history";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const cacheManager = {
  // Get cached scan result
  getCached(url: string): any | null {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (!cache) return null;

      const cached: CachedScan[] = JSON.parse(cache);
      const item = cached.find((c) => c.url === url);

      if (!item) return null;

      // Check if cache is expired
      if (Date.now() > item.expiresAt) {
        this.removeCached(url);
        return null;
      }

      return item.results;
    } catch (error) {
      console.error("Error reading cache:", error);
      return null;
    }
  },

  // Save scan result to cache
  setCached(url: string, results: any): void {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      const cached: CachedScan[] = cache ? JSON.parse(cache) : [];

      // Remove old entry if exists
      const filtered = cached.filter((c) => c.url !== url);

      // Add new entry
      filtered.push({
        url,
        results,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      });

      // Keep only last 20 scans
      const limited = filtered.slice(-20);

      localStorage.setItem(CACHE_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error("Error saving cache:", error);
    }
  },

  // Remove cached entry
  removeCached(url: string): void {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (!cache) return;

      const cached: CachedScan[] = JSON.parse(cache);
      const filtered = cached.filter((c) => c.url !== url);

      localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error removing cache:", error);
    }
  },

  // Clear all cache
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  },

  // Get scan history
  getHistory(): Array<{ url: string; timestamp: number; violations: number }> {
    try {
      const history = localStorage.getItem(HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error("Error reading history:", error);
      return [];
    }
  },

  // Add to scan history
  addToHistory(url: string, violationCount: number): void {
    try {
      const history = this.getHistory();

      // Remove duplicate
      const filtered = history.filter((h) => h.url !== url);

      // Add new entry
      filtered.unshift({
        url,
        timestamp: Date.now(),
        violations: violationCount,
      });

      // Keep only last 50
      const limited = filtered.slice(0, 50);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error("Error adding to history:", error);
    }
  },

  // Clear history
  clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  },
};
