---
id: network_requirements
title: 网络要求
---

# 网络要求

Frigate 设计为本地运行，核心功能不需要持久的互联网连接。但某些功能在初始设置或持续运行中需要互联网访问。本页面描述哪些功能连接互联网、何时连接以及如何控制。

## Frigate 如何使用互联网 {#how-frigate-uses-the-internet}

Frigate 的互联网使用分为三类：

1. **一次性模型下载**：首次启用某个功能时下载 ML 模型，然后缓存在本地。后续启动无需互联网。
2. **可选的云服务**：Frigate+ 和生成式 AI 等功能仅在显式配置时才连接外部 API。
3. **构建时依赖**：在构建过程中打包到 Docker 镜像中的组件。这些在运行时无需互联网。

:::tip

初始设置后，只要所有所需模型已下载且未启用云依赖功能，Frigate 可以完全离线运行。

:::

## 一次性模型下载 {#one-time-model-downloads}

以下模型在首次启用其关联功能时自动下载。一旦缓存在 `/config/model_cache/` 中，不再需要互联网。

| 功能 | 下载的模型 | 来源 |
| --- | --- | --- |
| [语义搜索](/configuration/semantic_search) | Jina CLIP v1 或 v2 (ONNX) + 分词器 | HuggingFace |
| [人脸识别](/configuration/face_recognition) | FaceNet、ArcFace、人脸检测模型 | GitHub |
| [车牌识别](/configuration/license_plate_recognition) | PaddleOCR + YOLOv9 车牌检测器 | GitHub |
| [鸟类分类](/configuration/bird_classification) | MobileNetV2 鸟类模型 + 标签映射 | GitHub |
| [自定义分类](/configuration/custom_classification/state_classification)（训练） | MobileNetV2 ImageNet 基础权重 | Google 存储 |
| [音频转写](/configuration/advanced/system) | Whisper 或 Sherpa-ONNX 流媒体模型 | HuggingFace / OpenAI |

### 硬件特定检测器模型 {#hardware-specific-detector-models}

如果你使用以下硬件检测器之一且未提供自己的模型文件，将在首次启动时下载默认模型：

| 检测器 | 下载的模型 | 来源 |
| --- | --- | --- |
| [Rockchip RKNN](/configuration/object_detectors#rockchip-platform) | RKNN 检测模型 | GitHub |
| [Hailo 8 / 8L](/configuration/object_detectors#hailo-8) | YOLOv6n (.hef) | Hailo Model Zoo (AWS S3) |
| [AXERA AXEngine](/configuration/object_detectors) | 检测模型 | HuggingFace |

:::note

默认的 CPU、EdgeTPU 和 OpenVINO 目标检测模型已打包到 Docker 镜像中，运行时无需任何下载。

:::

### 阻止模型下载 {#preventing-model-downloads}

如果你已下载所有所需模型并希望阻止 Frigate 尝试任何出站连接，设置以下环境变量：

```yaml
environment:
  HF_HUB_OFFLINE: "1"
  TRANSFORMERS_OFFLINE: "1"
```

:::warning

在 `/config/model_cache/` 中没有已缓存的正确模型文件的情况下设置这些变量将导致失败。仅在成功完成带互联网访问的初始设置后使用它们。

:::

### 镜像支持 {#mirror-support}

如果你的 Frigate 实例有受限的互联网访问，可以使用环境变量将模型下载指向内部镜像：

| 环境变量 | 默认值 | 使用者 |
| --- | --- | --- |
| `HF_ENDPOINT` | `https://huggingface.co` | 语义搜索、Sherpa-ONNX、AXEngine 模型 |
| `GITHUB_ENDPOINT` | `https://github.com` | 人脸识别、LPR、RKNN 模型 |
| `GITHUB_RAW_ENDPOINT` | `https://raw.githubusercontent.com` | 鸟类分类 |
| `TF_KERAS_MOBILENET_V2_WEIGHTS_URL` | Google 存储（Keras 默认） | 自定义分类训练 |

> **中国大陆用户**：我们提供了国内下载加速镜像，详见[通过 Docker 安装](/frigate/installation.md#docker)教程中的 `environment` 配置。

## 可选的云服务 {#optional-cloud-services}

以下功能在正常操作期间连接到外部服务，活动时需要互联网。

### Frigate+

配置 Frigate+ API 密钥时，Frigate 与 `https://api.frigate.video` 通信以下载模型、上传快照等。移除 API 密钥以禁用。

详见 [Frigate+](/integrations/plus)。

### 生成式 AI {#generative-ai}

| 提供商 | 是否需要互联网 |
| --- | --- |
| OpenAI | 需要 |
| Google Gemini | 需要 |
| Azure OpenAI | 需要 |
| Ollama | 通常本地，可为远程 |
| llama.cpp | 不需要 |

### 版本检查 {#version-check}

启动时查询 `https://api.github.com`。可禁用：

```yaml
telemetry:
  version_check: false
```

### 推送通知 {#push-notifications}

需要 Frigate 服务器到浏览器厂商推送服务的互联网访问。

### MQTT

如果配置了 MQTT 代理，通常为局域网连接；云托管 MQTT 需要互联网。

## 不需要互联网的功能 {#what-does-not-require-internet}

- **目标检测**：CPU、EdgeTPU、OpenVINO 模型已打包。
- **录制和回放**：全部本地。
- **实时流**：局域网内拉流，MSE 和 HLS 无需外部连接。
- **网页界面**：完全自包含。
- **自定义分类推理**：训练后完全本地。
- **音频检测**：YAMNet 模型已打包。

## 离线运行 Frigate {#running-frigate-offline}

1. **预下载模型**：在线启动一次，模型缓存到 `/config/model_cache/`。
2. **禁用版本检查**：`telemetry.version_check: false`。
3. **阻止出站请求**：`HF_HUB_OFFLINE=1`、`TRANSFORMERS_OFFLINE=1`。
4. **避免云功能**：不配置 Frigate+、云 AI、云 MQTT。
5. **使用本地镜像**：设置镜像环境变量。

完成这些步骤后，Frigate 将无出站互联网连接运行。
