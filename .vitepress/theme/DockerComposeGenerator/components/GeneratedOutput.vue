<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { createHighlighter } from "shiki";
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import { TkVpContainer } from "vitepress-theme-teek";
import { stripHighlightNotation } from "../generator";

const props = defineProps<{
  yaml: string;
  configPath: string;
  mediaPath: string;
  hasAnyHardware: boolean;
  deviceId: string;
}>();

const copied = ref(false);
const highlighted = ref("");

// 复用 VitePress 相同的高亮器配置，保证代码块样式一致
let highlighterPromise: Promise<any> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: ["yaml"],
    });
  }
  return highlighterPromise;
}

async function highlightYaml(code: string) {
  try {
    const highlighter = await getHighlighter();
    const html = highlighter.codeToHtml(code, {
      lang: "yaml",
      transformers: [
        transformerMetaHighlight(),
        transformerNotationDiff(),
        transformerNotationFocus({
          classActiveLine: "has-focus",
          classActivePre: "has-focused-lines",
        }),
        transformerNotationHighlight(),
        transformerNotationErrorLevel(),
        {
          name: "vitepress:add-dir",
          pre(node: any) {
            node.properties.dir = "ltr";
          },
        },
        {
          name: "vitepress:remove-inline-color",
          // 移除内联 color 样式，保留 CSS 变量以便主题切换
          span(node: any) {
            const style = node.properties.style;
            if (!style) return;
            const next = style
              .replace(/color:[^;]+;?\s*/g, "")
              .replace(/background-color:[^;]+;?\s*/g, "")
              .replace(/--shiki-light-bg:[^;]+;?\s*/g, "")
              .replace(/--shiki-dark-bg:[^;]+;?\s*/g, "");
            if (next.trim()) node.properties.style = next.trim();
            else delete node.properties.style;
          },
        },
      ],
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    });
    highlighted.value = html.replace(
      /<pre class="([^"]*)"/,
      '<pre class="$1 vp-code"'
    );
  } catch (error) {
    console.error("代码高亮失败:", error);
    highlighted.value = "";
  }
}

async function copyConfig() {
  try {
    await navigator.clipboard.writeText(stripHighlightNotation(props.yaml));
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch (error) {
    console.error("复制失败:", error);
  }
}

onMounted(() => highlightYaml(props.yaml));
watch(
  () => props.yaml,
  (value) => highlightYaml(value)
);
</script>

<template>
  <section class="dcg-section dcg-result">
    <div class="dcg-result-header">
      <h4>生成的配置</h4>
      <button class="dcg-copy-btn" type="button" @click="copyConfig">
        {{ copied ? "已复制！" : "复制配置" }}
      </button>
    </div>

    <TkVpContainer v-if="!configPath" type="tip">
      <template #title>提示</template>
      <p>你未指定配置文件保存目录，请确定是否需要修改。</p>
    </TkVpContainer>
    <TkVpContainer v-if="!mediaPath" type="tip">
      <template #title>提示</template>
      <p>你未指定录制文件保存目录，请确定是否需要修改。</p>
    </TkVpContainer>
    <TkVpContainer v-if="deviceId === 'stable' && !hasAnyHardware" type="warning">
      <template #title>警告</template>
      <p>你还没有选择任何硬件加速，请确认是否有支持的硬件可以使用。</p>
    </TkVpContainer>

    <div class="vp-doc">
      <div class="language-yaml">
        <span class="lang">yaml</span>
        <div v-html="highlighted"></div>
      </div>
    </div>
  </section>
</template>
