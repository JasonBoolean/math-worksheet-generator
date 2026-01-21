/**
 * Mobile Utilities
 * Provides mobile-specific functionality including orientation detection,
 * zoom/scroll support, and native share API integration
 */

class MobileUtils {
  constructor() {
    this.currentOrientation = this.getOrientation();
    this.isTouch = this.isTouchDevice();
    this.shareSupported = this.isShareSupported();
    
    // Bind methods
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
    
    // Setup orientation listener
    this.setupOrientationListener();
  }
  
  /**
   * Check if device is touch-enabled
   * @returns {boolean} True if touch device
   */
  isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }
  
  /**
   * Get current device orientation
   * @returns {string} 'portrait' or 'landscape'
   */
  getOrientation() {
    if (window.matchMedia('(orientation: portrait)').matches) {
      return 'portrait';
    }
    return 'landscape';
  }
  
  /**
   * Setup orientation change listener
   */
  setupOrientationListener() {
    // Modern approach using matchMedia
    const portraitQuery = window.matchMedia('(orientation: portrait)');
    const landscapeQuery = window.matchMedia('(orientation: landscape)');
    
    const updateOrientation = () => {
      const newOrientation = this.getOrientation();
      if (newOrientation !== this.currentOrientation) {
        this.currentOrientation = newOrientation;
        this.handleOrientationChange(newOrientation);
      }
    };
    
    // Add listeners
    if (portraitQuery.addEventListener) {
      portraitQuery.addEventListener('change', updateOrientation);
      landscapeQuery.addEventListener('change', updateOrientation);
    } else {
      // Fallback for older browsers
      portraitQuery.addListener(updateOrientation);
      landscapeQuery.addListener(updateOrientation);
    }
    
    // Also listen to window resize as fallback
    window.addEventListener('resize', updateOrientation);
  }
  
  /**
   * Handle orientation change
   * @param {string} orientation - New orientation
   */
  handleOrientationChange(orientation) {
    console.log('Orientation changed to:', orientation);
    
    // Dispatch custom event
    const event = new CustomEvent('orientationchange', {
      detail: { orientation }
    });
    window.dispatchEvent(event);
    
    // Add orientation class to body
    document.body.classList.remove('portrait', 'landscape');
    document.body.classList.add(orientation);
    
    // Trigger layout recalculation
    this.triggerLayoutUpdate();
  }
  
  /**
   * Trigger layout update after orientation change
   */
  triggerLayoutUpdate() {
    // Force reflow
    document.body.offsetHeight;
    
    // Dispatch resize event to trigger any resize handlers
    window.dispatchEvent(new Event('resize'));
  }
  
  /**
   * Check if Web Share API is supported
   * @returns {boolean} True if share is supported
   */
  isShareSupported() {
    return navigator.share !== undefined;
  }
  
  /**
   * Share content using native share API
   * @param {Object} options - Share options
   * @param {string} options.title - Share title
   * @param {string} options.text - Share text
   * @param {string} options.url - Share URL
   * @param {File} options.file - File to share (optional)
   * @returns {Promise<void>}
   */
  async share(options) {
    if (!this.shareSupported) {
      throw new Error('Web Share API not supported');
    }
    
    try {
      const shareData = {
        title: options.title || '数学练习册',
        text: options.text || '我用数学练习册生成器创建了一个练习册',
        url: options.url || window.location.href
      };
      
      // Add file if provided and supported
      if (options.file && navigator.canShare && navigator.canShare({ files: [options.file] })) {
        shareData.files = [options.file];
      }
      
      await navigator.share(shareData);
      console.log('Share successful');
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Share cancelled by user');
        return false;
      }
      console.error('Share failed:', error);
      throw error;
    }
  }
  
  /**
   * Share image blob using native share API
   * @param {Blob} blob - Image blob to share
   * @param {string} filename - Filename for the image
   * @returns {Promise<boolean>}
   */
  async shareImage(blob, filename = 'worksheet.png') {
    if (!this.shareSupported) {
      throw new Error('Web Share API not supported');
    }
    
    try {
      // Create File from Blob
      const file = new File([blob], filename, { type: blob.type });
      
      // Check if files can be shared
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        throw new Error('File sharing not supported');
      }
      
      await navigator.share({
        title: '数学练习册',
        text: '我生成的数学练习册',
        files: [file]
      });
      
      console.log('Image shared successfully');
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Share cancelled by user');
        return false;
      }
      console.error('Image share failed:', error);
      throw error;
    }
  }
  
  /**
   * Enable pinch-to-zoom on an element
   * @param {HTMLElement} element - Element to enable zoom on
   * @param {Object} options - Zoom options
   */
  enablePinchZoom(element, options = {}) {
    const {
      minScale = 1,
      maxScale = 4,
      onZoom = null
    } = options;
    
    let scale = 1;
    let lastScale = 1;
    let startDistance = 0;
    
    const getDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        startDistance = getDistance(e.touches);
      }
    };
    
    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        
        const currentDistance = getDistance(e.touches);
        const scaleChange = currentDistance / startDistance;
        scale = Math.max(minScale, Math.min(maxScale, lastScale * scaleChange));
        
        element.style.transform = `scale(${scale})`;
        element.style.transformOrigin = 'center center';
        
        if (onZoom) {
          onZoom(scale);
        }
      }
    };
    
    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        lastScale = scale;
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    
    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }
  
  /**
   * Enable smooth scrolling with momentum on an element
   * @param {HTMLElement} element - Element to enable scrolling on
   */
  enableSmoothScroll(element) {
    element.style.overflowY = 'auto';
    element.style.webkitOverflowScrolling = 'touch';
    element.style.overscrollBehavior = 'contain';
  }
  
  /**
   * Get viewport dimensions
   * @returns {Object} Viewport width and height
   */
  getViewportDimensions() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  }
  
  /**
   * Check if device is in mobile viewport
   * @returns {boolean} True if mobile viewport
   */
  isMobileViewport() {
    const { width } = this.getViewportDimensions();
    return width <= 768;
  }
  
  /**
   * Check if device is in tablet viewport
   * @returns {boolean} True if tablet viewport
   */
  isTabletViewport() {
    const { width } = this.getViewportDimensions();
    return width > 768 && width <= 1024;
  }
  
  /**
   * Prevent zoom on double-tap for specific elements
   * @param {HTMLElement} element - Element to prevent double-tap zoom
   */
  preventDoubleTapZoom(element) {
    let lastTap = 0;
    
    element.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300 && tapLength > 0) {
        e.preventDefault();
      }
      
      lastTap = currentTime;
    });
  }
  
  /**
   * Add haptic feedback (vibration) if supported
   * @param {string} pattern - Vibration pattern ('light', 'medium', 'heavy')
   */
  hapticFeedback(pattern = 'light') {
    if (!navigator.vibrate) {
      return;
    }
    
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30
    };
    
    navigator.vibrate(patterns[pattern] || patterns.light);
  }
  
  /**
   * Request fullscreen mode
   * @param {HTMLElement} element - Element to make fullscreen (default: document.documentElement)
   * @returns {Promise<void>}
   */
  async requestFullscreen(element = document.documentElement) {
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen request failed:', error);
      throw error;
    }
  }
  
  /**
   * Exit fullscreen mode
   * @returns {Promise<void>}
   */
  async exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.error('Exit fullscreen failed:', error);
      throw error;
    }
  }
  
  /**
   * Check if currently in fullscreen mode
   * @returns {boolean} True if in fullscreen
   */
  isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileUtils;
} else {
  window.MobileUtils = MobileUtils;
}
