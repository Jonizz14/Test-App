// Data Cache Manager - Memory and localStorage caching
import { swUtils } from './serviceWorker';

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheConfig = {
      // Cache durations in milliseconds
      durations: {
        // User data - 5 minutes
        user: 5 * 60 * 1000,
        profile: 5 * 60 * 1000,
        
        // Test data - 10 minutes
        tests: 10 * 60 * 1000,
        questions: 10 * 60 * 1000,
        attempts: 10 * 60 * 1000,
        
        // Session data - 2 minutes (more dynamic)
        sessions: 2 * 60 * 1000,
        activeSession: 30 * 1000, // 30 seconds
        
        // Static data - 30 minutes
        pricing: 30 * 60 * 1000,
        starPackages: 30 * 60 * 1000,
        gifts: 30 * 60 * 1000,
        configurations: 30 * 60 * 1000,
        
        // Statistics - 1 minute
        statistics: 1 * 60 * 1000,
        dashboardStats: 1 * 60 * 1000,
        
        // Contact messages - 5 minutes
        contactMessages: 5 * 60 * 1000,
        
        // Default duration
        default: 5 * 60 * 1000
      },
      
      // Maximum memory cache size
      maxMemoryCacheSize: 100,
      
      // localStorage keys prefix
      storagePrefix: 'testapp_cache_'
    };
    
    this.cleanupInterval = null;
    this.startCleanup();
  }

  // Get cache key for localStorage
  getStorageKey(key) {
    return `${this.cacheConfig.storagePrefix}${key}`;
  }

  // Determine cache type based on key
  getCacheType(key) {
    if (key.includes('user') || key.includes('profile')) return 'user';
    if (key.includes('test')) return 'tests';
    if (key.includes('question')) return 'questions';
    if (key.includes('attempt')) return 'attempts';
    if (key.includes('session')) return 'sessions';
    if (key.includes('pricing') || key.includes('plan')) return 'pricing';
    if (key.includes('star') || key.includes('gift')) return 'starPackages';
    if (key.includes('stat') || key.includes('dashboard')) return 'statistics';
    if (key.includes('contact')) return 'contactMessages';
    return 'default';
  }

  // Get cache duration for a key
  getCacheDuration(key) {
    const type = this.getCacheType(key);
    return this.cacheConfig.durations[type] || this.cacheConfig.durations.default;
  }

  // Set data in cache (memory + localStorage)
  set(key, data, options = {}) {
    const { 
      duration = this.getCacheDuration(key),
      forceMemoryOnly = false 
    } = options;
    
    const cacheItem = {
      data,
      timestamp: Date.now(),
      duration,
      key
    };

    // Store in memory cache
    this.setMemoryCache(key, cacheItem);
    
    // Store in localStorage if not memory-only and data is serializable
    if (!forceMemoryOnly && this.isSerializable(data)) {
      this.setLocalStorageCache(key, cacheItem);
    }

    return cacheItem;
  }

  // Get data from cache (memory first, then localStorage)
  get(key, options = {}) {
    const { useMemoryOnly = false } = options;
    
    // Try memory cache first
    const memoryData = this.getMemoryCache(key);
    if (memoryData && !this.isExpired(memoryData)) {
      return {
        data: memoryData.data,
        source: 'memory',
        age: Date.now() - memoryData.timestamp
      };
    }
    
    // Try localStorage cache if not memory-only
    if (!useMemoryOnly) {
      const storageData = this.getLocalStorageCache(key);
      if (storageData && !this.isExpired(storageData)) {
        // Update memory cache with fresh data
        this.setMemoryCache(key, storageData);
        return {
          data: storageData.data,
          source: 'localStorage',
          age: Date.now() - storageData.timestamp
        };
      }
    }
    
    return null;
  }

  // Check if cache item is expired
  isExpired(cacheItem) {
    if (!cacheItem || !cacheItem.timestamp || !cacheItem.duration) {
      return true;
    }
    return Date.now() - cacheItem.timestamp > cacheItem.duration;
  }

  // Memory cache operations
  setMemoryCache(key, cacheItem) {
    // Remove oldest items if cache is full
    if (this.memoryCache.size >= this.cacheConfig.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, cacheItem);
  }

  getMemoryCache(key) {
    return this.memoryCache.get(key);
  }

  // localStorage cache operations
  setLocalStorageCache(key, cacheItem) {
    try {
      const storageKey = this.getStorageKey(key);
      const serializedData = JSON.stringify(cacheItem);
      localStorage.setItem(storageKey, serializedData);
    } catch (error) {
      console.warn('[Cache] Failed to store in localStorage:', error);
      // If localStorage is full, clear old cache entries
      this.cleanupLocalStorage();
    }
  }

  getLocalStorageCache(key) {
    try {
      const storageKey = this.getStorageKey(key);
      const serializedData = localStorage.getItem(storageKey);
      if (!serializedData) return null;
      
      return JSON.parse(serializedData);
    } catch (error) {
      console.warn('[Cache] Failed to read from localStorage:', error);
      return null;
    }
  }

  // Check if data is serializable for localStorage
  isSerializable(data) {
    try {
      JSON.stringify(data);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Remove item from all caches
  remove(key) {
    this.memoryCache.delete(key);
    
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('[Cache] Failed to remove from localStorage:', error);
    }
  }

  // Clear all caches
  clear(options = {}) {
    const { memoryOnly = false } = options;
    
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear localStorage cache if not memory-only
    if (!memoryOnly) {
      this.clearLocalStorage();
    }
  }

  // Clear localStorage cache
  clearLocalStorage() {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.cacheConfig.storagePrefix));
    
    cacheKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Get cache statistics
  getStats() {
    const memoryCount = this.memoryCache.size;
    
    // Count localStorage entries
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.cacheConfig.storagePrefix));
    const storageCount = cacheKeys.length;
    
    // Calculate memory cache usage
    let memoryUsage = 0;
    try {
      memoryUsage = JSON.stringify([...this.memoryCache.values()]).length;
    } catch (error) {
      memoryUsage = 0;
    }
    
    return {
      memory: {
        count: memoryCount,
        size: memoryUsage,
        maxSize: this.cacheConfig.maxMemoryCacheSize
      },
      localStorage: {
        count: storageCount,
        prefix: this.cacheConfig.storagePrefix
      }
    };
  }

  // Start periodic cleanup
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Stop periodic cleanup
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Cleanup expired cache items
  cleanup() {
    const now = Date.now();
    
    // Cleanup memory cache
    for (const [key, cacheItem] of this.memoryCache.entries()) {
      if (this.isExpired(cacheItem)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Cleanup localStorage
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.cacheConfig.storagePrefix));
    
    cacheKeys.forEach(storageKey => {
      try {
        const cacheItem = JSON.parse(localStorage.getItem(storageKey));
        if (this.isExpired(cacheItem)) {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        // Remove corrupted entries
        localStorage.removeItem(storageKey);
      }
    });
  }

  // Preload common data
  async preloadCommonData(apiService) {
    const preloadKeys = [
      'pricing',
      'starPackages',
      'configurations'
    ];
    
    const promises = preloadKeys.map(async (key) => {
      try {
        // Only preload if not already cached
        const cached = this.get(key);
        if (!cached) {
          switch (key) {
            case 'pricing':
              const pricing = await apiService.getPricing();
              this.set('pricing', pricing);
              break;
            case 'starPackages':
              const starPackages = await apiService.getStarPackages();
              this.set('starPackages', starPackages);
              break;
            default:
              break;
          }
        }
      } catch (error) {
        console.warn(`[Cache] Failed to preload ${key}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
  }

  // Cache API response with automatic key generation
  cacheApiResponse(endpoint, data, method = 'GET') {
    if (method !== 'GET') return; // Only cache GET requests
    
    const key = this.generateApiCacheKey(endpoint);
    this.set(key, data);
  }

  // Generate cache key for API endpoint
  generateApiCacheKey(endpoint) {
    // Remove query parameters and normalize the endpoint
    const cleanEndpoint = endpoint.split('?')[0];
    return `api_${cleanEndpoint.replace(/\//g, '_')}`;
  }

  // Get cached API response
  getCachedApiResponse(endpoint) {
    const key = this.generateApiCacheKey(endpoint);
    return this.get(key);
  }

  // Invalidate cache for related endpoints
  invalidateRelated(pattern) {
    const keys = [...this.memoryCache.keys()];
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
      this.remove(key);
    });
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// React hooks for cache management
export const useCache = () => {
  return {
    set: (key, data, options) => cacheManager.set(key, data, options),
    get: (key, options) => cacheManager.get(key, options),
    remove: (key) => cacheManager.remove(key),
    clear: (options) => cacheManager.clear(options),
    getStats: () => cacheManager.getStats(),
    invalidateRelated: (pattern) => cacheManager.invalidateRelated(pattern)
  };
};

// API response caching hook
export const useApiCache = (apiService) => {
  const cache = useCache();
  
  const cachedRequest = async (endpoint, options = {}) => {
    const { 
      cacheDuration, 
      forceRefresh = false,
      useCache = true 
    } = options;
    
    // Try to get from cache first
    if (useCache && !forceRefresh) {
      const cached = cache.getCachedApiResponse(endpoint);
      if (cached) {
        return {
          data: cached.data,
          fromCache: true,
          source: cached.source,
          age: cached.age
        };
      }
    }
    
    // Make API request
    const response = await apiService.get(endpoint);
    
    // Cache the response
    if (useCache) {
      cache.cacheApiResponse(endpoint, response);
    }
    
    return {
      data: response,
      fromCache: false,
      source: 'network',
      age: 0
    };
  };
  
  return { cachedRequest, cache };
};

export default cacheManager;