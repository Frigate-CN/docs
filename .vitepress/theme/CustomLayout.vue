<script setup>
import Teek from "vitepress-theme-teek";
import { ref } from 'vue'

const { Layout } = Teek;

const showFeedback = ref(false)
</script>

<template>
  <Teek.Layout>
    <template #teek-right-bottom-after>
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
              <iframe width="400px" height="680px" src="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAANAAdCNWrdUQjI3WjVGVUtYQ0xQQkhSWllDOTdRUzdaQy4u&embed=true" frameborder="0" marginwidth="0" marginheight="0" style="border: none; max-width:100%; max-height:100vh" allowfullscreen webkitallowfullscreen mozallowfullscreen msallowfullscreen> </iframe>
            </div>
          </div>
        </Transition>
      </div>
    </template>
  </Teek.Layout>
</template>

<style scoped>
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  transition: all .3s ease-in-out;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;

  /* 可选：从下方滑入 / 滑出效果 */
  transform: translateY(20px);

  /* 或者：缩放效果 */
  /* transform: scale(0.9) translateY(20px); */
}

.popup-enter-to,
.popup-leave-from {
  opacity: 1;
  transform: translateY(0);
  /* transform: scale(1) translateY(0); */
}
</style>