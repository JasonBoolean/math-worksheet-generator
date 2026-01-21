/**
 * Checkpoint Test - 检查点测试
 * 验证核心功能是否正常工作
 */

// Mock constants for testing
global.DIFFICULTY_LEVELS = {
  within10: { name: '10以内', maxNumber: 10, minNumber: 1 },
  within20: { name: '20以内', maxNumber: 20, minNumber: 1 },
  within50: { name: '50以内', maxNumber: 50, minNumber: 1 },
  within100: { name: '100以内', maxNumber: 100, minNumber: 1 }
};

global.OPERATION_TYPES = {
  addition: { name: '加法', symbol: '+' },
  subtraction: { name: '减法', symbol: '-' },
  mixed: { name: '加减混合', symbol: '±' }
};

global.LAYOUT_TYPES = {
  'two-column': { name: '两列', columns: 2, problemsPerPage: 20 },
  'three-column': { name: '三列', columns: 3, problemsPerPage: 30 }
};

global.BACKGROUND_STYLES = {
  blank: { name: '空白', type: 'solid' },
  lined: { name: '横线', type: 'lines' },
  grid: { name: '方格', type: 'grid' },
  dotted: { name: '点阵', type: 'dotted' },
  custom: { name: '自定义', type: 'image' }
};

global.VALIDATION_RULES = {
  problemCount: { min: 1, max: 50 }
};

// Load the classes
const MathProblem = require('../models/MathProblem');
const WorksheetConfig = require('../models/WorksheetConfig');
const ProblemGenerator = require('../core/ProblemGenerator');
const ConfigurationManager = require('../core/ConfigurationManager');

// Make classes globally available
global.MathProblem = MathProblem;
global.WorksheetConfig = WorksheetConfig;

function runCheckpointTests() {
  console.log('🔍 运行检查点测试...\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  function test(name, testFn) {
    totalTests++;
    try {
      testFn();
      console.log(`✅ ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failedTests++;
    }
  }
  
  function expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`期望 ${expected}，实际 ${actual}`);
        }
      },
      toBeGreaterThan: (expected) => {
        if (actual <= expected) {
          throw new Error(`期望 ${actual} 大于 ${expected}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
        }
      },
      toBeInstanceOf: (constructor) => {
        if (!(actual instanceof constructor)) {
          throw new Error(`期望 ${constructor.name} 的实例`);
        }
      }
    };
  }
  
  console.log('=== 核心组件测试 ===');
  
  // 测试 1: MathProblem 基础功能
  test('MathProblem 创建和验证', () => {
    const problem = new MathProblem(8, 5, '+', 13);
    expect(problem.operand1).toBe(8);
    expect(problem.operand2).toBe(5);
    expect(problem.operator).toBe('+');
    expect(problem.result).toBe(13);
    expect(problem.toString()).toBe('8 + 5 = ');
  });
  
  // 测试 2: WorksheetConfig 配置管理
  test('WorksheetConfig 配置创建', () => {
    const config = new WorksheetConfig({
      difficulty: 'within20',
      operationType: 'addition',
      layout: 'two-column',
      backgroundStyle: 'blank'
    });
    expect(config.difficulty).toBe('within20');
    expect(config.operationType).toBe('addition');
    expect(config.layout).toBe('two-column');
  });
  
  // 测试 3: ProblemGenerator 题目生成
  test('ProblemGenerator 生成题目', () => {
    const generator = new ProblemGenerator();
    const config = new WorksheetConfig({
      difficulty: 'within10',
      operationType: 'addition',
      problemCount: 5
    });
    
    const problems = generator.generateProblems(config);
    expect(problems.length).toBe(5);
    
    // 验证所有题目都是加法且在难度范围内
    problems.forEach(problem => {
      expect(problem.operator).toBe('+');
      expect(problem.operand1).toBeGreaterThan(0);
      expect(problem.operand2).toBeGreaterThan(0);
      expect(problem.operand1 <= 10).toBe(true);
      expect(problem.operand2 <= 10).toBe(true);
    });
  });
  
  // 测试 4: ConfigurationManager 管理功能
  test('ConfigurationManager 配置管理', () => {
    const manager = new ConfigurationManager();
    const config = manager.createConfig({
      difficulty: 'within20',
      operationType: 'subtraction'
    });
    
    expect(config).toBeInstanceOf(WorksheetConfig);
    expect(config.difficulty).toBe('within20');
    expect(config.operationType).toBe('subtraction');
  });
  
  console.log('\n=== 集成功能测试 ===');
  
  // 测试 5: 完整工作流程
  test('完整工作流程测试', () => {
    // 1. 创建配置管理器
    const manager = new ConfigurationManager();
    
    // 2. 创建配置
    const config = manager.createConfig({
      difficulty: 'within20',
      operationType: 'mixed',
      problemCount: 10
    });
    
    // 3. 生成题目
    const generator = new ProblemGenerator();
    const problems = generator.generateProblems(config);
    
    // 4. 验证结果
    expect(problems.length).toBe(10);
    
    // 验证混合运算包含加法和减法
    const hasAddition = problems.some(p => p.operator === '+');
    const hasSubtraction = problems.some(p => p.operator === '-');
    expect(hasAddition).toBe(true);
    expect(hasSubtraction).toBe(true);
    
    // 验证所有结果都非负
    problems.forEach(problem => {
      expect(problem.result >= 0).toBe(true);
    });
  });
  
  // 测试 6: 错误处理
  test('错误处理测试', () => {
    // 测试无效的题目创建
    try {
      new MathProblem(5, 3, '+', 9); // 错误的结果
      throw new Error('应该抛出错误');
    } catch (error) {
      expect(error.message.includes('incorrect')).toBe(true);
    }
    
    // 测试无效的配置
    try {
      new WorksheetConfig({ difficulty: 'invalid' });
      throw new Error('应该抛出错误');
    } catch (error) {
      expect(error.message.includes('Invalid difficulty')).toBe(true);
    }
  });
  
  // 测试 7: 数据验证
  test('数据验证测试', () => {
    const generator = new ProblemGenerator();
    const config = new WorksheetConfig({
      difficulty: 'within10',
      operationType: 'subtraction'
    });
    
    const problems = generator.generateProblems(config, 20);
    
    // 验证所有减法题目的结果都非负
    problems.forEach(problem => {
      expect(problem.operator).toBe('-');
      expect(problem.result >= 0).toBe(true);
      expect(problem.operand1 >= problem.operand2).toBe(true);
    });
  });
  
  console.log('\n=== 性能测试 ===');
  
  // 测试 8: 性能测试
  test('性能测试 - 大量题目生成', () => {
    const generator = new ProblemGenerator();
    const config = new WorksheetConfig({
      difficulty: 'within100',
      operationType: 'mixed',
      problemCount: 50
    });
    
    const startTime = Date.now();
    const problems = generator.generateProblems(config);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(problems.length).toBe(50);
    expect(duration < 1000).toBe(true); // 应该在1秒内完成
  });
  
  console.log('\n=== 测试结果汇总 ===');
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`成功率: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 所有核心功能测试通过！系统运行正常。');
    return true;
  } else {
    console.log('\n⚠️  部分测试失败，需要检查相关功能。');
    return false;
  }
}

// 运行测试
if (require.main === module) {
  runCheckpointTests();
}

module.exports = { runCheckpointTests };