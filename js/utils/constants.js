// Constants for Math Worksheet Generator

// Application Configuration
const APP_CONFIG = {
  name: '数学练习册生成器',
  version: '1.0.0',
  author: 'Math Worksheet Generator Team'
};

// Canvas Configuration
const CANVAS_CONFIG = {
  // A4 dimensions in pixels at 300 DPI
  width: 2480,
  height: 3508,
  dpi: 300,
  // Preview dimensions (scaled down for display)
  previewWidth: 500,
  previewHeight: 700,
  // Margins in pixels (at 300 DPI)
  margins: {
    top: 150,
    right: 150,
    bottom: 150,
    left: 150
  }
};

// Difficulty Levels
const DIFFICULTY_LEVELS = {
  within10: {
    name: '10以内',
    maxNumber: 10,
    minNumber: 1
  },
  within20: {
    name: '20以内',
    maxNumber: 20,
    minNumber: 1
  },
  within50: {
    name: '50以内',
    maxNumber: 50,
    minNumber: 1
  },
  within100: {
    name: '100以内',
    maxNumber: 100,
    minNumber: 1
  }
};

// Operation Types
const OPERATION_TYPES = {
  addition: {
    name: '加法',
    symbol: '+',
    operation: (a, b) => a + b
  },
  subtraction: {
    name: '减法',
    symbol: '-',
    operation: (a, b) => a - b
  },
  mixed: {
    name: '加减混合',
    symbol: '±',
    operation: null // Will be determined randomly
  }
};

// Layout Types
const LAYOUT_TYPES = {
  'two-column': {
    name: '两列',
    columns: 2,
    problemsPerPage: 20,
    spacing: {
      horizontal: 50,
      vertical: 80
    }
  },
  'three-column': {
    name: '三列',
    columns: 3,
    problemsPerPage: 30,
    spacing: {
      horizontal: 40,
      vertical: 70
    }
  }
};

// Background Styles
const BACKGROUND_STYLES = {
  blank: {
    name: '空白',
    type: 'blank',
    color: '#ffffff'
  },
  lined: {
    name: '横线',
    type: 'lined',
    lineSpacing: 60,
    lineColor: '#e0e0e0',
    lineWidth: 1
  },
  grid: {
    name: '方格',
    type: 'grid',
    gridSize: 40,
    lineColor: '#e0e0e0',
    lineWidth: 1
  },
  dotted: {
    name: '点阵',
    type: 'dotted',
    dotSpacing: 30,
    dotColor: '#d0d0d0',
    dotSize: 2
  },
  custom: {
    name: '自定义',
    type: 'custom',
    imageUrl: null,
    tileMode: false,
    opacity: 1.0
  }
};

// Font Configuration
const FONT_CONFIG = {
  problem: {
    family: 'Arial, sans-serif',
    size: 24, // 减小字体大小以适应预览
    weight: 'normal',
    color: '#000000'
  },
  answer: {
    family: 'Arial, sans-serif',
    size: 18, // 减小答案字体大小
    weight: 'normal',
    color: '#666666'
  },
  lineHeight: 1.2
};

// Export Configuration
const EXPORT_CONFIG = {
  formats: {
    png: {
      name: 'PNG',
      mimeType: 'image/png',
      quality: 1.0
    },
    jpeg: {
      name: 'JPEG',
      mimeType: 'image/jpeg',
      quality: 0.95
    }
  },
  defaultFormat: 'png',
  filename: {
    prefix: 'math-worksheet',
    dateFormat: 'YYYY-MM-DD-HHmmss'
  }
};

// Local Storage Keys
const STORAGE_KEYS = {
  userPreferences: 'math-worksheet-preferences',
  recentConfigs: 'math-worksheet-recent-configs',
  customBackgrounds: 'math-worksheet-custom-backgrounds',
  appSettings: 'math-worksheet-app-settings'
};

// Error Messages
const ERROR_MESSAGES = {
  generation: {
    failed: '生成练习册失败，请重试',
    invalidConfig: '配置参数无效，请检查设置',
    noProblems: '无法生成题目，请调整难度设置'
  },
  export: {
    failed: '导出图片失败，请重试',
    unsupportedFormat: '不支持的图片格式',
    canvasError: 'Canvas渲染错误'
  },
  file: {
    uploadFailed: '文件上传失败',
    invalidFormat: '不支持的文件格式',
    fileTooLarge: '文件大小超出限制'
  },
  browser: {
    unsupported: '浏览器不支持此功能',
    canvasNotSupported: '浏览器不支持Canvas',
    downloadNotSupported: '浏览器不支持文件下载'
  }
};

// Success Messages
const SUCCESS_MESSAGES = {
  generation: '练习册生成成功！',
  export: '图片导出成功！',
  save: '设置保存成功！',
  install: '应用安装成功！'
};

// Animation Configuration
const ANIMATION_CONFIG = {
  duration: {
    short: 200,
    medium: 300,
    long: 500
  },
  easing: {
    easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)'
  }
};

// Responsive Breakpoints
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
};

// PWA Configuration
const PWA_CONFIG = {
  updateCheckInterval: 60000, // 1 minute
  installPromptDelay: 3000, // 3 seconds
  offlineMessage: '应用已离线，部分功能可能受限',
  updateAvailableMessage: '发现新版本，是否立即更新？'
};

// Validation Rules
const VALIDATION_RULES = {
  problemCount: {
    min: 1,
    max: 50
  },
  numberRange: {
    min: 1,
    max: 1000
  },
  fileSize: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
  }
};

// Performance Configuration
const PERFORMANCE_CONFIG = {
  debounceDelay: 300,
  throttleDelay: 100,
  maxRenderTime: 5000,
  batchSize: 10
};

// Accessibility Configuration
const A11Y_CONFIG = {
  focusOutlineWidth: 2,
  focusOutlineColor: '#2196f3',
  minTouchTarget: 44, // pixels
  contrastRatio: 4.5
};

// Export all constants
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    APP_CONFIG,
    CANVAS_CONFIG,
    DIFFICULTY_LEVELS,
    OPERATION_TYPES,
    LAYOUT_TYPES,
    BACKGROUND_STYLES,
    FONT_CONFIG,
    EXPORT_CONFIG,
    STORAGE_KEYS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    ANIMATION_CONFIG,
    BREAKPOINTS,
    PWA_CONFIG,
    VALIDATION_RULES,
    PERFORMANCE_CONFIG,
    A11Y_CONFIG
  };
} else {
  // Browser environment - constants are already available globally
  console.log('Math Worksheet Generator constants loaded');
}