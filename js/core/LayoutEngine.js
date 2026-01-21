/**
 * LayoutEngine - Calculates layout positions for math problems
 * Implements multi-column layout algorithms with optimized spacing
 */
class LayoutEngine {
  constructor() {
    this.currentLayout = null;
    this.debugMode = false;
  }
  
  /**
   * Calculate layout for problems
   * @param {Array<MathProblem>} problems - Problems to layout
   * @param {WorksheetConfig} config - Configuration
   * @returns {Object} Layout object with problem positions
   */
  calculateLayout(problems, config) {
    if (!problems || problems.length === 0) {
      throw new Error('No problems provided for layout calculation');
    }
    
    if (!config) {
      throw new Error('Configuration is required for layout calculation');
    }
    
    // Get layout configuration
    const layoutConfig = this.getLayoutConfig(config);
    const canvasConfig = this.getCanvasConfig();
    
    // Calculate available space
    const availableSpace = this.calculateAvailableSpace(canvasConfig);
    
    // Calculate problem positions
    const problemPositions = this.calculateProblemPositions(
      problems, 
      layoutConfig, 
      availableSpace
    );
    
    // Create layout object
    const layout = {
      problems: problemPositions,
      pageSize: {
        width: canvasConfig.width,
        height: canvasConfig.height
      },
      margins: canvasConfig.margins,
      layoutConfig: layoutConfig,
      availableSpace: availableSpace,
      metadata: {
        totalProblems: problems.length,
        columns: layoutConfig.columns,
        rows: Math.ceil(problems.length / layoutConfig.columns),
        generatedAt: new Date()
      }
    };
    
    // Optimize spacing
    const optimizedLayout = this.optimizeSpacing(layout);
    
    // Validate layout
    if (!this.validateLayout(optimizedLayout)) {
      throw new Error('Generated layout is invalid');
    }
    
    this.currentLayout = optimizedLayout;
    
    if (this.debugMode) {
      console.log('Layout calculated:', optimizedLayout);
    }
    
    return optimizedLayout;
  }
  
  /**
   * Get layout configuration from worksheet config
   * @param {WorksheetConfig} config - Worksheet configuration
   * @returns {Object} Layout configuration
   */
  getLayoutConfig(config) {
    const baseConfig = config.getLayoutConfig();
    
    return {
      columns: baseConfig.columns,
      spacing: {
        horizontal: baseConfig.spacing.horizontal,
        vertical: baseConfig.spacing.vertical
      },
      problemsPerPage: baseConfig.problemsPerPage,
      alignment: 'left', // Default alignment
      distribution: 'even' // Even distribution of problems
    };
  }
  
  /**
   * Get canvas configuration
   * @returns {Object} Canvas configuration
   */
  getCanvasConfig() {
    // Use global CANVAS_CONFIG if available, otherwise use defaults
    if (typeof CANVAS_CONFIG !== 'undefined') {
      return CANVAS_CONFIG;
    }
    
    // Fallback configuration
    return {
      width: 2480,
      height: 3508,
      dpi: 300,
      previewWidth: 595,
      previewHeight: 842,
      margins: {
        top: 150,
        right: 150,
        bottom: 150,
        left: 150
      }
    };
  }
  
  /**
   * Calculate available space for problems
   * @param {Object} canvasConfig - Canvas configuration
   * @returns {Object} Available space dimensions
   */
  calculateAvailableSpace(canvasConfig) {
    const margins = canvasConfig.margins;
    
    return {
      width: canvasConfig.width - margins.left - margins.right,
      height: canvasConfig.height - margins.top - margins.bottom,
      startX: margins.left,
      startY: margins.top
    };
  }
  
  /**
   * Calculate positions for all problems
   * @param {Array<MathProblem>} problems - Problems to position
   * @param {Object} layoutConfig - Layout configuration
   * @param {Object} availableSpace - Available space
   * @returns {Array} Array of problem position objects
   */
  calculateProblemPositions(problems, layoutConfig, availableSpace) {
    const positions = [];
    const columns = layoutConfig.columns;
    const spacing = layoutConfig.spacing;
    
    // Calculate column width
    const totalHorizontalSpacing = (columns - 1) * spacing.horizontal;
    const columnWidth = (availableSpace.width - totalHorizontalSpacing) / columns;
    
    // Calculate problem dimensions
    const problemDimensions = this.calculateProblemDimensions(columnWidth);
    
    // Calculate rows needed
    const totalRows = Math.ceil(problems.length / columns);
    
    // Calculate vertical spacing
    const totalVerticalSpacing = (totalRows - 1) * spacing.vertical;
    const availableVerticalSpace = availableSpace.height - totalVerticalSpacing;
    const rowHeight = Math.max(
      problemDimensions.height,
      availableVerticalSpace / totalRows
    );
    
    // Position each problem
    problems.forEach((problem, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      const x = availableSpace.startX + col * (columnWidth + spacing.horizontal);
      const y = availableSpace.startY + row * (rowHeight + spacing.vertical);
      
      positions.push({
        problem: problem,
        position: {
          x: x,
          y: y,
          width: columnWidth,
          height: rowHeight
        },
        metadata: {
          row: row,
          column: col,
          index: index
        }
      });
    });
    
    return positions;
  }
  
  /**
   * Calculate problem dimensions based on content
   * @param {number} maxWidth - Maximum width available
   * @returns {Object} Problem dimensions
   */
  calculateProblemDimensions(maxWidth) {
    // Get font configuration
    const fontConfig = this.getFontConfig();
    
    // Estimate text dimensions
    // This is a rough estimate - actual rendering may vary
    const averageCharWidth = fontConfig.problem.size * 0.6;
    const lineHeight = fontConfig.problem.size * fontConfig.lineHeight;
    
    // Typical problem format: "XX + XX = "
    const estimatedTextWidth = averageCharWidth * 10; // Rough estimate
    
    return {
      width: Math.min(estimatedTextWidth, maxWidth),
      height: lineHeight + 20, // Add some padding
      textHeight: lineHeight
    };
  }
  
  /**
   * Get font configuration
   * @returns {Object} Font configuration
   */
  getFontConfig() {
    // Use global FONT_CONFIG if available, otherwise use defaults
    if (typeof FONT_CONFIG !== 'undefined') {
      return FONT_CONFIG;
    }
    
    // Fallback configuration
    return {
      problem: {
        family: 'Arial, sans-serif',
        size: 48,
        weight: 'normal',
        color: '#000000'
      },
      lineHeight: 1.2
    };
  }
  
  /**
   * Optimize spacing in layout
   * @param {Object} layout - Layout to optimize
   * @returns {Object} Optimized layout
   */
  optimizeSpacing(layout) {
    const optimizedLayout = { ...layout };
    const problems = [...layout.problems];
    
    // Optimize vertical spacing
    optimizedLayout.problems = this.optimizeVerticalSpacing(problems, layout);
    
    // Optimize horizontal alignment
    optimizedLayout.problems = this.optimizeHorizontalAlignment(
      optimizedLayout.problems, 
      layout
    );
    
    // Ensure problems don't overlap
    optimizedLayout.problems = this.preventOverlaps(optimizedLayout.problems);
    
    return optimizedLayout;
  }
  
  /**
   * Optimize vertical spacing between rows
   * @param {Array} problems - Problem positions
   * @param {Object} layout - Layout object
   * @returns {Array} Optimized problem positions
   */
  optimizeVerticalSpacing(problems, layout) {
    if (problems.length === 0) return problems;
    
    const columns = layout.layoutConfig.columns;
    const totalRows = Math.ceil(problems.length / columns);
    
    if (totalRows <= 1) return problems;
    
    // Calculate optimal vertical spacing
    const usedHeight = problems.reduce((max, p) => 
      Math.max(max, p.position.y + p.position.height), 0
    );
    
    const availableHeight = layout.availableSpace.height;
    const remainingSpace = availableHeight - (usedHeight - layout.availableSpace.startY);
    
    if (remainingSpace > 0) {
      // Distribute extra space evenly between rows
      const extraSpacePerGap = remainingSpace / (totalRows - 1);
      
      problems.forEach((problemPos, index) => {
        const row = Math.floor(index / columns);
        if (row > 0) {
          problemPos.position.y += row * extraSpacePerGap;
        }
      });
    }
    
    return problems;
  }
  
  /**
   * Optimize horizontal alignment within columns
   * @param {Array} problems - Problem positions
   * @param {Object} layout - Layout object
   * @returns {Array} Optimized problem positions
   */
  optimizeHorizontalAlignment(problems, layout) {
    const columns = layout.layoutConfig.columns;
    
    // Group problems by column
    const columnGroups = {};
    problems.forEach(problemPos => {
      const col = problemPos.metadata.column;
      if (!columnGroups[col]) {
        columnGroups[col] = [];
      }
      columnGroups[col].push(problemPos);
    });
    
    // Align problems within each column
    Object.keys(columnGroups).forEach(col => {
      const columnProblems = columnGroups[col];
      
      // For now, use left alignment
      // Could be extended to support center or right alignment
      columnProblems.forEach(problemPos => {
        // Already positioned correctly for left alignment
        // Additional alignment logic could be added here
      });
    });
    
    return problems;
  }
  
  /**
   * Prevent overlapping problems
   * @param {Array} problems - Problem positions
   * @returns {Array} Non-overlapping problem positions
   */
  preventOverlaps(problems) {
    // Sort problems by position (top to bottom, left to right)
    const sortedProblems = [...problems].sort((a, b) => {
      if (Math.abs(a.position.y - b.position.y) < 10) {
        return a.position.x - b.position.x;
      }
      return a.position.y - b.position.y;
    });
    
    // Check for overlaps and adjust positions
    for (let i = 1; i < sortedProblems.length; i++) {
      const current = sortedProblems[i];
      const previous = sortedProblems[i - 1];
      
      // Check if problems are in the same row
      if (Math.abs(current.position.y - previous.position.y) < 10) {
        // Check for horizontal overlap
        const prevRight = previous.position.x + previous.position.width;
        if (current.position.x < prevRight + 10) {
          // Adjust position to prevent overlap
          current.position.x = prevRight + 20;
        }
      }
    }
    
    return sortedProblems;
  }
  
  /**
   * Validate layout
   * @param {Object} layout - Layout to validate
   * @returns {boolean} True if layout is valid
   */
  validateLayout(layout) {
    if (!layout || !layout.problems) {
      return false;
    }
    
    // Check if all problems have valid positions
    for (const problemPos of layout.problems) {
      if (!this.validateProblemPosition(problemPos, layout)) {
        return false;
      }
    }
    
    // Check for overlaps
    if (this.hasOverlaps(layout.problems)) {
      console.warn('Layout validation: Problems overlap detected');
      return false;
    }
    
    // Check if problems fit within page bounds
    if (!this.problemsFitInBounds(layout.problems, layout)) {
      console.warn('Layout validation: Problems exceed page bounds');
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate individual problem position
   * @param {Object} problemPos - Problem position object
   * @param {Object} layout - Layout object
   * @returns {boolean} True if position is valid
   */
  validateProblemPosition(problemPos, layout) {
    if (!problemPos.problem || !problemPos.position) {
      return false;
    }
    
    const pos = problemPos.position;
    
    // Check for valid numeric values
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) ||
        !Number.isFinite(pos.width) || !Number.isFinite(pos.height)) {
      return false;
    }
    
    // Check for positive dimensions
    if (pos.width <= 0 || pos.height <= 0) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if problems have overlaps
   * @param {Array} problems - Problem positions
   * @returns {boolean} True if overlaps exist
   */
  hasOverlaps(problems) {
    for (let i = 0; i < problems.length; i++) {
      for (let j = i + 1; j < problems.length; j++) {
        if (this.problemsOverlap(problems[i], problems[j])) {
          return true;
        }
      }
    }
    return false;
  }
  
  /**
   * Check if two problems overlap
   * @param {Object} problem1 - First problem position
   * @param {Object} problem2 - Second problem position
   * @returns {boolean} True if problems overlap
   */
  problemsOverlap(problem1, problem2) {
    const p1 = problem1.position;
    const p2 = problem2.position;
    
    return !(p1.x + p1.width <= p2.x ||
             p2.x + p2.width <= p1.x ||
             p1.y + p1.height <= p2.y ||
             p2.y + p2.height <= p1.y);
  }
  
  /**
   * Check if all problems fit within page bounds
   * @param {Array} problems - Problem positions
   * @param {Object} layout - Layout object
   * @returns {boolean} True if all problems fit
   */
  problemsFitInBounds(problems, layout) {
    const pageWidth = layout.pageSize.width;
    const pageHeight = layout.pageSize.height;
    
    for (const problemPos of problems) {
      const pos = problemPos.position;
      
      if (pos.x < 0 || pos.y < 0 ||
          pos.x + pos.width > pageWidth ||
          pos.y + pos.height > pageHeight) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get layout statistics
   * @param {Object} layout - Layout object
   * @returns {Object} Layout statistics
   */
  getLayoutStatistics(layout) {
    if (!layout || !layout.problems) {
      return null;
    }
    
    const problems = layout.problems;
    const positions = problems.map(p => p.position);
    
    return {
      totalProblems: problems.length,
      columns: layout.layoutConfig.columns,
      rows: layout.metadata.rows,
      averageSpacing: {
        horizontal: this.calculateAverageHorizontalSpacing(positions),
        vertical: this.calculateAverageVerticalSpacing(positions)
      },
      utilization: {
        horizontal: this.calculateHorizontalUtilization(positions, layout),
        vertical: this.calculateVerticalUtilization(positions, layout)
      },
      bounds: {
        minX: Math.min(...positions.map(p => p.x)),
        maxX: Math.max(...positions.map(p => p.x + p.width)),
        minY: Math.min(...positions.map(p => p.y)),
        maxY: Math.max(...positions.map(p => p.y + p.height))
      }
    };
  }
  
  /**
   * Calculate average horizontal spacing
   * @param {Array} positions - Problem positions
   * @returns {number} Average horizontal spacing
   */
  calculateAverageHorizontalSpacing(positions) {
    if (positions.length < 2) return 0;
    
    const spacings = [];
    for (let i = 1; i < positions.length; i++) {
      const current = positions[i];
      const previous = positions[i - 1];
      
      // Only calculate spacing for problems in the same row
      if (Math.abs(current.y - previous.y) < 10) {
        const spacing = current.x - (previous.x + previous.width);
        if (spacing > 0) {
          spacings.push(spacing);
        }
      }
    }
    
    return spacings.length > 0 
      ? spacings.reduce((sum, s) => sum + s, 0) / spacings.length 
      : 0;
  }
  
  /**
   * Calculate average vertical spacing
   * @param {Array} positions - Problem positions
   * @returns {number} Average vertical spacing
   */
  calculateAverageVerticalSpacing(positions) {
    if (positions.length < 2) return 0;
    
    // Group by rows and calculate spacing between rows
    const rows = {};
    positions.forEach(pos => {
      const rowKey = Math.round(pos.y / 10) * 10; // Group by approximate Y position
      if (!rows[rowKey]) {
        rows[rowKey] = [];
      }
      rows[rowKey].push(pos);
    });
    
    const rowYs = Object.keys(rows).map(Number).sort((a, b) => a - b);
    if (rowYs.length < 2) return 0;
    
    const spacings = [];
    for (let i = 1; i < rowYs.length; i++) {
      const currentRowY = rowYs[i];
      const previousRowY = rowYs[i - 1];
      const previousRowHeight = Math.max(...rows[previousRowY].map(p => p.height));
      
      const spacing = currentRowY - (previousRowY + previousRowHeight);
      if (spacing > 0) {
        spacings.push(spacing);
      }
    }
    
    return spacings.length > 0 
      ? spacings.reduce((sum, s) => sum + s, 0) / spacings.length 
      : 0;
  }
  
  /**
   * Calculate horizontal space utilization
   * @param {Array} positions - Problem positions
   * @param {Object} layout - Layout object
   * @returns {number} Utilization percentage (0-1)
   */
  calculateHorizontalUtilization(positions, layout) {
    if (positions.length === 0) return 0;
    
    const totalUsedWidth = positions.reduce((sum, pos) => sum + pos.width, 0);
    const availableWidth = layout.availableSpace.width;
    
    return Math.min(totalUsedWidth / availableWidth, 1);
  }
  
  /**
   * Calculate vertical space utilization
   * @param {Array} positions - Problem positions
   * @param {Object} layout - Layout object
   * @returns {number} Utilization percentage (0-1)
   */
  calculateVerticalUtilization(positions, layout) {
    if (positions.length === 0) return 0;
    
    const maxY = Math.max(...positions.map(p => p.y + p.height));
    const minY = Math.min(...positions.map(p => p.y));
    const usedHeight = maxY - minY;
    const availableHeight = layout.availableSpace.height;
    
    return Math.min(usedHeight / availableHeight, 1);
  }
  
  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
  
  /**
   * Get current layout
   * @returns {Object|null} Current layout or null if none
   */
  getCurrentLayout() {
    return this.currentLayout;
  }
  
  /**
   * Clear current layout
   */
  clearLayout() {
    this.currentLayout = null;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LayoutEngine;
} else {
  window.LayoutEngine = LayoutEngine;
}