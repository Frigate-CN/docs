---
id: genai_objects
title: Object Descriptions
---

生成式 AI 可根据你追踪目标的缩略图自动生成描述性文本，这有助于在 Frigate 中实现[语义搜索](../configuration/semantic_search.md)，为追踪目标提供更丰富的上下文信息。你可以在 Frigate 用户界面的“浏览”页面中，通过点击追踪目标的缩略图来查看这些描述。

描述请求会在追踪目标生命周期结束时自动发送至你的 AI 服务商，你也可以选择在检测到显著变化的若干帧后（例如用于实时通知的场景）提前发送请求。此外，还能通过 Frigate 用户界面手动重新生成描述。需要注意的是，若你在目标生命周期结束前手动输入了描述，该内容将被生成的响应覆盖。

默认情况下，系统会为所有追踪目标和所有监控区域生成描述。但你也可以通过指定`objects`和`required_zones`参数，仅为特定的追踪目标或区域生成描述。

可选方案：通过设置 `use_snapshot` 为 `True`，可以使用快照（若已启用）来生成描述，该设置默认为 `False`。此时系统会将目标生命周期内从 `detect` 流收集的未压缩图像发送给模型。当目标生命周期结束时，只会保存一张经过压缩和裁剪的缩略图。使用快照的优势在于：当你需要重新生成追踪目标描述时，它能向 AI 提供质量更高的图像（通常由 AI 自行降采样处理），效果优于裁剪/压缩后的缩略图。但使用快照也有弊端：由于只能发送单张图像给服务商，这将限制模型判断物体运动方向的能力。

你还可以通过 MQTT 动态控制特定相机的生成式 AI 目标描述功能，使用主题`frigate/<摄像头ID>/object_descriptions/set`进行切换。详见 [MQTT 文档](../integrations/mqtt/#frigatecamera_nameobjectdescriptionsset)。

## 使用方法和最佳实践

Frigate 的缩略图搜索擅长识别追踪目标的特定细节 - 例如，使用"图像标题"方法查找"穿黄色背心的人"、"在草坪上奔跑的白狗"或"住宅街道上的红色汽车"。为了进一步增强这一点，Frigate 的默认提示设计为询问你的 AI 提供商有关物体/目标行为背后的意图，而不仅仅是描述其外观。

虽然生成检测物品/目标的简单描述很有用，但理解意图提供了更深层次的洞察。Frigate 的默认提示不仅识别场景中的"什么"，还旨在推断"为什么"它可能在那里或"什么"它可能会做下一步。描述告诉你发生了什么，但意图提供了上下文。例如，一个人走向门可能看起来像访客，但如果他们在下班后快速移动，你可以推断潜在的闯入企图。检测到一个人在夜间在门附近徘徊可以比简单地注意到"一个人站在门旁"更快触发警报，帮助你根据情况上下文做出响应。

### 使用生成式 AI 进行通知

Frigate 提供了一个[MQTT 主题](/integrations/mqtt)，`frigate/tracked_object_update`，当你的 AI 提供商返回追踪目标的描述时，它会更新包含`event_id`和`description`的 JSON 有效负载。此描述可直接用于通知，例如发送警报到你的手机或进行音频公告。如果需要来自追踪目标的其他详细信息，你可以使用[HTTP API](/integrations/api/event-events-event-id-get)查询`event_id`，例如：`http://frigate_ip:5000/api/events/<event_id>`。

如果希望在物体/目标停止被追踪之前获得通知，可以配置`after_significant_updates`的附加发送触发器。

```yaml
genai:
  send_triggers:
    tracked_object_end: true # 默认
    after_significant_updates: 3 # 在发送图像前追踪目标的更新次数
```

## 自定义提示词

Frigate 将来自追踪目标的多帧图像与提示一起发送给你的生成式 AI 提供商，要求其生成描述。默认提示如下：

```
请分析以下监控摄像头画面中的 “{label}” 元素，如果可以，请尽可能描述 “{label}” 的动作、以及它接下来可能会做什么，而不是描述其外观或周围环境。请注意引号内的名称可能为英文，请输出时将其翻译为中文。
```

:::tip

提示可以使用变量替换，如`{label}`、`{sub_label}`和`{camera}`，以将追踪目标的信息替换为提示的一部分。

:::

你也可以在配置中定义自定义提示词。

```yaml
genai:
  enabled: True
  provider: ollama
  base_url: http://localhost:11434
  model: llava
objects:
  prompt: "分析来自{camera}安全摄像头的这些图像中的{label}。重点关注{label}的动作、行为和潜在意图，而不仅仅是描述其外观。"
  object_prompts:
    person: "请查看该监控画面中的主要人物。他们在做什么，他们的行为可能暗示什么意图(例如，接近门、离开区域、站立不动)？不要描述周围环境或静态细节。"
    car: "观察这些图像中的主要车辆。重点关注其移动、方向或目的(例如，停车、接近、绕行)。如果是送货车辆，请提及公司名称。"
```

提示词也可以在摄像头级别单独设置并覆盖，以便为模型提供关于你特定摄像头的更详细提示。

```yaml
cameras:
  front_door:
    objects:
      genai:
        enabled: True
        use_snapshot: True
        prompt: "分析来自{camera}前门安全摄像头的这些图像中的“{label}”。重点关注“{label}”的动作和潜在意图。请注意引号内的名称可能为英文，请输出时将其翻译为中文。"
        object_prompts:
          person: "检查这些图像中的人物。他们在做什么，他们的行为可能暗示什么目的(例如，递送东西、接近、离开)？如果他们携带或与包裹互动，请包括有关其来源或目的地的详细信息。"
          cat: "观察这些图像中的猫。重点关注其移动和意图(例如，徘徊、狩猎、与物体互动)。如果猫靠近花盆或进行任何特定动作，请提及。"
        objects:
          - person
          - cat
        required_zones:
          - steps
```

### 尝试不同的提示

许多提供商还为其模型提供公开的聊天界面。从 Frigate 下载几个不同的缩略图或快照，并在他们的聊天页面中尝试新内容，然后再更新 Frigate 中的提示以获得你喜欢的描述。

海外：

- OpenAI - [ChatGPT](https://chatgpt.com)
- Gemini - [Google AI Studio](https://aistudio.google.com)
- Ollama - [Open WebUI](https://docs.openwebui.com/)

国内：

- 千问 - [阿里百炼](https://bailian.console.aliyun.com/)
- 豆包 - [火山引擎](https://console.volcengine.com/ark)
