/**
 * Build Configuration for Math Worksheet Generator
 * Production build settings for static deployment
 */

module.exports = {
  // Source directories
  source: {
    root: '.',
    js: 'js',
    css: 'styles',
    assets: 'assets',
    html: ['index.html', 'manifest.json', 'sw.js']
  },

  // Output directory for production build
  output: {
    dir: 'dist',
    js: 'dist/js',
    css: 'dist/styles',
    assets: 'dist/assets'
  },

  // Optimization settings
  optimization: {
    minifyJS: true,
    minifyCSS: true,
    minifyHTML: true,
    compressImages: true,
    generateSourceMaps: false,
    removeComments: true,
    inlineSmallAssets: false
  },

  // Compression settings
  compression: {
    js: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug']
      },
      mangle: {
        toplevel: true,
        reserved: ['MathProblem', 'WorksheetConfig']
      },
      format: {
        comments: false
      }
    },
    css: {
      level: 2,
      compatibility: 'ie11'
    }
  },

  // Files to copy as-is
  copy: [
    'manifest.json',
    'sw.js',
    '.gitignore',
    'README.md',
    'assets/**/*'
  ],

  // Files to exclude from build
  exclude: [
    'node_modules/**',
    'test-*.html',
    'debug-*.html',
    'js/tests/**',
    'js/examples/**',
    '*.md',
    'build.config.js',
    'build.js',
    '.git/**',
    '.kiro/**',
    'package.json',
    'package-lock.json'
  ],

  // PWA settings
  pwa: {
    generateServiceWorker: true,
    cacheStrategy: 'cache-first',
    offlinePages: ['index.html']
  },

  // Deployment targets
  deployment: {
    githubPages: {
      branch: 'gh-pages',
      cname: null
    },
    netlify: {
      redirects: true,
      headers: true
    }
  }
};
