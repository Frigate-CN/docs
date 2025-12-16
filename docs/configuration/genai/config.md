---
id: genai
title: 生成式 AI <Badge type="tip" text="0.16.0 和 以上版本" />
---

## 配置

生成式 AI 可以为所有摄像头启用，或仅为特定摄像头启用。即使某个摄像头的生成式 AI 功能已禁用，你仍然可以通过 HTTP API 手动为事件生成描述。目前有 3 种原生提供商可与 Frigate 集成。支持 OpenAI 标准 API 的其他提供商也可使用。请参阅下面的 OpenAI 部分。

要使用生成式 AI，你必须在 Frigate 配置的全局层级定义一个提供商。如果你选择的提供商需要 API 密钥，可以直接将其粘贴在配置中，或存储在环境变量中(以`FRIGATE_`为前缀)。

## Ollama

:::warning

不建议在 CPU 上使用 Ollama，高推理时间会使生成式 AI 变得很不实用。

:::

[Ollama](https://ollama.com/)允许你自托管大型语言模型并保持所有内容在本地运行。它在[llama.cpp](https://github.com/ggerganov/llama.cpp)上提供了一个很好的 API。强烈建议在配备 Nvidia 显卡的机器或 Apple silicon Mac 上托管此服务器以获得最佳性能。

大多数 7b 参数的 4-bit 视觉模型都能在 8GB 显存中运行。也有可用的[Docker 容器](https://hub.docker.com/r/ollama/ollama)。

并行请求也有一些注意事项。你需要设置`OLLAMA_NUM_PARALLEL=1`并选择适合你硬件和偏好的`OLLAMA_MAX_QUEUE`和`OLLAMA_MAX_LOADED_MODELS`值。请参阅[Ollama 文档](https://github.com/ollama/ollama/blob/main/docs/faq.md#how-does-ollama-handle-concurrent-requests)。

### 支持的模型

你必须为 Frigate 使用一个具备视觉能力的模型。当前可用的模型变体可以在他们的[模型库](https://ollama.com/library)中找到。需要注意的是，Frigate 不会自动下载你在配置中指定的模型，Ollama 会尝试下载该模型，但下载过程可能超过超时时间，因此建议你在 Ollama 服务器或 Docker 容器中提前通过运行 ollama pull your_model 来拉取模型。同时请注意，Frigate 配置中指定的模型必须与你实际下载的模型标签（tag）相匹配。

:::info
每个模型都提供多种参数规模（如 3b、4b、8b 等）。参数规模越大，模型处理复杂任务和理解情境的能力越强，但同时需要更多的内存和计算资源。建议你尝试多个模型并进行实验，以找出表现最佳的模型。
:::
:::tip
如果你想为 Frigate 和 HomeAssistant 使用同一个模型，该模型需要同时支持视觉能力和工具调用功能。qwen3-VL 在 Ollama 中能够同时支持视觉和工具调用。
:::

以下是推荐的模型：

| Model         | Notes                                              |
| ------------- | -------------------------------------------------- |
| `qwen3-vl`    | 强大的视觉和情境理解能力，但对显存（VRAM）要求较高 |
| `Intern3.5VL` | 速度相对较快，具有良好的视觉理解能力               |
| `gemma3`      | 擅长每一帧画面之间的理解，但推理速度较慢           |
| `qwen2.5-vl`  | 速度快且功能强大，具有良好的视觉理解能力           |

:::note

你应至少有 8GB 可用 RAM(或在 GPU 上运行时为显存)来运行 7B 模型，16GB 运行 13B 模型，32GB 运行 33B 模型。

:::

### 配置

```yaml
genai:
  provider: ollama
  base_url: http://localhost:11434
  model: minicpm-v:8b
  provider_options: # 也可以进行定义其他 Ollama 客户端选项。
    keep_alive: -1
    options:
      num_ctx: 8192 # 确保上下文与使用 Ollama 的其他服务相匹配。
```

## Google Gemini

Google Gemini 有一个免费等级，允许每分钟[15 次查询](https://ai.google.dev/pricing)到 API，这对于标准 Frigate 使用来说已经足够。

### 支持的模型

你必须使用支持视觉的图生文模型。当前模型变体可在[其文档](https://ai.google.dev/gemini-api/docs/models/gemini)中找到。

### 获取 API 密钥

要开始使用 Gemini，你必须首先从[Google AI Studio](https://aistudio.google.com)获取 API 密钥。

1. 接受服务条款
2. 从右侧导航栏点击"获取 API 密钥"
3. 点击"在新项目中创建 API 密钥"
4. 复制 API 密钥用于你的配置

### 配置

```yaml
genai:
  provider: gemini
  api_key: "{FRIGATE_GEMINI_API_KEY}"
  model: gemini-2.0-flash
```

:::note

如需使用其他兼容 Gemini 的 API ENDPOINT，请将环境变量`GEMINI_BASE_URL`设置为你所用服务商的 API 地址。

:::

## OpenAI

OpenAI 没有为其 API 提供免费等级。随着 gpt-4o 的发布，价格已经降低，如果你选择此路线，每次生成应该只需几分钱。

如果你打算使用中国大陆的各个 AI 提供商，他们大部分都兼容 OpenAI API 接口。

:::warning
请注意，如果你的摄像头位于公共领域（例如过道）等会检测过多物体/目标的地方，过多的物体/目标可能会很快耗尽你的资源包。请**务必不要开启**后付费模式！
:::

### 支持的模型

你必须使用支持视觉的图生文模型。当前模型变体可在[其文档](https://platform.openai.com/docs/models)中找到。

:::note

如果你选择国内兼容 OpenAI API 的大模型提供商，请注意选择支持**图生文**的模型。例如腾讯云的`hunyuan-vision`模型。DeepSeek 官方目前未提供其图生文[`DeepSeek-VL2`](https://github.com/deepseek-ai/DeepSeek-VL2)模型的 API，但可以在第三方服务商处获取由他们部署的版本。

:::

### 获取 API 密钥

要开始使用 OpenAI，你必须首先[创建 API 密钥](https://platform.openai.com/api-keys)并[配置计费](https://platform.openai.com/settings/organization/billing/overview)。

### 配置

```yaml
genai:
  provider: openai
  api_key: "{FRIGATE_OPENAI_API_KEY}"
  model: gpt-4o
```

:::note

要使用兼容 OpenAI API 的其他服务商（例如阿里云和腾讯云等国内云厂商），需要设置**环境变量** `OPENAI_BASE_URL` 为你的服务商的 API endpoint。

例如腾讯云请设置为`https://api.hunyuan.cloud.tencent.com/v1`
:::

## Azure OpenAI

微软通过 Azure OpenAI 提供了几种视觉模型。需要订阅。

### 支持的模型

你必须使用支持视觉的图生文模型。当前模型变体可在[其文档](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models)中找到。

### 创建资源并获取 API 密钥

要开始使用 Azure OpenAI，你必须首先[创建资源](https://learn.microsoft.com/azure/cognitive-services/openai/how-to/create-resource?pivots=web-portal#create-a-resource)。你需要你的 API 密钥、模型名称和资源 URL，其中必须包含`api-version`参数(参见下面的示例)。

### 配置

```yaml
genai:
  enabled: True
  provider: azure_openai
  base_url: https://instance.cognitiveservices.azure.com/openai/responses?api-version=2025-04-01-preview
  model: gpt-5-mini
  api_key: "{FRIGATE_OPENAI_API_KEY}"
```
