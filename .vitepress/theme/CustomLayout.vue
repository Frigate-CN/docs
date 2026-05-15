<script setup>
import Teek from "vitepress-theme-teek";
import { ref } from "vue";
import { useRouter } from "vitepress";
import { DocsAiHelper, createVitePressNavigator } from "docs-ai-helper";

const router = useRouter();
const showFeedback = ref(false);

const docsAiEndpoint = "https://ai.agent.docs.frigate-cn.video/ai/chat/completions";
const docsAiNavigate = createVitePressNavigator(router);
const showDocsAiReasoningToggle = false;

function docsAiContext() {
  return {
    path: window.location.pathname,
    title: document.title,
  };
}

function docsAiRequestBody({ question, messages }) {
  return {
    messages: messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(-6)
      .map((message) => ({
        role: message.role,
        content: message.content,
      })),
  };
}

function docsAiParseStream(chunk) {
  return chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const payload = line.startsWith("data:") ? line.slice(5).trim() : line;
      if (!payload) return [];
      if (payload === "[DONE]") return [{ done: true }];

      try {
        const data = JSON.parse(payload);
        const delta = data.choices?.[0]?.delta ?? data.delta ?? data;

        return [
          {
            content: delta.content,
            reasoning: delta.reasoning_content ?? delta.reasoning,
          },
        ];
      } catch {
        return [{ content: payload }];
      }
    });
}
</script>

<template>
  <Teek.Layout>
    <template #teek-right-bottom-after>
      <DocsAiHelper
        :endpoint="docsAiEndpoint"
        :navigate="docsAiNavigate"
        :context="docsAiContext"
        :request-body="docsAiRequestBody"
        :parse-stream="docsAiParseStream"
        :assistant="{ name: 'CNB AI', avatar: 'https://docs.cnb.cool/images/logo/svg/Symbol-Black.svg' }"
        :user="{ name: '你' }"
        :welcome="{
          title: '需要我帮你查文档吗？',
          description: '可以询问入门、配置、故障排查，或让 AI 总结当前页面。'
        }"
        :suggested-questions="[
          { label: '是否支持小米摄像头？' },
          { label: '如何配置摄像头？' },
          { label: '如何设置物体检测？' }
        ]"
        launcher-text="AI"
        launcher-mode="inline"
        launcher-variant="toolbar"
        launcher-class="docs-ai-helper-launcher"
        panel-class="docs-ai-helper-panel"
        input-placeholder="输入你的问题..."
        :show-reasoning-default="false"
        :allow-reasoning-toggle="showDocsAiReasoningToggle"
        :size="{ width: 640, height: 560 }"
      />

      <div>
        <button
          class="tk-right-bottom-button__button feedback-button"
          @click="showFeedback = true"
        >
          💬 反馈
        </button>
        <Transition name="popup">
          <div
            v-show="showFeedback"
            class="feedback-overlay"
            @click.self="showFeedback = false"
          >
            <div class="feedback-popup">
              <h3>用户反馈</h3>
              <button class="close-button" @click="showFeedback = false">×</button>
              <iframe
                width="400px"
                height="680px"
                src="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAANAAdCNWrdUQjI3WjVGVUtYQ0xQQkhSWllDOTdRUzdaQy4u&embed=true"
                frameborder="0"
                marginwidth="0"
                marginheight="0"
                style="border: none; max-width: 100%; max-height: 100vh"
                allowfullscreen
                webkitallowfullscreen
                mozallowfullscreen
                msallowfullscreen
              />
            </div>
          </div>
        </Transition>
      </div>
    </template>
  </Teek.Layout>
</template>

<style scoped>
:deep(.docs-ai-helper-panel) {
  right: 24px;
}

:deep(.docs-ai-helper-panel .dah-actions .dah-icon-button:nth-last-child(2)) {
  font-size: 0;
}

:deep(.docs-ai-helper-panel .dah-actions .dah-icon-button:nth-last-child(2))::before {
  content: "🗑";
  font-size: 16px;
  line-height: 1;
}

:deep(.docs-ai-helper-panel .dah-markdown a) {
  color: var(--dah-accent);
  font-weight: 650;
  text-decoration-line: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
}

:deep(.docs-ai-helper-panel .dah-markdown a:hover),
:deep(.docs-ai-helper-panel .dah-markdown a:focus) {
  color: var(--dah-accent-strong);
  text-decoration-thickness: 2px;
}

:deep(.docs-ai-helper-panel .dah-markdown a:focus-visible) {
  outline: 2px solid var(--dah-accent);
  outline-offset: 2px;
  border-radius: 3px;
}

:deep(.docs-ai-helper-panel .dah-message-user .dah-markdown a) {
  color: #fff;
  text-decoration-color: rgba(255, 255, 255, 0.8);
}

:deep(.docs-ai-helper-panel .dah-message-user .dah-markdown a:hover),
:deep(.docs-ai-helper-panel .dah-message-user .dah-markdown a:focus) {
  color: #fff;
  text-decoration-color: #fff;
}

.feedback-button {
  background: var(--tk-theme-color);
  height: 4em;
  color: var(--tk-bg-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.feedback-button:hover {
  background: var(--vp-code-link-hover-color);
}

.feedback-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  z-index: 2000;
}

.feedback-popup {
  background: var(--tk-bg-color-elm);
  width: 480px;
  height: 550px;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.feedback-popup h3 {
  color: var(--vp-c-text-1);
  position: absolute;
  top: 9px;
  left: 12px;
  z-index: 1;
}

.close-button {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  z-index: 1;
}

iframe {
  width: 100%;
  height: calc(100% - 40px);
  border: none;
  margin-top: 40px;
}

.popup-enter-active,
.popup-leave-active {
  transition: all 0.3s ease-in-out;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.popup-enter-to,
.popup-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
