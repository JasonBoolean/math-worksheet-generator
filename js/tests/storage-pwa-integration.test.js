/**
 * Integration tests for LocalStorageManager and PWAServiceManager
 * Tests the interaction between storage and PWA functionality
 */

// Mock browser APIs for Node.js environment
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    data: {},
    getItem(key) {
      return this.data[key] || null;
    },
    setItem(key, value) {
      this.data[key] = value;
    },
    removeItem(key) {
      delete this.data[key];
    },
    clear() {
      this.data = {};
    }
  };
}

if (typeof window === 'undefined') {
  global.window = {
    isSecureContext: true,
    location: { hostname: 'localhost' },
    matchMedia: () => ({ matches: false }),
    navigator: { standalone: false, onLine: true },
    addEventListener: () => {},
    dispatchEvent: () => {},
    MessageChannel: class {
      constructor() {
        this.port1 = { onmessage: null };
        this.port2 = {};
      }
    }
  };
  
  global.navigator = {
    onLine: true,
    serviceWorker: {
      register: async () => ({
        scope: './',
        addEventListener: () => {},
        update: async () => {},
        waiting: null,
        installing: null
      }),
      ready: Promise.resolve({}),
      controller: {
        postMessage: () => {}
      }
    }
  };
  
  global.Notification = {
    permission: 'default',
    requestPermission: async () => 'granted'
  };
  
  global.document = {
    hidden: false,
    addEventListener: () => {}
  };
}

// Mock STORAGE_KEYS
if (typeof STORAGE_KEYS === 'undefined') {
  global.STORAGE_KEYS = {
    userPreferences: 'math-worksheet-preferences',
    recentConfigs: 'math-worksheet-recent-configs',
    customBackgrounds: 'math-worksheet-custom-backgrounds',
    appSettings: 'math-worksheet-app-settings'
  };
}

// Load dependencies
const LocalStorageManager = require('../services/LocalStorageManager.js');
const PWAServiceManager = require('../services/PWAServiceManager.js');

/**
 * Integration test suite
 */
async function runIntegrationTests() {
  console.log('Running Storage & PWA Integration Tests...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Helper function for async tests
  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passedTests++;
    } catch (error) {
      console.error(`✗ ${name}`);
      console.error(`  Error: ${error.message}`);
      failedTests++;
    }
  }
  
  // Helper function for assertions
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }
  
  // Test 1: Initialize both managers
  await testAsync('should initialize both managers successfully', async () => {
    const storageManager = new LocalStorageManager();
    const pwaManager = new PWAServiceManager();
    
    assert(storageManager.isSupported === true, 'storage should be supported');
    assert(pwaManager !== null, 'PWA manager should be created');
  });
  
  // Test 2: Save PWA preferences to storage
  await testAsync('should save PWA-related preferences to storage', async () => {
    localStorage.clear();
    
    const storageManager = new LocalStorageManager();
    const preferences = {
      defaultConfig: { difficulty: 'within10' },
      theme: 'dark',
      uiSettings: {
        showInstallPrompt: true,
        enableNotifications: false,
        offlineMode: true
      }
    };
    
    const saved = storageManager.savePreferences(preferences);
    assert(saved === true, 'should save preferences');
    
    const loaded = storageManager.loadPreferences();
    assert(loaded !== null, 'should load preferences');
    assert(loaded.uiSettings.offlineMode === true, 'should preserve offline mode setting');
  });
  
  // Test 3: Store PWA installation state
  await testAsync('should track PWA installation state in preferences', async () => {
    localStorage.clear();
    
    const storageManager = new LocalStorageManager();
    const pwaManager = new PWAServiceManager();
    
    // Simulate PWA installation
    pwaManager.isInstalled = true;
    
    // Save installation state to preferences
    const preferences = {
      uiSettings: {
        pwaInstalled: pwaManager.isInstalled,
        installDate: new Date().toISOString()
      }
    };
    
    storageManager.savePreferences(preferences);
    const loaded = storageManager.loadPreferences();
    
    assert(loaded.uiSettings.pwaInstalled === true, 'should track installation state');
    assert(loaded.uiSettings.installDate !== undefined, 'should track install date');
  });
  
  // Test 4: Export data including PWA state
  await testAsync('should export data including PWA state', async () => {
    localStorage.clear();
    
    const storageManager = new LocalStorageManager();
    const pwaManager = new PWAServiceManager();
    
    // Setup some data
    storageManager.savePreferences({
      uiSettings: {
        pwaInstalled: pwaManager.isInstalled,
        offlineReady: pwaManager.isOfflineReady
      }
    });
    
    storageManager.saveRecentConfig({ difficulty: 'within20' });
    
    const exported = storageManager.exportData();
    
    assert(exported !== null, 'should export data');
    assert(exported.preferences !== null, 'should have preferences');
    assert(exported.recentConfigs.length > 0, 'should have recent configs');
  });
  
  // Test 5: Handle offline state with storage
  await testAsync('should handle offline state with storage', async () => {
    localStorage.clear();
    
    const storageManager = new LocalStorageManager();
    const pwaManager = new PWAServiceManager();
    
    // Simulate offline mode
    const offlinePreferences = {
      uiSettings: {
        lastOnline: new Date().toISOString(),
        offlineMode: true
      }
    };
    
    storageManager.savePreferences(offlinePreferences);
    
    const loaded = storageManager.loadPreferences();
    assert(loaded.uiSettings.offlineMode === true, 'should preserve offline mode');
  });
  
  // Test 6: Clear all data including PWA state
  await testAsync('should clear all data including PWA state', async () => {
    localStorage.clear();
    
    const storageManager = new LocalStorageManager();
    
    // Setup data
    storageManager.savePreferences({
      uiSettings: { pwaInstalled: true }
    });
    
    // Clear all
    const cleared = storageManager.clearData();
    assert(cleared === true, 'should clear data');
    
    const loaded = storageManager.loadPreferences();
    assert(loaded === null, 'preferences should be cleared');
  });
  
  // Test 7: Get capabilities and storage info together
  await testAsync('should get capabilities and storage info together', async () => {
    localStorage.clear();
    
    const storageManager = new LocalStorageManager();
    const pwaManager = new PWAServiceManager();
    
    // Add some data
    storageManager.savePreferences({ theme: 'dark' });
    
    const capabilities = pwaManager.getCapabilities();
    const storageInfo = storageManager.getStorageInfo();
    
    assert(capabilities !== null, 'should have capabilities');
    assert(storageInfo.supported === true, 'storage should be supported');
    assert(storageInfo.totalSize > 0, 'should have some data stored');
  });
  
  // Test 8: Import/export with PWA state
  await testAsync('should import/export with PWA state', async () => {
    localStorage.clear();
    
    const storageManager = new LocalStorageManager();
    
    // Setup data with PWA state
    storageManager.savePreferences({
      uiSettings: {
        pwaInstalled: true,
        notificationsEnabled: false
      }
    });
    
    // Export
    const exported = storageManager.exportData();
    
    // Clear
    storageManager.clearData();
    
    // Import
    const imported = storageManager.importData(exported);
    assert(imported === true, 'should import data');
    
    // Verify
    const loaded = storageManager.loadPreferences();
    assert(loaded.uiSettings.pwaInstalled === true, 'should restore PWA state');
  });
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log(`Integration Tests completed: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log('='.repeat(50));
  
  return failedTests === 0;
}

// Run tests if executed directly
if (require.main === module) {
  runIntegrationTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runIntegrationTests };
