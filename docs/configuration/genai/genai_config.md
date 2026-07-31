---
id: genai_config
title: 配置生成式 AI
---

## 配置 {#configuration}

可以在全局配置中设置生成式 AI 提供商，启用后即可使用生成式 AI 功能。目前有 5 种原生提供商可与 Frigate 集成。支持 OpenAI 标准 API 的其他提供商也可使用，请参阅下方的 OpenAI 兼容部分。

`genai` 是一个命名提供者的映射。`genai` 下的每个键都是你选择的名称，其值是该提供者的设置：

<ConfigTabs>
<TabItem value="图形化配置">

1. 导航到 <NavPath path="Settings > Enrichments > Generative AI" />。
   - 点击**添加（Add）**并输入**提供者名称（Provider name）**。接受字母、数字、连字符和下划线的任意名称，但创建后无法从界面更改。
   - 将**提供者（Provider）**设置为你使用的服务（例如 `ollama`）
   - 根据提供者要求设置**基础 URL（Base URL）**、**API 密钥（API key）**和**模型（Model）**
   - 设置**角色（Roles）**为该提供者应处理的角色。

</TabItem>
<TabItem value="YAML配置文件">

```yaml
genai:
  my_provider: # 任意你喜欢的名称
    provider: ollama
    base_url: http://localhost:11434
    model: qwen3-vl:4b
    roles:
      - descriptions
      - embeddings
      - chat
```

</TabItem>
</ConfigTabs>

## 常见问题

### 如何调试 GenAI 问题？

Frigate 的生成式 AI 功能是分别配置和启用的。[核查描述与摘要](/configuration/genai/genai_review)位于 `review.genai` 下，[目标描述](/configuration/genai/genai_objects)位于 `objects.genai` 下。在本页面配置提供者并不会启用任一功能，启用一个也不意味着启用了另一个。确定哪个功能不起作用，然后按以下步骤排查。

1. 确认提供者可用并拥有 `descriptions` 角色。
   - 核查描述、核查摘要和目标描述都使用在 <NavPath path="Settings > Enrichments > Generative AI > Roles" />（`genai.<provider>.roles`）中分配了 `descriptions` 角色的提供者。
   - 提供者在其某个角色第一次实际使用时才会被联系。持有语义搜索 `embeddings` 角色的提供者在启动时初始化，而 `descriptions` 提供者直到第一次描述请求时才初始化，这可能远在启动之后。
   - 在 <NavPath path="Settings > Enrichments > Generative AI" /> 中，使用模型字段旁的**刷新模型（Refresh models）**。它会查询提供者的模型列表，是验证基础 URL、API 密钥以及 Frigate 与提供者之间网络路径是否正确的快速方法。

2. 确认你期望的功能实际已启用。
   - 目标描述默认禁用。在全局或每个摄像头下打开 <NavPath path="Settings > Global configuration > Objects > GenAI object config > Enable GenAI" />（`objects.genai.enabled`）。这是自定义提示看起来被忽略而核查摘要仍在生成的最常见原因。
   - 核查描述默认禁用。打开 <NavPath path="Settings > Global configuration > Review > GenAI config > Enable GenAI descriptions" />（`review.genai.enabled`）。一旦启用，警报默认会被描述，但检测不会，因此仅检测的核查项永远不会获得摘要，除非**启用 GenAI 检测（Enable GenAI for detections）**（`review.genai.detections`）也开启。

3. 如果目标描述从未被请求，检查跳过生成的过滤器。
   - <NavPath path="Settings > Global configuration > Objects > GenAI object config > GenAI objects" />（`objects.genai.objects`）限制生成到特定标签，**必需区域（Required zones）**（`objects.genai.required_zones`）要求目标进入其中一个区域。如果设置了但未匹配，Frigate 会静默跳过请求。
   - 缩略图仅在目标移动时收集。提前静止的目标贡献的帧更少。
   - **使用快照（Use snapshots）**（`objects.genai.use_snapshot`）要求为摄像头启用快照。如果无法读取快照，Frigate 会记录 `Cannot load snapshot for <id>, file not found` 且不生成描述。
   - **结束发送（Send on end）**（`objects.genai.send_triggers.tracked_object_end`）默认开启。如果你关闭了它而使用**提前 GenAI 触发器（Early GenAI trigger）**（`objects.genai.send_triggers.after_significant_updates`），描述仅在该更新次数达到后才被请求。

4. 启用调试日志查看 Frigate 实际在做什么。此更改后重启 Frigate。下一步也需要重启，所以同时开启两者以避免重启两次。

   ```yaml
   logger:
     default: info
     logs:
       # highlight-start
       frigate.genai: debug
       frigate.data_processing.post.object_descriptions: debug
       frigate.data_processing.post.review_descriptions: debug
       # highlight-end
   ```

5. 保存发送给提供者的确切图像和提示词。
   - 为正在调试的功能开启**保存缩略图（Save thumbnails）**（`review.genai.debug_save_thumbnails` 或 `objects.genai.debug_save_thumbnails`）。两个功能都写入 `/media/frigate/clips/genai-requests/`，这些文件仅限管理员访问。
   - 核查描述写入 `genai-requests/<review_id>/`，包含发送的编号帧，以及 `prompt.txt` 和 `response.txt`（包含确切的提示词和原始、未解析的模型响应）。
   - 核查摘要报告写入 `genai-requests/<start_ts>-<end_ts>/prompt.txt` 和 `response.txt`。不涉及图像，因为报告汇总现有的核查描述。
   - 目标描述写入 `genai-requests/<event_id>/`，包含编号的缩略图。目标描述的提示词不写入文件，仅在步骤 4 的调试日志中可见。
   - 在责怪模型之前先查看保存的图像。如果目标很小、模糊或在画面外，再好的提示词也无法修复结果。对于目标描述，考虑开启**使用快照**（`objects.genai.use_snapshot`）发送更高质量的图像。对于核查项，考虑将**核查图像源（Review image source）**（`review.genai.image_source`）设置为 `recordings` 以获取 480p 帧，而不是较低分辨率的预览帧。

<ConfigTabs>
<TabItem value="图形化配置">

对于核查描述，导航到 <NavPath path="Settings > Global configuration > Review" />，将 **GenAI config > Save thumbnails** 设置为开启。

对于目标描述，导航到 <NavPath path="Settings > Global configuration > Objects" />，展开 **GenAI object config**，将 **Save thumbnails** 设置为开启。

</TabItem>
<TabItem value="YAML配置文件">

```yaml
review:
  genai:
    enabled: true
    # highlight-next-line
    debug_save_thumbnails: true

objects:
  genai:
    enabled: true
    # highlight-next-line
    debug_save_thumbnails: true
```

</TabItem>
</ConfigTabs>

6. 验证提示词是否如你所想。
   - 目标描述提示词是你直接控制的。摄像头级别的 <NavPath path="Settings > Camera configuration > Objects > GenAI object config > Caption prompt" />（`objects.genai.prompt`）覆盖全局的，**目标提示词（Object prompts）**（`objects.genai.object_prompts`）中某个标签的条目会覆盖该标签的两者。只有 `{label}`、`{sub_label}` 和 `{camera}` 会被替换。
   - 核查描述提示词由 Frigate 构建并请求结构化 JSON 响应，因此不可完全替换。你控制的部分是 <NavPath path="Settings > Global configuration > Review > GenAI config > Activity context prompt" />（`review.genai.activity_context_prompt`）和**额外关注事项（Additional concerns）**（`review.genai.additional_concerns`）。保持活动上下文提示词通用，因为过于具体的规则会影响模型的威胁级别评分。

7. 如果描述生成但结果不佳或不一致，检查模型和上下文窗口。
   - 空字段、缺失 `shortSummary` 值或 `Failed to parse review description` 错误通常意味着模型未遵循请求的 JSON 结构。较小的模型在结构化输出方面有困难。尝试更大的参数量或[推荐模型](#推荐本地模型)之一。
   - Frigate 根据提供者报告的上下文大小计算要发送多少帧。如果你的服务器报告的值与实际运行的值不同，帧将被截断或请求失败。通过在 <NavPath path="Settings > Enrichments > Generative AI > Provider options" />（`genai.<provider>.provider_options`）中添加 `context_size` 来固定该值，对于 Ollama 还确认 `options.num_ctx` 与配置的上下文匹配。
   - 在 <NavPath path="System metrics > Enrichments" /> 中查看**核查描述速度（Review Description Speed）**和**目标描述速度（Object Description Speed）**。如果推理需要数十秒，请求会相互排队，描述会看似停止。对于 Ollama，检查 `OLLAMA_NUM_PARALLEL`、`OLLAMA_MAX_QUEUE` 和 `OLLAMA_MAX_LOADED_MODELS`，确保 Frigate 的并发请求按预期处理。

本页面的例子都使用 `my_provider`，但名称是任意的，仅用于在配置的其他地方引用该提供者（例如 `semantic_search.model`）。

每个提供者处理一个或多个**角色**：`chat`（对话）、`descriptions`（描述）和 `embeddings`（嵌入）。默认情况下一个提供者处理所有三个角色，每个角色可分配给恰好一个提供者。如果你想让一个提供者处理所有事情，只需定义一个；也可以使用 `roles` 选项将角色拆分到多个提供者。

## 本地提供商 {#local-providers}

本地提供商运行在你自己的硬件上，所有数据处理都在本地完成。这些提供商需要 GPU 或专用硬件以获得最佳性能。

:::warning

不建议在 CPU 上运行生成式 AI 模型，因为高推理延迟会使生成式 AI 变得不实用。

:::

### 推荐本地模型 {#recommended-local-models}

你必须为 Frigate 使用具备视觉能力的模型。以下是 `descriptions` 和 `chat` 角色的推荐本地部署模型：

| 模型      | 说明                                                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qwen3-vl`| 强大的视觉和情境理解能力，增强了对较小目标和目标交互的识别能力。                                                                                                     |
| `qwen3.6` | 强大的情境理解能力，但与 qwen3-vl 相似。                                                                                                                             |
| `gemma4`  | 强大的情境理解能力，但有时会使用更模糊的词汇如"互动"而非具体的动作描述。                                                                                             |

`embeddings` 角色需要不同类型的模型。文本查询与存储的图像嵌入进行匹配，因此模型必须经过训练，将图像和文本放入同一向量空间。对话或描述模型在被要求时仍会返回向量，但这些向量并非为检索而训练，文本搜索将返回糟糕的匹配结果且不会报错指明原因。

| 模型                | 说明                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qwen3-vl-embedding` | 用于[语义搜索](/configuration/semantic_search#genai-提供者)的多模态嵌入。必须由 llama.cpp 以 `--embeddings` 和 `--mmproj` 启动。 |
| `Intern3.5VL` | 速度相对较快，具有良好的视觉理解能力                                                                                                                   |
| `gemma3`      | 推理速度较慢，但具有良好的视觉和时序理解能力                                                                                                           |

:::info

每个模型都提供多种参数规模（3b、4b、8b 等）。参数规模越大，模型处理复杂任务和理解情境的能力越强，但同时需要更多的内存和计算资源。建议你尝试多个模型并进行实验，以找出表现最佳的模型。

:::

:::note

你应至少有 8GB 可用 RAM（或在 GPU 上运行时为 VRAM）来运行 7B 模型，16GB 运行 13B 模型，24GB 运行 33B 模型。

:::

### 模型类型：指令型与思考型 {#model-types-instruct-vs-thinking}

视觉-语言模型有**指令型（instruct）**变体（经过微调以遵循指令并简洁回复）、**思考型（thinking）**变体（经过微调用于自由格式、推测性推理）以及支持按请求切换两种模式的**混合型（hybrid）**变体。大多数现代视觉-语言模型都是混合型的。

Frigate 会按任务自动管理推理模式：

- **描述任务**（目标描述、核查描述、核查摘要）仅涉及综合生成，受益于简洁、直接的输出，因此当模型支持按请求切换时，Frigate 会在这些调用中禁用思考模式。
- **聊天**功能允许你在配置的模型支持时，从编辑器中切换思考模式的开启或关闭。

你可以在 Frigate 中使用纯指令型、混合型或支持思考型的模型——无需额外配置即可为描述禁用思考模式。

### llama.cpp {#llamacpp}

[llama.cpp](https://github.com/ggml-org/llama.cpp) 是 LLaMA 的 C++ 实现，提供高性能推理服务器。

强烈建议在配备独立显卡的机器或 Apple Silicon Mac 上托管 llama.cpp 服务器以获得最佳性能。

#### 支持的模型 {#supported-models}

你必须为 Frigate 使用具备视觉能力的模型。llama.cpp 服务器支持多种 GGUF 格式的视觉模型。

#### 配置 {#configuration-1}

所有 llama.cpp 原生选项都可以通过 `provider_options` 传递，包括 `temperature`、`top_k`、`top_p`、`min_p`、`repeat_penalty`、`repeat_last_n`、`seed`、`grammar` 等。完整参数列表请参阅 [llama.cpp 服务器文档](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)。

```yaml
genai:
  my_provider:
    provider: llamacpp
    base_url: http://localhost:8080
    model: your-model-name
    provider_options:
      context_size: 16000 # 可选，覆盖服务器报告的上下文大小。
```

Frigate 在启动时查询 llama.cpp 服务器获取模型的上下文大小，并将其与其他检测到的功能一起记录到日志中。如果在 `provider_options` 中设置了 `context_size`，则始终使用该值，即使服务器报告了其自身的值。

### Ollama {#ollama}

[Ollama](https://ollama.com/) 允许你自托管大型语言模型并保持所有内容在本地运行。强烈建议在配备 Nvidia 独立显卡的机器或 Apple Silicon Mac 上托管此服务以获得最佳性能。

大多数 7b 参数的 4-bit 视觉模型都能在 8GB VRAM 中运行。也有可用的 [Docker 容器](https://hub.docker.com/r/ollama/ollama)。

并行请求也有一些注意事项。你需要设置 `OLLAMA_NUM_PARALLEL=1` 并选择适合你硬件和偏好的 `OLLAMA_MAX_QUEUE` 和 `OLLAMA_MAX_LOADED_MODELS` 值。请参阅 [Ollama 文档](https://docs.ollama.com/faq#how-does-ollama-handle-concurrent-requests)。

:::tip

如果你想为 Frigate 和 HomeAssistant 使用同一个模型，该模型需要同时支持视觉能力和工具调用功能。qwen3-VL 在 Ollama 中能够同时支持视觉和工具调用。

:::

注意，Frigate 不会自动下载你在配置中指定的模型。Ollama 会尝试下载该模型，但下载过程可能超过超时时间，因此建议你在 Ollama 服务器或 Docker 容器中提前运行 `ollama pull your_model` 来拉取模型。Frigate 配置中指定的模型必须与你下载的模型标签匹配。

#### 配置 {#configuration-2}

```yaml
genai:
  my_provider:
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
  my_provider:
    provider: openai
    base_url: http://your-llama-server
    model: your-model-name
    provider_options:
      context_size: 8192 # 指定已配置的上下文大小
```

这确保 Frigate 在生成提示词时使用正确的上下文窗口大小。

:::

#### 配置 {#configuration-3}

```yaml
genai:
  my_provider:
    provider: openai
    base_url: http://your-server:port
    api_key: your-api-key # 本地服务器可能不需要
    model: your-model-name
```

要使用其他 OpenAI 兼容 API 端点，请设置 `OPENAI_BASE_URL` 环境变量为你的提供商 API URL。

## 云端提供商 {#cloud-providers}

云端提供商运行在远程基础设施上，需要 API 密钥进行认证。这些服务在其服务器上处理所有模型推理。

:::info

云端生成式 AI 提供商需要网络连接来发送图像和提示词进行处理。本地提供商如 llama.cpp 和 Ollama（使用本地模型）不需要网络。详见[网络需求](/frigate/network_requirements#generative-ai)。

:::

### Ollama 云端 {#ollama-cloud}

Ollama 也支持[云端模型](https://ollama.com/cloud)，模型推理在云端完成。你可以通过将 `base_url` 设置为 `https://ollama.com` 并提供 API 密钥来直接连接 Ollama Cloud。或者，你可以在本地运行 Ollama 并使用云端模型名称，让本地实例将请求转发到云端。更多详情请查阅 Ollama 云端模型[文档](https://docs.ollama.com/cloud)。

#### 配置 {#configuration-4}

```yaml
genai:
  my_provider:
    provider: ollama
    base_url: http://localhost:11434
    model: cloud-model-name
```

或直接使用 Ollama Cloud：

```yaml
genai:
  my_provider:
    provider: ollama
    base_url: https://ollama.com
    model: cloud-model-name
    api_key: your-api-key
```

### Google Gemini {#google-gemini}

Google Gemini API 提供了[免费套餐](https://ai.google.dev/pricing)，但该套餐的配额限制可能无法满足 Frigate 的常规使用需求。请根据你的部署场景选择合适的计费套餐。

#### 支持的模型 {#supported-models-1}

你必须使用支持视觉的模型。当前模型变体可在[其文档](https://ai.google.dev/gemini-api/docs/models/gemini)中找到。

#### 获取 API 密钥 {#get-api-key}

要开始使用 Gemini，你必须首先从 [Google AI Studio](https://aistudio.google.com) 获取 API 密钥。

1. 接受服务条款
2. 从右侧导航栏点击"获取 API 密钥"
3. 点击"在新项目中创建 API 密钥"
4. 复制 API 密钥用于你的配置

#### 配置 {#configuration-5}

```yaml
genai:
  my_provider:
    provider: gemini
    api_key: "{FRIGATE_GEMINI_API_KEY}"
    model: gemini-2.5-flash
```

:::note

若需使用其他兼容 Gemini 的 API 端点，可在 `provider_options` 中通过 `base_url` 键配置：

```yaml
genai:
  my_provider:
    provider: gemini
    ...
    provider_options:
      base_url: https://...
```

其他 HTTP 选项也可用，请参阅 [python-genai 文档](https://github.com/googleapis/python-genai)。

:::

### OpenAI {#openai}

OpenAI 没有为其 API 提供免费等级。随着 gpt-4o 的发布，价格已经降低，每次生成应该只需几分钱。

如果你打算使用中国大陆的各个 AI 提供商，他们大部分都兼容 OpenAI API 接口。

:::warning

请注意，如果你的摄像头位于公共领域（例如过道）等会检测过多目标的地方，过多的目标可能会很快耗尽你的资源包。请**务必不要开启**后付费模式！

:::

#### 支持的模型 {#supported-models-2}

你必须使用支持视觉的模型。当前模型变体可在[其文档](https://platform.openai.com/docs/models)中找到。

:::note

如果你选择国内兼容 OpenAI API 的大模型提供商，请注意选择支持**图生文**的模型。例如腾讯云的 `hunyuan-vision` 模型。DeepSeek 官方目前未提供其图生文 [`DeepSeek-VL2`](https://github.com/deepseek-ai/DeepSeek-VL2) 模型的 API，但可以在第三方服务商处获取由他们部署的版本。

:::

#### 获取 API 密钥 {#get-api-key-1}

要开始使用 OpenAI，你必须首先[创建 API 密钥](https://platform.openai.com/api-keys)并[配置计费](https://platform.openai.com/settings/organization/billing/overview)。

#### 配置 {#configuration-6}

```yaml
genai:
  my_provider:
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
  my_provider:
    provider: openai
    base_url: http://your-llama-server
    model: your-model-name
    provider_options:
      context_size: 8192 # 指定已配置的上下文大小
```

这确保 Frigate 在生成提示词时使用正确的上下文窗口大小。

:::

### Azure OpenAI {#azure-openai}

微软通过 Azure OpenAI 提供了几种视觉模型。需要订阅。

#### 支持的模型 {#supported-models-3}

你必须使用支持视觉的模型。当前模型变体可在[其文档](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models)中找到。

#### 创建资源并获取 API 密钥 {#create-resource-and-get-api-key}

要开始使用 Azure OpenAI，你必须首先[创建资源](https://learn.microsoft.com/azure/cognitive-services/openai/how-to/create-resource?pivots=web-portal#create-a-resource)。你需要你的 API 密钥、模型名称和资源 URL，其中必须包含 `api-version` 参数（参见下面的示例）。

#### 配置 {#configuration-7}

```yaml
genai:
  my_provider:
    provider: azure_openai
    base_url: https://instance.cognitiveservices.azure.com/openai/responses?api-version=2025-04-01-preview
    model: gpt-5-mini
    api_key: "{FRIGATE_OPENAI_API_KEY}"
```
