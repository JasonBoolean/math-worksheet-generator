/**
 * PWAServiceManager - Manages PWA functionality
 * Handles service worker registration, install prompts, and offline capabilities
 * Requirements: 8.6, 9.6
 */
class PWAServiceManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.serviceWorkerRegistration = null;
    this.updateCheckInterval = null;
    this.onInstallableCallback = null;
    this.onInstalledCallback = null;
    this.onUpdateAvailableCallback = null;
    this.isOfflineReady = false;
  }
  
  /**
   * Initialize PWA service manager
   * @returns {Promise<boolean>} True if initialized successfully
   */
  async initialize() {
    console.log('PWAServiceManager: Initializing...');
    
    try {
      // Check if running in secure context
      if (!this.isSecureContext()) {
        console.warn('PWA requires HTTPS or localhost');
        return false;
      }
      
      // Register service worker
      await this.registerServiceWorker();
      
      // Setup install prompt handling
      this.setupInstallPrompt();
      
      // Setup update checking
      this.setupUpdateChecking();
      
      // Check if already installed
      this.checkIfInstalled();
      
      // Setup online/offline detection
      this.setupOnlineOfflineDetection();
      
      console.log('PWAServiceManager: Initialized successfully');
      return true;
    } catch (error) {
      console.error('PWAServiceManager: Initialization failed:', error);
      return false;
    }
  }
  
  /**
   * Check if running in secure context
   * @returns {boolean} True if secure context
   */
  isSecureContext() {
    return window.isSecureContext || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }
  
  /**
   * Register service worker
   * @returns {Promise<ServiceWorkerRegistration>} Registration object
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }
    
    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('./sw.js', {
        scope: './'
      });
      
      console.log('Service Worker registered:', this.serviceWorkerRegistration.scope);
      
      // Handle service worker updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorkerRegistration.installing;
        console.log('Service Worker update found');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New Service Worker installed, update available');
            if (this.onUpdateAvailableCallback) {
              this.onUpdateAvailableCallback();
            }
          }
        });
      });
      
      // Check if service worker is ready
      await navigator.serviceWorker.ready;
      this.isOfflineReady = true;
      console.log('Service Worker ready, offline support enabled');
      
      return this.serviceWorkerRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }
  
  /**
   * Setup install prompt handling
   */
  setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Notify callback if set
      if (this.onInstallableCallback) {
        this.onInstallableCallback();
      }
    });
    
    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.isInstalled = true;
      this.deferredPrompt = null;
      
      // Notify callback if set
      if (this.onInstalledCallback) {
        this.onInstalledCallback();
      }
    });
  }
  
  /**
   * Setup automatic update checking
   */
  setupUpdateChecking() {
    // Get update check interval from config or use default
    const interval = (typeof PWA_CONFIG !== 'undefined' && PWA_CONFIG.updateCheckInterval) 
      ? PWA_CONFIG.updateCheckInterval 
      : 60000; // 1 minute default
    
    // Check for updates periodically
    this.updateCheckInterval = setInterval(async () => {
      await this.checkForUpdates();
    }, interval);
    
    // Check for updates when page becomes visible
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        await this.checkForUpdates();
      }
    });
  }
  
  /**
   * Check if app is already installed
   */
  checkIfInstalled() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('App is running in standalone mode');
    }
    
    // Check if running as installed PWA
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('App is installed (iOS)');
    }
  }
  
  /**
   * Setup online/offline detection
   */
  setupOnlineOfflineDetection() {
    window.addEventListener('online', () => {
      console.log('App is online');
      this.handleOnlineStatus(true);
    });
    
    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.handleOnlineStatus(false);
    });
    
    // Check initial status
    this.handleOnlineStatus(navigator.onLine);
  }
  
  /**
   * Handle online/offline status changes
   * @param {boolean} isOnline - Online status
   */
  handleOnlineStatus(isOnline) {
    // Dispatch custom event for app to handle
    const event = new CustomEvent('pwa-connection-change', {
      detail: { isOnline }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Check if app can be installed
   * @returns {boolean} True if installable
   */
  checkInstallability() {
    return !!this.deferredPrompt && !this.isInstalled;
  }
  
  /**
   * Prompt user to install app
   * @returns {Promise<boolean>} True if user accepted installation
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }
    
    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`Install prompt outcome: ${outcome}`);
      
      // Clear the deferred prompt
      this.deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }
  
  /**
   * Check for app updates
   * @returns {Promise<boolean>} True if update available
   */
  async checkForUpdates() {
    if (!this.serviceWorkerRegistration) {
      return false;
    }
    
    try {
      await this.serviceWorkerRegistration.update();
      
      // Check if there's a waiting service worker
      const hasUpdate = !!this.serviceWorkerRegistration.waiting;
      
      if (hasUpdate) {
        console.log('Update available');
      }
      
      return hasUpdate;
    } catch (error) {
      console.error('Update check failed:', error);
      return false;
    }
  }
  
  /**
   * Apply pending update
   * @returns {Promise<void>}
   */
  async applyUpdate() {
    if (!this.serviceWorkerRegistration || !this.serviceWorkerRegistration.waiting) {
      console.warn('No update available to apply');
      return;
    }
    
    try {
      // Tell the waiting service worker to skip waiting
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait for the new service worker to activate
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
      });
      
      // Reload the page to use the new service worker
      window.location.reload();
    } catch (error) {
      console.error('Failed to apply update:', error);
    }
  }
  
  /**
   * Get PWA capabilities
   * @returns {Object} Capabilities object
   */
  getCapabilities() {
    return {
      isInstallable: this.checkInstallability(),
      isInstalled: this.isInstalled,
      isOfflineReady: this.isOfflineReady,
      hasUpdate: !!this.serviceWorkerRegistration?.waiting,
      isOnline: navigator.onLine,
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsNotifications: 'Notification' in window,
      supportsPushNotifications: 'PushManager' in window,
      supportsBackgroundSync: 'sync' in (this.serviceWorkerRegistration || {})
    };
  }
  
  /**
   * Set callback for when app becomes installable
   * @param {Function} callback - Callback function
   */
  onInstallable(callback) {
    this.onInstallableCallback = callback;
  }
  
  /**
   * Set callback for when app is installed
   * @param {Function} callback - Callback function
   */
  onInstalled(callback) {
    this.onInstalledCallback = callback;
  }
  
  /**
   * Set callback for when update is available
   * @param {Function} callback - Callback function
   */
  onUpdateAvailable(callback) {
    this.onUpdateAvailableCallback = callback;
  }
  
  /**
   * Request notification permission
   * @returns {Promise<string>} Permission status
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }
    
    try {
      const permission = await Notification.requestPermission();
      console.log(`Notification permission: ${permission}`);
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }
  
  /**
   * Show notification
   * @param {string} title - Notification title
   * @param {Object} options - Notification options
   * @returns {Promise<void>}
   */
  async showNotification(title, options = {}) {
    if (!this.serviceWorkerRegistration) {
      console.warn('Service Worker not registered');
      return;
    }
    
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }
    
    try {
      await this.serviceWorkerRegistration.showNotification(title, {
        icon: './assets/icons/icon-192x192.png',
        badge: './assets/icons/icon-144x144.png',
        ...options
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }
  
  /**
   * Unregister service worker
   * @returns {Promise<boolean>} True if unregistered successfully
   */
  async unregister() {
    if (!this.serviceWorkerRegistration) {
      return false;
    }
    
    try {
      // Clear update check interval
      if (this.updateCheckInterval) {
        clearInterval(this.updateCheckInterval);
        this.updateCheckInterval = null;
      }
      
      // Unregister service worker
      const success = await this.serviceWorkerRegistration.unregister();
      
      if (success) {
        console.log('Service Worker unregistered successfully');
        this.serviceWorkerRegistration = null;
        this.isOfflineReady = false;
      }
      
      return success;
    } catch (error) {
      console.error('Failed to unregister Service Worker:', error);
      return false;
    }
  }
  
  /**
   * Get service worker version
   * @returns {Promise<string>} Version string
   */
  async getVersion() {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      return 'No active service worker';
    }
    
    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.type === 'VERSION') {
            resolve(event.data.version);
          } else {
            resolve('Unknown');
          }
        };
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        );
        
        // Timeout after 2 seconds
        setTimeout(() => resolve('Timeout'), 2000);
      });
    } catch (error) {
      console.error('Failed to get version:', error);
      return 'Error';
    }
  }
  
  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
    
    this.onInstallableCallback = null;
    this.onInstalledCallback = null;
    this.onUpdateAvailableCallback = null;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAServiceManager;
} else {
  window.PWAServiceManager = PWAServiceManager;
}