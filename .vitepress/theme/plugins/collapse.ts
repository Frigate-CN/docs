/**
 * VitePress Markdown 折叠容器插件
 *
 * 参考 vitepress-theme-teek 的 simpleContainer 模式开发。
 * Teek 文档：https://vp.teek.top/develop/container.html
 *
 * 设计思路：
 * markdown-it 插件直接输出 <CollapseContainer> Vue 组件标签，
 * VitePress 会自动将其作为已注册的 Vue 组件处理，无需客户端 hydration。
 *
 * 在 Markdown 中使用：
 * ::: collapse 点击展开
 * 这里是折叠的内容，支持 **Markdown** 语法。
 * :::
 *
 * 也可以不带标题（默认标题为"展开查看"）：
 * ::: collapse
 * 内容
 * :::
 */

import container from "markdown-it-container";

export interface CollapseContainerOption {
  /** 容器类型名，默认 "collapse" */
  type?: string;
  /** 默认标题 */
  defaultTitle?: string;
}

/**
 * 创建折叠容器 markdown-it 插件。
 *
 * 直接输出 <CollapseContainer> Vue 组件标签，
 * VitePress 自动将已注册的 Vue 组件渲染为交互式组件。
 */
export function collapsePlugin(md: any, options: CollapseContainerOption = {}): void {
  const {
    type = "collapse",
    defaultTitle = "展开查看",
  } = options;

  md.use(container, type, {
    render(tokens, idx) {
      const token = tokens[idx];
      const info = token.info.trim().slice(type.length).trim();
      const title = info || defaultTitle;

      if (token.nesting === 1) {
        // 输出 Vue 组件标签，VitePress 自动处理
        return `<CollapseContainer title="${md.utils.escapeHtml(title)}">
`;
      } else {
        return `</CollapseContainer>
`;
      }
    },
  });
}

export default collapsePlugin;