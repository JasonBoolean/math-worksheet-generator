/**
 * Unit Tests for BackgroundStyleProcessor
 * Tests the background style processing functionality
 */

// Mock canvas context for testing
class MockCanvasContext {
  constructor() {
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.globalAlpha = 1;
    this.operations = [];
  }
  
  save() {
    this.operations.push({ type: 'save' });
  }
  
  restore() {
    this.operations.push({ type: 'restore' });
  }
  
  fillRect(x, y, width, height) {
    this.operations.push({ 
      type: 'fillRect', 
      x, y, width, height, 
      fillStyle: this.fillStyle 
    });
  }
  
  strokeRect(x, y, width, height) {
    this.operations.push({ 
      type: 'strokeRect', 
      x, y, width, height, 
      strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth
    });
  }
  
  beginPath() {
    this.operations.push({ type: 'beginPath' });
  }
  
  moveTo(x, y) {
    this.operations.push({ type: 'moveTo', x, y });
  }
  
  lineTo(x, y) {
    this.operations.push({ type: 'lineTo', x, y });
  }
  
  stroke() {
    this.operations.push({ 
      type: 'stroke', 
      strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth
    });
  }
  
  arc(x, y, radius, startAngle, endAngle) {
    this.operations.push({ 
      type: 'arc', 
      x, y, radius, startAngle, endAngle 
    });
  }
  
  fill() {
    this.operations.push({ 
      type: 'fill', 
      fillStyle: this.fillStyle 
    });
  }
  
  drawImage(image, ...args) {
    this.operations.push({ 
      type: 'drawImage', 
      image, 
      args 
    });
  }
  
  createPattern(image, repetition) {
    return { type: 'pattern', image, repetition };
  }
  
  clearOperations() {
    this.operations = [];
  }
  
  getOperations() {
    return [...this.operations];
  }
}

// Test suite
class BackgroundStyleProcessorTest {
  constructor() {
    this.processor = new BackgroundStyleProcessor();
    this.mockContext = new MockCanvasContext();
    this.testDimensions = { width: 400, height: 300 };
    this.passedTests = 0;
    this.failedTests = 0;
    this.testResults = [];
  }
  
  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('Starting BackgroundStyleProcessor tests...');
    
    // Basic functionality tests
    this.testConstructor();
    this.testSupportedStyles();
    this.testValidateConfig();
    this.testGetDefaultConfig();
    
    // Background rendering tests
    await this.testBlankBackground();
    await this.testLinedBackground();
    await this.testGridBackground();
    await this.testDottedBackground();
    
    // Configuration tests
    this.testCreateBackgroundConfig();
    this.testValidationMethods();
    
    // Error handling tests
    await this.testErrorHandling();
    
    // Cache tests
    this.testCacheOperations();
    
    this.printResults();
    return this.failedTests === 0;
  }
  
  /**
   * Test helper method
   */
  test(name, testFunction) {
    try {
      const result = testFunction();
      if (result === true || result === undefined) {
        this.passedTests++;
        this.testResults.push({ name, status: 'PASS' });
        console.log(`✓ ${name}`);
      } else {
        this.failedTests++;
        this.testResults.push({ name, status: 'FAIL', error: 'Test returned false' });
        console.log(`✗ ${name}: Test returned false`);
      }
    } catch (error) {
      this.failedTests++;
      this.testResults.push({ name, status: 'FAIL', error: error.message });
      console.log(`✗ ${name}: ${error.message}`);
    }
  }
  
  /**
   * Async test helper method
   */
  async testAsync(name, testFunction) {
    try {
      const result = await testFunction();
      if (result === true || result === undefined) {
        this.passedTests++;
        this.testResults.push({ name, status: 'PASS' });
        console.log(`✓ ${name}`);
      } else {
        this.failedTests++;
        this.testResults.push({ name, status: 'FAIL', error: 'Test returned false' });
        console.log(`✗ ${name}: Test returned false`);
      }
    } catch (error) {
      this.failedTests++;
      this.testResults.push({ name, status: 'FAIL', error: error.message });
      console.log(`✗ ${name}: ${error.message}`);
    }
  }
  
  /**
   * Test constructor
   */
  testConstructor() {
    this.test('Constructor initializes correctly', () => {
      const processor = new BackgroundStyleProcessor();
      return processor.supportedStyles.length > 0 &&
             processor.cache instanceof Map &&
             processor.customImages instanceof Map;
    });
  }
  
  /**
   * Test supported styles
   */
  testSupportedStyles() {
    this.test('Supported styles include all expected types', () => {
      const expected = ['blank', 'lined', 'grid', 'dotted', 'custom'];
      return expected.every(style => this.processor.supportedStyles.includes(style));
    });
  }
  
  /**
   * Test config validation
   */
  testValidateConfig() {
    this.test('Validates valid config', () => {
      const config = { type: 'blank' };
      return this.processor.validateConfig(config);
    });
    
    this.test('Rejects invalid config', () => {
      const config = { type: 'invalid' };
      return !this.processor.validateConfig(config);
    });
    
    this.test('Rejects null config', () => {
      return !this.processor.validateConfig(null);
    });
  }
  
  /**
   * Test default config generation
   */
  testGetDefaultConfig() {
    this.test('Returns valid blank config', () => {
      const config = this.processor.getDefaultConfig('blank');
      return config.type === 'blank' && config.color === '#ffffff';
    });
    
    this.test('Returns valid lined config', () => {
      const config = this.processor.getDefaultConfig('lined');
      return config.type === 'lined' && 
             typeof config.lineSpacing === 'number' &&
             typeof config.lineColor === 'string';
    });
    
    this.test('Returns valid grid config', () => {
      const config = this.processor.getDefaultConfig('grid');
      return config.type === 'grid' && 
             typeof config.gridSize === 'number' &&
             typeof config.lineColor === 'string';
    });
    
    this.test('Returns valid dotted config', () => {
      const config = this.processor.getDefaultConfig('dotted');
      return config.type === 'dotted' && 
             typeof config.dotSpacing === 'number' &&
             typeof config.dotSize === 'number';
    });
  }
  
  /**
   * Test blank background rendering
   */
  async testBlankBackground() {
    await this.testAsync('Renders blank background', async () => {
      this.mockContext.clearOperations();
      const config = { type: 'blank', color: '#ffffff' };
      
      await this.processor.processBackground(this.mockContext, config, this.testDimensions);
      
      const operations = this.mockContext.getOperations();
      const fillRectOp = operations.find(op => op.type === 'fillRect');
      
      return fillRectOp && 
             fillRectOp.fillStyle === '#ffffff' &&
             fillRectOp.width === this.testDimensions.width &&
             fillRectOp.height === this.testDimensions.height;
    });
  }
  
  /**
   * Test lined background rendering
   */
  async testLinedBackground() {
    await this.testAsync('Renders lined background', async () => {
      this.mockContext.clearOperations();
      const config = { 
        type: 'lined', 
        lineSpacing: 50, 
        lineColor: '#e0e0e0',
        lineWidth: 1
      };
      
      await this.processor.processBackground(this.mockContext, config, this.testDimensions);
      
      const operations = this.mockContext.getOperations();
      const hasLines = operations.some(op => op.type === 'moveTo') &&
                      operations.some(op => op.type === 'lineTo') &&
                      operations.some(op => op.type === 'stroke');
      
      return hasLines;
    });
  }
  
  /**
   * Test grid background rendering
   */
  async testGridBackground() {
    await this.testAsync('Renders grid background', async () => {
      this.mockContext.clearOperations();
      const config = { 
        type: 'grid', 
        gridSize: 40, 
        lineColor: '#e0e0e0',
        lineWidth: 1
      };
      
      await this.processor.processBackground(this.mockContext, config, this.testDimensions);
      
      const operations = this.mockContext.getOperations();
      const moveToOps = operations.filter(op => op.type === 'moveTo');
      const lineToOps = operations.filter(op => op.type === 'lineTo');
      
      // Grid should have both horizontal and vertical lines
      return moveToOps.length > 0 && lineToOps.length > 0;
    });
  }
  
  /**
   * Test dotted background rendering
   */
  async testDottedBackground() {
    await this.testAsync('Renders dotted background', async () => {
      this.mockContext.clearOperations();
      const config = { 
        type: 'dotted', 
        dotSpacing: 30, 
        dotColor: '#d0d0d0',
        dotSize: 2
      };
      
      await this.processor.processBackground(this.mockContext, config, this.testDimensions);
      
      const operations = this.mockContext.getOperations();
      const arcOps = operations.filter(op => op.type === 'arc');
      const fillOps = operations.filter(op => op.type === 'fill');
      
      // Should have arcs and fills for dots
      return arcOps.length > 0 && fillOps.length > 0;
    });
  }
  
  /**
   * Test background config creation from worksheet config
   */
  testCreateBackgroundConfig() {
    this.test('Creates config from worksheet config', () => {
      // Mock WorksheetConfig
      const worksheetConfig = {
        backgroundStyle: 'lined',
        customBackgroundUrl: null
      };
      
      const config = this.processor.createBackgroundConfig(worksheetConfig);
      return config.type === 'lined' && typeof config.lineSpacing === 'number';
    });
    
    this.test('Handles custom background URL', () => {
      const worksheetConfig = {
        backgroundStyle: 'custom',
        customBackgroundUrl: 'data:image/png;base64,test'
      };
      
      const config = this.processor.createBackgroundConfig(worksheetConfig);
      return config.type === 'custom' && config.imageUrl === 'data:image/png;base64,test';
    });
  }
  
  /**
   * Test validation methods
   */
  testValidationMethods() {
    this.test('Validates lined config correctly', () => {
      const validConfig = { lineSpacing: 50 };
      const invalidConfig = { lineSpacing: -10 };
      
      return this.processor.validateLinedConfig(validConfig) &&
             !this.processor.validateLinedConfig(invalidConfig);
    });
    
    this.test('Validates grid config correctly', () => {
      const validConfig = { gridSize: 40 };
      const invalidConfig = { gridSize: 0 };
      
      return this.processor.validateGridConfig(validConfig) &&
             !this.processor.validateGridConfig(invalidConfig);
    });
    
    this.test('Validates dotted config correctly', () => {
      const validConfig = { dotSpacing: 30, dotSize: 2 };
      const invalidConfig = { dotSpacing: -5, dotSize: 100 };
      
      return this.processor.validateDottedConfig(validConfig) &&
             !this.processor.validateDottedConfig(invalidConfig);
    });
    
    this.test('Validates custom config correctly', () => {
      const validConfig = { imageUrl: 'test.png' };
      const invalidConfig = { imageUrl: '' };
      
      return this.processor.validateCustomConfig(validConfig) &&
             !this.processor.validateCustomConfig(invalidConfig);
    });
  }
  
  /**
   * Test error handling
   */
  async testErrorHandling() {
    await this.testAsync('Handles invalid parameters gracefully', async () => {
      try {
        await this.processor.processBackground(null, null, null);
        return false; // Should have thrown an error
      } catch (error) {
        return error.message.includes('Invalid parameters');
      }
    });
    
    await this.testAsync('Handles unknown background type', async () => {
      this.mockContext.clearOperations();
      const config = { type: 'unknown' };
      
      // Should not throw, but should render white background
      await this.processor.processBackground(this.mockContext, config, this.testDimensions);
      
      const operations = this.mockContext.getOperations();
      const fillRectOp = operations.find(op => op.type === 'fillRect');
      
      return fillRectOp && fillRectOp.fillStyle === '#ffffff';
    });
  }
  
  /**
   * Test cache operations
   */
  testCacheOperations() {
    this.test('Cache starts empty', () => {
      const stats = this.processor.getCacheStats();
      return stats.cacheSize === 0 && stats.customImagesCount === 0;
    });
    
    this.test('Can clear cache', () => {
      this.processor.clearCache();
      const stats = this.processor.getCacheStats();
      return stats.cacheSize === 0 && stats.customImagesCount === 0;
    });
    
    this.test('Returns cache statistics', () => {
      const stats = this.processor.getCacheStats();
      return typeof stats.cacheSize === 'number' &&
             typeof stats.customImagesCount === 'number' &&
             Array.isArray(stats.supportedStyles);
    });
  }
  
  /**
   * Print test results
   */
  printResults() {
    console.log('\n=== BackgroundStyleProcessor Test Results ===');
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.failedTests}`);
    console.log(`Total: ${this.passedTests + this.failedTests}`);
    
    if (this.failedTests > 0) {
      console.log('\nFailed tests:');
      this.testResults
        .filter(result => result.status === 'FAIL')
        .forEach(result => {
          console.log(`  ✗ ${result.name}: ${result.error || 'Unknown error'}`);
        });
    }
    
    console.log(`\nOverall result: ${this.failedTests === 0 ? 'PASS' : 'FAIL'}`);
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundStyleProcessorTest;
} else {
  window.BackgroundStyleProcessorTest = BackgroundStyleProcessorTest;
}