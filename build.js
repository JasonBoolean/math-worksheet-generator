#!/usr/bin/env node

/**
 * Production Build Script for Math Worksheet Generator
 * Generates optimized static files for deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./build.config.js');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Clean dist directory
function cleanDist() {
  logStep('1/7', 'Cleaning dist directory...');
  if (fs.existsSync(config.output.dir)) {
    fs.rmSync(config.output.dir, { recursive: true, force: true });
  }
  fs.mkdirSync(config.output.dir, { recursive: true });
  logSuccess('Dist directory cleaned');
}

// Create directory structure
function createDirectories() {
  logStep('2/7', 'Creating directory structure...');
  const dirs = [
    config.output.js,
    config.output.css,
    config.output.assets,
    path.join(config.output.assets, 'icons')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  logSuccess('Directory structure created');
}

// Copy static files
function copyStaticFiles() {
  logStep('3/7', 'Copying static files...');
  
  // Copy HTML
  fs.copyFileSync('index.html', path.join(config.output.dir, 'index.html'));
  
  // Copy manifest and service worker
  fs.copyFileSync('manifest.json', path.join(config.output.dir, 'manifest.json'));
  fs.copyFileSync('sw.js', path.join(config.output.dir, 'sw.js'));
  
  // Copy assets
  if (fs.existsSync('assets')) {
    copyDirectory('assets', path.join(config.output.dir, 'assets'));
  }
  
  logSuccess('Static files copied');
}

// Helper function to copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Minify JavaScript
function minifyJavaScript() {
  logStep('4/7', 'Minifying JavaScript...');
  
  try {
    // Find all JS files
    const jsFiles = findJSFiles('js');
    
    // Copy JS directory structure
    copyDirectory('js', config.output.js);
    
    // Minify each JS file
    jsFiles.forEach(file => {
      const relativePath = path.relative('js', file);
      const outputPath = path.join(config.output.js, relativePath);
      
      try {
        execSync(`npx terser ${file} -o ${outputPath} --compress --mangle`, {
          stdio: 'pipe'
        });
      } catch (error) {
        logWarning(`Failed to minify ${file}, copying original`);
        fs.copyFileSync(file, outputPath);
      }
    });
    
    logSuccess('JavaScript minified');
  } catch (error) {
    logWarning('JavaScript minification failed, using original files');
    copyDirectory('js', config.output.js);
  }
}

// Helper function to find all JS files
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip test and example directories
      if (!file.includes('test') && !file.includes('example')) {
        findJSFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') && !file.includes('.test.') && !file.includes('.min.')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Minify CSS
function minifyCSS() {
  logStep('5/7', 'Minifying CSS...');
  
  try {
    const cssFiles = ['styles/main.css', 'styles/responsive.css'];
    const outputFile = path.join(config.output.css, 'styles.min.css');
    
    // Combine and minify CSS
    execSync(`npx clean-css-cli -o ${outputFile} ${cssFiles.join(' ')}`, {
      stdio: 'pipe'
    });
    
    // Also copy individual files
    cssFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const fileName = path.basename(file);
        fs.copyFileSync(file, path.join(config.output.css, fileName));
      }
    });
    
    logSuccess('CSS minified');
  } catch (error) {
    logWarning('CSS minification failed, copying original files');
    copyDirectory('styles', config.output.css);
  }
}

// Optimize HTML
function optimizeHTML() {
  logStep('6/7', 'Optimizing HTML...');
  
  const htmlPath = path.join(config.output.dir, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Update paths if needed (already using relative paths)
  // Remove comments if configured
  if (config.optimization.removeComments) {
    html = html.replace(/<!--[\s\S]*?-->/g, '');
  }
  
  // Add cache busting version parameter
  const version = Date.now();
  html = html.replace(/\.css"/g, `.css?v=${version}"`);
  html = html.replace(/\.js"/g, `.js?v=${version}"`);
  
  fs.writeFileSync(htmlPath, html);
  logSuccess('HTML optimized');
}

// Generate build info
function generateBuildInfo() {
  logStep('7/7', 'Generating build info...');
  
  const buildInfo = {
    version: require('./package.json').version,
    buildDate: new Date().toISOString(),
    buildNumber: Date.now(),
    environment: 'production',
    optimization: config.optimization
  };
  
  fs.writeFileSync(
    path.join(config.output.dir, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  
  logSuccess('Build info generated');
}

// Calculate build size
function calculateBuildSize() {
  log('\n📊 Build Statistics:', 'blue');
  
  function getDirectorySize(dir) {
    let size = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += fs.statSync(filePath).size;
      }
    }
    
    return size;
  }
  
  const totalSize = getDirectorySize(config.output.dir);
  const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  log(`Total build size: ${sizeInMB} MB`, 'green');
  log(`Output directory: ${config.output.dir}`, 'green');
}

// Main build process
function build() {
  log('\n🚀 Starting production build...\n', 'blue');
  
  const startTime = Date.now();
  
  try {
    cleanDist();
    createDirectories();
    copyStaticFiles();
    minifyJavaScript();
    minifyCSS();
    optimizeHTML();
    generateBuildInfo();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log('\n✨ Build completed successfully!', 'green');
    log(`Build time: ${duration}s\n`, 'green');
    
    calculateBuildSize();
    
    log('\n📦 Deployment ready files are in the dist/ directory', 'blue');
    log('You can now deploy the contents of dist/ to any static hosting service\n', 'blue');
    
  } catch (error) {
    logError(`\nBuild failed: ${error.message}`);
    process.exit(1);
  }
}

// Run build
if (require.main === module) {
  build();
}

module.exports = { build };
