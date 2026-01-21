/**
 * Unit Tests for ImageExporter
 */

// Mock canvas and related APIs for testing
class MockCanvas {
  constructor(width = 800, height = 600) {
    this.width = width;
    this.height = height;
    this.toBlob = jest.fn();
    this.toDataURL = jest.fn();
    this.getContext = jest.fn(() => ({
      fillRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray([255, 255, 255, 255])
      }))
    }));
  }
}

// Mock URL.createObjectURL and revokeObjectURL
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Mock document methods
global.document = {
  createElement: jest.fn((tag) => {
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        style: { display: '' },
        click: jest.fn(),
        download: ''
      };
    }
    if (tag === 'canvas') {
      return new MockCanvas();
    }
    return {};
  }),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

// Mock navigator
global.navigator = {
  share: jest.fn(),
  canShare: jest.fn(() => true)
};

describe('ImageExporter', () => {
  let exporter;
  let mockCanvas;

  beforeEach(() => {
    exporter = new ImageExporter();
    mockCanvas = new MockCanvas();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock behaviors
    mockCanvas.toBlob.mockImplementation((callback, mimeType, quality) => {
      const blob = new Blob(['mock-image-data'], { type: mimeType || 'image/png' });
      callback(blob);
    });
    
    mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,mock-data');
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(exporter.supportedFormats).toEqual(['png', 'jpeg']);
      expect(exporter.defaultQuality).toBe(1.0);
      expect(exporter.isExporting).toBe(false);
    });
  });

  describe('exportToBlob', () => {
    test('should export canvas to PNG blob by default', async () => {
      const blob = await exporter.exportToBlob(mockCanvas);
      
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png',
        1.0
      );
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    test('should export canvas to JPEG blob with quality', async () => {
      const options = { format: 'jpeg', quality: 0.8 };
      const blob = await exporter.exportToBlob(mockCanvas, options);
      
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.8
      );
      expect(blob).toBeInstanceOf(Blob);
    });

    test('should throw error for invalid canvas', async () => {
      await expect(exporter.exportToBlob(null)).rejects.toThrow('Invalid canvas element provided');
      await expect(exporter.exportToBlob({})).rejects.toThrow('Invalid canvas element provided');
    });

    test('should throw error for unsupported format', async () => {
      const options = { format: 'gif' };
      await expect(exporter.exportToBlob(mockCanvas, options)).rejects.toThrow('Unsupported format: gif');
    });

    test('should throw error for invalid quality', async () => {
      const options = { quality: 1.5 };
      await expect(exporter.exportToBlob(mockCanvas, options)).rejects.toThrow('Quality must be between 0 and 1');
    });

    test('should handle canvas toBlob failure', async () => {
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null); // Simulate failure
      });

      await expect(exporter.exportToBlob(mockCanvas)).rejects.toThrow('Failed to create blob from canvas');
    });
  });

  describe('exportToDataURL', () => {
    test('should export canvas to data URL', () => {
      const dataURL = exporter.exportToDataURL(mockCanvas);
      
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png', 1.0);
      expect(dataURL).toBe('data:image/png;base64,mock-data');
    });

    test('should export with custom format and quality', () => {
      const options = { format: 'jpeg', quality: 0.9 };
      exporter.exportToDataURL(mockCanvas, options);
      
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.9);
    });

    test('should throw error for invalid canvas', () => {
      expect(() => exporter.exportToDataURL(null)).toThrow('Invalid canvas element provided');
    });

    test('should throw error for unsupported format', () => {
      const options = { format: 'webp' };
      expect(() => exporter.exportToDataURL(mockCanvas, options)).toThrow('Unsupported format: webp');
    });
  });

  describe('downloadBlob', () => {
    test('should download blob with generated filename', async () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: jest.fn()
      };
      
      document.createElement.mockReturnValue(mockLink);
      
      await exporter.downloadBlob(blob);
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toMatch(/^math-worksheet-.*\.png$/);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });

    test('should download blob with custom filename', async () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const filename = 'custom-worksheet.png';
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: jest.fn()
      };
      
      document.createElement.mockReturnValue(mockLink);
      
      await exporter.downloadBlob(blob, filename);
      
      expect(mockLink.download).toBe(filename);
    });

    test('should throw error for missing blob', async () => {
      await expect(exporter.downloadBlob(null)).rejects.toThrow('No blob provided for download');
    });
  });

  describe('shareImage', () => {
    test('should share image using Web Share API', async () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      
      await exporter.shareImage(blob);
      
      expect(navigator.share).toHaveBeenCalledWith({
        title: '数学练习册',
        text: '生成的数学练习册',
        files: [expect.any(File)]
      });
    });

    test('should share with custom options', async () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const options = {
        title: 'Custom Title',
        text: 'Custom Text',
        filename: 'custom.png'
      };
      
      await exporter.shareImage(blob, options);
      
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Custom Title',
        text: 'Custom Text',
        files: [expect.any(File)]
      });
    });

    test('should throw error when Web Share API not supported', async () => {
      delete navigator.share;
      const blob = new Blob(['test'], { type: 'image/png' });
      
      await expect(exporter.shareImage(blob)).rejects.toThrow('Web Share API not supported');
    });

    test('should throw error for missing blob', async () => {
      await expect(exporter.shareImage(null)).rejects.toThrow('No blob provided for sharing');
    });
  });

  describe('exportAndDownload', () => {
    test('should export and download in one operation', async () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: jest.fn()
      };
      
      document.createElement.mockReturnValue(mockLink);
      
      await exporter.exportAndDownload(mockCanvas);
      
      expect(mockCanvas.toBlob).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });

    test('should prevent concurrent exports', async () => {
      exporter.isExporting = true;
      
      await expect(exporter.exportAndDownload(mockCanvas)).rejects.toThrow('Export already in progress');
    });

    test('should reset exporting flag after completion', async () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: jest.fn()
      };
      
      document.createElement.mockReturnValue(mockLink);
      
      await exporter.exportAndDownload(mockCanvas);
      
      expect(exporter.isExporting).toBe(false);
    });

    test('should reset exporting flag after error', async () => {
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null); // Simulate failure
      });
      
      await expect(exporter.exportAndDownload(mockCanvas)).rejects.toThrow();
      expect(exporter.isExporting).toBe(false);
    });
  });

  describe('generateFilename', () => {
    test('should generate filename with default options', () => {
      const filename = exporter.generateFilename();
      
      expect(filename).toMatch(/^math-worksheet-\d{8}-\d{6}\.png$/);
    });

    test('should generate filename with custom options', () => {
      const options = {
        prefix: 'custom',
        format: 'jpeg',
        customSuffix: 'test',
        includeTimestamp: false
      };
      
      const filename = exporter.generateFilename(options);
      
      expect(filename).toBe('custom-test.jpeg');
    });

    test('should include timestamp by default', () => {
      const filename = exporter.generateFilename();
      
      expect(filename).toMatch(/\d{8}-\d{6}/);
    });
  });

  describe('validateOptions', () => {
    test('should return default options when none provided', () => {
      const validated = exporter.validateOptions();
      
      expect(validated.format).toBe('png');
      expect(validated.quality).toBe(1.0);
      expect(validated.dpi).toBe(300);
    });

    test('should validate and correct invalid format', () => {
      const options = { format: 'invalid' };
      const validated = exporter.validateOptions(options);
      
      expect(validated.format).toBe('png');
    });

    test('should validate and correct invalid quality', () => {
      const options = { quality: 2.0 };
      const validated = exporter.validateOptions(options);
      
      expect(validated.quality).toBe(1.0);
    });

    test('should validate and correct invalid DPI', () => {
      const options = { dpi: 1000 };
      const validated = exporter.validateOptions(options);
      
      expect(validated.dpi).toBe(300);
    });
  });

  describe('Capability checks', () => {
    test('should check download support', () => {
      const supported = exporter.isDownloadSupported();
      expect(typeof supported).toBe('boolean');
    });

    test('should check share support', () => {
      const supported = exporter.isShareSupported();
      expect(typeof supported).toBe('boolean');
    });

    test('should get supported formats', () => {
      const formats = exporter.getSupportedFormats();
      expect(formats).toEqual(['png', 'jpeg']);
    });

    test('should get capabilities', () => {
      const capabilities = exporter.getCapabilities();
      
      expect(capabilities).toHaveProperty('canDownload');
      expect(capabilities).toHaveProperty('canShare');
      expect(capabilities).toHaveProperty('supportedFormats');
      expect(capabilities).toHaveProperty('maxCanvasSize');
    });
  });

  describe('Export status', () => {
    test('should track export progress', () => {
      expect(exporter.isExportInProgress()).toBe(false);
      
      exporter.isExporting = true;
      expect(exporter.isExportInProgress()).toBe(true);
      
      exporter.isExporting = false;
      expect(exporter.isExportInProgress()).toBe(false);
    });
  });
});