/**
 * Main Application Entry Point
 * Math Worksheet Generator
 */

// 添加全局错误处理
window.addEventListener('error', function(e) {
  console.error('Global error:', e.error);
  console.error('Error message:', e.message);
  console.error('Error filename:', e.filename);
  console.error('Error line:', e.lineno);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
});

class MathWorksheetApp {
  constructor() {
    console.log('MathWorksheetApp constructor called');
    
    this.isInitialized = false;
    this.renderingEngine = null;
    this.imageExporter = null;
    this.mobileUtils = null;
    this.currentConfig = null;
    this.currentProblems = [];
    this.isGenerating = false;
    this.isExporting = false;
    
    // Real-time preview properties
    this.previewUpdateTimeout = null;
    this.lastPreviewConfig = null;
    
    // Mobile-specific properties
    this.pinchZoomCleanup = null;
    
    // Error handling and progress tracking
    this.errorHandler = null;
    this.progressIndicator = null;
    
    // 检查依赖
    this.checkDependencies();
    
    // Initialize error handler
    if (typeof globalErrorHandler !== 'undefined') {
      this.errorHandler = globalErrorHandler;
      this.errorHandler.setUICallback((data) => this.handleErrorUICallback(data));
      console.log('ErrorHandler initialized');
    }
    
    // Initialize progress indicator
    if (typeof globalProgressIndicator !== 'undefined') {
      this.progressIndicator = globalProgressIndicator;
      console.log('ProgressIndicator initialized');
    }
    
    // Initialize ImageExporter
    this.imageExporter = new ImageExporter();
    
    // Initialize MobileUtils
    if (typeof MobileUtils !== 'undefined') {
      this.mobileUtils = new MobileUtils();
      console.log('MobileUtils initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      console.log('DOM still loading, waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      console.log('DOM already loaded, initializing immediately');
      this.initialize();
    }
  }
  
  /**
   * Check if all dependencies are loaded
   */
  checkDependencies() {
    console.log('Checking dependencies...');
    
    const dependencies = [
      'CANVAS_CONFIG',
      'MathProblem',
      'WorksheetConfig',
      'RenderingEngine',
      'ImageExporter'
    ];
    
    const missing = [];
    dependencies.forEach(dep => {
      if (typeof window[dep] === 'undefined') {
        missing.push(dep);
        console.error(`Missing dependency: ${dep}`);
      } else {
        console.log(`✓ ${dep} loaded`);
      }
    });
    
    if (missing.length > 0) {
      console.error('Missing dependencies:', missing);
      // 不要阻止初始化，只是警告
      console.warn('Some dependencies missing, but continuing initialization...');
    }
    
    console.log('Dependency check complete');
    return true; // 总是返回true，不阻止初始化
  }
  
  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('Initializing Math Worksheet Generator...');
      
      // Initialize progress indicator with UI elements
      if (this.progressIndicator) {
        this.progressIndicator.initialize();
      }
      
      // Initialize rendering engine
      this.initializeCanvas();
      
      // Setup UI event listeners
      this.setupEventListeners();
      
      // Initialize mobile features
      this.initializeMobileFeatures();
      
      // Initialize PWA features (disabled for debugging)
      // await this.initializePWA();
      
      // Load user preferences
      this.loadUserPreferences();
      
      // Set initial configuration
      this.currentConfig = WorksheetConfig.createDefault();
      this.updateUI();
      
      // Initialize with a preview
      this.updatePreview();
      
      this.isInitialized = true;
      console.log('Math Worksheet Generator initialized successfully');
      
      // Check for quick generation parameter
      this.checkQuickGeneration();
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      
      // Use error handler if available
      if (this.errorHandler) {
        this.errorHandler.handleError(
          new AppError(
            error.message || '应用初始化失败',
            ErrorTypes.SYSTEM,
            ErrorSeverity.CRITICAL,
            { originalError: error }
          )
        );
      } else {
        this.showError('应用初始化失败: ' + error.message);
      }
    }
  }
  
  /**
   * Handle error UI callback from ErrorHandler
   * @param {Object} data - Error data from ErrorHandler
   */
  handleErrorUICallback(data) {
    if (data.type === 'error') {
      this.showError(data.message);
    } else if (data.type === 'success') {
      this.showSuccess(data.message);
    } else if (data.type === 'warning') {
      this.showWarning(data.message);
    } else if (data.type === 'info') {
      if (this.progressIndicator) {
        this.progressIndicator.showInfo(data.message);
      }
    }
  }
  
  /**
   * Initialize mobile-specific features
   */
  initializeMobileFeatures() {
    if (!this.mobileUtils) {
      console.log('MobileUtils not available, skipping mobile features');
      return;
    }
    
    console.log('Initializing mobile features...');
    
    // Setup orientation change handler
    window.addEventListener('orientationchange', (e) => {
      console.log('Orientation changed:', e.detail.orientation);
      this.handleOrientationChange(e.detail.orientation);
    });
    
    // Enable pinch-to-zoom on preview canvas
    const previewContainer = document.querySelector('.preview-container');
    if (previewContainer && this.mobileUtils.isTouch) {
      this.pinchZoomCleanup = this.mobileUtils.enablePinchZoom(
        previewContainer,
        {
          minScale: 1,
          maxScale: 3,
          onZoom: (scale) => {
            console.log('Preview zoom:', scale);
          }
        }
      );
      
      // Enable smooth scrolling
      this.mobileUtils.enableSmoothScroll(previewContainer);
    }
    
    // Add share button if Web Share API is supported
    if (this.mobileUtils.shareSupported) {
      this.addShareButton();
    }
    
    // Prevent double-tap zoom on buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      this.mobileUtils.preventDoubleTapZoom(button);
    });
    
    // Add orientation class to body
    document.body.classList.add(this.mobileUtils.currentOrientation);
    
    console.log('Mobile features initialized');
  }
  
  /**
   * Handle device orientation change
   * @param {string} orientation - New orientation
   */
  handleOrientationChange(orientation) {
    console.log('Handling orientation change to:', orientation);
    
    // Update canvas size if needed
    if (this.renderingEngine && this.renderingEngine.isReady()) {
      setTimeout(() => {
        this.renderingEngine.setupHighDPI();
        this.updatePreview();
      }, 300); // Wait for orientation change animation
    }
  }
  
  /**
   * Add share button to action buttons
   */
  addShareButton() {
    const actionButtons = document.querySelector('.action-buttons');
    if (!actionButtons) return;
    
    // Check if share button already exists
    if (document.getElementById('share-btn')) return;
    
    const shareButton = document.createElement('button');
    shareButton.id = 'share-btn';
    shareButton.className = 'secondary-button';
    shareButton.textContent = '分享';
    shareButton.disabled = true;
    
    shareButton.addEventListener('click', () => {
      this.shareWorksheet();
    });
    
    // Insert after export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn && exportBtn.nextSibling) {
      actionButtons.insertBefore(shareButton, exportBtn.nextSibling);
    } else {
      actionButtons.appendChild(shareButton);
    }
    
    console.log('Share button added');
  }
  
  /**
   * Share worksheet using native share API
   */
  async shareWorksheet() {
    if (!this.mobileUtils || !this.mobileUtils.shareSupported) {
      this.showError('您的设备不支持分享功能');
      return;
    }
    
    if (this.currentProblems.length === 0) {
      this.showError('请先生成练习册');
      return;
    }
    
    try {
      this.showLoading('正在准备分享...');
      
      // Create export canvas
      const exportCanvas = document.createElement('canvas');
      const exportEngine = new RenderingEngine();
      exportEngine.initialize(exportCanvas);
      exportEngine.setExportSize(CANVAS_CONFIG.width, CANVAS_CONFIG.height);
      
      // Render worksheet to export canvas
      await this.renderWorksheetToCanvas(exportEngine);
      
      // Convert to blob
      const blob = await new Promise((resolve) => {
        exportCanvas.toBlob(resolve, 'image/png', 1.0);
      });
      
      // Share using native API
      const filename = this.imageExporter.generateFilename({
        customSuffix: `${this.currentConfig.difficulty}-${this.currentConfig.operationType}`
      });
      
      const shared = await this.mobileUtils.shareImage(blob, filename);
      
      this.hideLoading();
      
      if (shared) {
        this.showSuccess('分享成功！');
        
        // Add haptic feedback
        if (this.mobileUtils) {
          this.mobileUtils.hapticFeedback('light');
        }
      }
      
    } catch (error) {
      console.error('Failed to share worksheet:', error);
      this.hideLoading();
      
      if (error.message.includes('not supported')) {
        this.showError('您的设备不支持图片分享，请使用导出功能');
      } else {
        this.showError('分享失败: ' + error.message);
      }
    }
  }
  
  /**
   * Initialize Canvas rendering
   */
  initializeCanvas() {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) {
      throw new Error('Preview canvas not found');
    }
    
    console.log('Initializing canvas...');
    
    this.renderingEngine = new RenderingEngine();
    this.renderingEngine.initialize(canvas);
    this.renderingEngine.setPreviewSize();
    
    console.log('Canvas initialized successfully');
  }
  
  /**
   * Setup UI event listeners
   */
  setupEventListeners() {
    // Configuration controls - with real-time preview
    document.getElementById('difficulty').addEventListener('change', (e) => {
      this.updateConfig({ difficulty: e.target.value });
    });
    
    document.querySelectorAll('input[name="operation"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.updateConfig({ operationType: e.target.value });
        }
      });
    });
    
    document.getElementById('layout').addEventListener('change', (e) => {
      this.updateConfig({ layout: e.target.value });
    });
    
    document.getElementById('background').addEventListener('change', (e) => {
      this.updateConfig({ backgroundStyle: e.target.value });
      this.toggleCustomBackgroundUpload(e.target.value === 'custom');
    });
    
    document.getElementById('custom-background').addEventListener('change', (e) => {
      this.handleCustomBackgroundUpload(e.target.files[0]);
    });
    
    // Action buttons
    document.getElementById('generate-btn').addEventListener('click', () => {
      this.generateWorksheet();
    });
    
    document.getElementById('export-btn').addEventListener('click', () => {
      this.exportWorksheet();
    });
    
    // Message overlays
    document.getElementById('error-close').addEventListener('click', () => {
      this.hideError();
    });
    
    document.getElementById('success-close').addEventListener('click', () => {
      this.hideSuccess();
    });
    
    // PWA install button
    document.getElementById('install-btn').addEventListener('click', () => {
      this.installPWA();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
    
    // Window resize handling
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }
  
  /**
   * Initialize PWA features
   */
  async initializePWA() {
    try {
      // 暂时禁用Service Worker以避免缓存问题
      console.log('PWA features disabled for debugging');
      return;
      
      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('Service Worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('New service worker version available');
        });
      }
      
      // Setup install prompt
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.showInstallButton();
      });
      
      // Handle app installed
      window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        this.hideInstallButton();
        this.showSuccess('应用安装成功！');
      });
      
    } catch (error) {
      console.warn('PWA features not available:', error);
    }
  }
  
  /**
   * Load user preferences from local storage
   */
  loadUserPreferences() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.userPreferences);
      if (stored) {
        const preferences = JSON.parse(stored);
        if (preferences.defaultConfig) {
          this.currentConfig = WorksheetConfig.fromJSON(preferences.defaultConfig);
        }
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  }
  
  /**
   * Save user preferences to local storage
   */
  saveUserPreferences() {
    try {
      const preferences = {
        defaultConfig: this.currentConfig.toJSON(),
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.userPreferences, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }
  
  /**
   * Update configuration
   * @param {Object} updates - Configuration updates
   */
  updateConfig(updates) {
    if (!this.currentConfig) return;
    
    try {
      this.currentConfig.update(updates);
      this.updateUI();
      this.saveUserPreferences();
      
      // Real-time preview update
      this.updatePreview();
    } catch (error) {
      console.error('Failed to update configuration:', error);
      
      // Use error handler if available
      if (this.errorHandler) {
        this.errorHandler.handleError(
          new AppError(
            error.message || '配置更新失败',
            ErrorTypes.VALIDATION,
            ErrorSeverity.LOW,
            { originalError: error, updates }
          )
        );
      } else {
        this.showError('配置更新失败: ' + error.message);
      }
    }
  }
  
  /**
   * Update UI to reflect current configuration
   */
  updateUI() {
    if (!this.currentConfig) return;
    
    // Update form controls
    document.getElementById('difficulty').value = this.currentConfig.difficulty;
    document.querySelector(`input[name="operation"][value="${this.currentConfig.operationType}"]`).checked = true;
    document.getElementById('layout').value = this.currentConfig.layout;
    document.getElementById('background').value = this.currentConfig.backgroundStyle;
    
    // Show/hide custom background upload
    this.toggleCustomBackgroundUpload(this.currentConfig.backgroundStyle === 'custom');
  }
  
  /**
   * Toggle custom background upload visibility
   * @param {boolean} show - Whether to show the upload control
   */
  toggleCustomBackgroundUpload(show) {
    const group = document.getElementById('custom-background-group');
    group.style.display = show ? 'block' : 'none';
  }
  
  /**
   * Handle custom background image upload
   * @param {File} file - Uploaded file
   */
  handleCustomBackgroundUpload(file) {
    if (!file) return;
    
    // Validate file type
    if (!VALIDATION_RULES.fileSize.allowedTypes.includes(file.type)) {
      this.showError('不支持的文件格式，请上传 PNG、JPEG 或 GIF 图片');
      return;
    }
    
    // Validate file size
    if (file.size > VALIDATION_RULES.fileSize.maxSize) {
      this.showError('文件大小超出限制，请选择小于 5MB 的图片');
      return;
    }
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      this.updateConfig({ customBackgroundUrl: e.target.result });
    };
    reader.onerror = () => {
      this.showError('文件读取失败，请重试');
    };
    reader.readAsDataURL(file);
  }
  
  /**
   * Generate worksheet with current configuration
   */
  async generateWorksheet() {
    if (this.isGenerating) return;
    
    const operationId = 'generate-worksheet';
    
    try {
      this.isGenerating = true;
      
      // Use progress indicator if available
      if (this.progressIndicator) {
        this.progressIndicator.startOperation(operationId, '正在生成练习册...', { 
          showProgress: true,
          total: 100
        });
      } else {
        this.showLoading('正在生成练习册...');
      }
      
      console.log('Starting worksheet generation...');
      console.log('Current config:', this.currentConfig);
      
      // Update progress: generating problems
      if (this.progressIndicator) {
        this.progressIndicator.updateProgress(operationId, 30, '正在生成题目...');
      }
      
      // Generate problems (placeholder - will be implemented in task 2)
      this.currentProblems = this.generatePlaceholderProblems();
      console.log('Generated', this.currentProblems.length, 'problems');
      
      // Update progress: rendering
      if (this.progressIndicator) {
        this.progressIndicator.updateProgress(operationId, 70, '正在渲染练习册...');
      }
      
      // Render worksheet
      await this.renderWorksheet();
      console.log('Worksheet rendered successfully');
      
      // Update progress: complete
      if (this.progressIndicator) {
        this.progressIndicator.updateProgress(operationId, 100, '完成！');
      }
      
      // Enable export button
      document.getElementById('export-btn').disabled = false;
      
      if (this.progressIndicator) {
        this.progressIndicator.completeOperation(operationId, '练习册生成成功！');
      } else {
        this.hideLoading();
      }
      
      this.showPreview();
      
      console.log('Worksheet generation complete');
      
    } catch (error) {
      console.error('Failed to generate worksheet:', error);
      
      if (this.progressIndicator) {
        this.progressIndicator.failOperation(operationId, '生成练习册失败');
      }
      
      // Use error handler if available
      if (this.errorHandler) {
        this.errorHandler.handleError(
          new AppError(
            error.message || '生成练习册失败',
            ErrorTypes.RENDERING,
            ErrorSeverity.MEDIUM,
            { originalError: error }
          ),
          {
            retry: true,
            operationId: 'generate-retry',
            retryFn: () => this.generateWorksheet()
          }
        );
      } else {
        this.showError('生成练习册失败: ' + error.message);
      }
    } finally {
      this.isGenerating = false;
      if (!this.progressIndicator) {
        this.hideLoading();
      }
    }
  }
  
  /**
   * Generate placeholder problems for testing
   * @returns {Array} Array of placeholder problems
   */
  generatePlaceholderProblems() {
    console.log('Generating placeholder problems...');
    
    const problems = [];
    const count = this.currentConfig.problemCount;
    const difficulty = this.currentConfig.getDifficultyConfig();
    
    console.log(`Generating ${count} problems with difficulty:`, difficulty);
    
    for (let i = 0; i < count; i++) {
      const a = Math.floor(Math.random() * difficulty.maxNumber) + 1;
      const b = Math.floor(Math.random() * difficulty.maxNumber) + 1;
      
      let operator, result;
      if (this.currentConfig.operationType === 'addition') {
        operator = '+';
        result = a + b;
      } else if (this.currentConfig.operationType === 'subtraction') {
        operator = '-';
        // Ensure non-negative result
        const larger = Math.max(a, b);
        const smaller = Math.min(a, b);
        result = larger - smaller;
        problems.push(new MathProblem(larger, smaller, operator, result));
        continue;
      } else {
        // Mixed
        operator = Math.random() < 0.5 ? '+' : '-';
        if (operator === '+') {
          result = a + b;
        } else {
          const larger = Math.max(a, b);
          const smaller = Math.min(a, b);
          result = larger - smaller;
          problems.push(new MathProblem(larger, smaller, operator, result));
          continue;
        }
      }
      
      problems.push(new MathProblem(a, b, operator, result));
    }
    
    console.log('Generated problems:', problems.map(p => p.toString()));
    return problems;
  }
  
  /**
   * Render worksheet to canvas
   */
  async renderWorksheet() {
    if (!this.renderingEngine.isReady()) {
      throw new Error('Rendering engine not ready');
    }
    
    console.log('Starting worksheet rendering with', this.currentProblems.length, 'problems');
    
    // Clear canvas
    this.renderingEngine.clear();
    
    // Render background
    const backgroundConfig = this.currentConfig.getBackgroundConfig();
    console.log('Background config:', backgroundConfig);
    this.renderingEngine.renderBackground(backgroundConfig);
    
    // Calculate layout (placeholder - will be implemented in task 4)
    const layout = this.calculatePlaceholderLayout();
    console.log('Layout calculated:', layout.length, 'positions');
    
    // Render problems
    this.currentProblems.forEach((problem, index) => {
      if (layout[index]) {
        console.log(`Rendering problem ${index}:`, problem.toString(), 'at position:', layout[index]);
        this.renderingEngine.renderProblem(problem, layout[index], this.currentConfig.showAnswers);
      }
    });
    
    // Test if canvas has content by checking if it's not blank
    const canvas = this.renderingEngine.canvas;
    const imageData = this.renderingEngine.context.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some(pixel => pixel !== 0);
    console.log('Canvas has content:', hasContent);
    
    console.log('Worksheet rendering complete');
  }
  
  /**
   * Calculate placeholder layout for problems
   * @returns {Array} Array of position objects
   */
  calculatePlaceholderLayout() {
    const layout = [];
    const layoutConfig = this.currentConfig.getLayoutConfig();
    const { columns } = layoutConfig;
    
    const canvasWidth = CANVAS_CONFIG.previewWidth;
    const canvasHeight = CANVAS_CONFIG.previewHeight;
    
    // A4纸张比例的合理边距 (约占页面的10-15%)
    const marginRatio = 0.12; // 12%的边距
    const topMargin = canvasHeight * marginRatio;
    const sideMargin = canvasWidth * marginRatio;
    
    const margins = { 
      top: topMargin, 
      left: sideMargin, 
      right: sideMargin, 
      bottom: topMargin 
    };
    
    const availableWidth = canvasWidth - margins.left - margins.right;
    const availableHeight = canvasHeight - margins.top - margins.bottom;
    
    const columnWidth = availableWidth / columns;
    // 三列时使用更大的padding来增加列间距
    const columnPadding = columns === 3 ? 15 : 10;
    
    // 根据可用高度和题目数量计算合理的题目高度
    const rowsNeeded = Math.ceil(this.currentProblems.length / columns);
    const problemHeight = Math.min(40, (availableHeight / rowsNeeded) * 0.7); // 70%用于题目，30%用于间距
    const verticalSpacing = (availableHeight / rowsNeeded) * 0.3;
    
    this.currentProblems.forEach((problem, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      
      const x = margins.left + column * columnWidth + columnPadding;
      const y = margins.top + row * (problemHeight + verticalSpacing);
      
      layout.push({
        x: x,
        y: y,
        width: columnWidth - (columnPadding * 2),
        height: problemHeight
      });
    });
    
    return layout;
  }
  
  /**
   * Export worksheet as image
   */
  async exportWorksheet() {
    if (this.isExporting || this.currentProblems.length === 0) return;
    
    const operationId = 'export-worksheet';
    
    try {
      this.isExporting = true;
      
      // Use progress indicator if available
      if (this.progressIndicator) {
        this.progressIndicator.startOperation(operationId, '正在导出图片...', { 
          showProgress: true,
          total: 100
        });
      } else {
        this.showLoading('正在导出图片...');
      }
      
      console.log('Starting export process using ImageExporter...');
      
      // Update progress: creating canvas
      if (this.progressIndicator) {
        this.progressIndicator.updateProgress(operationId, 20, '正在创建画布...');
      }
      
      // Create export canvas with high resolution
      const exportCanvas = document.createElement('canvas');
      const exportEngine = new RenderingEngine();
      exportEngine.initialize(exportCanvas);
      exportEngine.setExportSize(CANVAS_CONFIG.width, CANVAS_CONFIG.height);
      
      console.log('Export canvas size:', exportCanvas.width, 'x', exportCanvas.height);
      
      // Update progress: rendering
      if (this.progressIndicator) {
        this.progressIndicator.updateProgress(operationId, 50, '正在渲染高清图片...');
      }
      
      // Render worksheet to export canvas
      await this.renderWorksheetToCanvas(exportEngine);
      
      // Update progress: exporting
      if (this.progressIndicator) {
        this.progressIndicator.updateProgress(operationId, 80, '正在生成文件...');
      }
      
      // Export using ImageExporter
      const filename = this.imageExporter.generateFilename({
        customSuffix: `${this.currentConfig.difficulty}-${this.currentConfig.operationType}`
      });
      
      await this.imageExporter.exportAndDownload(exportCanvas, {
        format: 'png',
        quality: 1.0,
        filename: filename
      });
      
      // Update progress: complete
      if (this.progressIndicator) {
        this.progressIndicator.updateProgress(operationId, 100, '完成！');
        this.progressIndicator.completeOperation(operationId, '图片导出成功！');
      } else {
        this.hideLoading();
        this.showSuccess('图片导出成功！');
      }
      
    } catch (error) {
      console.error('Failed to export worksheet:', error);
      
      if (this.progressIndicator) {
        this.progressIndicator.failOperation(operationId, '导出图片失败');
      }
      
      // Use error handler if available
      if (this.errorHandler) {
        this.errorHandler.handleError(
          new AppError(
            error.message || '导出图片失败',
            ErrorTypes.EXPORT,
            ErrorSeverity.MEDIUM,
            { originalError: error }
          ),
          {
            retry: true,
            operationId: 'export-retry',
            retryFn: () => this.exportWorksheet()
          }
        );
      } else {
        this.showError('导出图片失败: ' + error.message);
      }
    } finally {
      this.isExporting = false;
      if (!this.progressIndicator) {
        this.hideLoading();
      }
    }
  }
  
  /**
   * Render worksheet to a specific canvas (for export)
   * @param {RenderingEngine} renderingEngine - Rendering engine to use
   */
  async renderWorksheetToCanvas(renderingEngine) {
    console.log('Rendering worksheet to export canvas...');
    
    // Clear canvas
    renderingEngine.clear();
    
    // Render background
    const backgroundConfig = this.currentConfig.getBackgroundConfig();
    await renderingEngine.renderBackground(backgroundConfig);
    
    // Calculate layout for export (high resolution)
    const layout = this.calculateExportLayout(renderingEngine.canvas.width, renderingEngine.canvas.height);
    
    // Render problems
    this.currentProblems.forEach((problem, index) => {
      if (layout[index]) {
        renderingEngine.renderProblem(problem, layout[index], this.currentConfig.showAnswers);
      }
    });
    
    console.log('Export rendering complete');
  }

  /**
   * Calculate layout for high-resolution export
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   * @returns {Array} Array of position objects for export
   */
  calculateExportLayout(canvasWidth, canvasHeight) {
    const layout = [];
    const layoutConfig = this.currentConfig.getLayoutConfig();
    const { columns } = layoutConfig;
    
    // 使用配置中的边距（已经是300 DPI的像素值）
    const margins = CANVAS_CONFIG.margins;
    const availableWidth = canvasWidth - margins.left - margins.right;
    const availableHeight = canvasHeight - margins.top - margins.bottom;
    
    const columnWidth = availableWidth / columns;
    // 三列时使用更大的padding来增加列间距
    const columnPadding = columns === 3 ? 80 : 50;
    
    // 根据可用高度和题目数量计算合理的题目高度
    const rowsNeeded = Math.ceil(this.currentProblems.length / columns);
    const problemHeight = Math.min(250, (availableHeight / rowsNeeded) * 0.7);
    const verticalSpacing = (availableHeight / rowsNeeded) * 0.3;
    
    console.log(`Export layout: ${canvasWidth}x${canvasHeight}, Available: ${availableWidth}x${availableHeight}`);
    console.log(`Columns: ${columns}, Rows: ${rowsNeeded}, Problem height: ${problemHeight}, Spacing: ${verticalSpacing}`);
    
    this.currentProblems.forEach((problem, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      
      const x = margins.left + column * columnWidth + columnPadding;
      const y = margins.top + row * (problemHeight + verticalSpacing);
      
      // 确保题目不会超出画布边界
      if (y + problemHeight <= canvasHeight - margins.bottom) {
        layout.push({
          x: x,
          y: y,
          width: columnWidth - (columnPadding * 2),
          height: problemHeight
        });
      } else {
        console.warn(`Problem ${index} would be outside canvas bounds, skipping`);
      }
    });
    
    return layout;
  }
  
  /**
   * Generate filename for export (deprecated - use ImageExporter.generateFilename)
   * @returns {string} Generated filename
   */
  generateFilename() {
    return this.imageExporter.generateFilename({
      customSuffix: `${this.currentConfig.difficulty}-${this.currentConfig.operationType}`
    });
  }
  
  /**
   * Download blob as file (deprecated - use ImageExporter.downloadBlob)
   * @param {Blob} blob - Blob to download
   * @param {string} filename - Filename for download
   */
  downloadBlob(blob, filename) {
    return this.imageExporter.downloadBlob(blob, filename);
  }
  
  /**
   * Show preview canvas
   */
  showPreview() {
    console.log('Showing preview canvas...');
    const placeholder = document.getElementById('preview-placeholder');
    const canvas = document.getElementById('preview-canvas');
    
    console.log('Placeholder element:', placeholder);
    console.log('Canvas element:', canvas);
    console.log('Canvas dimensions:', canvas ? `${canvas.width}x${canvas.height}` : 'N/A');
    console.log('Canvas CSS dimensions:', canvas ? `${canvas.style.width}x${canvas.style.height}` : 'N/A');
    
    if (placeholder) {
      placeholder.style.display = 'none';
      console.log('Placeholder hidden');
    }
    
    if (canvas) {
      // 确保canvas可见
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      canvas.style.opacity = '1';
      
      console.log('Canvas shown');
      
      // Force a repaint
      canvas.offsetHeight;
    }
    
    // Enable share button if available
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
      shareBtn.disabled = false;
    }
  }
  
  /**
   * Hide preview canvas
   */
  hidePreview() {
    const placeholder = document.getElementById('preview-placeholder');
    const canvas = document.getElementById('preview-canvas');
    
    if (canvas) {
      canvas.style.display = 'none';
    }
    
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }
  
  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  showLoading(message = '正在处理...') {
    const overlay = document.getElementById('loading-overlay');
    const text = overlay.querySelector('p');
    text.textContent = message;
    overlay.style.display = 'flex';
  }
  
  /**
   * Hide loading overlay
   */
  hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    const overlay = document.getElementById('error-message');
    const text = document.getElementById('error-text');
    text.textContent = message;
    overlay.style.display = 'flex';
  }
  
  /**
   * Hide error message
   */
  hideError() {
    document.getElementById('error-message').style.display = 'none';
  }
  
  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    const overlay = document.getElementById('success-message');
    const text = document.getElementById('success-text');
    text.textContent = message;
    overlay.style.display = 'flex';
  }
  
  /**
   * Hide success message
   */
  hideSuccess() {
    document.getElementById('success-message').style.display = 'none';
  }
  
  /**
   * Show warning message
   * @param {string} message - Warning message
   */
  showWarning(message) {
    // Use progress indicator toast if available
    if (this.progressIndicator) {
      this.progressIndicator.showWarning(message);
    } else {
      // Fallback to error message with warning styling
      this.showError(message);
    }
  }
  
  /**
   * Show PWA install button
   */
  showInstallButton() {
    document.getElementById('install-btn').style.display = 'block';
  }
  
  /**
   * Hide PWA install button
   */
  hideInstallButton() {
    document.getElementById('install-btn').style.display = 'none';
  }
  
  /**
   * Install PWA
   */
  async installPWA() {
    if (!this.deferredPrompt) return;
    
    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted PWA install');
      } else {
        console.log('User dismissed PWA install');
      }
      
      this.deferredPrompt = null;
      this.hideInstallButton();
      
    } catch (error) {
      console.error('Failed to install PWA:', error);
    }
  }
  
  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'g':
          e.preventDefault();
          this.generateWorksheet();
          break;
        case 's':
          e.preventDefault();
          this.exportWorksheet();
          break;
      }
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Debounce resize handling
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (this.renderingEngine && this.renderingEngine.isReady()) {
        this.renderingEngine.setupHighDPI();
        // Update preview after resize
        this.updatePreview();
      }
    }, 250);
  }
  
  /**
   * Update preview in real-time
   */
  updatePreview() {
    // Clear any existing preview update timeout
    clearTimeout(this.previewUpdateTimeout);
    
    // Debounce preview updates to avoid excessive rendering
    this.previewUpdateTimeout = setTimeout(() => {
      this.renderPreview();
    }, PERFORMANCE_CONFIG.debounceDelay);
  }
  
  /**
   * Render preview with current configuration
   */
  async renderPreview() {
    if (!this.renderingEngine || !this.renderingEngine.isReady()) {
      console.warn('Rendering engine not ready for preview');
      return;
    }
    
    try {
      console.log('Updating real-time preview...');
      
      // Generate preview problems if we don't have any or config changed significantly
      if (this.currentProblems.length === 0 || this.shouldRegenerateProblems()) {
        this.currentProblems = this.generatePlaceholderProblems();
      }
      
      // Clear canvas
      this.renderingEngine.clear();
      
      // Render background
      const backgroundConfig = this.currentConfig.getBackgroundConfig();
      await this.renderingEngine.renderBackground(backgroundConfig);
      
      // Calculate layout for preview
      const layout = this.calculatePlaceholderLayout();
      
      // Render problems
      this.currentProblems.forEach((problem, index) => {
        if (layout[index]) {
          this.renderingEngine.renderProblem(problem, layout[index], this.currentConfig.showAnswers);
        }
      });
      
      // Show the preview canvas
      this.showPreview();
      
      // Enable export button since we have content
      document.getElementById('export-btn').disabled = false;
      
      console.log('Real-time preview updated successfully');
      
    } catch (error) {
      console.error('Failed to update preview:', error);
      // Don't show error to user for preview updates, just log it
    }
  }
  
  /**
   * Check if problems should be regenerated based on config changes
   * @returns {boolean} True if problems should be regenerated
   */
  shouldRegenerateProblems() {
    if (!this.lastPreviewConfig) {
      this.lastPreviewConfig = this.currentConfig.clone();
      return true;
    }
    
    // Check if significant config changes occurred that require new problems
    const significantChanges = [
      'difficulty',
      'operationType',
      'problemCount'
    ];
    
    for (const key of significantChanges) {
      if (this.lastPreviewConfig[key] !== this.currentConfig[key]) {
        this.lastPreviewConfig = this.currentConfig.clone();
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Debounced generation for real-time preview
   */
  debounceGenerate() {
    clearTimeout(this.generateTimeout);
    this.generateTimeout = setTimeout(() => {
      this.generateWorksheet();
    }, PERFORMANCE_CONFIG.debounceDelay);
  }
  
  /**
   * Check for quick generation URL parameter
   */
  checkQuickGeneration() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('quick') === 'true') {
      setTimeout(() => {
        this.generateWorksheet();
      }, 1000);
    }
  }
}

// Initialize application when script loads
const app = new MathWorksheetApp();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathWorksheetApp;
} else {
  window.MathWorksheetApp = app;
}

// 添加背景渲染函数到MathWorksheetApp原型
MathWorksheetApp.prototype.renderExportBackground = async function(ctx, backgroundConfig, width, height) {
  const backgroundType = backgroundConfig.backgroundStyle || backgroundConfig.type || 'blank';
  
  switch (backgroundType) {
    case 'lined':
      const lineSpacing = 240;
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let y = lineSpacing; y < height; y += lineSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
      break;
      
    case 'grid':
      const gridSize = 160;
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = gridSize; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = gridSize; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
      break;
      
    case 'dotted':
      const dotSpacing = 120;
      const dotSize = 8;
      ctx.fillStyle = '#d0d0d0';
      for (let x = dotSpacing; x < width; x += dotSpacing) {
        for (let y = dotSpacing; y < height; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      break;
  }
};