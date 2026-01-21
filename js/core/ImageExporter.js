/**
 * ImageExporter - Handles image export and download functionality
 * Implements Canvas to Blob conversion, format support, and file download
 */
class ImageExporter {
  constructor() {
    this.supportedFormats = ['png', 'jpeg'];
    this.defaultQuality = 1.0;
    this.isExporting = false;
  }

  /**
   * Export canvas as blob
   * @param {HTMLCanvasElement} canvas - Canvas element to export
   * @param {Object} options - Export options
   * @param {string} options.format - Image format ('png' or 'jpeg')
   * @param {number} options.quality - Image quality (0-1, for JPEG)
   * @param {number} options.dpi - Target DPI (optional)
   * @returns {Promise<Blob>} Promise that resolves to image blob
   */
  async exportToBlob(canvas, options = {}) {
    if (!canvas || !canvas.getContext) {
      throw new Error('Invalid canvas element provided');
    }

    const {
      format = EXPORT_CONFIG.defaultFormat,
      quality = this.defaultQuality,
      dpi = CANVAS_CONFIG.dpi
    } = options;

    // Validate format
    if (!this.supportedFormats.includes(format)) {
      throw new Error(`Unsupported format: ${format}. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    // Validate quality
    if (quality < 0 || quality > 1) {
      throw new Error('Quality must be between 0 and 1');
    }

    console.log(`Exporting canvas to ${format} with quality ${quality}`);

    try {
      const mimeType = EXPORT_CONFIG.formats[format]?.mimeType || 'image/png';
      
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            console.log(`Export successful: ${blob.size} bytes, type: ${blob.type}`);
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, mimeType, quality);
      });
    } catch (error) {
      console.error('Export to blob failed:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Export canvas as data URL
   * @param {HTMLCanvasElement} canvas - Canvas element to export
   * @param {Object} options - Export options
   * @returns {string} Data URL string
   */
  exportToDataURL(canvas, options = {}) {
    if (!canvas || !canvas.getContext) {
      throw new Error('Invalid canvas element provided');
    }

    const {
      format = EXPORT_CONFIG.defaultFormat,
      quality = this.defaultQuality
    } = options;

    // Validate format
    if (!this.supportedFormats.includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    try {
      const mimeType = EXPORT_CONFIG.formats[format]?.mimeType || 'image/png';
      const dataURL = canvas.toDataURL(mimeType, quality);
      
      console.log(`Data URL generated: ${dataURL.length} characters`);
      return dataURL;
    } catch (error) {
      console.error('Export to data URL failed:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Download blob as file
   * @param {Blob} blob - Blob to download
   * @param {string} filename - Filename for download
   * @returns {Promise<void>} Promise that resolves when download starts
   */
  async downloadBlob(blob, filename) {
    if (!blob) {
      throw new Error('No blob provided for download');
    }

    if (!filename) {
      filename = this.generateFilename();
    }

    console.log(`Starting download: ${filename} (${blob.size} bytes)`);

    try {
      // Check if browser supports download
      if (!this.isDownloadSupported()) {
        throw new Error('Browser does not support file download');
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

      console.log(`Download initiated: ${filename}`);
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  /**
   * Share image using Web Share API (mobile devices)
   * @param {Blob} blob - Image blob to share
   * @param {Object} options - Share options
   * @returns {Promise<void>} Promise that resolves when share completes
   */
  async shareImage(blob, options = {}) {
    if (!blob) {
      throw new Error('No blob provided for sharing');
    }

    const {
      title = '数学练习册',
      text = '生成的数学练习册',
      filename = this.generateFilename()
    } = options;

    // Check if Web Share API is supported
    if (!navigator.share) {
      throw new Error('Web Share API not supported');
    }

    try {
      // Create file from blob
      const file = new File([blob], filename, { type: blob.type });
      
      await navigator.share({
        title: title,
        text: text,
        files: [file]
      });

      console.log('Image shared successfully');
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Share cancelled by user');
      } else {
        console.error('Share failed:', error);
        throw new Error(`Share failed: ${error.message}`);
      }
    }
  }

  /**
   * Export and download canvas in one operation
   * @param {HTMLCanvasElement} canvas - Canvas to export
   * @param {Object} options - Export and download options
   * @returns {Promise<void>} Promise that resolves when download starts
   */
  async exportAndDownload(canvas, options = {}) {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }

    try {
      this.isExporting = true;
      
      const blob = await this.exportToBlob(canvas, options);
      await this.downloadBlob(blob, options.filename);
      
      console.log('Export and download completed successfully');
    } catch (error) {
      console.error('Export and download failed:', error);
      throw error;
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * Export and share canvas in one operation (mobile)
   * @param {HTMLCanvasElement} canvas - Canvas to export
   * @param {Object} options - Export and share options
   * @returns {Promise<void>} Promise that resolves when share completes
   */
  async exportAndShare(canvas, options = {}) {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }

    try {
      this.isExporting = true;
      
      const blob = await this.exportToBlob(canvas, options);
      await this.shareImage(blob, options);
      
      console.log('Export and share completed successfully');
    } catch (error) {
      console.error('Export and share failed:', error);
      throw error;
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * Generate filename for export
   * @param {Object} options - Filename options
   * @returns {string} Generated filename
   */
  generateFilename(options = {}) {
    const {
      prefix = EXPORT_CONFIG.filename.prefix,
      format = EXPORT_CONFIG.defaultFormat,
      includeTimestamp = true,
      customSuffix = ''
    } = options;

    let filename = prefix;

    if (customSuffix) {
      filename += `-${customSuffix}`;
    }

    if (includeTimestamp) {
      const now = new Date();
      const timestamp = now.toISOString()
        .slice(0, 19)
        .replace(/[:-]/g, '')
        .replace('T', '-');
      filename += `-${timestamp}`;
    }

    filename += `.${format}`;

    return filename;
  }

  /**
   * Check if browser supports file download
   * @returns {boolean} True if download is supported
   */
  isDownloadSupported() {
    // Check for download attribute support
    const link = document.createElement('a');
    return typeof link.download !== 'undefined';
  }

  /**
   * Check if Web Share API is supported
   * @returns {boolean} True if sharing is supported
   */
  isShareSupported() {
    return navigator.share && navigator.canShare;
  }

  /**
   * Get supported export formats
   * @returns {Array<string>} Array of supported format names
   */
  getSupportedFormats() {
    return [...this.supportedFormats];
  }

  /**
   * Validate export options
   * @param {Object} options - Options to validate
   * @returns {Object} Validated and normalized options
   */
  validateOptions(options = {}) {
    const validated = {
      format: EXPORT_CONFIG.defaultFormat,
      quality: this.defaultQuality,
      dpi: CANVAS_CONFIG.dpi,
      ...options
    };

    // Validate format
    if (!this.supportedFormats.includes(validated.format)) {
      console.warn(`Invalid format ${validated.format}, using default: ${EXPORT_CONFIG.defaultFormat}`);
      validated.format = EXPORT_CONFIG.defaultFormat;
    }

    // Validate quality
    if (validated.quality < 0 || validated.quality > 1) {
      console.warn(`Invalid quality ${validated.quality}, using default: ${this.defaultQuality}`);
      validated.quality = this.defaultQuality;
    }

    // Validate DPI
    if (validated.dpi < 72 || validated.dpi > 600) {
      console.warn(`Invalid DPI ${validated.dpi}, using default: ${CANVAS_CONFIG.dpi}`);
      validated.dpi = CANVAS_CONFIG.dpi;
    }

    return validated;
  }

  /**
   * Get export capabilities of current browser
   * @returns {Object} Capabilities object
   */
  getCapabilities() {
    return {
      canDownload: this.isDownloadSupported(),
      canShare: this.isShareSupported(),
      supportedFormats: this.getSupportedFormats(),
      maxCanvasSize: this.getMaxCanvasSize()
    };
  }

  /**
   * Get maximum canvas size supported by browser
   * @returns {Object} Maximum dimensions {width, height}
   */
  getMaxCanvasSize() {
    // Create test canvas to determine maximum size
    const testCanvas = document.createElement('canvas');
    const ctx = testCanvas.getContext('2d');
    
    // Test common maximum sizes
    const testSizes = [32767, 16384, 8192, 4096];
    
    for (const size of testSizes) {
      try {
        testCanvas.width = size;
        testCanvas.height = size;
        
        // Try to draw something to test if it actually works
        ctx.fillRect(0, 0, 1, 1);
        const imageData = ctx.getImageData(0, 0, 1, 1);
        
        if (imageData.data[3] === 255) { // Alpha channel should be 255
          return { width: size, height: size };
        }
      } catch (error) {
        // Continue to next smaller size
      }
    }
    
    // Fallback to conservative size
    return { width: 4096, height: 4096 };
  }

  /**
   * Check if export is currently in progress
   * @returns {boolean} True if export is in progress
   */
  isExportInProgress() {
    return this.isExporting;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageExporter;
} else {
  window.ImageExporter = ImageExporter;
}