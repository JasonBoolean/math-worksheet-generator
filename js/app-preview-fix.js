/**
 * Preview Fix Patch for MathWorksheetApp
 * 修复预览显示问题
 */

// 等待应用初始化
window.addEventListener('load', function() {
  console.log('应用预览修复补丁已加载');
  
  // 等待应用实例创建
  setTimeout(function() {
    if (typeof window.MathWorksheetApp !== 'undefined' && window.MathWorksheetApp) {
      const app = window.MathWorksheetApp;
      
      // 重写showPreview方法
      const originalShowPreview = app.showPreview;
      app.showPreview = function() {
        console.log('[修复] 显示预览画布...');
        
        const placeholder = document.getElementById('preview-placeholder');
        const canvas = document.getElementById('preview-canvas');
        const container = document.querySelector('.preview-container');
        
        if (!canvas) {
          console.error('[修复] 找不到canvas元素');
          return;
        }
        
        console.log('[修复] Canvas尺寸:', canvas.width, 'x', canvas.height);
        console.log('[修复] Canvas CSS:', canvas.style.width, 'x', canvas.style.height);
        
        // 隐藏占位符
        if (placeholder) {
          placeholder.style.display = 'none';
          placeholder.style.visibility = 'hidden';
          placeholder.style.opacity = '0';
          placeholder.style.zIndex = '-1';
          console.log('[修复] 占位符已隐藏');
        }
        
        // 显示canvas
        if (canvas) {
          canvas.style.display = 'block';
          canvas.style.visibility = 'visible';
          canvas.style.opacity = '1';
          canvas.style.zIndex = '1';
          canvas.style.position = 'relative';
          
          // 确保canvas有内容
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 10), Math.min(canvas.height, 10));
          const hasContent = Array.from(imageData.data).some(pixel => pixel !== 0);
          
          console.log('[修复] Canvas有内容:', hasContent);
          
          if (!hasContent) {
            console.warn('[修复] Canvas似乎是空的，尝试重新渲染');
            // 触发重新渲染
            if (app.renderPreview) {
              setTimeout(() => app.renderPreview(), 100);
            }
          }
          
          // 强制重绘
          canvas.offsetHeight;
          
          console.log('[修复] Canvas已显示');
        }
        
        // 确保容器正确显示
        if (container) {
          container.style.display = 'flex';
          container.style.visibility = 'visible';
        }
        
        // 启用分享按钮
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
          shareBtn.disabled = false;
        }
        
        console.log('[修复] 预览显示完成');
      };
      
      // 重写renderPreview方法以添加更多调试信息
      const originalRenderPreview = app.renderPreview;
      app.renderPreview = async function() {
        console.log('[修复] 开始渲染预览...');
        
        if (!this.renderingEngine || !this.renderingEngine.isReady()) {
          console.error('[修复] RenderingEngine未就绪');
          return;
        }
        
        try {
          // 生成题目
          if (this.currentProblems.length === 0 || this.shouldRegenerateProblems()) {
            console.log('[修复] 生成新题目...');
            this.currentProblems = this.generatePlaceholderProblems();
            console.log('[修复] 生成了', this.currentProblems.length, '个题目');
          }
          
          // 清空画布
          console.log('[修复] 清空画布...');
          this.renderingEngine.clear();
          
          // 渲染背景
          console.log('[修复] 渲染背景...');
          const backgroundConfig = this.currentConfig.getBackgroundConfig();
          console.log('[修复] 背景配置:', backgroundConfig);
          
          try {
            await this.renderingEngine.renderBackground(backgroundConfig);
            console.log('[修复] 背景渲染完成');
          } catch (bgError) {
            console.error('[修复] 背景渲染失败:', bgError);
            // 继续渲染题目
          }
          
          // 计算布局
          console.log('[修复] 计算布局...');
          const layout = this.calculatePlaceholderLayout();
          console.log('[修复] 布局:', layout.length, '个位置');
          
          // 渲染题目
          console.log('[修复] 渲染题目...');
          let renderedCount = 0;
          this.currentProblems.forEach((problem, index) => {
            if (layout[index]) {
              try {
                this.renderingEngine.renderProblem(problem, layout[index], this.currentConfig.showAnswers);
                renderedCount++;
              } catch (problemError) {
                console.error(`[修复] 渲染题目${index}失败:`, problemError);
              }
            }
          });
          
          console.log('[修复] 渲染了', renderedCount, '个题目');
          
          // 显示预览
          this.showPreview();
          
          // 启用导出按钮
          document.getElementById('export-btn').disabled = false;
          
          console.log('[修复] 预览渲染完成');
          
        } catch (error) {
          console.error('[修复] 预览渲染失败:', error);
          console.error('[修复] 错误堆栈:', error.stack);
        }
      };
      
      console.log('预览修复补丁已应用');
      
      // 立即触发一次预览更新
      if (app.isInitialized && app.currentConfig) {
        console.log('触发初始预览更新...');
        setTimeout(() => {
          app.updatePreview();
        }, 500);
      }
    } else {
      console.warn('应用实例未找到，预览修复补丁未应用');
    }
  }, 1000);
});
