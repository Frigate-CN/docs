# Frigate 文档

这是 [Frigate](https://github.com/blakeblackshear/frigate/) 项目的中文文档，采用 VitePress 构建。

[📖 English](./README.md)

## 项目概述

本仓库包含 Frigate 的完整文档，涵盖：

- **安装指南** - 多平台部署说明
- **配置文档** - 详细的设置和调优指南
- **集成指南** - 第三方服务集成
- **API 参考** - 完整的 API 文档
- **故障排除** - 常见问题和解决方案

文档按主题组织，具有清晰的导航和搜索功能。

## 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装

安装项目依赖：

```bash
npm install
```

### 开发

启动本地开发服务器（支持热重载）：

```bash
npm run docs:dev
```

访问 `http://localhost:5173` 查看文档。

### 构建

生成静态生产版本：

```bash
npm run docs:build
```

### 预览

本地预览生产版本：

```bash
npm run docs:preview
```

## 技术栈

- **VitePress** - 文档网站生成工具
- **Vue 3** - 反应式 UI 组件框架
- **Vite** - 现代化构建工具
- **Shiki** - 代码语法高亮
- **Mermaid** - 图表绘制工具

## 常用链接

- [Frigate GitHub 仓库](https://github.com/blakeblackshear/frigate/)
- [官方文档](https://docs.frigate.video/)
- [Home Assistant 集成](https://www.home-assistant.io/)

## 贡献指南

欢迎提交贡献！请按照以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/improvement`)
3. 进行更改
4. 提交更改 (`git commit -m 'Add improvements'`)
5. 推送到分支 (`git push origin feature/improvement`)
6. 打开 Pull Request

### 文档编写规范

- 遵循 Markdown 格式约定
- 代码块使用正确的语言标记
- 配置示例使用 YAML 格式
- 在必要的地方添加图表和示例
- 保持文档结构一致

## 许可证

本文档采用 MIT 许可证。详见 [LICENSE](./LICENSE) 文件。

版权所有 © 2024 Frigate CN

## 支持

有关文档问题、问题或建议：

- [CNB Issues](https://cnb.cool/frigate-cn/docs/-/issues)
- [QQ群](https://qm.qq.com/q/ul8QcaHWMM)

