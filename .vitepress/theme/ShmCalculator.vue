<template>
  <div class="shm-calculator">
    <div class="calculator-card">
      <h3>SHM 计算器</h3>
      <p class="description">根据摄像头分辨率和数量计算所需的共享内存 (SHM)</p>

      <div class="form-group">
        <label for="width">宽度 (Width):</label>
        <input
          id="width"
          v-model.number="width"
          type="number"
          min="1"
          placeholder="例如: 1280"
          @input="calculate"
        />
      </div>

      <div class="form-group">
        <label for="height">高度 (Height):</label>
        <input
          id="height"
          v-model.number="height"
          type="number"
          min="1"
          placeholder="例如: 720"
          @input="calculate"
        />
      </div>

      <div class="form-group">
        <label for="cameraCount">摄像头数量:</label>
        <input
          id="cameraCount"
          v-model.number="cameraCount"
          type="number"
          min="1"
          placeholder="例如: 8"
          @input="calculate"
        />
      </div>

      <div class="result-section">
        <h4>计算结果</h4>
        <div class="result-value">
          <span class="result-number">{{ result }}</span>
        </div>
        <div class="formula-display">
          <p><strong>单摄像头:</strong> {{ singleCameraShm }}</p>
          <p><strong>公式:</strong> (width × height × 1.5 × 20 + 270480) ÷ 1048576</p>
          <p v-if="cameraCount > 1"><strong>总计 ({{ cameraCount }} 个摄像头):</strong> {{ totalShm }}</p>
          <p><strong>含日志:</strong> + 40MB</p>
        </div>
      </div>

      <div class="presets">
        <h4>常用预设</h4>
        <div class="preset-buttons">
          <button @click="applyPreset(1280, 720, 1)">1280x720 × 1</button>
          <button @click="applyPreset(1280, 720, 4)">1280x720 × 4</button>
          <button @click="applyPreset(1280, 720, 8)">1280x720 × 8</button>
          <button @click="applyPreset(1920, 1080, 1)">1920x1080 × 1</button>
          <button @click="applyPreset(1920, 1080, 4)">1920x1080 × 4</button>
          <button @click="applyPreset(3840, 2160, 1)">4K × 1</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const width = ref<number>(1280)
const height = ref<number>(720)
const cameraCount = ref<number>(1)

const result = ref<string>('26.32MB')

const singleCameraShm = ref<string>('26.32MB')
const totalShm = ref<string>('26.32MB')

function calculate() {
  if (!width.value || !height.value || !cameraCount.value) {
    result.value = '请输入有效值'
    singleCameraShm.value = '-'
    totalShm.value = '-'
    return
  }

  // 单摄像头基础 SHM 计算 (不含日志)
  // 公式: (width * height * 1.5 * 20 + 270480) / 1048576
  const singleCameraBase = (width.value * height.value * 1.5 * 20 + 270480) / 1048576
  singleCameraShm.value = `${singleCameraBase.toFixed(2)}MB`

  // 总 SHM 计算 (多摄像头，含日志)
  const totalBase = singleCameraBase * cameraCount.value
  const finalResult = totalBase + 40 // 默认包含日志 +40MB

  totalShm.value = `${(totalBase + 40).toFixed(2)}MB`

  // 格式化结果
  if (finalResult < 1) {
    result.value = `${(finalResult * 1024).toFixed(2)}KB`
  } else if (finalResult >= 1024) {
    result.value = `${(finalResult / 1024).toFixed(2)}GB`
  } else {
    result.value = `${finalResult.toFixed(2)}MB`
  }
}

function applyPreset(w: number, h: number, count: number) {
  width.value = w
  height.value = h
  cameraCount.value = count
  calculate()
}

// 初始化计算
calculate()
</script>

<style scoped>
.shm-calculator {
  margin: 2rem 0;
}

.calculator-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
}

.calculator-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: var(--vp-c-text-1);
}

.description {
  margin: 0 0 1.5rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.form-group input[type="number"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input[type="number"]:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.checkbox-group {
  margin-top: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
}

.result-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
}

.result-section h4 {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-1);
}

.result-value {
  text-align: center;
  padding: 1rem;
  background: var(--vp-c-brand);
  border-radius: 6px;
  margin-bottom: 1rem;
}

.result-number {
  font-size: 2rem;
  font-weight: bold;
  color: white;
}

.formula-display {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.formula-display p {
  margin: 0.25rem 0;
}

.formula-display strong {
  color: var(--vp-c-text-1);
}

.presets {
  margin-top: 1.5rem;
}

.presets h4 {
  margin: 0 0 0.75rem 0;
  color: var(--vp-c-text-1);
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preset-buttons button {
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.preset-buttons button:hover {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}
</style>
