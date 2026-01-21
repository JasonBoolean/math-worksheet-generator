/**
 * LocalStorageManager - Manages local storage operations
 * Handles user preferences, recent configurations, and custom backgrounds
 * Requirements: 8.7, 10.3
 */
class LocalStorageManager {
  constructor() {
    this.isSupported = this.checkSupport();
    this.maxRecentConfigs = 10;
    this.maxCustomBackgrounds = 20;
    this.maxStorageSize = 5 * 1024 * 1024; // 5MB limit
  }
  
  /**
   * Check if localStorage is supported
   * @returns {boolean} True if localStorage is supported
   */
  checkSupport() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage is not supported:', e);
      return false;
    }
  }
  
  /**
   * Get storage keys from constants or use defaults
   * @returns {Object} Storage keys
   */
  getStorageKeys() {
    if (typeof STORAGE_KEYS !== 'undefined') {
      return STORAGE_KEYS;
    }
    return {
      userPreferences: 'math-worksheet-preferences',
      recentConfigs: 'math-worksheet-recent-configs',
      customBackgrounds: 'math-worksheet-custom-backgrounds',
      appSettings: 'math-worksheet-app-settings'
    };
  }
  
  /**
   * Save user preferences
   * @param {Object} preferences - User preferences object
   * @param {Object} preferences.defaultConfig - Default worksheet configuration
   * @param {string} preferences.theme - UI theme preference
   * @param {Object} preferences.uiSettings - UI-related settings
   * @returns {boolean} True if saved successfully
   */
  savePreferences(preferences) {
    if (!this.isSupported) {
      console.warn('Cannot save preferences: localStorage not supported');
      return false;
    }
    
    try {
      const keys = this.getStorageKeys();
      const dataToSave = {
        defaultConfig: preferences.defaultConfig || null,
        theme: preferences.theme || 'light',
        uiSettings: preferences.uiSettings || {},
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(keys.userPreferences, JSON.stringify(dataToSave));
      console.log('User preferences saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
      return false;
    }
  }
  
  /**
   * Load user preferences
   * @returns {Object|null} User preferences or null if not found
   */
  loadPreferences() {
    if (!this.isSupported) {
      return null;
    }
    
    try {
      const keys = this.getStorageKeys();
      const stored = localStorage.getItem(keys.userPreferences);
      
      if (!stored) {
        return null;
      }
      
      const preferences = JSON.parse(stored);
      console.log('User preferences loaded successfully');
      return preferences;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return null;
    }
  }
  
  /**
   * Save recent configuration to history
   * @param {Object} config - Worksheet configuration to save
   * @returns {boolean} True if saved successfully
   */
  saveRecentConfig(config) {
    if (!this.isSupported) {
      return false;
    }
    
    try {
      const keys = this.getStorageKeys();
      const recentConfigs = this.getRecentConfigs();
      
      // Create a config entry with timestamp
      const configEntry = {
        config: config,
        timestamp: new Date().toISOString(),
        id: this.generateConfigId(config)
      };
      
      // Remove duplicate if exists
      const filtered = recentConfigs.filter(item => item.id !== configEntry.id);
      
      // Add new config at the beginning
      filtered.unshift(configEntry);
      
      // Keep only the most recent configs
      const trimmed = filtered.slice(0, this.maxRecentConfigs);
      
      localStorage.setItem(keys.recentConfigs, JSON.stringify(trimmed));
      console.log('Recent configuration saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save recent config:', error);
      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
      return false;
    }
  }
  
  /**
   * Get recent configurations
   * @returns {Array} Array of recent configuration entries
   */
  getRecentConfigs() {
    if (!this.isSupported) {
      return [];
    }
    
    try {
      const keys = this.getStorageKeys();
      const stored = localStorage.getItem(keys.recentConfigs);
      
      if (!stored) {
        return [];
      }
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load recent configs:', error);
      return [];
    }
  }
  
  /**
   * Save custom background image
   * @param {string} imageData - Base64 encoded image data
   * @param {string} name - Background name/identifier
   * @returns {boolean} True if saved successfully
   */
  saveCustomBackground(imageData, name) {
    if (!this.isSupported) {
      return false;
    }
    
    try {
      // Check data size
      const dataSize = new Blob([imageData]).size;
      if (dataSize > this.maxStorageSize) {
        console.warn('Background image too large:', dataSize);
        return false;
      }
      
      const keys = this.getStorageKeys();
      const backgrounds = this.getCustomBackgrounds();
      
      // Create background entry
      const backgroundEntry = {
        id: this.generateId(),
        name: name || `背景 ${backgrounds.length + 1}`,
        data: imageData,
        timestamp: new Date().toISOString()
      };
      
      // Add new background
      backgrounds.push(backgroundEntry);
      
      // Keep only the most recent backgrounds
      const trimmed = backgrounds.slice(-this.maxCustomBackgrounds);
      
      localStorage.setItem(keys.customBackgrounds, JSON.stringify(trimmed));
      console.log('Custom background saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save custom background:', error);
      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
      return false;
    }
  }
  
  /**
   * Get custom backgrounds
   * @returns {Array} Array of custom background entries
   */
  getCustomBackgrounds() {
    if (!this.isSupported) {
      return [];
    }
    
    try {
      const keys = this.getStorageKeys();
      const stored = localStorage.getItem(keys.customBackgrounds);
      
      if (!stored) {
        return [];
      }
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load custom backgrounds:', error);
      return [];
    }
  }
  
  /**
   * Delete a custom background
   * @param {string} backgroundId - Background ID to delete
   * @returns {boolean} True if deleted successfully
   */
  deleteCustomBackground(backgroundId) {
    if (!this.isSupported) {
      return false;
    }
    
    try {
      const keys = this.getStorageKeys();
      const backgrounds = this.getCustomBackgrounds();
      const filtered = backgrounds.filter(bg => bg.id !== backgroundId);
      
      localStorage.setItem(keys.customBackgrounds, JSON.stringify(filtered));
      console.log('Custom background deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete custom background:', error);
      return false;
    }
  }
  
  /**
   * Clear all stored data
   * @returns {boolean} True if cleared successfully
   */
  clearData() {
    if (!this.isSupported) {
      return false;
    }
    
    try {
      const keys = this.getStorageKeys();
      Object.values(keys).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('All stored data cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }
  
  /**
   * Clear only recent configurations
   * @returns {boolean} True if cleared successfully
   */
  clearRecentConfigs() {
    if (!this.isSupported) {
      return false;
    }
    
    try {
      const keys = this.getStorageKeys();
      localStorage.removeItem(keys.recentConfigs);
      console.log('Recent configurations cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear recent configs:', error);
      return false;
    }
  }
  
  /**
   * Clear only custom backgrounds
   * @returns {boolean} True if cleared successfully
   */
  clearCustomBackgrounds() {
    if (!this.isSupported) {
      return false;
    }
    
    try {
      const keys = this.getStorageKeys();
      localStorage.removeItem(keys.customBackgrounds);
      console.log('Custom backgrounds cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear custom backgrounds:', error);
      return false;
    }
  }
  
  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats
   */
  getStorageInfo() {
    if (!this.isSupported) {
      return { supported: false };
    }
    
    try {
      let totalSize = 0;
      const keys = this.getStorageKeys();
      const details = {};
      
      Object.entries(keys).forEach(([name, key]) => {
        const item = localStorage.getItem(key);
        const size = item ? new Blob([item]).size : 0;
        totalSize += size;
        details[name] = {
          key: key,
          size: size,
          sizeKB: (size / 1024).toFixed(2)
        };
      });
      
      return {
        supported: true,
        totalSize: totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        maxSize: this.maxStorageSize,
        maxSizeMB: (this.maxStorageSize / (1024 * 1024)).toFixed(2),
        usagePercent: ((totalSize / this.maxStorageSize) * 100).toFixed(2),
        details: details
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { supported: true, error: error.message };
    }
  }
  
  /**
   * Handle quota exceeded error
   */
  handleQuotaExceeded() {
    console.warn('Storage quota exceeded, attempting cleanup...');
    
    try {
      // Try to free up space by removing oldest items
      const recentConfigs = this.getRecentConfigs();
      if (recentConfigs.length > 5) {
        const keys = this.getStorageKeys();
        const trimmed = recentConfigs.slice(0, 5);
        localStorage.setItem(keys.recentConfigs, JSON.stringify(trimmed));
        console.log('Cleaned up old configurations');
      }
      
      const backgrounds = this.getCustomBackgrounds();
      if (backgrounds.length > 10) {
        const keys = this.getStorageKeys();
        const trimmed = backgrounds.slice(-10);
        localStorage.setItem(keys.customBackgrounds, JSON.stringify(trimmed));
        console.log('Cleaned up old backgrounds');
      }
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    }
  }
  
  /**
   * Generate a unique ID
   * @returns {string} Unique identifier
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate a config ID based on config content
   * @param {Object} config - Configuration object
   * @returns {string} Config identifier
   */
  generateConfigId(config) {
    const str = JSON.stringify(config);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `config-${Math.abs(hash)}`;
  }
  
  /**
   * Export all data as JSON
   * @returns {Object} All stored data
   */
  exportData() {
    if (!this.isSupported) {
      return null;
    }
    
    try {
      return {
        preferences: this.loadPreferences(),
        recentConfigs: this.getRecentConfigs(),
        customBackgrounds: this.getCustomBackgrounds(),
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }
  
  /**
   * Import data from JSON
   * @param {Object} data - Data to import
   * @returns {boolean} True if imported successfully
   */
  importData(data) {
    if (!this.isSupported || !data) {
      return false;
    }
    
    try {
      if (data.preferences) {
        this.savePreferences(data.preferences);
      }
      
      if (data.recentConfigs && Array.isArray(data.recentConfigs)) {
        const keys = this.getStorageKeys();
        localStorage.setItem(keys.recentConfigs, JSON.stringify(data.recentConfigs));
      }
      
      if (data.customBackgrounds && Array.isArray(data.customBackgrounds)) {
        const keys = this.getStorageKeys();
        localStorage.setItem(keys.customBackgrounds, JSON.stringify(data.customBackgrounds));
      }
      
      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocalStorageManager;
} else {
  window.LocalStorageManager = LocalStorageManager;
}