<template>
  <div class="stream-ai-container">
    <div class="messages-container">
      <div v-for="(msg, index) in messages" :key="index" class="message-item">
        <div :class="['message-bubble', msg.role]">
          <div class="message-role">{{ msg.role === 'user' ? '你' : 'AI' }}</div>
          
          <!-- 渲染解析后的HTML -->
          <div class="message-content" v-html="msg.htmlContent"></div>
          
          <!-- 显示思考内容 -->
          <div v-if="msg.reasoning && showReasoning" class="reasoning-content">
            <i class="fas fa-lightbulb"></i> 思考过程: {{ msg.reasoning }}
          </div>
        </div>
      </div>
      
      <div v-if="isLoading" class="message-item">
        <div class="message-bubble ai">
          <div class="message-role">AI</div>
          <div class="message-content" v-html="currentHtmlContent"></div>
          
          <span class="typing-indicator">
            <span>.</span><span>.</span><span>.</span>
          </span>
          
          <!-- 实时显示思考内容 -->
          <div v-if="currentReasoning && showReasoning" class="reasoning-content">
            <i class="fas fa-lightbulb"></i> 思考过程: {{ currentReasoning }}
          </div>
        </div>
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
</template>

<script setup>
import { ref, onUnmounted, computed } from 'vue';
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

// 实时将当前Markdown内容转换为HTML
const currentHtmlContent = computed(() => {
  if (!md || !currentContent.value) return '';
  // 使用Vitepress的MarkdownIt解析，并用DOMPurify净化
  return DOMPurify.sanitize(md.render(currentContent.value));
});

// 清理连接
onUnmounted(() => {
  cancelStream();
});

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

// 发送消息并处理流式响应
const sendMessage = async () => {
  const input = userInput.value.trim();
  if (!input || isLoading.value) return;

  // 解析用户输入的Markdown（如果需要）
  const userHtml = md ? DOMPurify.sanitize(md.render(input)) : input;
  
  // 添加用户消息
  messages.value.push({ 
    role: 'user', 
    content: input,
    htmlContent: userHtml,
    reasoning: ''
  });
  
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
      body: JSON.stringify({ question: input }),
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
.stream-ai-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
  max-width: 80%;
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

.reasoning-content {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #d1d5db;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

.reasoning-content i {
  margin-right: 4px;
  color: #f59e0b;
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
</style>
