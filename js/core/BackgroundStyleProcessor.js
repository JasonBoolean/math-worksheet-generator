/**
 * BackgroundStyleProcessor - Handles background style rendering for math worksheets
 * Implements multiple background styles including blank, lined, grid, dotted, and custom images
 */
class BackgroundStyleProcessor {
  constructor() {
    this.supportedStyles = ['blank', 'lined', 'grid', 'dotted', 'custom'];
    this.cache = new Map(); // Cache for processed backgrounds
    this.customImages = new Map(); // Cache for custom images
  }
  
  /**
   * Process and render background style to canvas
   * @param {CanvasRenderingContext2D} context - Canvas rendering context
   * @param {Object} config - Background configuration
   * @param {Object} dimensions - Canvas dimensions {width, height}
   * @returns {Promise<void>} Promise that resolves when background is rendered
   */
  async processBackground(context, config, dimensions) {
    if (!context || !config || !dimensions) {
      throw new Error('Invalid parameters for background processing');
    }
    
    console.log('Processing background:', config.type || config.backgroundStyle, dimensions);
    
    try {
      // Always start with a solid background
      this.renderSolidBackground(context, dimensions, '#ffffff');
      
      // Get the background type from config
      const backgroundType = config.type || config.backgroundStyle || 'blank';
      
      // Process specific background style
      switch (backgroundType) {
        case 'blank':
          // Already rendered white background above
          break;
          
        case 'lined':
          this.renderLinedBackground(context, config, dimensions);
          break;
          
        case 'grid':
          this.renderGridBackground(context, config, dimensions);
          break;
          
        case 'dotted':
          this.renderDottedBackground(context, config, dimensions);
          break;
          
        case 'custom':
          await this.renderCustomBackground(context, config, dimensions);
          break;
          
        default:
          console.warn('Unknown background type:', backgroundType);
          // Fallback to blank background
          break;
      }
      
      console.log('Background processing complete');
    } catch (error) {
      console.error('Error processing background:', error);
      // Fallback to white background
      this.renderSolidBackground(context, dimensions, '#ffffff');
    }
  }
  
  /**
   * Render solid color background
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {Object} dimensions - Canvas dimensions
   * @param {string} color - Background color
   */
  renderSolidBackground(context, dimensions, color = '#ffffff') {
    context.save();
    context.fillStyle = color;
    context.fillRect(0, 0, dimensions.width, dimensions.height);
    context.restore();
    
    console.log(`Solid background rendered: ${color}, size: ${dimensions.width}x${dimensions.height}`);
  }
  
  /**
   * Render lined background (horizontal lines)
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {Object} config - Line configuration
   * @param {Object} dimensions - Canvas dimensions
   */
  renderLinedBackground(context, config, dimensions) {
    const lineSpacing = config.lineSpacing || 60;
    const lineColor = config.lineColor || '#e0e0e0';
    const lineWidth = config.lineWidth || 1;
    
    context.save();
    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    context.beginPath();
    
    // Draw horizontal lines
    for (let y = lineSpacing; y < dimensions.height; y += lineSpacing) {
      context.moveTo(0, y);
      context.lineTo(dimensions.width, y);
    }
    
    context.stroke();
    context.restore();
    
    console.log(`Lined background rendered: spacing=${lineSpacing}, color=${lineColor}`);
  }
  
  /**
   * Render grid background (horizontal and vertical lines)
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {Object} config - Grid configuration
   * @param {Object} dimensions - Canvas dimensions
   */
  renderGridBackground(context, config, dimensions) {
    const gridSize = config.gridSize || 40;
    const lineColor = config.lineColor || '#e0e0e0';
    const lineWidth = config.lineWidth || 1;
    
    context.save();
    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    context.beginPath();
    
    // Draw vertical lines
    for (let x = gridSize; x < dimensions.width; x += gridSize) {
      context.moveTo(x, 0);
      context.lineTo(x, dimensions.height);
    }
    
    // Draw horizontal lines
    for (let y = gridSize; y < dimensions.height; y += gridSize) {
      context.moveTo(0, y);
      context.lineTo(dimensions.width, y);
    }
    
    context.stroke();
    context.restore();
    
    console.log(`Grid background rendered: size=${gridSize}, color=${lineColor}`);
  }
  
  /**
   * Render dotted background (dot pattern)
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {Object} config - Dot configuration
   * @param {Object} dimensions - Canvas dimensions
   */
  renderDottedBackground(context, config, dimensions) {
    const dotSpacing = config.dotSpacing || 30;
    const dotColor = config.dotColor || '#d0d0d0';
    const dotSize = config.dotSize || 2;
    
    context.save();
    context.fillStyle = dotColor;
    
    // Draw dots in a grid pattern
    for (let x = dotSpacing; x < dimensions.width; x += dotSpacing) {
      for (let y = dotSpacing; y < dimensions.height; y += dotSpacing) {
        context.beginPath();
        context.arc(x, y, dotSize, 0, 2 * Math.PI);
        context.fill();
      }
    }
    
    context.restore();
    
    console.log(`Dotted background rendered: spacing=${dotSpacing}, size=${dotSize}, color=${dotColor}`);
  }
  
  /**
   * Render custom image background
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {Object} config - Image configuration
   * @param {Object} dimensions - Canvas dimensions
   * @returns {Promise<void>} Promise that resolves when image is rendered
   */
  async renderCustomBackground(context, config, dimensions) {
    const imageUrl = config.imageUrl || config.customBackgroundUrl;
    
    if (!imageUrl) {
      console.warn('No custom background image URL provided');
      return;
    }
    
    try {
      const image = await this.loadImage(imageUrl);
      
      context.save();
      
      // Set opacity if specified
      if (config.opacity !== undefined) {
        context.globalAlpha = config.opacity;
      }
      
      // Render image based on tile mode
      if (config.tileMode) {
        this.tileImage(context, image, dimensions);
      } else {
        // Stretch to fit canvas
        context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
      }
      
      context.restore();
      
      console.log('Custom background image rendered:', imageUrl);
    } catch (error) {
      console.error('Failed to render custom background:', error);
      // Fallback to white background
      this.renderSolidBackground(context, dimensions, '#ffffff');
    }
  }
  
  /**
   * Load image from URL
   * @param {string} url - Image URL
   * @returns {Promise<HTMLImageElement>} Promise that resolves with loaded image
   */
  loadImage(url) {
    // Check cache first
    if (this.customImages.has(url)) {
      return Promise.resolve(this.customImages.get(url));
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Cache the loaded image
        this.customImages.set(url, img);
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      // Handle data URLs and regular URLs
      img.src = url;
    });
  }
  
  /**
   * Tile an image across the canvas
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {HTMLImageElement} image - Image to tile
   * @param {Object} dimensions - Canvas dimensions
   */
  tileImage(context, image, dimensions) {
    const pattern = context.createPattern(image, 'repeat');
    if (pattern) {
      context.fillStyle = pattern;
      context.fillRect(0, 0, dimensions.width, dimensions.height);
    } else {
      // Fallback: manually tile the image
      const imageWidth = image.width;
      const imageHeight = image.height;
      
      for (let x = 0; x < dimensions.width; x += imageWidth) {
        for (let y = 0; y < dimensions.height; y += imageHeight) {
          context.drawImage(image, x, y);
        }
      }
    }
  }
  
  /**
   * Validate background configuration
   * @param {Object} config - Background configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfig(config) {
    if (!config) {
      return false;
    }
    
    const backgroundType = config.type || config.backgroundStyle;
    
    if (!this.supportedStyles.includes(backgroundType)) {
      console.warn('Unsupported background style:', backgroundType);
      return false;
    }
    
    // Validate specific configuration based on type
    switch (backgroundType) {
      case 'lined':
        return this.validateLinedConfig(config);
      case 'grid':
        return this.validateGridConfig(config);
      case 'dotted':
        return this.validateDottedConfig(config);
      case 'custom':
        return this.validateCustomConfig(config);
      default:
        return true;
    }
  }
  
  /**
   * Validate lined background configuration
   * @param {Object} config - Configuration to validate
   * @returns {boolean} True if valid
   */
  validateLinedConfig(config) {
    const spacing = config.lineSpacing;
    return !spacing || (typeof spacing === 'number' && spacing > 0 && spacing < 1000);
  }
  
  /**
   * Validate grid background configuration
   * @param {Object} config - Configuration to validate
   * @returns {boolean} True if valid
   */
  validateGridConfig(config) {
    const size = config.gridSize;
    return !size || (typeof size === 'number' && size > 0 && size < 500);
  }
  
  /**
   * Validate dotted background configuration
   * @param {Object} config - Configuration to validate
   * @returns {boolean} True if valid
   */
  validateDottedConfig(config) {
    const spacing = config.dotSpacing;
    const size = config.dotSize;
    
    const spacingValid = !spacing || (typeof spacing === 'number' && spacing > 0 && spacing < 500);
    const sizeValid = !size || (typeof size === 'number' && size > 0 && size < 50);
    
    return spacingValid && sizeValid;
  }
  
  /**
   * Validate custom background configuration
   * @param {Object} config - Configuration to validate
   * @returns {boolean} True if valid
   */
  validateCustomConfig(config) {
    const url = config.imageUrl || config.customBackgroundUrl;
    return typeof url === 'string' && url.length > 0;
  }
  
  /**
   * Get default configuration for a background style
   * @param {string} styleType - Background style type
   * @returns {Object} Default configuration
   */
  getDefaultConfig(styleType) {
    const defaults = {
      blank: {
        type: 'blank',
        color: '#ffffff'
      },
      lined: {
        type: 'lined',
        lineSpacing: 60,
        lineColor: '#e0e0e0',
        lineWidth: 1
      },
      grid: {
        type: 'grid',
        gridSize: 40,
        lineColor: '#e0e0e0',
        lineWidth: 1
      },
      dotted: {
        type: 'dotted',
        dotSpacing: 30,
        dotColor: '#d0d0d0',
        dotSize: 2
      },
      custom: {
        type: 'custom',
        imageUrl: null,
        tileMode: false,
        opacity: 1.0
      }
    };
    
    return defaults[styleType] || defaults.blank;
  }
  
  /**
   * Create background configuration from worksheet config
   * @param {WorksheetConfig} worksheetConfig - Worksheet configuration
   * @returns {Object} Background configuration
   */
  createBackgroundConfig(worksheetConfig) {
    if (!worksheetConfig) {
      return this.getDefaultConfig('blank');
    }
    
    const backgroundStyle = worksheetConfig.backgroundStyle || 'blank';
    const baseConfig = this.getDefaultConfig(backgroundStyle);
    
    // Merge with custom background URL if available
    if (backgroundStyle === 'custom' && worksheetConfig.customBackgroundUrl) {
      baseConfig.imageUrl = worksheetConfig.customBackgroundUrl;
    }
    
    return baseConfig;
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.customImages.clear();
    console.log('Background style processor cache cleared');
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      customImagesCount: this.customImages.size,
      supportedStyles: this.supportedStyles
    };
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundStyleProcessor;
} else {
  window.BackgroundStyleProcessor = BackgroundStyleProcessor;
}