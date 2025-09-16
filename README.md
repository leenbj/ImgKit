# ImgKit - 智能图片压缩工具

一个基于Web的智能图片压缩工具，支持多种图片格式的高效压缩处理。

## ✨ 功能特性

- 🖼️ **多格式支持**：支持 JPEG、PNG、WebP 等主流图片格式
- 🎚️ **可调节压缩**：支持 0-100% 压缩强度自定义调节
- 📱 **响应式设计**：适配桌面和移动设备
- ⚡ **实时预览**：压缩前后文件大小实时估算
- 📦 **批量处理**：支持多文件同时上传和压缩
- 💾 **本地处理**：所有处理在浏览器本地完成，保护隐私

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm 或 yarn 包管理器

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

```bash
npm run dev
# 或
make dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本

```bash
npm run build
# 或
make build
```

## 🛠️ 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式方案**：Tailwind CSS
- **状态管理**：Zustand
- **测试框架**：Vitest
- **代码规范**：ESLint + Prettier

## 📁 项目结构

```
src/
├── app/              # 应用外壳组件
├── core/             # 核心算法模块
├── features/         # 功能模块
│   └── upload/       # 文件上传功能
├── state/            # 状态管理
├── styles/           # 样式文件
├── utils/            # 工具函数
└── worker/           # Web Worker

tests/                # 测试文件
scripts/              # 构建脚本
docs/                 # 文档目录
```

## 🎯 使用说明

1. **上传图片**：点击上传区域或拖拽图片文件到页面
2. **调节压缩**：使用滑块调整压缩强度（0-100%）
3. **开始压缩**：点击"开始压缩"按钮处理图片
4. **下载结果**：压缩完成后下载处理后的图片

## 🧪 测试

```bash
npm run test
# 或
make test
```

## 📋 开发命令

```bash
# 开发服务器
make dev

# 代码检查
make lint

# 构建项目
make build

# 运行测试
make test

# 项目初始化
make setup
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者们！

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
