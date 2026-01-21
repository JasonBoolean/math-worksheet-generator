/**
 * Unit tests for PWAServiceManager
 * Tests PWA functionality including service worker and install prompts
 */

// Mock browser APIs for Node.js environment
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

// Load PWAServiceManager
const PWAServiceManager = require('../services/PWAServiceManager.js');

/**
 * Test suite for PWAServiceManager
 */
async function runTests() {
  console.log('Running PWAServiceManager tests...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Helper function to run a test
  function test(name, fn) {
    try {
      fn();
      console.log(`✓ ${name}`);
      passedTests++;
    } catch (error) {
      console.error(`✗ ${name}`);
      console.error(`  Error: ${error.message}`);
      failedTests++;
    }
  }
  
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
  
  // Test 1: PWAServiceManager initialization
  test('should initialize with default values', () => {
    const manager = new PWAServiceManager();
    assert(manager.deferredPrompt === null, 'deferredPrompt should be null');
    assert(manager.isInstalled === false, 'isInstalled should be false');
    assert(manager.serviceWorkerRegistration === null, 'serviceWorkerRegistration should be null');
    assert(manager.isOfflineReady === false, 'isOfflineReady should be false');
  });
  
  // Test 2: Check secure context
  test('should check secure context', () => {
    const manager = new PWAServiceManager();
    const isSecure = manager.isSecureContext();
    assert(typeof isSecure === 'boolean', 'isSecureContext should return boolean');
  });
  
  // Test 3: Check installability
  test('should check installability', () => {
    const manager = new PWAServiceManager();
    const installable = manager.checkInstallability();
    assert(installable === false, 'should not be installable without deferred prompt');
    
    manager.deferredPrompt = { prompt: () => {} };
    const installableWithPrompt = manager.checkInstallability();
    assert(installableWithPrompt === true, 'should be installable with deferred prompt');
  });
  
  // Test 4: Get capabilities
  test('should get PWA capabilities', () => {
    const manager = new PWAServiceManager();
    const capabilities = manager.getCapabilities();
    
    assert(capabilities !== null, 'capabilities should not be null');
    assert(typeof capabilities.isInstallable === 'boolean', 'isInstallable should be boolean');
    assert(typeof capabilities.isInstalled === 'boolean', 'isInstalled should be boolean');
    assert(typeof capabilities.isOfflineReady === 'boolean', 'isOfflineReady should be boolean');
    // isOnline comes from navigator.onLine which may be undefined in test environment
    assert(capabilities.hasOwnProperty('isOnline'), 'should have isOnline property');
  });
  
  // Test 5: Set callbacks
  test('should set callbacks', () => {
    const manager = new PWAServiceManager();
    const callback = () => {};
    
    manager.onInstallable(callback);
    assert(manager.onInstallableCallback === callback, 'onInstallableCallback should be set');
    
    manager.onInstalled(callback);
    assert(manager.onInstalledCallback === callback, 'onInstalledCallback should be set');
    
    manager.onUpdateAvailable(callback);
    assert(manager.onUpdateAvailableCallback === callback, 'onUpdateAvailableCallback should be set');
  });
  
  // Test 6: Cleanup
  test('should cleanup resources', () => {
    const manager = new PWAServiceManager();
    manager.onInstallableCallback = () => {};
    manager.onInstalledCallback = () => {};
    manager.onUpdateAvailableCallback = () => {};
    
    manager.cleanup();
    
    assert(manager.onInstallableCallback === null, 'onInstallableCallback should be null');
    assert(manager.onInstalledCallback === null, 'onInstalledCallback should be null');
    assert(manager.onUpdateAvailableCallback === null, 'onUpdateAvailableCallback should be null');
  });
  
  // Test 7: Handle online status
  test('should handle online status', () => {
    const manager = new PWAServiceManager();
    
    // Should not throw error
    manager.handleOnlineStatus(true);
    manager.handleOnlineStatus(false);
    
    assert(true, 'handleOnlineStatus should execute without errors');
  });
  
  // Test 8: Check if installed (standalone mode)
  test('should check if installed', () => {
    const manager = new PWAServiceManager();
    
    // Mock standalone mode
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = () => ({ matches: true });
    
    manager.checkIfInstalled();
    assert(manager.isInstalled === true, 'should detect standalone mode');
    
    // Restore
    window.matchMedia = originalMatchMedia;
  });
  
  // Test 9: Prompt install without deferred prompt
  await testAsync('should handle prompt install without deferred prompt', async () => {
    const manager = new PWAServiceManager();
    const result = await manager.promptInstall();
    assert(result === false, 'should return false without deferred prompt');
  });
  
  // Test 10: Check for updates without registration
  await testAsync('should handle check for updates without registration', async () => {
    const manager = new PWAServiceManager();
    const hasUpdate = await manager.checkForUpdates();
    assert(hasUpdate === false, 'should return false without registration');
  });
  
  // Test 11: Apply update without registration
  await testAsync('should handle apply update without registration', async () => {
    const manager = new PWAServiceManager();
    // Should not throw error
    await manager.applyUpdate();
    assert(true, 'applyUpdate should execute without errors');
  });
  
  // Test 12: Request notification permission
  await testAsync('should request notification permission', async () => {
    const manager = new PWAServiceManager();
    const permission = await manager.requestNotificationPermission();
    assert(typeof permission === 'string', 'should return permission string');
  });
  
  // Test 13: Show notification without registration
  await testAsync('should handle show notification without registration', async () => {
    const manager = new PWAServiceManager();
    // Should not throw error
    await manager.showNotification('Test', { body: 'Test message' });
    assert(true, 'showNotification should execute without errors');
  });
  
  // Test 14: Unregister without registration
  await testAsync('should handle unregister without registration', async () => {
    const manager = new PWAServiceManager();
    const result = await manager.unregister();
    assert(result === false, 'should return false without registration');
  });
  
  // Test 15: Get version without controller
  await testAsync('should handle get version without controller', async () => {
    const manager = new PWAServiceManager();
    
    // Check if navigator.serviceWorker exists before testing
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      // Temporarily remove controller to test the fallback
      const originalController = navigator.serviceWorker.controller;
      navigator.serviceWorker.controller = null;
      
      const version = await manager.getVersion();
      assert(typeof version === 'string', 'should return version string');
      assertEqual(version, 'No active service worker', 'should return no active service worker message');
      
      // Restore controller
      navigator.serviceWorker.controller = originalController;
    } else {
      // In environments without serviceWorker, just verify it returns a string
      const version = await manager.getVersion();
      assert(typeof version === 'string', 'should return version string');
    }
  });
  
  // Test 16: Initialize PWA service manager
  await testAsync('should initialize PWA service manager', async () => {
    const manager = new PWAServiceManager();
    const initialized = await manager.initialize();
    assert(typeof initialized === 'boolean', 'initialize should return boolean');
  });
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log(`Tests completed: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log('='.repeat(50));
  
  return failedTests === 0;
}

// Run tests if executed directly
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runTests };
