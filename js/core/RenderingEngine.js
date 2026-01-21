/**
 * RenderingEngine - Handles Canvas rendering for math worksheets
 */
class RenderingEngine {
  constructor() {
    this.canvas = null;
    this.context = null;
    this.dpi = CANVAS_CONFIG.dpi;
    this.scale = 1;
    this.isHighDPI = window.devicePixelRatio > 1;
    this.backgroundProcessor = new BackgroundStyleProcessor();
  }
  
  /**
   * Initialize the rendering engine with a canvas element
   * @param {HTMLCanvasElement} canvas - Canvas element to render to
   */
  initialize(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    
    if (!this.context) {
      throw new Error('Canvas 2D context not supported');
    }
    
    console.log('RenderingEngine initialized with canvas:', canvas.id || 'unnamed');
    
    // Set initial canvas size if not set
    if (!canvas.width || !canvas.height) {
      this.setPreviewSize();
    }
    
    // Set default rendering properties
    this.setupDefaults();
    
    console.log('RenderingEngine setup complete');
  }
  
  /**
   * Setup canvas for high DPI displays
   */
  setupHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    
    // Get current canvas dimensions or use defaults
    const rect = this.canvas.getBoundingClientRect();
    const displayWidth = rect.width || CANVAS_CONFIG.previewWidth;
    const displayHeight = rect.height || CANVAS_CONFIG.previewHeight;
    
    // Set actual canvas size for high DPI
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;
    
    // Scale context to match device pixel ratio
    this.context.scale(dpr, dpr);
    
    // Set CSS size to maintain display size
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';
    
    this.scale = dpr;
    
    console.log(`Canvas setup: ${displayWidth}x${displayHeight} display, ${this.canvas.width}x${this.canvas.height} actual, DPR: ${dpr}`);
  }
  
  /**
   * Setup default rendering properties
   */
  setupDefaults() {
    this.context.textBaseline = 'top';
    this.context.textAlign = 'left';
    this.context.fillStyle = '#000000';
    this.context.strokeStyle = '#000000';
    this.context.lineWidth = 1;
    this.context.font = `${FONT_CONFIG.problem.size}px ${FONT_CONFIG.problem.family}`;
    
    // Enable text anti-aliasing
    this.context.textRenderingOptimization = 'optimizeQuality';
    
    console.log('Default rendering properties set');
  }
  
  /**
   * Clear the entire canvas
   */
  clear() {
    // Save current transform
    this.context.save();
    
    // Reset transform to clear entire canvas
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Restore transform
    this.context.restore();
    
    console.log('Canvas cleared');
  }
  
  /**
   * Set canvas size for export (high resolution)
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  setExportSize(width = CANVAS_CONFIG.width, height = CANVAS_CONFIG.height) {
    console.log(`Setting export size: ${width}x${height}`);
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Calculate scale factor for export
    this.scale = width / CANVAS_CONFIG.previewWidth;
    
    // Reset context transform
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.setupDefaults();
    
    console.log(`Export size set: canvas=${this.canvas.width}x${this.canvas.height}, scale=${this.scale}`);
  }
  
  /**
   * Set canvas size for preview (display resolution)
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  setPreviewSize(width = CANVAS_CONFIG.previewWidth, height = CANVAS_CONFIG.previewHeight) {
    console.log(`Setting preview size: ${width}x${height}`);
    
    // Set canvas dimensions
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Set CSS dimensions to ensure visibility
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.canvas.style.display = 'block';
    this.canvas.style.visibility = 'visible';
    
    // Reset scale for preview
    this.scale = 1;
    
    // Reset context transform and setup defaults
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.setupDefaults();
    
    console.log(`Preview size set: canvas=${this.canvas.width}x${this.canvas.height}, CSS=${this.canvas.style.width}x${this.canvas.style.height}`);
  }
  
  /**
   * Render background style
   * @param {Object} backgroundConfig - Background configuration
   */
  async renderBackground(backgroundConfig) {
    console.log('Rendering background:', backgroundConfig);
    
    try {
      const dimensions = {
        width: this.canvas.width / this.scale,
        height: this.canvas.height / this.scale
      };
      
      await this.backgroundProcessor.processBackground(
        this.context, 
        backgroundConfig, 
        dimensions
      );
      
      console.log('Background rendering complete');
    } catch (error) {
      console.error('Error rendering background:', error);
      // Fallback to white background
      this.context.save();
      this.context.fillStyle = '#ffffff';
      this.context.fillRect(0, 0, this.canvas.width / this.scale, this.canvas.height / this.scale);
      this.context.restore();
    }
  }
  
  /**
   * Render a math problem at specified position
   * @param {MathProblem} problem - Math problem to render
   * @param {Object} position - Position and size {x, y, width, height}
   * @param {boolean} showAnswer - Whether to show the answer
   */
  renderProblem(problem, position, showAnswer = false) {
    if (!problem || !position) {
      console.warn('Invalid problem or position for rendering');
      return;
    }
    
    const { x, y, width, height } = position;
    
    console.log(`Rendering problem at (${x}, ${y}): ${problem.toString()}`);
    
    try {
      this.context.save();
      
      // Calculate font size based on available width and canvas scale
      const baseFontSize = FONT_CONFIG.problem.size;
      const problemText = problem.toString();
      
      // Measure text with base font size
      this.context.font = `${FONT_CONFIG.problem.weight} ${baseFontSize}px ${FONT_CONFIG.problem.family}`;
      let textWidth = this.context.measureText(problemText).width;
      
      // Scale down font if text is too wide for the column
      let fontSize = baseFontSize;
      if (textWidth > width) {
        fontSize = Math.floor(baseFontSize * (width / textWidth) * 0.9); // 0.9 for padding
        fontSize = Math.max(fontSize, 16); // Minimum font size
      }
      
      const scaledFontSize = fontSize * this.scale;
      
      // Set font for problem
      this.context.font = `${FONT_CONFIG.problem.weight} ${scaledFontSize}px ${FONT_CONFIG.problem.family}`;
      this.context.fillStyle = FONT_CONFIG.problem.color;
      this.context.textAlign = 'left';
      this.context.textBaseline = 'top';
      
      // Render problem text
      this.context.fillText(problemText, x, y);
      
      // Render answer if requested
      if (showAnswer) {
        const answerY = y + scaledFontSize * FONT_CONFIG.lineHeight;
        const baseAnswerFontSize = Math.floor(fontSize * 0.75); // Answer font is 75% of problem font
        const scaledAnswerFontSize = baseAnswerFontSize * this.scale;
        
        this.context.font = `${FONT_CONFIG.answer.weight} ${scaledAnswerFontSize}px ${FONT_CONFIG.answer.family}`;
        this.context.fillStyle = FONT_CONFIG.answer.color;
        this.context.fillText(problem.result.toString(), x, answerY);
      }
      
      this.context.restore();
      
      console.log(`Problem rendered: ${problemText}${showAnswer ? ' = ' + problem.result : ''} at scale ${this.scale}, fontSize ${fontSize}`);
    } catch (error) {
      console.error('Error rendering problem:', error);
      this.context.restore();
    }
  }
  
  /**
   * Render text at specified position
   * @param {string} text - Text to render
   * @param {Object} position - Position {x, y}
   * @param {Object} style - Text style options
   */
  renderText(text, position, style = {}) {
    const { x, y } = position;
    
    this.context.save();
    
    // Apply text style
    const fontSize = style.fontSize || FONT_CONFIG.problem.size;
    const fontFamily = style.fontFamily || FONT_CONFIG.problem.family;
    const fontWeight = style.fontWeight || FONT_CONFIG.problem.weight;
    const color = style.color || FONT_CONFIG.problem.color;
    const align = style.align || 'left';
    const baseline = style.baseline || 'top';
    
    this.context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    this.context.fillStyle = color;
    this.context.textAlign = align;
    this.context.textBaseline = baseline;
    
    this.context.fillText(text, x, y);
    
    this.context.restore();
    
    console.log(`Text rendered at (${x}, ${y}): "${text}"`);
  }
  
  /**
   * Measure text dimensions
   * @param {string} text - Text to measure
   * @param {Object} style - Text style options
   * @returns {Object} Text metrics {width, height}
   */
  measureText(text, style = {}) {
    const fontSize = style.fontSize || FONT_CONFIG.problem.size;
    const fontFamily = style.fontFamily || FONT_CONFIG.problem.family;
    const fontWeight = style.fontWeight || FONT_CONFIG.problem.weight;
    
    this.context.save();
    this.context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = this.context.measureText(text);
    this.context.restore();
    
    return {
      width: metrics.width,
      height: fontSize
    };
  }
  
  /**
   * Draw a rectangle
   * @param {Object} rect - Rectangle {x, y, width, height}
   * @param {Object} style - Style options
   */
  drawRect(rect, style = {}) {
    const { x, y, width, height } = rect;
    
    this.context.save();
    
    if (style.fill) {
      this.context.fillStyle = style.fill;
      this.context.fillRect(x, y, width, height);
    }
    
    if (style.stroke) {
      this.context.strokeStyle = style.stroke;
      this.context.lineWidth = style.lineWidth || 1;
      this.context.strokeRect(x, y, width, height);
    }
    
    this.context.restore();
  }
  
  /**
   * Draw a line
   * @param {Object} from - Start point {x, y}
   * @param {Object} to - End point {x, y}
   * @param {Object} style - Line style options
   */
  drawLine(from, to, style = {}) {
    this.context.save();
    
    this.context.strokeStyle = style.color || '#000000';
    this.context.lineWidth = style.width || 1;
    
    this.context.beginPath();
    this.context.moveTo(from.x, from.y);
    this.context.lineTo(to.x, to.y);
    this.context.stroke();
    
    this.context.restore();
  }
  
  /**
   * Render a complete worksheet with problems and background
   * @param {Array} problems - Array of MathProblem instances
   * @param {Object} config - Worksheet configuration
   * @param {Array} layout - Array of position objects for each problem
   * @returns {Promise<void>} Promise that resolves when rendering is complete
   */
  async renderWorksheet(problems, config, layout) {
    console.log('Starting worksheet rendering...');
    
    if (!this.isReady()) {
      throw new Error('Rendering engine not ready');
    }
    
    // Clear canvas
    this.clear();
    
    // Render background
    const backgroundConfig = config.getBackgroundConfig();
    await this.renderBackground(backgroundConfig);
    
    // Render problems
    problems.forEach((problem, index) => {
      if (layout[index]) {
        this.renderProblem(problem, layout[index], config.showAnswers);
      }
    });
    
    console.log(`Worksheet rendering complete: ${problems.length} problems rendered`);
  }

  /**
   * Export canvas as blob
   * @param {string} format - Image format ('png' or 'jpeg')
   * @param {number} quality - Image quality (0-1)
   * @returns {Promise<Blob>} Canvas as blob
   */
  toBlob(format = 'png', quality = 1.0) {
    return new Promise((resolve, reject) => {
      const mimeType = EXPORT_CONFIG.formats[format]?.mimeType || 'image/png';
      
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, mimeType, quality);
    });
  }
  
  /**
   * Get canvas as data URL
   * @param {string} format - Image format
   * @param {number} quality - Image quality
   * @returns {string} Data URL
   */
  toDataURL(format = 'png', quality = 1.0) {
    const mimeType = EXPORT_CONFIG.formats[format]?.mimeType || 'image/png';
    return this.canvas.toDataURL(mimeType, quality);
  }
  
  /**
   * Check if rendering engine is ready
   * @returns {boolean} True if ready to render
   */
  isReady() {
    return this.canvas && this.context;
  }
  
  /**
   * Get canvas dimensions
   * @returns {Object} Canvas dimensions {width, height}
   */
  getDimensions() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RenderingEngine;
} else {
  window.RenderingEngine = RenderingEngine;
}