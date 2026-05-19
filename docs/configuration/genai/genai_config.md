---
id: genai_config
title: 配置生成式 AI
---

## 配置

可以在全局配置中设置生成式 AI 提供商，启用后即可使用生成式 AI 功能。目前有 4 种原生提供商可与 Frigate 集成。支持 OpenAI 标准 API 的其他提供商也可使用，请参阅下方的 OpenAI 兼容部分。

要使用生成式 AI，你必须在 Frigate 配置的全局层级定义一个提供商。如果你选择的提供商需要 API 密钥，可以直接将其粘贴在配置中，或存储在以 `FRIGATE_` 为前缀的环境变量中。

## 本地提供商

本地提供商运行在你自己的硬件上，所有数据处理都在本地完成。这些提供商需要 GPU 或专用硬件以获得最佳性能。

:::warning

不建议在 CPU 上运行生成式 AI 模型，因为高推理延迟会使生成式 AI 变得不实用。

:::

### 推荐本地模型

你必须为 Frigate 使用具备视觉能力的模型。以下是推荐的本地部署模型：

| 模型          | 说明                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qwen3-vl`    | 强大的视觉和情境理解能力，增强了对较小目标和目标交互的识别能力。                                                                                         |
| `qwen3.5`     | 强大的情境理解能力，但缺少 qwen3-vl 的 DeepStack，导致在识别人手中物体等小细节方面表现较差。                                                            |
| `gemma4`      | 强大的情境理解能力，但有时会使用更模糊的词汇如"互动"而非具体的动作描述。                                                                                  |
| `Intern3.5VL` | 速度相对较快，具有良好的视觉理解能力                                                                                                                   |
| `gemma3`      | 推理速度较慢，但具有良好的视觉和时序理解能力                                                                                                           |

:::info

每个模型都提供多种参数规模（3b、4b、8b 等）。参数规模越大，模型处理复杂任务和理解情境的能力越强，但同时需要更多的内存和计算资源。建议你尝试多个模型并进行实验，以找出表现最佳的模型。

:::

:::note

你应至少有 8GB 可用 RAM（或在 GPU 上运行时为 VRAM）来运行 7B 模型，16GB 运行 13B 模型，24GB 运行 33B 模型。

:::

### 模型类型：指令型与思考型

大多数视觉-语言模型都以**指令型（Instruct）**的形式提供，这类模型经过微调，能够遵循指令并针对提示词生成简洁的回复。不过，部分模型（例如某些 Qwen-VL 或 minigpt 变体）同时提供**指令型**与**思考型（Thinking）**两个版本。

- **指令型模型**：**始终推荐**在 Frigate 中使用此类模型。这类模型可生成直接、相关且具备实用价值的描述内容，最契合 Frigate 对目标及事件摘要的使用场景需求。
- **思考型/推理型模型**：这类模型经过微调后，输出内容更偏向自由格式、开放式且带有推测性质，通常不够简洁，也无法生成 Frigate 所需的实用性摘要。因此，Frigate **不建议也不支持**使用思考型模型。

部分模型被标记为**混合型**（可同时处理思考类与指令类任务）。对于这类模型，建议禁用推理/思考模式，具体方式因模型而异（参见你的模型文档）。

**建议**：在 Frigate 配置中使用任何模型时，请务必选择带 `-instruct` 后缀的版本，或官方文档标注为指令型的变体。若存在疑问，可查阅模型供应商的文档或模型库，以确认应使用的正确模型变体。

### llama.cpp {#llamacpp}

[llama.cpp](https://github.com/ggml-org/llama.cpp) 是 LLaMA 的 C++ 实现，提供高性能推理服务器。

强烈建议在配备独立显卡的机器或 Apple Silicon Mac 上托管 llama.cpp 服务器以获得最佳性能。

#### 支持的模型

你必须为 Frigate 使用具备视觉能力的模型。llama.cpp 服务器支持多种 GGUF 格式的视觉模型。

#### 配置

所有 llama.cpp 原生选项都可以通过 `provider_options` 传递，包括 `temperature`、`top_k`、`top_p`、`min_p`、`repeat_penalty`、`repeat_last_n`、`seed`、`grammar` 等。完整参数列表请参阅 [llama.cpp 服务器文档](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)。

```yaml
genai:
  provider: llamacpp
  base_url: http://localhost:8080
  model: your-model-name
  provider_options:
    context_size: 16000 # 告知 Frigate 你的上下文大小，以便发送适当数量的信息
```

### Ollama

[Ollama](https://ollama.com/) 允许你自托管大型语言模型并保持所有内容在本地运行。强烈建议在配备 Nvidia 独立显卡的机器或 Apple Silicon Mac 上托管此服务以获得最佳性能。

大多数 7b 参数的 4-bit 视觉模型都能在 8GB VRAM 中运行。也有可用的 [Docker 容器](https://hub.docker.com/r/ollama/ollama)。

并行请求也有一些注意事项。你需要设置 `OLLAMA_NUM_PARALLEL=1` 并选择适合你硬件和偏好的 `OLLAMA_MAX_QUEUE` 和 `OLLAMA_MAX_LOADED_MODELS` 值。请参阅 [Ollama 文档](https://docs.ollama.com/faq#how-does-ollama-handle-concurrent-requests)。

:::tip

如果你想为 Frigate 和 HomeAssistant 使用同一个模型，该模型需要同时支持视觉能力和工具调用功能。qwen3-VL 在 Ollama 中能够同时支持视觉和工具调用。

:::

注意，Frigate 不会自动下载你在配置中指定的模型。Ollama 会尝试下载该模型，但下载过程可能超过超时时间，因此建议你在 Ollama 服务器或 Docker 容器中提前运行 `ollama pull your_model` 来拉取模型。Frigate 配置中指定的模型必须与你下载的模型标签匹配。

#### 配置

```yaml
genai:
  provider: ollama
  base_url: http://localhost:11434
  model: qwen3-vl:4b
  provider_options: # 其他 Ollama 客户端选项可在此定义
    keep_alive: -1
    options:
      num_ctx: 8192 # 确保上下文大小与使用 Ollama 的其他服务匹配
```

### OpenAI 兼容 {#openai-compatible}

Frigate 支持任何实现了 OpenAI API 标准的提供商。这包括 [vLLM](https://docs.vllm.ai/)、[LocalAI](https://localai.io/) 等自托管解决方案和其他 OpenAI 兼容服务器。

:::tip

对于未在 API 响应中暴露已配置上下文大小的 OpenAI 兼容服务器（如 llama.cpp），你可以在 `provider_options` 中手动指定上下文大小：

```yaml
genai:
  provider: openai
  base_url: http://your-llama-server
  model: your-model-name
  provider_options:
    context_size: 8192 # 指定已配置的上下文大小
```

这确保 Frigate 在生成提示词时使用正确的上下文窗口大小。

:::

#### 配置

```yaml
genai:
  provider: openai
  base_url: http://your-server:port
  api_key: your-api-key # 本地服务器可能不需要
  model: your-model-name
```

要使用其他 OpenAI 兼容 API 端点，请设置 `OPENAI_BASE_URL` 环境变量为你的提供商 API URL。

## 云端提供商

云端提供商运行在远程基础设施上，需要 API 密钥进行认证。这些服务在其服务器上处理所有模型推理。

:::info

云端生成式 AI 提供商需要网络连接来发送图像和提示词进行处理。本地提供商如 llama.cpp 和 Ollama（使用本地模型）不需要网络。详见[网络需求](/frigate/network_requirements#generative-ai)。

:::

### Ollama 云端 {#ollama-cloud}

Ollama 也支持[云端模型](https://ollama.com/cloud)，模型推理在云端完成。你可以通过将 `base_url` 设置为 `https://ollama.com` 并提供 API 密钥来直接连接 Ollama Cloud。或者，你可以在本地运行 Ollama 并使用云端模型名称，让本地实例将请求转发到云端。更多详情请查阅 Ollama 云端模型[文档](https://docs.ollama.com/cloud)。

#### 配置

```yaml
genai:
  provider: ollama
  base_url: http://localhost:11434
  model: cloud-model-name
```

或直接使用 Ollama Cloud：

```yaml
genai:
  provider: ollama
  base_url: https://ollama.com
  model: cloud-model-name
  api_key: your-api-key
```

### Google Gemini

Google Gemini API 提供了[免费套餐](https://ai.google.dev/pricing)，但该套餐的配额限制可能无法满足 Frigate 的常规使用需求。请根据你的部署场景选择合适的计费套餐。

#### 支持的模型

你必须使用支持视觉的模型。当前模型变体可在[其文档](https://ai.google.dev/gemini-api/docs/models/gemini)中找到。

#### 获取 API 密钥

要开始使用 Gemini，你必须首先从 [Google AI Studio](https://aistudio.google.com) 获取 API 密钥。

1. 接受服务条款
2. 从右侧导航栏点击"获取 API 密钥"
3. 点击"在新项目中创建 API 密钥"
4. 复制 API 密钥用于你的配置

#### 配置

```yaml
genai:
  provider: gemini
  api_key: "{FRIGATE_GEMINI_API_KEY}"
  model: gemini-2.5-flash
```

:::note

若需使用其他兼容 Gemini 的 API 端点，可在 `provider_options` 中通过 `base_url` 键配置：

```yaml
genai:
  provider: gemini
  ...
  provider_options:
    base_url: https://...
```

其他 HTTP 选项也可用，请参阅 [python-genai 文档](https://github.com/googleapis/python-genai)。

:::

### OpenAI

OpenAI 没有为其 API 提供免费等级。随着 gpt-4o 的发布，价格已经降低，每次生成应该只需几分钱。

如果你打算使用中国大陆的各个 AI 提供商，他们大部分都兼容 OpenAI API 接口。

:::warning

请注意，如果你的摄像头位于公共领域（例如过道）等会检测过多目标的地方，过多的目标可能会很快耗尽你的资源包。请**务必不要开启**后付费模式！

:::

#### 支持的模型

你必须使用支持视觉的模型。当前模型变体可在[其文档](https://platform.openai.com/docs/models)中找到。

:::note

如果你选择国内兼容 OpenAI API 的大模型提供商，请注意选择支持**图生文**的模型。例如腾讯云的 `hunyuan-vision` 模型。DeepSeek 官方目前未提供其图生文 [`DeepSeek-VL2`](https://github.com/deepseek-ai/DeepSeek-VL2) 模型的 API，但可以在第三方服务商处获取由他们部署的版本。

:::

#### 获取 API 密钥

要开始使用 OpenAI，你必须首先[创建 API 密钥](https://platform.openai.com/api-keys)并[配置计费](https://platform.openai.com/settings/organization/billing/overview)。

#### 配置

```yaml
genai:
  provider: openai
  api_key: "{FRIGATE_OPENAI_API_KEY}"
  model: gpt-4o
```

:::note

要使用兼容 OpenAI API 的其他服务商（例如阿里云和腾讯云等国内云厂商），需要设置**环境变量** `OPENAI_BASE_URL` 为你的服务商的 API 端点。

例如腾讯云请设置为 `https://api.hunyuan.cloud.tencent.com/v1`

:::

:::tip

对于未在 API 响应中暴露已配置上下文大小的 OpenAI 兼容服务器（如 llama.cpp），你可以在 `provider_options` 中手动指定上下文大小：

```yaml
genai:
  provider: openai
  base_url: http://your-llama-server
  model: your-model-name
  provider_options:
    context_size: 8192 # 指定已配置的上下文大小
```

这确保 Frigate 在生成提示词时使用正确的上下文窗口大小。

:::

### Azure OpenAI

微软通过 Azure OpenAI 提供了几种视觉模型。需要订阅。

#### 支持的模型

你必须使用支持视觉的模型。当前模型变体可在[其文档](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models)中找到。

#### 创建资源并获取 API 密钥

要开始使用 Azure OpenAI，你必须首先[创建资源](https://learn.microsoft.com/azure/cognitive-services/openai/how-to/create-resource?pivots=web-portal#create-a-resource)。你需要你的 API 密钥、模型名称和资源 URL，其中必须包含 `api-version` 参数（参见下面的示例）。

#### 配置

```yaml
genai:
  provider: azure_openai
  base_url: https://instance.cognitiveservices.azure.com/openai/responses?api-version=2025-04-01-preview
  model: gpt-5-mini
  api_key: "{FRIGATE_OPENAI_API_KEY}"
```
