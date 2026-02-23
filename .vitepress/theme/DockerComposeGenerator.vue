<template>
  <div class="docker-compose-generator">
    <div class="generator-card">
      <h3>Docker Compose 配置生成器</h3>
      <p class="description">根据你的硬件配置和需求自动生成 Frigate 的 Docker Compose 配置</p>

      <div class="form-section">
        <h4>镜像配置</h4>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" value="cnb" v-model="imageSource" @change="generateConfig" />
            <span>使用国内镜像源加速（推荐）</span>
          </label>
        </div>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" value="official" v-model="imageSource" @change="generateConfig" />
            <span>使用官方镜像</span>
          </label>
        </div>
        <div class="form-group">
          <label>选择设备类型:</label>
          <div class="device-grid">
            <div
              class="device-card"
              :class="{ active: deviceType === 'intel-gpu' }"
              @click="selectDevice('intel-gpu')"
            >
              <div class="device-icon device-icon-intel"></div>
              <div class="device-name">Intel GPU</div>
              <div class="device-desc">Intel 核显/独显</div>
            </div>
            <div
              class="device-card"
              :class="{ active: deviceType === 'apple-silicon' }"
              @click="selectDevice('apple-silicon')"
            >
              <div class="device-icon"><i class="fa-brands fa-apple"></i></div>
              <div class="device-name">Apple Silicon</div>
              <div class="device-desc">Mac M 系列处理器</div>
            </div>
            <div
              class="device-card"
              :class="{ active: deviceType === 'raspberry-pi' }"
              @click="selectDevice('raspberry-pi')"
            >
              <div class="device-icon">🍓</div>
              <div class="device-name">树莓派</div>
              <div class="device-desc">ARM 设备</div>
            </div>
            <div
              class="device-card"
              :class="{ active: imageTag === 'stable-tensorrt' }"
              @click="selectDevice('stable-tensorrt')"
            >
              <div class="device-icon device-icon-nvidia"></div>
              <div class="device-name">NVIDIA GPU</div>
              <div class="device-desc">TensorRT 加速</div>
            </div>
            <div
              class="device-card"
              :class="{ active: imageTag === 'stable-tensorrt-jp6' }"
              @click="selectDevice('stable-tensorrt-jp6')"
            >
              <div class="device-icon device-icon-nvidia"></div>
              <div class="device-name">NVIDIA Jetson</div>
              <div class="device-desc">Jetson 开发板</div>
            </div>
            <div
              class="device-card"
              :class="{ active: imageTag === 'stable-rocm' }"
              @click="selectDevice('stable-rocm')"
            >
              <div class="device-icon device-icon-amd"></div>
              <div class="device-name">AMD GPU</div>
              <div class="device-desc">ROCm 加速</div>
            </div>
            <div
              class="device-card"
              :class="{ active: imageTag === 'stable-rk' }"
              @click="selectDevice('stable-rk')"
            >
              <div class="device-icon device-icon-rockchip"></div>
              <div class="device-name">RockChip</div>
              <div class="device-desc">瑞芯微开发板</div>
            </div>
            <div
              class="device-card"
              :class="{ active: imageTag === 'stable-synaptics' }"
              @click="selectDevice('stable-synaptics')"
            >
              <div class="device-icon device-icon-synaptics"></div>
              <div class="device-name">昇锐</div>
              <div class="device-desc">Synaptics NPU</div>
            </div>
                        <div
              class="device-card"
              :class="{ active: deviceType === 'stable' }"
              @click="selectDevice('stable')"
            >
              <div class="device-icon">💻</div>
              <div class="device-name">标准 x86_64</div>
              <div class="device-desc">通用 PC/服务器</div>
            </div>
          </div>
          <p class="help-text" v-if="deviceType === 'stable-tensorrt'">使用 NVIDIA GPU 时会自动配置 GPU 部署参数（deploy.resources）。</p>
          <p class="help-text" v-else-if="deviceType === 'stable-tensorrt-jp6'">NVIDIA Jetson 设备会自动配置 runtime: nvidia。</p>
          <p class="help-text" v-else-if="deviceType === 'stable-rocm'">AMD GPU 会自动配置 LIBVA_DRIVER_NAME 环境变量和 /dev/dri 设备映射。</p>
          <p class="help-text" v-else-if="deviceType === 'stable-rk'">瑞芯微设备会自动配置 /dev/dri 设备映射。</p>
          <p class="help-text" v-else-if="deviceType === 'stable-synaptics'">昇锐设备会自动配置 /dev/synap 和视频设备。</p>
          <p class="help-text" v-else-if="deviceType === 'apple-silicon'">⚠️ Apple Silicon（M 系列处理器）需要额外安装使用<a href="../configuration/object_detectors#apple-silicon-detector" target="_blank">外部检测器</a>。</p>
          <p class="help-text" v-else-if="deviceType === 'raspberry-pi'">树莓派会自动配置 Video11 设备并使用 arm64 镜像。</p>
          <p class="help-text" v-else-if="deviceType === 'intel-gpu'">Intel GPU 会自动配置 /dev/dri 设备映射。</p>
        </div>

        <!-- NVIDIA GPU 专用配置 -->
        <div v-if="deviceType === 'stable-tensorrt'" class="nvidia-config">
          <div class="form-group">
            <label for="gpuCount">GPU 数量:</label>
            <input
              id="gpuCount"
              v-model="nvidiaGpuCount"
              type="text"
              placeholder="1"
              @input="handleGpuCountInput"
            />
          </div>
          <div class="form-group">
            <label for="gpuDeviceId">GPU 设备 ID (多个 GPU 时使用，逗号分隔):</label>
            <input
              id="gpuDeviceId"
              v-model="nvidiaGpuDeviceId"
              type="text"
              placeholder="0"
              @input="generateConfig"
            />
            <p class="help-text">如果只有一个 GPU，留空即可。多个 GPU 时输入如: 0,1,2</p>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h4>存储路径配置</h4>
        <div class="form-group">
          <label for="configPath">配置文件/数据库/模型缓存目录：</label>
          <input
            id="configPath"
            v-model="configPath"
            type="text"
            placeholder="/home/frigate/config"
            @input="generateConfig"
          />
        </div>
        <div class="form-group">
          <label for="mediaPath">录制文件目录：</label>
          <input
            id="mediaPath"
            v-model="mediaPath"
            type="text"
            placeholder="/home/frigate/video"
            @input="generateConfig"
          />
        </div>
      </div>

      <div class="form-section">
        <h4>硬件加速配置</h4>
        <p class="help-text" v-if="deviceType !== 'stable'">
          部分选项已根据设备类型自动配置
        </p>
        <div class="checkbox-grid">
          <div class="checkbox-group">
            <label class="checkbox-label" :class="{ disabled: deviceType === 'apple-silicon' }">
              <input type="checkbox" v-model="hardware.usbCoral" @change="generateConfig" :disabled="deviceType === 'apple-silicon'" />
              <span>USB Coral (TPU)</span>
            </label>
          </div>
          <div class="checkbox-group">
            <label class="checkbox-label" :class="{ disabled: deviceType === 'apple-silicon' }">
              <input type="checkbox" v-model="hardware.pcieCoral" @change="generateConfig" :disabled="deviceType === 'apple-silicon'" />
              <span>PCIe Coral (TPU)</span>
            </label>
          </div>
          <div class="checkbox-group">
            <label class="checkbox-label" :class="{ disabled: deviceType === 'stable-tensorrt-jp6' || deviceType === 'apple-silicon' }">
              <input type="checkbox" v-model="hardware.gpu" @change="generateConfig" :disabled="deviceType === 'stable-tensorrt-jp6' || deviceType === 'apple-silicon'" />
              <span>GPU 加速（/dev/dri）</span>
            </label>
          </div>
          <div class="checkbox-group">
            <label class="checkbox-label" :class="{ disabled: (deviceType !== 'intel-gpu' && deviceType !== 'stable' && deviceType !== 'stable-tensorrt') || deviceType === 'stable-tensorrt-jp6' || deviceType === 'apple-silicon' }">
              <input type="checkbox" v-model="hardware.intelNpu" @change="generateConfig" :disabled="(deviceType !== 'intel-gpu' && deviceType !== 'stable' && deviceType !== 'stable-tensorrt') || deviceType === 'stable-tensorrt-jp6' || deviceType === 'apple-silicon'" />
              <span>Intel NPU (/dev/accel)</span>
            </label>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h4>端口配置</h4>
        <div class="checkbox-group">
          <TkPopover content="⚠️ 警告！该端口应仅用于内网环境，并且配置防火墙禁止外部访问。如果你不知道如何配置防护，请不要开启该端口！" placement="top">
            <template #reference>
              <label class="checkbox-label">
                <input type="checkbox" v-model="ports.enable5000" @change="generateConfig" />
                <span>启用 5000 端口（无鉴权访问）</span>
                <span class="warning">
                  <button>⚠️ 谨慎暴露</button>
                </span>
              </label>
            </template>
          </TkPopover>
        </div>
      </div>

      <div class="form-section">
        <h4>其他配置</h4>
        <div class="form-grid">
          <div class="form-group">
            <TkPopover content="能够在配置文件中使用 {FRIGATE_RTSP_PASSWORD} 变量来引用该密码，避免密码泄露" placement="top">
              <template #reference>
                <label for="rtspPassword">RTSP 密码：</label> 
                <input
                  id="rtspPassword"
                  v-model="rtspPassword"
                  type="text"
                  placeholder="password"
                  @input="generateConfig"
                />
              </template>
            </TkPopover>
          </div>
          <div class="form-group">
            <label for="timezone">时区:</label>
            <input
              id="timezone"
              v-model="timezone"
              type="text"
              :placeholder="Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai'"
              @input="generateConfig"
            />
          </div>
          <div class="form-group">
            <TkPopover placement="top">
              <template #default>
                <div class="vp-doc">SHM大小，请参阅 <a href='installation#calculating-required-shm-size'>计算所需的共享内存大小（shm-size）</a>的计算结果来配置</div>
              </template>
              <template #reference>
                <label for="shmSize">共享内存（SHM）:</label>
                <input
                  ref="shmSizeInput"
                  id="shmSize"
                  v-model="shmSize"
                  @input="handleShmSizeInput"
                  type="text"
                  placeholder="512mb"
                  :class="{ error: shmSizeError }"
                />
              </template>
            </TkPopover>
          </div>
        </div>
      </div>

      <div class="result-section">
        <div class="result-header">
          <h4>生成的配置</h4>
          <button class="copy-btn" @click="copyConfig">
            <span v-if="!copied">复制配置</span>
            <span v-else>已复制!</span>
          </button>
        </div>
        <!-- 直接使用 TkCodeBlockToggle 组件 -->
        <div class="vp-doc">
          <div class="language-yaml">
            <button class="copy" title="复制代码"></button>
            <span class="lang">yaml</span>
            <div v-html="highlightedCode"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 移除 Shiki 生成的背景色，让 VitePress 主题样式接管 */
.result-section :deep(.shiki) {
  background: transparent !important;
}
.result-section :deep(.shiki) > code {
  background: transparent !important;
}
</style>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { createHighlighter } from 'shiki'
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight
} from '@shikijs/transformers'
import { TkPopover } from "vitepress-theme-teek";


// 创建与 VitePress 相同的高亮器
let highlighter: any = null
let highlighterPromise: Promise<any> | null = null

async function getHighlighter() {
  if (!highlighter) {
    if (!highlighterPromise) {
      highlighterPromise = createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: ['yaml']
      })
    }
    highlighter = await highlighterPromise
  }
  return highlighter
}

const configPath = ref<string>('/home/frigate/config')
const mediaPath = ref<string>('/home/frigate/video')
const rtspPassword = ref<string>('password')
const timezone = ref<string>('')
const shmSize = ref<string>('512mb')
const imageSource = ref<string>('cnb')
const imageTag = ref<string>('stable')
const deviceType = ref<string>('stable')

const hardware = ref({
  usbCoral: false,
  pcieCoral: false,
  raspberryPi: false,
  gpu: false,
  intelNpu: false
})

const ports = ref({
  enable5000: false
})

// NVIDIA GPU 专用配置
const nvidiaGpuCount = ref<string>('1')
const nvidiaGpuDeviceId = ref<string>('')

const copied = ref<boolean>(false)

const shmSizeError = ref<boolean>(false)
const shmSizeInput = ref<HTMLInputElement | null>(null)

const generatedConfig = ref<string>('')
const highlightedCode = ref<string>('')

// 使用与 VitePress 相同的代码高亮配置
async function highlightYamlCode(code: string) {
  try {
    const h = await getHighlighter()
    const html = h.codeToHtml(code, {
      lang: 'yaml',
      transformers: [
        transformerMetaHighlight(),
        transformerNotationDiff(),
        transformerNotationFocus({
          classActiveLine: 'has-focus',
          classActivePre: 'has-focused-lines'
        }),
        transformerNotationHighlight(),
        transformerNotationErrorLevel(),
        {
          name: 'vitepress:add-dir',
          pre(node: any) {
            node.properties.dir = 'ltr'
          }
        },
        {
          name: 'vitepress:remove-inline-color',
          // 移除内联 color 样式，保留 CSS 变量
          span(node: any) {
            const style = node.properties.style
            if (!style) return
            // 移除 color 属性，只保留 --shiki-light 和 --shiki-dark
            const newStyle = style
              .replace(/color:[^;]+;?\s*/g, '')
              .replace(/background-color:[^;]+;?\s*/g, '')
              .replace(/--shiki-light-bg:[^;]+;?\s*/g, '')
              .replace(/--shiki-dark-bg:[^;]+;?\s*/g, '')
            if (newStyle.trim()) {
              node.properties.style = newStyle.trim()
            } else {
              delete node.properties.style
            }
          }
        }
      ],
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      }
    })
    // 添加 vp-code 类，保留所有原有的类
    highlightedCode.value = html.replace(/<pre class="([^"]*)"/, '<pre class="$1 vp-code"')
  } catch (err) {
    console.error('代码高亮失败:', err)
    highlightedCode.value = ''
  }
}

function generateConfig() {
  const devices: string[] = []
  const volumes: string[] = []

  // 如果选择了 rockchip 镜像，自动启用 /dev/dri
  if (imageTag.value === 'stable-rk') {
    hardware.value.gpu = true
    if (!hardware.value.gpu) {
      gpuDevicePath.value = '/dev/dri/renderD128'
    }
  }

  if (hardware.value.usbCoral) {
    devices.push('      - /dev/bus/usb:/dev/bus/usb # 用于USB Coral，其他版本需要修改')
  }

  if (hardware.value.pcieCoral) {
    devices.push('      - /dev/apex_0:/dev/apex_0 # 用于PCIe Coral，请按照此处的驱动说明操作 https://github.com/jnicolson/gasket-builder')
  }

  if (hardware.value.raspberryPi) {
    devices.push('      - /dev/video11:/dev/video11 # 用于树莓派4B')
  }

  // 对于非 tensorrt 镜像，才添加 GPU 设备映射
  if (hardware.value.gpu && imageTag.value !== 'stable-tensorrt') {
    devices.push('      - /dev/dri:/dev/dri # 用于GPU硬件加速')
  }

  if (hardware.value.intelNpu) {
    devices.push('      - /dev/accel:/dev/accel # Intel NPU')
  }

  // RockChip 专用设备配置
  if (imageTag.value === 'stable-rk') {
    devices.push('      - /dev/dma_heap # RockChip DMA 堆')
    devices.push('      - /dev/rga # RockChip RGA')
    devices.push('      - /dev/mpp_service # RockChip MPP 服务')
    volumes.push('      - /sys/:/sys/:ro # RockChip 系统信息')
  }

  // Synaptics 专用设备配置
  if (imageTag.value === 'stable-synaptics') {
    devices.push('      - /dev/synap # Synaptics NPU')
    devices.push('      - /dev/video0 # 视频设备 0')
    devices.push('      - /dev/video1 # 视频设备 1')
  }

  const devicesSection = devices.length > 0
    ? `    devices:\n${devices.join('\n')}\n`
    : ''

  // NVIDIA GPU 部署配置
  let deployConfig = ''
  let runtimeConfig = ''
  let extraHostsConfig = ''
  let securityOptConfig = ''
  if (imageTag.value === 'stable-tensorrt') {
    const hasDeviceId = nvidiaGpuDeviceId.value && nvidiaGpuDeviceId.value.trim() !== ''
    const gpuCountValue = nvidiaGpuCount.value || '1'
    deployConfig = `    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
${hasDeviceId ? `              device_ids: ['${nvidiaGpuDeviceId.value.replace(/,/g, "', '")}'] # 仅在使用多个 GPU 时需要\n` : ''}              count: ${gpuCountValue} # GPU 数量
              capabilities: [gpu]
`
  } else if (imageTag.value === 'stable-tensorrt-jp6') {
    // Jetson 需要使用 runtime: nvidia
    runtimeConfig = `    runtime: nvidia
`
  }

  // Apple Silicon 需要配置 extra_hosts
  if (deviceType.value === 'apple-silicon') {
    extraHostsConfig = `    extra_hosts:
      # 此项配置至关重要
      # 允许 Frigate 通过 Apple Silicon Detector 访问苹果芯片的 NPU
      - "host.docker.internal:host-gateway" # 访问 NPU 检测器的必要配置
`
  }

  // RockChip 需要配置 security_opt
  if (imageTag.value === 'stable-rk') {
    securityOptConfig = `    security_opt:
      - apparmor=unconfined
      - systempaths=unconfined
`
  }

  const portsConfig = ports.value.enable5000
    ? '- "5000:5000" # 用于内部无鉴权验证的访问。谨慎暴露。\n      '
    : ''

  // 环境变量配置
  let envConfig = ''
  if (imageSource.value === 'cnb') {
    envConfig = `      HF_ENDPOINT: "https://huggingface.mirror.frigate-cn.video" # 由我们提供的Huggingface国内镜像源，提供Frigate需要用到的部分模型加速下载 [!code highlight]
      GITHUB_ENDPOINT: "https://github.mirror.frigate-cn.video" # 由我们提供的GitHub国内镜像源，提供Frigate需要用到的部分模型加速下载 [!code highlight]`
  }

  // AMD GPU 需要额外的环境变量
  if (imageTag.value === 'stable-rocm') {
    envConfig += envConfig ? '\n' : ''
    envConfig += `      LIBVA_DRIVER_NAME: "radeonsi" # AMD GPU 视频加速驱动`
  }

  const imageAddress = imageSource.value === 'cnb'
    ? `docker.cnb.cool/frigate-cn/frigate:${imageTag.value} # 此处为国内镜像源地址，原地址为 ghcr.io/blakeblackshear/frigate:${imageTag.value}`
    : `ghcr.io/blakeblackshear/frigate:${imageTag.value}`

  // shm_size 如果为空，使用默认值 512mb
  const shmSizeValue = shmSize.value || '512mb'
  // timezone 如果为空，使用浏览器时区或默认值
  const timezoneValue = timezone.value || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai'
  // 存储路径如果为空，使用默认值
  const configPathValue = configPath.value || '/home/frigate/config'
  const mediaPathValue = mediaPath.value || '/home/frigate/video'

  generatedConfig.value = `services:
  frigate:
    container_name: frigate
    privileged: true # 使用特权模式
    restart: unless-stopped
    stop_grace_period: 30s # 为各服务提供足够的关闭时间
    image: ${imageAddress}
    shm_size: "${shmSizeValue}" # 根据上述计算结果为你的摄像头更新此值
${runtimeConfig}${devicesSection}${deployConfig}${extraHostsConfig}${securityOptConfig}    volumes:
      - /etc/localtime:/etc/localtime:ro
      - ${configPathValue}:/config # "${configPathValue}"为你宿主机上希望存放配置文件的路径
      - ${mediaPathValue}:/media/frigate # "${mediaPathValue}"为你宿主机上希望存放监控录像文件的路径
      - type: tmpfs # 必选：将使用1GB内存作为缓存文件
        target: /tmp/cache
        tmpfs:
          size: 1000000000
${volumes.length > 0 ? volumes.join('\n') + '\n' : ''}    ports:
      - "8971:8971"
      ${portsConfig}- "8554:8554" # RTSP视频流
      - "8555:8555/tcp" # 基于TCP的WebRTC
      - "8555:8555/udp" # 基于UDP的WebRTC
    environment:
      FRIGATE_RTSP_PASSWORD: "${rtspPassword.value}" # rtsp的密码，请修改"password"为你期望的密码
      TZ: "${timezoneValue}" # 设置为中国+8时区 [!code highlight]
${envConfig}`
}

function onImageTagChange() {
  // 如果选择了 rockchip 镜像，自动启用 /dev/dri
  if (imageTag.value === 'stable-rk') {
    hardware.value.gpu = true
  }
  generateConfig()
}

function selectDevice(tag: string) {
  deviceType.value = tag

  // 根据设备类型自动配置硬件选项
  // 先重置所有选项
  hardware.value.gpu = false
  hardware.value.raspberryPi = false
  hardware.value.usbCoral = false
  hardware.value.pcieCoral = false
  hardware.value.intelNpu = false

  switch (tag) {
    case 'apple-silicon':
      // Apple Silicon 使用 arm64 镜像，不勾选任何硬件选项
      imageTag.value = 'stable-standard-arm64'
      break
    case 'raspberry-pi':
      // 树莓派使用 arm64 镜像，自动勾选 Video11 设备
      imageTag.value = 'stable-standard-arm64'
      hardware.value.raspberryPi = true
      break
    case 'intel-gpu':
      // Intel GPU 使用标准镜像，自动勾选 GPU 加速
      imageTag.value = 'stable'
      hardware.value.gpu = true
      break
    case 'stable-tensorrt':
    case 'stable-tensorrt-jp6':
      // NVIDIA GPU 不需要在 devices 中添加配置
      imageTag.value = tag
      break
    case 'stable-rocm':
    case 'stable-rk':
      // AMD GPU 和 RockChip 需要启用 GPU 加速
      imageTag.value = tag
      hardware.value.gpu = true
      break
    case 'stable-synaptics':
      // Synaptics 使用 stable-synaptics 镜像
      imageTag.value = tag
      break
    case 'stable':
      // 标准版本
      imageTag.value = 'stable'
      break
  }

  generateConfig()
}

async function copyConfig() {
  try {
    await navigator.clipboard.writeText(generatedConfig.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 校验并处理 SHM 输入，只允许数字和容量单位（mb, gb 等）
function handleShmSizeInput(event: Event) {
  const target = event.target as HTMLInputElement
  let value = target.value

  // 只保留数字和容量单位（b, k, m, g, t）及其大写形式
  const filtered = value.replace(/[^0-9bkmgBKMG]/g, '')

  // 验证格式：数字开头，后跟1-2个容量单位字母
  const validPattern = /^\d+[bkmgBKMG]{1,2}$/
  // 检查输入过程中是否有非法字符（过滤前后的长度不同）
  const hasInvalidChars = filtered.length < value.length

  if (filtered === '') {
    // 空值，清空 shmSize，清除错误状态
    shmSize.value = ''
    shmSizeError.value = false
  } else if (validPattern.test(filtered) && !hasInvalidChars) {
    // 格式有效且没有非法字符，更新 shmSize，清除错误状态
    shmSize.value = filtered
    shmSizeError.value = false
  } else {
    // 有非法字符或格式无效，设置错误状态并还原输入
    shmSizeError.value = true
    // 还原输入框的值为过滤后的值
    target.value = filtered
    // 同步更新 shmSize
    shmSize.value = filtered
    return
  }

  generateConfig()
}

// 处理 GPU 数量输入，只允许输入数字
function handleGpuCountInput(event: Event) {
  const target = event.target as HTMLInputElement
  let value = target.value

  // 只保留数字
  const filtered = value.replace(/[^0-9]/g, '')

  // 如果过滤后的值有效（至少有一个数字）
  if (filtered === '') {
    nvidiaGpuCount.value = ''
  } else {
    // 确保至少为 1
    const numValue = parseInt(filtered, 10)
    nvidiaGpuCount.value = numValue >= 1 ? numValue.toString() : '1'
  }

  generateConfig()
}

// 初始化生成配置
generateConfig()

// 初始化生成配置
generateConfig()

// 监听配置变化并更新高亮
watch(generatedConfig, async () => {
  await highlightYamlCode(generatedConfig.value)
})

onMounted(async () => {
  await highlightYamlCode(generatedConfig.value)
})
</script>

<style scoped>
.docker-compose-generator {
  margin: 2rem 0;
}

.generator-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 2rem;
  max-width: 900px;
}

.generator-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: var(--vp-c-text-1);
}

.description {
  margin: 0 0 1.5rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.form-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-border);
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.form-section h4 {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-1);
  font-size: 1.1rem;
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

.form-group input[type="text"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.form-group input[type="text"].error {
  border-color: #e74c3c;
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.form-group .select-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  transition: border-color 0.2s;
  cursor: pointer;
}

.form-group .select-input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.device-card {
  padding: 1rem;
  border: 2px solid var(--vp-c-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  background: var(--vp-c-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.device-card:hover {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-bg-soft);
  transform: translateY(-2px);
}

.device-card.active {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-brand-soft);
}

.device-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  height: 40px;
  width: auto;
  min-width: 40px;
  max-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-icon-nvidia {
  background-image: url('/assets/nvidia.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  font-size: 0;
}

.device-icon-rockchip {
  background-image: url('/assets/rockchip.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  font-size: 0;
}

.device-icon-intel {
  background-image: url('/assets/intel-header-logo-homepage.svg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  font-size: 0;
}

.device-icon-synaptics {
  background-image: url('/assets/synaptics.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  font-size: 0;
}

.device-icon-amd {
  background-image: url('/assets/AMD_E_Wh_RGB.png');
  background-size: 400% 100%;
  background-repeat: no-repeat;
  background-position: right center;
  font-size: 0;
}

.device-name {
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 0.25rem;
  font-size: 0.95rem;
}

.device-desc {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  line-height: 1.3;
}

.form-group .help-text {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.checkbox-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-label.disabled:hover {
  background: transparent;
}

.checkbox-label.disabled input[type="checkbox"] {
  cursor: not-allowed;
}

.nvidia-config {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
  border-left: 3px solid var(--vp-c-brand);
}

.nvidia-config .form-group {
  margin-bottom: 1rem;
}

.nvidia-config .form-group:last-child {
  margin-bottom: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-grid .form-group {
  margin-bottom: 0;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.checkbox-grid .checkbox-group {
  margin-bottom: 0;
}

.checkbox-group {
  margin-bottom: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.checkbox-label:hover {
  background: var(--vp-c-bg);
}

.checkbox-label input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
}

.checkbox-label span {
  color: var(--vp-c-text-1);
}

.checkbox-label .warning {
  margin-left: auto;
  color: #e67e22;
  font-size: 0.85rem;
}

.radio-group {
  margin-bottom: 0.75rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.radio-label:hover {
  background: var(--vp-c-bg);
}

.radio-label input[type="radio"] {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
}

.radio-label span {
  color: var(--vp-c-text-1);
}

.result-section {
  margin-top: 2rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h4 {
  margin: 0;
  color: var(--vp-c-text-1);
}

.copy-btn {
  padding: 0.5rem 1rem;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.copy-btn:hover {
  background: var(--vp-c-brand-dark);
}

/* 不定义任何代码块样式，完全依赖 VitePress 和 Teek 主题 */
</style>
