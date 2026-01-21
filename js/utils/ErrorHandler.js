/**
 * Global Error Handler
 * Provides error classification, user-friendly messages, and recovery mechanisms
 * 
 * Requirements: 1.5, 3.5, 10.1, 10.5
 */

/**
 * Error types classification
 */
const ErrorTypes = {
  VALIDATION: 'validation',
  RENDERING: 'rendering',
  EXPORT: 'export',
  STORAGE: 'storage',
  NETWORK: 'network',
  SYSTEM: 'system',
  COMPATIBILITY: 'compatibility'
};

/**
 * Error severity levels
 */
const ErrorSeverity = {
  LOW: 'low',        // Minor issues, can continue
  MEDIUM: 'medium',  // Significant issues, some features affected
  HIGH: 'high',      // Critical issues, major features broken
  CRITICAL: 'critical' // Application cannot function
};

/**
 * Custom error class with additional context
 */
class AppError extends Error {
  constructor(message, type, severity = ErrorSeverity.MEDIUM, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();
    this.userMessage = this.generateUserMessage();
  }

  /**
   * Generate user-friendly error message
   * @returns {string} User-friendly message
   */
  generateUserMessage() {
    const messages = {
      [ErrorTypes.VALIDATION]: '输入的参数不正确，请检查您的配置',
      [ErrorTypes.RENDERING]: '渲染过程出现问题，请重试',
      [ErrorTypes.EXPORT]: '导出图片失败，请重试',
      [ErrorTypes.STORAGE]: '保存数据失败，可能是存储空间不足',
      [ErrorTypes.NETWORK]: '网络连接出现问题',
      [ErrorTypes.SYSTEM]: '系统出现错误',
      [ErrorTypes.COMPATIBILITY]: '您的浏览器可能不支持某些功能'
    };

    return messages[this.type] || '发生了未知错误';
  }

  /**
   * Get recovery suggestions
   * @returns {Array<string>} Recovery suggestions
   */
  getRecoverySuggestions() {
    const suggestions = {
      [ErrorTypes.VALIDATION]: [
        '检查难度级别和运算类型设置',
        '确保所有必填项都已填写',
        '尝试使用默认配置'
      ],
      [ErrorTypes.RENDERING]: [
        '刷新页面重试',
        '尝试更简单的布局',
        '检查背景图片是否有效'
      ],
      [ErrorTypes.EXPORT]: [
        '检查浏览器是否允许下载',
        '尝试使用PNG格式',
        '减少题目数量后重试'
      ],
      [ErrorTypes.STORAGE]: [
        '清理浏览器缓存',
        '删除一些自定义背景',
        '使用隐私模式可能会限制存储'
      ],
      [ErrorTypes.NETWORK]: [
        '检查网络连接',
        '刷新页面重试'
      ],
      [ErrorTypes.SYSTEM]: [
        '刷新页面',
        '清除浏览器缓存',
        '尝试使用其他浏览器'
      ],
      [ErrorTypes.COMPATIBILITY]: [
        '更新浏览器到最新版本',
        '尝试使用Chrome或Firefox',
        '某些功能可能在您的设备上不可用'
      ]
    };

    return suggestions[this.type] || ['刷新页面重试', '如果问题持续，请联系技术支持'];
  }
}

/**
 * Global Error Handler
 */
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 50;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.uiCallback = null;
    
    // Setup global error listeners
    this.setupGlobalHandlers();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      // Prevent default error handling to avoid duplicate console errors
      event.preventDefault();
      
      // Skip script errors from cross-origin scripts
      if (event.message === 'Script error.' && !event.filename) {
        return;
      }
      
      console.error('Uncaught error:', event.error);
      
      // Only handle if we have a valid error
      if (event.error || event.message) {
        this.handleError(
          new AppError(
            event.message || 'Uncaught error',
            ErrorTypes.SYSTEM,
            ErrorSeverity.HIGH,
            {
              filename: event.filename || '',
              lineno: event.lineno || 0,
              colno: event.colno || 0
            }
          )
        );
      }
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(
        new AppError(
          event.reason?.message || 'Unhandled promise rejection',
          ErrorTypes.SYSTEM,
          ErrorSeverity.HIGH,
          { reason: event.reason }
        )
      );
    });
  }

  /**
   * Set UI callback for displaying errors
   * @param {Function} callback - Callback function to display errors
   */
  setUICallback(callback) {
    this.uiCallback = callback;
  }

  /**
   * Handle error with classification and recovery
   * @param {Error|AppError} error - Error to handle
   * @param {Object} options - Handling options
   */
  handleError(error, options = {}) {
    // Convert to AppError if needed
    const appError = error instanceof AppError 
      ? error 
      : this.classifyError(error);

    // Log error
    this.logError(appError);

    // Determine if we should retry
    const shouldRetry = options.retry !== false && this.shouldRetry(appError, options.operationId);

    if (shouldRetry && options.retryFn) {
      return this.retryOperation(options.operationId, options.retryFn, appError);
    }

    // Display error to user
    this.displayError(appError, options);

    // Attempt recovery if possible
    if (options.recoveryFn) {
      this.attemptRecovery(appError, options.recoveryFn);
    }

    return appError;
  }

  /**
   * Classify generic error into AppError
   * @param {Error} error - Generic error
   * @returns {AppError} Classified error
   */
  classifyError(error) {
    const message = error.message || error.toString();

    // Validation errors
    if (message.includes('invalid') || message.includes('must be') || message.includes('required')) {
      return new AppError(message, ErrorTypes.VALIDATION, ErrorSeverity.LOW, { originalError: error });
    }

    // Rendering errors
    if (message.includes('canvas') || message.includes('render') || message.includes('draw')) {
      return new AppError(message, ErrorTypes.RENDERING, ErrorSeverity.MEDIUM, { originalError: error });
    }

    // Export errors
    if (message.includes('export') || message.includes('download') || message.includes('blob')) {
      return new AppError(message, ErrorTypes.EXPORT, ErrorSeverity.MEDIUM, { originalError: error });
    }

    // Storage errors
    if (message.includes('storage') || message.includes('quota') || message.includes('localStorage')) {
      return new AppError(message, ErrorTypes.STORAGE, ErrorSeverity.MEDIUM, { originalError: error });
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return new AppError(message, ErrorTypes.NETWORK, ErrorSeverity.MEDIUM, { originalError: error });
    }

    // Compatibility errors
    if (message.includes('not supported') || message.includes('undefined') || message.includes('not a function')) {
      return new AppError(message, ErrorTypes.COMPATIBILITY, ErrorSeverity.HIGH, { originalError: error });
    }

    // Default to system error
    return new AppError(message, ErrorTypes.SYSTEM, ErrorSeverity.MEDIUM, { originalError: error });
  }

  /**
   * Log error to internal log
   * @param {AppError} error - Error to log
   */
  logError(error) {
    this.errorLog.push({
      error,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console with details
    console.error(`[${error.type}] ${error.severity}:`, error.message);
    if (error.context) {
      console.error('Context:', error.context);
    }
  }

  /**
   * Display error to user
   * @param {AppError} error - Error to display
   * @param {Object} options - Display options
   */
  displayError(error, options = {}) {
    const displayMessage = options.customMessage || error.userMessage;
    const suggestions = error.getRecoverySuggestions();

    // Use UI callback if available
    if (this.uiCallback) {
      this.uiCallback({
        type: 'error',
        message: displayMessage,
        details: error.message,
        suggestions,
        severity: error.severity,
        canRetry: options.retryFn !== undefined
      });
    } else {
      // Fallback to alert
      alert(`错误: ${displayMessage}\n\n建议: ${suggestions[0]}`);
    }
  }

  /**
   * Check if operation should be retried
   * @param {AppError} error - Error that occurred
   * @param {string} operationId - Operation identifier
   * @returns {boolean} Whether to retry
   */
  shouldRetry(error, operationId) {
    if (!operationId) return false;

    // Don't retry validation errors
    if (error.type === ErrorTypes.VALIDATION) return false;

    // Don't retry compatibility errors
    if (error.type === ErrorTypes.COMPATIBILITY) return false;

    // Check retry count
    const attempts = this.retryAttempts.get(operationId) || 0;
    return attempts < this.maxRetries;
  }

  /**
   * Retry operation with exponential backoff
   * @param {string} operationId - Operation identifier
   * @param {Function} operation - Operation to retry
   * @param {AppError} error - Previous error
   * @returns {Promise} Operation result
   */
  async retryOperation(operationId, operation, error) {
    const attempts = this.retryAttempts.get(operationId) || 0;
    this.retryAttempts.set(operationId, attempts + 1);

    // Calculate backoff delay (exponential: 1s, 2s, 4s)
    const delay = Math.pow(2, attempts) * 1000;

    console.log(`Retrying operation ${operationId} (attempt ${attempts + 1}/${this.maxRetries}) after ${delay}ms`);

    // Show retry message to user
    if (this.uiCallback) {
      this.uiCallback({
        type: 'info',
        message: `正在重试... (${attempts + 1}/${this.maxRetries})`
      });
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const result = await operation();
      // Success - reset retry count
      this.retryAttempts.delete(operationId);
      return result;
    } catch (retryError) {
      // Retry failed
      if (this.retryAttempts.get(operationId) >= this.maxRetries) {
        // Max retries reached
        this.retryAttempts.delete(operationId);
        throw new AppError(
          `操作失败，已重试${this.maxRetries}次`,
          error.type,
          ErrorSeverity.HIGH,
          { originalError: retryError, previousError: error }
        );
      } else {
        // Retry again
        return this.retryOperation(operationId, operation, error);
      }
    }
  }

  /**
   * Attempt to recover from error
   * @param {AppError} error - Error to recover from
   * @param {Function} recoveryFn - Recovery function
   */
  async attemptRecovery(error, recoveryFn) {
    try {
      console.log(`Attempting recovery for ${error.type} error`);
      await recoveryFn(error);
      console.log('Recovery successful');
      
      if (this.uiCallback) {
        this.uiCallback({
          type: 'success',
          message: '已自动恢复'
        });
      }
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
    }
  }

  /**
   * Fallback to safe defaults
   * @param {Object} config - Current configuration
   * @returns {Object} Safe default configuration
   */
  fallbackToSafeDefaults(config) {
    console.log('Falling back to safe defaults');
    
    // Return minimal safe configuration
    return {
      difficulty: 'within20',
      operationType: 'addition',
      layout: 'two-column',
      backgroundStyle: 'blank',
      problemCount: 20
    };
  }

  /**
   * Graceful degradation for unsupported features
   * @param {string} feature - Feature name
   * @param {Function} fallback - Fallback function
   */
  gracefulDegradation(feature, fallback) {
    console.warn(`Feature "${feature}" not available, using fallback`);
    
    if (this.uiCallback) {
      this.uiCallback({
        type: 'warning',
        message: `某些功能在您的设备上不可用，已使用替代方案`
      });
    }

    if (fallback) {
      return fallback();
    }
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recent: this.errorLog.slice(-10)
    };

    this.errorLog.forEach(entry => {
      const { type, severity } = entry.error;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
    this.retryAttempts.clear();
    console.log('Error log cleared');
  }

  /**
   * Export error log for debugging
   * @returns {string} JSON string of error log
   */
  exportErrorLog() {
    return JSON.stringify(this.errorLog, null, 2);
  }
}

// Create global instance
const globalErrorHandler = new ErrorHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler, AppError, ErrorTypes, ErrorSeverity, globalErrorHandler };
} else {
  window.ErrorHandler = ErrorHandler;
  window.AppError = AppError;
  window.ErrorTypes = ErrorTypes;
  window.ErrorSeverity = ErrorSeverity;
  window.globalErrorHandler = globalErrorHandler;
}
