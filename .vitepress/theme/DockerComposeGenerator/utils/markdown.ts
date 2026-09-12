/**
 * 极简的 Markdown 片段渲染工具。
 *
 * 生成器中的说明文字来自本项目自身的静态配置（非用户输入），
 * 因此这里只做必要的转换，无需完整的 Markdown 解析器。
 * 支持：[文字](链接) 与 **加粗**。
 */
export function renderInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

/** 将文本按空行拆分为多个 `<p>` 段落后再渲染行内语法 */
export function renderMarkdown(text: string): string {
  return text
    .split(/\n{2,}/g)
    .map((paragraph) => `<p>${renderInlineMarkdown(paragraph.trim())}</p>`)
    .join("");
}
