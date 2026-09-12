<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import MarkdownIt from 'markdown-it';
import markdownItContainer from 'markdown-it-container';
import { createHighlighter } from 'shiki';
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight
} from '@shikijs/transformers';
import { nanoid } from 'nanoid';

interface Model {
  key: string;
  label: string;
  recommended?: boolean;
  download: string;
  yaml: string;
  // ui 字段在本组件中未使用（暂未实现 Frigate UI / YAML 切换，仅展示 YAML 配置）
  ui?: string;
}

interface Props {
  detectorTitle?: string;
  models: Model[];
}

const props = defineProps<Props>();

const selectedIndex = ref(0);
const isOpen = ref(false);

const hasChoices = computed(() => props.models.length > 1);
const selectedModel = computed(() => props.models[selectedIndex.value] || props.models[0]);

function selectModel(index: number) {
  selectedIndex.value = index;
  isOpen.value = false;
}

function toggleMenu() {
  if (hasChoices.value) {
    isOpen.value = !isOpen.value;
  }
}

// 点击组件外部时关闭下拉菜单
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.model-config-dropdown__step--select')) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// ========== Shiki 高亮器（与 VitePress / DockerComposeGenerator 使用相同配置） ==========
// 关键：使用双主题 themes: { light, dark }，生成 CSS 变量 --shiki-light / --shiki-dark，
// 由 VitePress 主题样式根据 .dark 类自动切换，无需监听主题变化。
let highlighter: any = null;
let highlighterPromise: Promise<any> | null = null;

async function getHighlighter() {
  if (!highlighter) {
    if (!highlighterPromise) {
      highlighterPromise = createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: ['javascript', 'typescript', 'python', 'bash', 'shell', 'yaml', 'json', 'html', 'css', 'vue', 'tsx', 'jsx', 'diff', 'markdown', 'sh', 'yml'],
      });
    }
    highlighter = await highlighterPromise;
  }
  return highlighter;
}

// 预加载 highlighter
getHighlighter().catch(console.error);

// 缓存高亮结果以提高性能（双主题下结果与主题无关，可安全缓存）
const highlightCache = new Map<string, string>();

// VitePress 风格的 transformers（参考 DockerComposeGenerator.vue）
const shikiTransformers = [
  transformerMetaHighlight(),
  transformerNotationDiff(),
  transformerNotationFocus({
    classActiveLine: 'has-focus',
    classActivePre: 'has-focused-lines',
  }),
  transformerNotationHighlight(),
  transformerNotationErrorLevel(),
  {
    name: 'vitepress:add-dir',
    pre(node: any) {
      node.properties.dir = 'ltr';
    },
  },
  {
    name: 'vitepress:remove-inline-color',
    // 移除内联 color/background-color 样式，只保留 CSS 变量 --shiki-light / --shiki-dark
    // 这样 VitePress 主题样式可以接管颜色，并自动跟随明暗主题切换
    span(node: any) {
      const style = node.properties.style;
      if (!style) return;
      const newStyle = style
        .replace(/color:[^;]+;?\s*/g, '')
        .replace(/background-color:[^;]+;?\s*/g, '')
        .replace(/--shiki-light-bg:[^;]+;?\s*/g, '')
        .replace(/--shiki-dark-bg:[^;]+;?\s*/g, '');
      if (newStyle.trim()) {
        node.properties.style = newStyle.trim();
      } else {
        delete node.properties.style;
      }
    },
  },
];

// 创建带 Shiki 高亮占位的 MarkdownIt 实例（与 StreamAI.vue 一致的做法）
// highlight 回调接收 (str, lang, attrs)，attrs 可能包含 code-group 追加的 "active" 标记
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str: string, lang: string, attrs: string) {
    // 检测是否有 active 标记（由 code-group 容器追加）
    const isActive = attrs && attrs.includes('active');
    const activeAttr = isActive ? ' data-active="true"' : '';
    if (!lang) {
      return `<pre class="shiki"${activeAttr}><code data-lang="">${md.utils.escapeHtml(str)}</code></pre>`;
    }
    return `<pre class="shiki"${activeAttr}><code data-lang="${md.utils.escapeHtml(lang)}">${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

// 注册 VitePress 风格的 admonition 容器（:::warning / :::tip / :::info 等）
// 模仿 VitePress 的 createContainer，生成 <div class="xxx custom-block"> 结构
const admonitionTypes: Record<string, string> = {
  tip: '提示',
  info: '信息',
  warning: '警告',
  danger: '危险',
  note: '笔记',
  details: '详细信息',
};
for (const [klass, defaultTitle] of Object.entries(admonitionTypes)) {
  md.use(markdownItContainer, klass, {
    render(tokens: any, idx: number, _options: any, env: any) {
      const token = tokens[idx];
      const info = token.info.trim().slice(klass.length).trim();
      if (token.nesting === 1) {
        const title = md.renderInline(info || defaultTitle, { references: env.references });
        if (klass === 'details') {
          return `<details class="${klass} custom-block"><summary>${title}</summary>\n`;
        }
        return `<div class="${klass} custom-block"><p class="custom-block-title">${title}</p>\n`;
      }
      return klass === 'details' ? `</details>\n` : `</div>\n`;
    },
  });
}

// 从 fence 的 info 字符串中提取标题（如 ```sh [国内加速] 中的 "国内加速"）
function extractCodeTitle(info: string): string {
  return info.match(/\[(.*)\]/)?.[1] || '';
}

// 从 fence 的 info 字符串中提取语言（如 ```sh [国内加速] 中的 "sh"）
function extractCodeLang(info: string): string {
  return info.trim().replace(/\[.*\]/, '').replace(/\{.*\}/, '').trim() || 'text';
}

// code-group 唯一 ID 生成（优先用 nanoid 保证全局唯一，避免多个 dropdown 的 radio name 冲突）
let codeGroupIdCounter = 0;
function genGroupId(): string {
  try {
    return `cg-${nanoid(8)}`;
  } catch {
    return `cg-${++codeGroupIdCounter}`;
  }
}

// 注册 VitePress 风格的 code-group 容器（::: code-group）
// 模仿 VitePress 的 createCodeGroup，生成 <div class="vp-code-group"> + tab 切换结构
md.use(markdownItContainer, 'code-group', {
  marker: ':',
  render(tokens: any, idx: number) {
    if (tokens[idx].nesting === 1) {
      // 容器开启：扫描内部 token，为每个代码块生成 radio + label
      const groupName = genGroupId();
      let tabs = '';
      let checked = 'checked';
      let blockIndex = 0;
      for (let i = idx + 1; !(tokens[i].nesting === -1 && tokens[i].type === 'container_code-group_close'); ++i) {
        if (tokens[i].type === 'fence' && tokens[i].tag === 'code') {
          const title = extractCodeTitle(tokens[i].info);
          if (title) {
            const tabId = `tab-${groupName}-${blockIndex}`;
            tabs += `<input type="radio" name="${groupName}" id="${tabId}" ${checked}><label data-title="${md.utils.escapeHtml(title)}" for="${tabId}">${title}</label>`;
            // 给选中的代码块加 active 标记
            if (checked) {
              tokens[i].info = tokens[i].info + ' active';
              checked = '';
            }
            blockIndex++;
          }
        }
      }
      return `<div class="vp-code-group"><div class="tabs">${tabs}</div><div class="blocks">\n`;
    }
    return `</div></div>\n`;
  },
  // 验证函数：只有 ::: code-group 才匹配
  validate(params: string) {
    return params.trim() === 'code-group';
  },
});

// 解码 HTML 实体（SSR 安全：Node 环境下用正则降级）
function decodeHtml(html: string): string {
  if (typeof document !== 'undefined') {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = html;
    return textArea.value;
  }
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// 用 Shiki 高亮一段代码，返回完整的 HTML（带 vp-code 类，双主题 CSS 变量）
async function highlightCode(code: string, lang: string): Promise<string> {
  const cacheKey = `${lang}:${code}`;
  if (highlightCache.has(cacheKey)) {
    return highlightCache.get(cacheKey)!;
  }
  try {
    const h = await getHighlighter();
    const loadedLanguages = h.getLoadedLanguages();
    const normalizedLang = lang.toLowerCase();
    if (normalizedLang && loadedLanguages.includes(normalizedLang)) {
      const html = h.codeToHtml(code, {
        lang: normalizedLang,
        transformers: shikiTransformers,
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
      });
      // 添加 vp-code 类，与 VitePress 代码块一致
      const result = html.replace(/<pre class="([^"]*)"/, '<pre class="$1 vp-code"');
      highlightCache.set(cacheKey, result);
      return result;
    }
  } catch (e) {
    console.warn('Failed to highlight code:', e);
  }
  // 降级：返回未高亮的结构
  return `<pre class="shiki vp-code"><code>${md.utils.escapeHtml(code)}</code></pre>`;
}

// 异步应用 Shiki 高亮到 markdown-it 渲染出的 HTML（处理其中的代码块占位）
async function applyShikiHighlighting(html: string): Promise<string> {
  try {
    // 匹配带可选 data-active 属性的代码块占位
    const codeBlockRegex = /<pre class="shiki"(?: data-active="([^"]*)")?><code data-lang="([^"]*)">(.*?)<\/code><\/pre>/gs;

    let processedHtml = html;
    const replacements: Array<{ fullMatch: string; active: string | undefined; lang: string; escapedCode: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(html)) !== null) {
      const [fullMatch, active, lang, escapedCode] = match;
      replacements.push({ fullMatch, active, lang, escapedCode });
    }

    for (const { fullMatch, active, lang, escapedCode } of replacements) {
      const code = decodeHtml(escapedCode);
      const highlighted = await highlightCode(code, lang);
      // 用 .language-xxx 外层 div 包裹，与 VitePress 原生代码块结构一致
      const normalizedLang = (lang || 'text').toLowerCase();
      const activeClass = active === 'true' ? ' active' : '';
      const wrapped = `<div class="language-${normalizedLang}${activeClass}"><span class="lang">${normalizedLang}</span>${highlighted}</div>`;
      processedHtml = processedHtml.replace(fullMatch, wrapped);
    }

    return processedHtml;
  } catch (error) {
    console.warn('Shiki highlighting error:', error);
    return html;
  }
}

// ========== 渲染 download markdown ==========
const downloadHtml = ref('');

async function renderDownload(mdText: string) {
  if (!mdText || !mdText.trim()) {
    downloadHtml.value = '';
    return;
  }
  const basicHtml = md.render(mdText);
  downloadHtml.value = await applyShikiHighlighting(basicHtml);
}

// ========== 渲染 YAML 配置 ==========
const yamlHtml = ref('');

async function renderYaml(yamlText: string) {
  if (!yamlText) {
    yamlHtml.value = '';
    return;
  }
  yamlHtml.value = await highlightCode(yamlText, 'yaml');
}

// 监听选中模型变化，重新渲染
watch(
  selectedModel,
  async (m) => {
    await Promise.all([renderDownload(m.download), renderYaml(m.yaml)]);
  },
  { immediate: true }
);

// 复制 YAML 配置
function copyYaml(e: MouseEvent) {
  const btn = e.currentTarget as HTMLButtonElement;
  const container = btn.parentElement;
  if (!container) return;
  const codeEl = container.querySelector('code');
  const text = codeEl?.textContent || '';
  navigator.clipboard?.writeText(text).then(() => {
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 2000);
  });
}
</script>

<template>
  <div class="model-config-dropdown">
    <div class="model-config-dropdown__panel">
      <!-- 步骤 1：选择模型 -->
      <div class="model-config-dropdown__step model-config-dropdown__step--select">
        <h4 class="model-config-dropdown__step-title">步骤 1 — 选择模型</h4>
        <div
          class="model-config-dropdown__dropdown"
          :class="{
            'model-config-dropdown__dropdown--open': isOpen,
            'model-config-dropdown__dropdown--static': !hasChoices,
          }"
          @click="toggleMenu"
        >
          <div class="model-config-dropdown__dropdown-content">
            <span class="model-config-dropdown__model-name">
              {{ selectedModel.label }}
              <span
                v-if="selectedModel.recommended"
                class="model-config-dropdown__recommended-badge"
              >推荐</span>
            </span>
            <span v-if="hasChoices" class="model-config-dropdown__arrow">{{ isOpen ? '▲' : '▼' }}</span>
          </div>
        </div>

        <div v-if="isOpen && hasChoices" class="model-config-dropdown__menu">
          <div
            v-for="(model, index) in models"
            :key="model.key"
            class="model-config-dropdown__menu-item"
            :class="{ 'model-config-dropdown__menu-item--active': index === selectedIndex }"
            @click="selectModel(index)"
          >
            {{ model.label }}
            <span
              v-if="model.recommended"
              class="model-config-dropdown__recommended-badge"
            >推荐</span>
          </div>
        </div>
      </div>

      <!-- 步骤 2：下载模型 -->
      <div class="model-config-dropdown__step">
        <h4 class="model-config-dropdown__step-title">步骤 2 — 下载模型</h4>
        <div class="vp-doc model-config-dropdown__markdown" v-html="downloadHtml"></div>
      </div>

      <!-- 步骤 3：配置检测器（仅 YAML） -->
      <div class="model-config-dropdown__step">
        <h4 class="model-config-dropdown__step-title">步骤 3 — 配置检测器</h4>
        <div class="vp-doc model-config-dropdown__yaml">
          <div class="language-yaml">
            <button title="复制代码" class="copy" @click="copyYaml"></button>
            <span class="lang">yaml</span>
            <div class="model-config-dropdown__code" v-html="yamlHtml"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.model-config-dropdown {
  margin: 1.5rem 0;
}

.model-config-dropdown__panel {
  margin-top: 0.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--vp-c-bg);
}

.model-config-dropdown__step {
  padding: 1rem;
}

.model-config-dropdown__step:not(:last-child) {
  border-bottom: 1px solid var(--vp-c-divider);
}

.model-config-dropdown__step-title {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

/* --- 下拉按钮 --- */
.model-config-dropdown__dropdown {
  display: inline-block;
  width: 360px;
  max-width: 100%;
  text-align: left;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.model-config-dropdown__dropdown:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.model-config-dropdown__dropdown--open {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.model-config-dropdown__dropdown--static {
  cursor: default;
}

.model-config-dropdown__dropdown--static:hover {
  border-color: var(--vp-c-border);
  box-shadow: none;
}

.model-config-dropdown__dropdown-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
}

/* --- 模型菜单 --- */
.model-config-dropdown__menu {
  margin-top: 0.25rem;
  width: 360px;
  max-width: 100%;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--vp-c-bg);
  z-index: 10;
  position: relative;
}

.model-config-dropdown__menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
  transition: background-color 0.15s;
}

.model-config-dropdown__menu-item:not(:last-child) {
  border-bottom: 1px solid var(--vp-c-divider);
}

.model-config-dropdown__menu-item:hover {
  background-color: var(--vp-c-bg-soft);
}

.model-config-dropdown__menu-item--active {
  font-weight: 600;
  background-color: var(--vp-c-brand-soft);
}

.model-config-dropdown__model-name {
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.model-config-dropdown__recommended-badge {
  display: inline-block;
  background-color: var(--vp-c-green-1);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.model-config-dropdown__arrow {
  font-size: 0.7rem;
  color: var(--vp-c-text-2);
  transition: transform 0.2s;
}

.model-config-dropdown__dropdown--open .model-config-dropdown__arrow {
  transform: rotate(180deg);
}

/* --- 渲染的 markdown 内容 --- */
.model-config-dropdown__markdown {
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.model-config-dropdown__markdown :deep(p) {
  margin: 0.5rem 0;
}

.model-config-dropdown__markdown :deep(p:first-child) {
  margin-top: 0;
}

.model-config-dropdown__markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.model-config-dropdown__markdown :deep(a) {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.model-config-dropdown__markdown :deep(h4) {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.75rem 0 0.5rem;
  color: var(--vp-c-text-1);
}

.model-config-dropdown__markdown :deep(ul),
.model-config-dropdown__markdown :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.model-config-dropdown__markdown :deep(li) {
  margin: 0.25rem 0;
}

.model-config-dropdown__markdown :deep(table) {
  display: table;
  width: 100%;
  margin: 0.75rem 0;
  font-size: 0.85rem;
  border-collapse: collapse;
  overflow: hidden;
}

.model-config-dropdown__markdown :deep(th),
.model-config-dropdown__markdown :deep(td) {
  border: 1px solid var(--vp-c-border);
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.model-config-dropdown__markdown :deep(th) {
  background-color: var(--vp-c-bg-soft);
  font-weight: 600;
}

.model-config-dropdown__markdown :deep(blockquote) {
  border-left: 4px solid var(--vp-c-border);
  padding: 0.25rem 1rem;
  margin: 0.75rem 0;
  color: var(--vp-c-text-2);
}

/* 代码块：由 markdown-it + shiki 生成，外层包了 .vp-doc，
   VitePress 全局样式（.vp-doc .language-xxx）会接管背景色、padding、字体等。
   这里只需移除 shiki 生成的内联背景色，让 VitePress 主题样式生效。 */
.model-config-dropdown__markdown :deep(.shiki),
.model-config-dropdown__code :deep(.shiki) {
  background: transparent !important;
}

.model-config-dropdown__markdown :deep(.shiki) > code,
.model-config-dropdown__code :deep(.shiki) > code {
  background: transparent !important;
}

.model-config-dropdown__markdown :deep(.shiki pre),
.model-config-dropdown__code :deep(.shiki pre) {
  margin: 0;
}

/* 行内 code（非代码块内的） */
.model-config-dropdown__markdown :deep(code:not(pre code)) {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9em;
  background-color: var(--vp-c-bg-soft);
  padding: 0.15em 0.35em;
  border-radius: 3px;
}

/* YAML 代码块容器（步骤 3） */
.model-config-dropdown__yaml {
  margin: 0.5rem 0 0 0;
}

.model-config-dropdown__yaml .language-yaml {
  position: relative;
}

.model-config-dropdown__yaml .lang {
  position: absolute;
  top: 4px;
  right: 10px;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  z-index: 2;
}

.model-config-dropdown__yaml .copy {
  position: absolute;
  top: 4px;
  right: 40px;
  z-index: 2;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;
}

.model-config-dropdown__yaml .copy::before {
  content: '';
  display: block;
  width: 16px;
  height: 16px;
  margin: 6px auto;
  background-color: var(--vp-c-text-2);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='9' y='9' width='13' height='13' rx='2' ry='2'%3E%3C/rect%3E%3Cpath d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'%3E%3C/path%3E%3C/svg%3E") center / contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='9' y='9' width='13' height='13' rx='2' ry='2'%3E%3C/rect%3E%3Cpath d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'%3E%3C/path%3E%3C/svg%3E") center / contain no-repeat;
}

.model-config-dropdown__yaml:hover .copy {
  opacity: 1;
}

.model-config-dropdown__yaml .copy:hover {
  background-color: var(--vp-c-bg-mute);
}

.model-config-dropdown__yaml .copy.copied::before {
  background-color: var(--vp-c-green-1);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E") center / contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E") center / contain no-repeat;
}
</style>
