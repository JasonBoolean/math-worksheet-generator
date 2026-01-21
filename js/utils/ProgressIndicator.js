/**
 * Progress Indicator and Status Feedback System
 * Provides visual feedback for operations and status updates
 * 
 * Requirements: 8.6, 8.7
 */

/**
 * Progress states
 */
const ProgressStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning'
};

/**
 * Progress Indicator Manager
 */
class ProgressIndicator {
  constructor() {
    this.currentState = ProgressStates.IDLE;
    this.progressValue = 0;
    this.operations = new Map();
    this.messageQueue = [];
    this.autoHideTimeout = null;
    
    // UI elements (will be set when initialized)
    this.loadingOverlay = null;
    this.loadingText = null;
    this.progressBar = null;
    this.messageContainer = null;
  }

  /**
   * Initialize progress indicator with UI elements
   * @param {Object} elements - UI element references
   */
  initialize(elements = {}) {
    this.loadingOverlay = elements.loadingOverlay || document.getElementById('loading-overlay');
    this.loadingText = elements.loadingText || this.loadingOverlay?.querySelector('p');
    this.progressBar = elements.progressBar || document.getElementById('progress-bar');
    this.messageContainer = elements.messageContainer || document.getElementById('message-container');
    
    // Create progress bar if it doesn't exist
    if (!this.progressBar && this.loadingOverlay) {
      this.createProgressBar();
    }
    
    // Create message container if it doesn't exist
    if (!this.messageContainer) {
      this.createMessageContainer();
    }
    
    console.log('ProgressIndicator initialized');
  }

  /**
   * Create progress bar element
   */
  createProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.style.cssText = `
      width: 80%;
      max-width: 400px;
      height: 4px;
      background-color: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      margin: 20px auto 0;
      overflow: hidden;
    `;

    this.progressBar = document.createElement('div');
    this.progressBar.id = 'progress-bar';
    this.progressBar.className = 'progress-bar';
    this.progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background-color: #4CAF50;
      transition: width 0.3s ease;
      border-radius: 2px;
    `;

    progressContainer.appendChild(this.progressBar);
    
    if (this.loadingOverlay) {
      this.loadingOverlay.appendChild(progressContainer);
    }
  }

  /**
   * Create message container for toast notifications
   */
  createMessageContainer() {
    this.messageContainer = document.createElement('div');
    this.messageContainer.id = 'message-container';
    this.messageContainer.className = 'message-container';
    this.messageContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(this.messageContainer);
  }

  /**
   * Start an operation with progress tracking
   * @param {string} operationId - Unique operation identifier
   * @param {string} message - Progress message
   * @param {Object} options - Operation options
   */
  startOperation(operationId, message, options = {}) {
    const operation = {
      id: operationId,
      message,
      startTime: Date.now(),
      progress: 0,
      total: options.total || 100,
      showProgress: options.showProgress !== false,
      cancellable: options.cancellable || false
    };

    this.operations.set(operationId, operation);
    this.currentState = ProgressStates.LOADING;
    
    // Show loading overlay
    this.showLoading(message, options.showProgress);
    
    console.log(`Operation started: ${operationId}`);
  }

  /**
   * Update operation progress
   * @param {string} operationId - Operation identifier
   * @param {number} progress - Progress value (0-100 or current/total)
   * @param {string} message - Optional updated message
   */
  updateProgress(operationId, progress, message) {
    const operation = this.operations.get(operationId);
    if (!operation) {
      console.warn(`Operation ${operationId} not found`);
      return;
    }

    operation.progress = progress;
    if (message) {
      operation.message = message;
    }

    // Calculate percentage
    const percentage = operation.total 
      ? Math.round((progress / operation.total) * 100)
      : progress;

    // Update UI
    if (this.loadingText) {
      this.loadingText.textContent = operation.message;
    }

    if (this.progressBar && operation.showProgress) {
      this.progressBar.style.width = `${Math.min(percentage, 100)}%`;
    }

    console.log(`Progress update: ${operationId} - ${percentage}%`);
  }

  /**
   * Complete an operation successfully
   * @param {string} operationId - Operation identifier
   * @param {string} message - Success message
   * @param {Object} options - Completion options
   */
  completeOperation(operationId, message, options = {}) {
    const operation = this.operations.get(operationId);
    if (!operation) {
      console.warn(`Operation ${operationId} not found`);
      return;
    }

    const duration = Date.now() - operation.startTime;
    console.log(`Operation completed: ${operationId} (${duration}ms)`);

    this.operations.delete(operationId);
    
    // Hide loading if no more operations
    if (this.operations.size === 0) {
      this.hideLoading();
    }

    // Show success message
    if (message && options.showMessage !== false) {
      this.showSuccess(message, options.duration);
    }

    this.currentState = ProgressStates.SUCCESS;
  }

  /**
   * Fail an operation
   * @param {string} operationId - Operation identifier
   * @param {string} message - Error message
   * @param {Object} options - Failure options
   */
  failOperation(operationId, message, options = {}) {
    const operation = this.operations.get(operationId);
    if (operation) {
      const duration = Date.now() - operation.startTime;
      console.log(`Operation failed: ${operationId} (${duration}ms)`);
      this.operations.delete(operationId);
    }

    // Hide loading if no more operations
    if (this.operations.size === 0) {
      this.hideLoading();
    }

    // Show error message
    if (message && options.showMessage !== false) {
      this.showError(message, options.duration);
    }

    this.currentState = ProgressStates.ERROR;
  }

  /**
   * Cancel an operation
   * @param {string} operationId - Operation identifier
   */
  cancelOperation(operationId) {
    const operation = this.operations.get(operationId);
    if (operation) {
      console.log(`Operation cancelled: ${operationId}`);
      this.operations.delete(operationId);
    }

    if (this.operations.size === 0) {
      this.hideLoading();
    }
  }

  /**
   * Show loading overlay
   * @param {string} message - Loading message
   * @param {boolean} showProgress - Whether to show progress bar
   */
  showLoading(message = '正在处理...', showProgress = false) {
    if (!this.loadingOverlay) return;

    if (this.loadingText) {
      this.loadingText.textContent = message;
    }

    if (this.progressBar) {
      this.progressBar.style.display = showProgress ? 'block' : 'none';
      this.progressBar.style.width = '0%';
    }

    this.loadingOverlay.style.display = 'flex';
    this.currentState = ProgressStates.LOADING;
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    if (!this.loadingOverlay) return;
    
    this.loadingOverlay.style.display = 'none';
    
    if (this.progressBar) {
      this.progressBar.style.width = '0%';
    }
    
    if (this.operations.size === 0) {
      this.currentState = ProgressStates.IDLE;
    }
  }

  /**
   * Show success message (toast notification)
   * @param {string} message - Success message
   * @param {number} duration - Display duration in ms
   */
  showSuccess(message, duration = 3000) {
    this.showToast(message, 'success', duration);
  }

  /**
   * Show error message (toast notification)
   * @param {string} message - Error message
   * @param {number} duration - Display duration in ms
   */
  showError(message, duration = 5000) {
    this.showToast(message, 'error', duration);
  }

  /**
   * Show warning message (toast notification)
   * @param {string} message - Warning message
   * @param {number} duration - Display duration in ms
   */
  showWarning(message, duration = 4000) {
    this.showToast(message, 'warning', duration);
  }

  /**
   * Show info message (toast notification)
   * @param {string} message - Info message
   * @param {number} duration - Display duration in ms
   */
  showInfo(message, duration = 3000) {
    this.showToast(message, 'info', duration);
  }

  /**
   * Show toast notification
   * @param {string} message - Message text
   * @param {string} type - Message type (success, error, warning, info)
   * @param {number} duration - Display duration in ms
   */
  showToast(message, type = 'info', duration = 3000) {
    if (!this.messageContainer) {
      this.createMessageContainer();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Style based on type
    const colors = {
      success: { bg: '#4CAF50', icon: '✓' },
      error: { bg: '#f44336', icon: '✕' },
      warning: { bg: '#ff9800', icon: '⚠' },
      info: { bg: '#2196F3', icon: 'ℹ' }
    };
    
    const color = colors[type] || colors.info;
    
    toast.style.cssText = `
      background-color: ${color.bg};
      color: white;
      padding: 16px 24px;
      margin-bottom: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease;
      pointer-events: auto;
      max-width: 100%;
      word-wrap: break-word;
    `;

    toast.innerHTML = `
      <span style="font-size: 20px; font-weight: bold;">${color.icon}</span>
      <span style="flex: 1;">${message}</span>
      <button style="
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
      " onclick="this.parentElement.remove()">×</button>
    `;

    this.messageContainer.appendChild(toast);

    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    // Add animation styles if not already present
    this.ensureAnimationStyles();
  }

  /**
   * Ensure animation styles are present
   */
  ensureAnimationStyles() {
    if (document.getElementById('toast-animations')) return;

    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    if (this.messageContainer) {
      this.messageContainer.innerHTML = '';
    }
  }

  /**
   * Get current state
   * @returns {string} Current state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Check if any operation is in progress
   * @returns {boolean} True if operations are in progress
   */
  isOperationInProgress() {
    return this.operations.size > 0;
  }

  /**
   * Get active operations
   * @returns {Array} Array of active operations
   */
  getActiveOperations() {
    return Array.from(this.operations.values());
  }
}

// Create global instance
const globalProgressIndicator = new ProgressIndicator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProgressIndicator, ProgressStates, globalProgressIndicator };
} else {
  window.ProgressIndicator = ProgressIndicator;
  window.ProgressStates = ProgressStates;
  window.globalProgressIndicator = globalProgressIndicator;
}
