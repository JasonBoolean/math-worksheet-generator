# 数学练习册生成器

一个基于Web技术的跨平台应用程序，用于为小学生生成可打印的数学练习册。

## 功能特性

- 🧮 **多种运算类型**: 支持加法、减法、加减混合运算
- 📊 **灵活难度设置**: 10以内、20以内、50以内、100以内数字范围
- 🎨 **多样背景样式**: 空白、横线、方格、点阵、自定义背景
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 🖼️ **高质量导出**: 生成300 DPI的A4规格图片
- 💾 **离线使用**: PWA支持，可离线使用
- ⚡ **实时预览**: 配置更改即时预览效果

## 快速开始

### 在线使用

直接访问部署的网站即可使用，无需安装任何软件。

### 本地部署

1. **克隆或下载项目**
   ```bash
   git clone <repository-url>
   cd math-worksheet-generator
   ```

2. **安装依赖** (可选，用于开发)
   ```bash
   npm install
   ```

3. **启动本地服务器**
   ```bash
   # 使用npm (推荐)
   npm start
   
   # 或使用Python
   python -m http.server 3000
   
   # 或使用Node.js
   npx http-server . -p 3000
   ```

4. **打开浏览器**
   访问 `http://localhost:3000`

### 直接使用

也可以直接双击 `index.html` 文件在浏览器中打开使用。

## 使用说明

1. **选择配置**
   - 难度级别：选择数字范围
   - 运算类型：加法、减法或混合
   - 页面布局：两列或三列
   - 背景样式：选择合适的背景

2. **生成练习册**
   - 点击"生成练习册"按钮
   - 在预览区域查看效果

3. **导出图片**
   - 点击"导出图片"按钮
   - 自动下载高质量PNG图片

## 技术架构

- **前端框架**: 纯JavaScript (ES6+)
- **图形渲染**: HTML5 Canvas API
- **样式系统**: CSS3 + Flexbox/Grid
- **PWA支持**: Service Worker + Web App Manifest
- **响应式设计**: CSS媒体查询
- **本地存储**: LocalStorage API

## 项目结构

```
math-worksheet-generator/
├── index.html              # 主页面
├── manifest.json           # PWA配置
├── sw.js                   # Service Worker
├── styles/                 # 样式文件
│   ├── main.css           # 主样式
│   └── responsive.css     # 响应式样式
├── js/                     # JavaScript文件
│   ├── utils/             # 工具类
│   ├── models/            # 数据模型
│   ├── core/              # 核心功能
│   ├── ui/                # 用户界面
│   ├── services/          # 服务类
│   └── app.js             # 主应用
├── assets/                # 资源文件
│   └── icons/             # 图标文件
└── package.json           # 项目配置
```

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 代码格式化
npm run format

# HTML验证
npm run validate

# 清理构建文件
npm run clean

# 创建离线部署包
./package-offline.sh  # Linux/Mac
package-offline.bat   # Windows
```

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- 移动浏览器 (iOS Safari, Chrome Mobile)

## 部署选项

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

构建完成后，`dist/` 目录包含所有部署文件。

### 在线部署

#### GitHub Pages (自动部署)
项目已配置 GitHub Actions，推送到 `main` 分支自动部署。

#### Netlify
```bash
npm run deploy:netlify
```
或通过 Git 集成自动部署（已包含 `netlify.toml` 配置）

#### Vercel
```bash
npm run deploy:vercel
```
或通过 Git 集成自动部署（已包含 `vercel.json` 配置）

### 离线部署

创建离线部署包：

```bash
# Linux/Mac
./package-offline.sh

# Windows
package-offline.bat
```

生成的 ZIP 包可以：
- 分发给用户本地使用
- 部署到内网服务器
- 在无网络环境使用

### 详细文档

- 📖 [完整部署指南](DEPLOYMENT.md)
- 👤 [用户使用指南](USER_GUIDE.md)
- 📦 [离线部署说明](OFFLINE_PACKAGE_README.md)

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 更新日志

### v1.0.0 (当前版本)
- ✅ 基础项目结构
- ✅ 响应式用户界面
- ✅ Canvas渲染引擎
- ✅ PWA支持
- ⏳ 题目生成算法 (开发中)
- ⏳ 布局引擎 (开发中)
- ⏳ 图片导出功能 (开发中)

## 支持

如果您遇到问题或有建议，请：

1. 查看 [常见问题](docs/FAQ.md)
2. 搜索现有的 [Issues](https://github.com/math-worksheet-generator/math-worksheet-generator/issues)
3. 创建新的 Issue 描述问题

## 致谢

感谢所有为这个项目做出贡献的开发者和用户。

---

**数学练习册生成器** - 让数学学习更简单 📚✨