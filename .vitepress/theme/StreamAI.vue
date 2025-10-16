<template>
  <div class="stream-ai-container" :style="containerStyle" ref="rootContainer">
  <button class="stream-close-button" @click="closePopup" title="关闭">×</button>
  <div class="messages-container" ref="messagesContainer">
      <div v-for="(msg, index) in messages" :key="index" class="message-item">
        <div :class="['message-bubble', msg.role]">
          <div class="message-role">
            <svg v-if="msg.role !== 'user'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16"><g fill="none"><path d="M11.5286 1.87149C11.5769 1.73005 11.5356 1.5733 11.4233 1.47452C11.0472 1.14247 10.0965 0.443125 8.66911 0.339708C7.07054 0.223769 6.08089 0.652279 5.58096 0.969951C5.36531 1.10676 5.35326 1.41748 5.55499 1.57422L9.62723 4.73936C9.98617 5.01807 10.5125 4.8604 10.6591 4.43003L11.5286 1.87149Z" fill="currentColor"/><path d="M1.49017 11.2664C1.32368 11.3781 1.24855 11.584 1.30235 11.7774C1.45724 12.3339 1.91868 13.4919 3.22833 14.5456C4.53797 15.5992 6.08738 15.7128 6.74962 15.6966C6.94764 15.692 7.12016 15.5617 7.17998 15.3724L9.79046 7.11064C9.97875 6.51425 9.31048 6.01386 8.79154 6.3626L1.49017 11.2664Z" fill="currentColor"/><path d="M3.39813 2.54827C3.27013 2.49773 3.12683 2.50607 3.00579 2.57193C2.52256 2.83488 1.28526 3.64506 0.647135 5.30947C0.154627 6.59222 0.328071 8.01085 0.463488 8.70463C0.508009 8.9314 0.747306 9.06218 0.962489 8.97824L8.79485 5.92024C9.35414 5.70181 9.35646 4.91111 8.7981 4.6899L3.39813 2.54827Z" fill="currentColor"/><path d="M15.0167 8.46843C15.243 8.62194 15.5528 8.48652 15.5922 8.21569C15.6961 7.49872 15.7861 6.25076 15.371 5.30933C14.8177 4.05487 13.8786 3.28133 13.433 2.9669C13.292 2.86766 13.1019 2.87786 12.9725 2.99241L10.9959 4.74541C10.6732 5.03154 10.7066 5.54492 11.0636 5.78746L15.0167 8.46936V8.46843Z" fill="currentColor"/><path d="M9.49413 15.1604C9.47372 15.3937 9.67128 15.5866 9.90409 15.5616C10.6531 15.4813 12.1918 15.1841 13.3447 14.0827C14.467 13.0109 14.832 11.7384 14.9382 11.2319C14.9669 11.0951 14.9326 10.9528 14.8445 10.8442L11.3886 6.57909C11.0143 6.11719 10.2681 6.34535 10.2162 6.93757L9.49366 15.1604H9.49413Z" fill="currentColor"/></g></svg>
            {{ msg.role === 'user' ? '你' : 'CNB AI' }}
          </div>
          <!-- 显示思考内容（移动到生成内容上方） -->
          <div v-if="msg.reasoning && showReasoning" class="reasoning-content above">
            <i class="fas fa-lightbulb"></i> 思考过程: {{ msg.reasoning }}
          </div>

          <!-- 渲染解析后的HTML -->
          <div class="message-content" v-html="msg.htmlContent"></div>
        </div>
      </div>
      <div ref="bottomAnchor"></div>

      <div v-if="isLoading" class="message-item">
        <div class="message-bubble ai">
          <div class="message-role"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16"><g fill="none"><path d="M11.5286 1.87149C11.5769 1.73005 11.5356 1.5733 11.4233 1.47452C11.0472 1.14247 10.0965 0.443125 8.66911 0.339708C7.07054 0.223769 6.08089 0.652279 5.58096 0.969951C5.36531 1.10676 5.35326 1.41748 5.55499 1.57422L9.62723 4.73936C9.98617 5.01807 10.5125 4.8604 10.6591 4.43003L11.5286 1.87149Z" fill="currentColor"/><path d="M1.49017 11.2664C1.32368 11.3781 1.24855 11.584 1.30235 11.7774C1.45724 12.3339 1.91868 13.4919 3.22833 14.5456C4.53797 15.5992 6.08738 15.7128 6.74962 15.6966C6.94764 15.692 7.12016 15.5617 7.17998 15.3724L9.79046 7.11064C9.97875 6.51425 9.31048 6.01386 8.79154 6.3626L1.49017 11.2664Z" fill="currentColor"/><path d="M3.39813 2.54827C3.27013 2.49773 3.12683 2.50607 3.00579 2.57193C2.52256 2.83488 1.28526 3.64506 0.647135 5.30947C0.154627 6.59222 0.328071 8.01085 0.463488 8.70463C0.508009 8.9314 0.747306 9.06218 0.962489 8.97824L8.79485 5.92024C9.35414 5.70181 9.35646 4.91111 8.7981 4.6899L3.39813 2.54827Z" fill="currentColor"/><path d="M15.0167 8.46843C15.243 8.62194 15.5528 8.48652 15.5922 8.21569C15.6961 7.49872 15.7861 6.25076 15.371 5.30933C14.8177 4.05487 13.8786 3.28133 13.433 2.9669C13.292 2.86766 13.1019 2.87786 12.9725 2.99241L10.9959 4.74541C10.6732 5.03154 10.7066 5.54492 11.0636 5.78746L15.0167 8.46936V8.46843Z" fill="currentColor"/><path d="M9.49413 15.1604C9.47372 15.3937 9.67128 15.5866 9.90409 15.5616C10.6531 15.4813 12.1918 15.1841 13.3447 14.0827C14.467 13.0109 14.832 11.7384 14.9382 11.2319C14.9669 11.0951 14.9326 10.9528 14.8445 10.8442L11.3886 6.57909C11.0143 6.11719 10.2681 6.34535 10.2162 6.93757L9.49366 15.1604H9.49413Z" fill="currentColor"/></g></svg>CNB AI</div>
          <!-- 实时显示思考内容（放在生成结果上方） -->
          <div v-if="currentReasoning && showReasoning" class="reasoning-content">
            <i class="fas fa-lightbulb"></i> 思考过程: {{ currentReasoning }}
          </div>

          <div class="message-content" v-html="currentHtmlContent"></div>

          <span class="typing-indicator">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 回到底部按钮（仅当用户中断自动滚动时显示） -->
    <button 
      v-if="!autoScroll"
      class="scroll-to-bottom"
      @click="goToBottom"
      title="回到底部并恢复自动滚动"
    >
      回到底部
    </button>
    
    <div>
      <!-- 推荐问题展示：仅在无对话时显示 -->
      <div v-if="messages.length === 0" class="recommended-questions">
        <div class="recommended-title">推荐提问：</div>
        <div class="recommended-list">
          <button
            v-for="(q, idx) in displayedQuestions"
            :key="idx"
            class="recommended-question"
            @click="handleRecommendedClick(q)"
          >{{ q }}</button>
        </div>
      </div>
      <!-- 切换是否显示思考过程的按钮 -->
      <div class="toggle-reasoning" @click="showReasoning = !showReasoning">
        <i class="fas" :class="showReasoning ? 'fa-eye' : 'fa-eye-slash'"></i>
        {{ showReasoning ? '隐藏思考过程' : '显示思考过程' }}
      </div>

      <div class="input-container">
        <textarea
        v-model="userInput"
        :disabled="isLoading"
        placeholder="输入你的问题..."
        @keydown.enter.prevent="sendMessage"
        class="input-field"
      ></textarea>
      <button 
        @click="sendMessage" 
        :disabled="!userInput.trim() || isLoading"
        class="send-button"
      >
        <i class="fas fa-paper-plane"></i>
      </button>
      </div>
    </div>
    <!-- Resize handles: left, top, top-left -->
    <div
      class="resize-handle handle-left"
      @pointerdown="(e) => startResize('left', e)"
      role="slider"
      aria-label="Resize width"
    ></div>

    <div
      class="resize-handle handle-top"
      @pointerdown="(e) => startResize('top', e)"
      role="slider"
      aria-label="Resize height"
    ></div>

    <div
      class="resize-handle handle-top-left"
      @pointerdown="(e) => startResize('top-left', e)"
      role="slider"
      aria-label="Resize both"
    ></div>
  </div>
</template>

<script setup>
// 推荐问题点击后直接发送
function handleRecommendedClick(q) {
  if (isLoading.value) return;
  userInput.value = q;
  sendMessage();
}
import { ref, onUnmounted, onMounted, computed, nextTick } from 'vue';
// 推荐问题常量
const recommendedQuestions = [
  '是否支持小米摄像头？',
  '如何配置摄像头？',
  '如何设置物体检测？',
  '如何集成 Home Assistant？',
  '如何使用硬件加速？',
  '如何设置录像保存？',
  '如何使用人脸识别？',
  '如何排查硬件加速问题？',
];

// 随机抽选4条推荐问题
function getRandomQuestions(arr, n) {
  const copy = arr.slice();
  const result = [];
  while (copy.length && result.length < n) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

const displayedQuestions = ref(getRandomQuestions(recommendedQuestions, 4));

// 每次弹窗打开时刷新推荐问题
onMounted(() => {
  displayedQuestions.value = getRandomQuestions(recommendedQuestions, 4);
  attachScrollListener();
});
const emit = defineEmits(['close']);
import DOMPurify from 'dompurify';
import MarkdownIt from "markdown-it";
import hljs from 'highlight.js';

const md = MarkdownIt({ 
  html: true, 
  linkify: true,
  typographer: true,
  highlight: function(str, lang) {
      // 如果指定了语言且hljs支持该语言
      if (lang && hljs.getLanguage(lang)) {
        try {
          // 高亮代码并添加自定义类名
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        } catch (__) {}
      }
      
      // 未指定语言或不支持的语言，使用自动检测
      return `<pre class="hljs"><code>${hljs.highlightAuto(str).value}</code></pre>`;
    }
});

// 状态管理
const userInput = ref('');
const messages = ref([]);
const isLoading = ref(false);
const currentContent = ref('');          // 当前流式响应的Markdown内容
const currentReasoning = ref('');        // 当前流式响应的思考内容
const showReasoning = ref(false);        // 是否显示思考过程
const reader = ref(null);                // 流读取器
const abortController = ref(null);       // 用于取消请求
const partialData = ref('');             // 存储不完整的流数据片段

// 可调尺寸/位置（组件固定在右下角，通过改变宽高来调整大小）
const rootContainer = ref(null);
const width = ref(640);
const height = ref(480);
const minWidth = 300;
const minHeight = 180;
const maxWidth = () => Math.max(300, window.innerWidth - 80);
const maxHeight = () => Math.max(200, window.innerHeight - 80);

const containerStyle = computed(() => ({
  position: 'fixed',
  right: '20px',
  bottom: '20px',
  width: width.value + 'px',
  height: height.value + 'px',
  zIndex: 9999,
}));

// Resize state
const resizing = ref(false);
let resizeType = null; // 'left' | 'top' | 'top-left'
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

const startResize = (type, ev) => {
  ev.preventDefault();
  // Use pointer events to support mouse/touch
  const e = ev;
  resizing.value = true;
  resizeType = type;
  startX = e.clientX;
  startY = e.clientY;
  startWidth = width.value;
  startHeight = height.value;

  // Prevent text selection and touch scrolling during resize
  document.body.style.userSelect = 'none';
  document.body.style.touchAction = 'none';

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', stopResize);
};

const onPointerMove = (ev) => {
  if (!resizing.value) return;
  const e = ev;
  const dx = startX - e.clientX; // positive when moving left
  const dy = startY - e.clientY; // positive when moving up

  if (resizeType === 'left' || resizeType === 'top-left') {
    const newW = clamp(startWidth + dx, minWidth, maxWidth());
    width.value = newW;
  }

  if (resizeType === 'top' || resizeType === 'top-left') {
    const newH = clamp(startHeight + dy, minHeight, maxHeight());
    height.value = newH;
  }
};

const stopResize = () => {
  if (!resizing.value) return;
  resizing.value = false;
  resizeType = null;
  // restore
  document.body.style.userSelect = '';
  document.body.style.touchAction = '';
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', stopResize);
};
// 滚动/交互相关
const messagesContainer = ref(null);
const bottomAnchor = ref(null);
const autoScroll = ref(true); // 是否允许自动滚动
const programmaticScroll = ref(false); // 标记由代码引起的滚动，避免被误判为用户交互
const scrollThreshold = 60; // 当距离底部小于此值(像素)时视为在底部，继续自动滚动
let resizeObserver = null;
let programmaticScrollTimeout = null;
let followHandle = null;
let followAttempts = 0;
const maxFollowAttempts = 12; // 重试次数，约 12*80ms ~ 1s

// 实时将当前Markdown内容转换为HTML
const currentHtmlContent = computed(() => {
  if (!md || !currentContent.value) return '';
  // 使用Vitepress的MarkdownIt解析，并用DOMPurify净化
  return DOMPurify.sanitize(md.render(currentContent.value));
});

// 清理连接
// 清理连接与事件监听
onUnmounted(() => {
  cancelStream();
  removeScrollListener();
  stopResize();
});

onMounted(() => {
  attachScrollListener();
});

// 附加 / 移除滚动监听
const onUserScroll = (e) => {
  if (!messagesContainer.value) return;

  // 如果是程序化滚动产生的事件，忽略一次
  if (programmaticScroll.value) {
    programmaticScroll.value = false;
    return;
  }

  const el = messagesContainer.value;
  const distanceToBottom = el.scrollHeight - el.clientHeight - el.scrollTop;

  // 如果离底部小于阈值，认为用户到达底部，允许自动滚动
  if (distanceToBottom <= scrollThreshold) {
    autoScroll.value = true;
  } else {
    // 用户滚动且不在底部，停止自动滚动
    autoScroll.value = false;
  }
};

const attachScrollListener = () => {
  if (!messagesContainer.value) return;
  messagesContainer.value.addEventListener('scroll', onUserScroll, { passive: true });
  // attach ResizeObserver to detect content height changes (e.g., code blocks rendering)
  try {
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        // 当容器尺寸或子内容改变时，如果允许自动滚动则持续跟随到底部
        if (autoScroll.value) startFollowToBottom(false);
      });
      resizeObserver.observe(messagesContainer.value);
    }
  } catch (e) {
    // ResizeObserver 可能在一些环境不可用，安全忽略
    console.warn('ResizeObserver unavailable or failed to attach', e);
  }
};

const removeScrollListener = () => {
  if (!messagesContainer.value) return;
  messagesContainer.value.removeEventListener('scroll', onUserScroll);
  if (resizeObserver) {
    try {
      resizeObserver.disconnect();
    } catch (e) {}
    resizeObserver = null;
  }
};

// 将容器滚动到底部（程序化滚动）
const scrollToBottom = (smooth = true) => {
  if (!messagesContainer.value) return;
  // 标记为程序化滚动，避免将自身触发的 scroll 事件判为用户交互
  programmaticScroll.value = true;
  // 清理旧的超时
  if (programmaticScrollTimeout) {
    clearTimeout(programmaticScrollTimeout);
  }
  const behavior = smooth ? 'smooth' : 'auto';
  messagesContainer.value.scrollTo({ top: messagesContainer.value.scrollHeight, behavior });
  // 在短时间后清除程序化滚动标记，避免长时间阻止用户滚动的检测
  programmaticScrollTimeout = setTimeout(() => {
    programmaticScroll.value = false;
    programmaticScrollTimeout = null;
  }, 300);
};

// 用户点击回到底部按钮
const goToBottom = () => {
  autoScroll.value = true;
  scrollToBottom(true);
};

// 在生成新内容时判断是否滚动：如果autoScroll允许，则滚到底部
const scrollIfNeeded = (smooth = false) => {
  if (!messagesContainer.value) return;
  const el = messagesContainer.value;
  const distanceToBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
  if (autoScroll.value || distanceToBottom <= scrollThreshold) {
    // 使用持续跟随策略以处理异步渲染（例如代码高亮）导致的后续高度变化
    startFollowToBottom(smooth);
  }
};

// 持续滚到底部直到高度稳定（处理代码高亮、图片加载等异步导致的高度变化）
const startFollowToBottom = (smooth = false) => {
  if (!messagesContainer.value) return;
  // 取消已有的跟随任务
  if (followHandle) {
    cancelFollowToBottom();
  }
  followAttempts = 0;

  const el = messagesContainer.value;
  let lastHeight = el.scrollHeight;

  const step = () => {
    if (!autoScroll.value) return; // 用户已中断
    if (!messagesContainer.value) return;
    // 先滚到底部
    scrollToBottom(smooth);

    followAttempts += 1;
    // 等待一小段时间让渲染发生，再检查高度是否变化
    followHandle = window.setTimeout(() => {
      if (!messagesContainer.value) return;
      const newHeight = messagesContainer.value.scrollHeight;
      if (newHeight > lastHeight && followAttempts < maxFollowAttempts) {
        lastHeight = newHeight;
        // 再次请求下一步
        requestAnimationFrame(step);
      } else {
        // 稳定或达到最大尝试，结束跟随
        cancelFollowToBottom();
      }
    }, 80);
  };

  // 启动第一步
  requestAnimationFrame(step);
};

const cancelFollowToBottom = () => {
  if (followHandle) {
    clearTimeout(followHandle);
    followHandle = null;
  }
  followAttempts = 0;
};

// 取消当前流
const cancelStream = () => {
  if (reader.value) {
    reader.value.cancel();
    reader.value = null;
  }
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }
  partialData.value = '';
};

const closePopup = () => {
  // emit close so parent can hide the overlay
  emit('close');
};

// 发送消息并处理流式响应
const sendMessage = async () => {
  const input = userInput.value.trim();
  if (!input || isLoading.value) return;

  // 解析用户输入的Markdown（如果需要）
  const userHtml = md ? DOMPurify.sanitize(md.render(input)) : input;
  
    // 构建最多4条上下文，忽略reasoning内容
  const context = messages.value
    .filter(msg => msg.role === 'user' || msg.role === 'ai')
    .slice(-6)
    .map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.content
    }));

  // 添加用户消息
  messages.value.push({ 
    role: 'user', 
    content: input,
    htmlContent: userHtml,
    reasoning: ''
  });

  // 发送新消息时默认回到底部并允许自动滚动（用户交互会覆盖此设置）
  autoScroll.value = true;
  await nextTick();
  scrollToBottom(true);
  
  // 重置状态
  userInput.value = '';
  isLoading.value = true;
  currentContent.value = '';
  currentReasoning.value = '';
  partialData.value = '';
  
  // 取消可能存在的旧流
  cancelStream();

  try {
    abortController.value = new AbortController();
    
    // 发送POST请求
    const response = await fetch('https://ai.chat.docs.frigate-cn.video/ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: input, context: context}),
      signal: abortController.value.signal,
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    // 获取响应流
    const decoder = new TextDecoder();
    reader.value = response.body.getReader();
    
    // 处理流数据
    const processStream = async () => {
      const { done, value } = await reader.value.read();
      
      if (done) {
        // 流结束，检查是否有未处理的部分数据
        if (partialData.value.trim()) {
          const isDone = processDataChunk(partialData.value);
          if (!isDone && currentContent.value) {
            // 保存最终消息
            messages.value.push({
              role: 'ai',
              content: currentContent.value,
              htmlContent: currentHtmlContent.value,
              reasoning: currentReasoning.value
            });
            // DOM 将要更新，确保在下一刻滚动
            await nextTick();
            scrollIfNeeded(true);
          }
        }
        isLoading.value = false;
        return;
      }

      // 解码并处理接收到的数据
      const chunk = decoder.decode(value, { stream: true });
      partialData.value += chunk;

      // 处理当前累积的所有数据
      const isDone = processDataChunk(partialData.value);

      // 如果生成了新的片段（currentContent/currentReasoning更新），尝试滚动
      // 使用非平滑滚动以跟上流的速度
      scrollIfNeeded(false);

      // 如果收到结束标记，停止处理
      if (isDone) {
        isLoading.value = false;
        return;
      }

      // 继续处理流
      await processStream();
    };

    // 开始处理流
    await processStream();

  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('流式请求错误:', error);
      currentContent.value += '\n\n⚠️ 连接错误，请重试';
      isLoading.value = false;
    }
  }
};

// 处理数据块，提取并解析带有data:前缀的JSON
const processDataChunk = (data) => {
  const regex = /(data: )/g;
  const parts = data.split(regex);
  
  const chunks = [];
  for (let i = 1; i < parts.length; i += 2) {
    if (parts[i] && parts[i + 1]) {
      chunks.push(parts[i] + parts[i + 1]);
    }
  }
  
  // 保存未处理的部分
  partialData.value = parts.length % 2 === 0 ? parts[parts.length - 1] || '' : '';
  
  // 处理每个完整的data块
  for (const chunk of chunks) {
    try {
      const content = chunk.replace(/^data: /, '').trim();
      if (!content) continue;
      
      // 处理结束标记
      if (content === '[DONE]') {
        if (currentContent.value) {
          messages.value.push({
            role: 'ai',
            content: currentContent.value,
            htmlContent: currentHtmlContent.value,
            reasoning: currentReasoning.value
          });

          // 流结束时滚到底部（平滑）如果允许自动滚动
          // 在 DOM 更新后再滚动
          nextTick(() => scrollIfNeeded(true));
        }
        currentContent.value = '';
        currentReasoning.value = '';
        partialData.value = '';
        return true;
      }
      
      // 解析JSON并提取内容
      const data = JSON.parse(content);
      if (data.choices && data.choices.length > 0) {
        const delta = data.choices[0].delta;
        
        if (delta.content) {
          currentContent.value += delta.content;
        }
        
        if (delta.reasoning_content) {
          currentReasoning.value += delta.reasoning_content;
        }
      }
    } catch (e) {
      console.warn('解析数据块失败:', e, '原始内容:', chunk);
      partialData.value = chunk + partialData.value;
    }
  }
  
  return false;
};
</script>

<style scoped>
/* 基础样式保持不变 */

.dark .stream-ai-container {
  background: #1f2937;
  border-color: #374151;
  color: #d1d5db;
}

.stream-ai-container {
  /* width/height are now controlled inline via containerStyle */
  max-width: 100%;
  margin: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  background: white;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 10px;
  scroll-behavior: smooth;
}

.message-item {
  margin-bottom: 16px;
  max-width: 100%;
  animation: fadeIn 0.3s ease;
}

.user {
  margin-left: auto;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.user .message-bubble {
  background-color: #3b82f6;
  color: white;
  border-bottom-right-radius: 4px;
}

.ai .message-bubble {
  background-color: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}

/* 其他样式保持不变 */
.message-role {
  font-size: 12px;
  margin-bottom: 4px;
  opacity: 0.8;
  font-weight: 500;
}

.message-role svg {
    display: initial;
    vertical-align: text-bottom;
    margin-right: 3px;
}

.reasoning-content {
  margin: 8px 0;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

.reasoning-content i {
  margin-right: 4px;
  color: #f59e0b;
}

.reasoning-content.above {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #d1d5db;
}

.toggle-reasoning {
  align-self: flex-end;
  font-size: 12px;
  color: #60a5fa;
  cursor: pointer;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  position: absolute;
  right: 30px;
}

.toggle-reasoning:hover {
  color: #3b82f6;
  text-decoration: underline;
}

.input-container {
  display: flex;
  gap: 10px;
}

.input-field {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  resize: none;
  min-height: 50px;
  max-height: 150px;
  overflow-y: auto;
  font-family: inherit;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
}

.send-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.send-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.stream-close-button {
  position: absolute;
  top: 8px;
  right: 12px;
  z-index: 10001;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.stream-close-button:hover { color: #333 }

.typing-indicator {
  display: inline-flex;
  gap: 2px;
  margin-left: 4px;
}

.typing-indicator span {
  animation: typing 1.4s infinite both;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes typing {
  0% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0); }
}

/* 回到底部按钮样式 */
.scroll-to-bottom {
  position: fixed;
  bottom: 100px; /* 在输入区上方 */
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 6px 12px rgba(59,130,246,0.18);
  font-size: 13px;
}

.scroll-to-bottom:hover {
  background: #2563eb;
}

/* Resize handles */
.resize-handle {
  position: absolute;
  background: transparent;
  z-index: 10000;
}

.handle-left {
  left: -10px;
  top: 0;
  bottom: 0;
  width: 20px; /* larger hit area for touch */
  cursor: ew-resize;
}

.handle-top {
  top: -10px;
  left: 0;
  right: 0;
  height: 20px;
  cursor: ns-resize;
}

.handle-top-left {
  left: -12px;
  top: -12px;
  width: 24px;
  height: 24px;
  cursor: nwse-resize;
  border-radius: 4px;
  background: rgba(59,130,246,0.12);
  border: 1px solid rgba(59,130,246,0.18);
}

/* When resizing, change cursor globally for clarity */
html.resizing, body.resizing {
  cursor: nwse-resize !important;
}

/* 推荐问题样式 */
.recommended-questions {
  margin-bottom: 16px;
  padding: 12px 0;
  text-align: left;
}
.recommended-title {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}
.recommended-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.recommended-question {
  background: #f3f4f6;
  color: #2563eb;
  border: none;
  border-radius: 16px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.recommended-question:hover {
  background: #2563eb;
  color: #fff;
}
</style>
