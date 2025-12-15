---
id: semantic_search
title: 语义搜索 <Badge type="tip" text="0.15.0 和 以上版本" />
---

:::tip

语义搜索功能需要依赖外部下载的模型文件。相关模型托管在 HuggingFace 上。

如果你在中国大陆地区，请参考[通过 Docker 安装](../frigate/installation.md#docker)的教程，在`environment`中配置`HF_ENDPOINT`环境变量，否则功能可能无法正常使用。

:::

Frigate 中的语义搜索功能允许你通过图像本身、用户定义的文本描述或自动生成的描述来查找回顾项目中的追踪目标。例如“红色衣服的人”或者“白色的猫”等。

该功能通过为追踪目标的图像和文本描述创建**嵌入向量**(数值向量表示)来实现。通过比较这些嵌入向量，Frigate 评估它们的相似度以提供相关的搜索结果。

Frigate 使用来自 [Jina AI](https://huggingface.co/jinaai) 的模型创建嵌入向量并保存到 Frigate 数据库中。所有处理都在本地运行。

语义搜索功能可通过 Frigate 网页中的 **浏览** 页面使用。

## 最低系统要求 {#minimum-system-requirements}

语义搜索通过在本地系统上运行大型 AI 模型实现。树莓派等小型或性能不足的系统可能无法可靠运行或完全无法运行语义搜索。

使用语义搜索至少需要 8GB 内存。对于使用英语的用户，虽然 GPU 不是严格必需的，但相比仅使用 CPU 的系统，GPU 能显著提升性能。

为获得最佳性能，建议使用 16GB 或更多内存和独立 GPU。

## 配置 {#configuration}

语义搜索默认禁用，必须在配置文件或增强功能设置页面中启用后才能使用。语义搜索为全局配置设置。

```yaml
semantic_search:
  enabled: True
  reindex: False
```

:::tip

通过添加`reindex: True`到`semantic_search`配置中，或在网页增强功能设置页面切换开关并重启 Frigate，可以从数据库中现有的追踪目标重新创建嵌入向量索引。根据追踪目标的数量，此过程可能需要较长时间，并可能在索引时使 CPU 负载非常高。确保在再次重启 Frigate 前关闭页面中的开关或将配置改回`False`。

如果是首次启用语义搜索，请注意 Frigate 不会自动为以前的追踪目标创建索引。你需要启用`reindex`功能来完成此操作。

:::

### Jina CLIP v1 <Badge type="tip" text="0.15.0 和 以上版本" /> {#jina-ai-clip-version-1}

[Jina 的 V1 模型](https://huggingface.co/jinaai/jina-clip-v1)具有视觉模型，能够将图像和文本嵌入到相同的向量空间中，从而实现`图像->图像`和`文本->图像`的相似性搜索。Frigate 使用此模型对追踪目标进行编码，将缩略图图像存储在数据库中。当通过搜索框中的文本搜索追踪目标时，Frigate 将执行`文本->图像`相似性搜索。当在追踪目标详情面板中点击"查找相似"时，Frigate 将执行`图像->图像`相似性搜索以检索最匹配的缩略图。

:::warning
注意，`v1`的模型只能使用英文进行搜索。如果需要使用中文搜索，请使用[`Jina CLIP v2`模型](#jina-ai-clip-version-2)。
:::
V1 文本模型用于嵌入追踪目标描述并对其执行搜索。描述可以在浏览页面点击追踪目标缩略图时创建、查看和修改。有关如何自动生成追踪目标描述的更多信息，请参阅[生成式 AI 文档](/configuration/genai.md)。

通过设置`model_size`配置选项为`small`或`large`，可以选择不同权重的 Jina 模型版本：

```yaml
semantic_search:
  enabled: True
  model: 'jinav1'
  model_size: small
```

- 配置`large`模型将使用完整的 Jina 模型，如果适用会自动在 GPU 上运行。
- 配置`small`模型将使用量化版本的 Jina 模型，占用更少内存并在 CPU 上运行，嵌入质量差异可以忽略不计。

### Jina CLIP v2 <Badge type="tip" text="0.16.0 和 以上版本" /> {#jina-ai-clip-version-2}

Frigate 也支持[Jina 的 V2 模型](https://huggingface.co/jinaai/jina-clip-v2)，该模型引入了多语言支持（支持 89 种语言，包括中文）。相比之下，V1 模型仅支持英语。

V2 在文本-图像和文本-文本检索任务中仅比 V1 有 3%的性能提升，这种改进不太可能带来明显的实际好处。此外，V2**对内存和 GPU 的要求有很大提高**，导致推理时间和内存使用增加。如果你计划使用 V2，请确保系统有充足的内存和**独立显卡**。不建议在 CPU 上使用 V2 的`small`模型进行推理。

要使用 V2 模型，请更新配置中的`model`参数：

```yaml
semantic_search:
  enabled: True
  model: 'jinav2'
  model_size: large
```

对于大多数用户，特别是母语为英语的人，V1 模型仍然是推荐选择。

:::note

在 V1 和 V2 之间切换需要重新创建嵌入向量索引。为此，在语义搜索配置中设置`reindex: True`并重启 Frigate。V1 和 V2 的嵌入向量不兼容，如果不重新索引将导致搜索结果不正确。

:::

### GPU 加速

CLIP 模型以 ONNX 格式下载，当可用时，`large`模型可以使用 GPU 硬件加速。这取决于使用的 Docker 构建版本。You can also target a specific device in a multi-GPU installation.

```yaml
semantic_search:
  enabled: True
  model_size: large
  # Optional, if using the 'large' model in a multi-GPU installation
  device: 0 # [!code ++]
```

:::info

如果使用了适合你 GPU / NPU 的正确构建版本并配置了`large`模型，GPU 将被自动检测并使用。

Specify the `device` option to target a specific GPU in a multi-GPU system (see [onnxruntime's provider options](https://onnxruntime.ai/docs/execution-providers/)).
If you do not specify a device, the first available GPU will be used.

更多信息请参考[功能增强](../configuration/hardware_acceleration_enrichments.md)文档.

:::

## 使用方法和最佳实践

1. 语义搜索与浏览页面上的其他过滤器结合使用效果最佳。结合传统过滤和语义搜索可获得最佳结果。
2. 当搜索场景中的特定对象时使用缩略图搜索类型。当尝试辨别对象意图时使用描述搜索类型。
3. 由于 Frigate 使用的 AI 模型训练方式，在多模态(缩略图和描述)搜索中，匹配描述的结果通常会先出现，即使缩略图嵌入可能是更好的匹配。尝试调整"搜索类型"设置以帮助找到所需内容。请注意，如果仅为特定对象或区域生成描述，可能导致搜索结果优先显示有描述的对象，即使没有描述的对象更相关。
4. 使搜索语言和语气与你要查找的内容紧密匹配。如果使用缩略图搜索，将查询短语作为图像标题。搜索"红色汽车"可能不如"阳光明媚的住宅区街道上行驶的红色轿车"效果好。
5. 缩略图的语义搜索在匹配占据大部分画面的大主体时效果更好。"猫"等小物体往往效果不佳。
6. 多尝试！找到一个想测试的追踪目标，开始输入关键词和短语，看看什么对你有效。

## Triggers

Triggers utilize Semantic Search to automate actions when a tracked object matches a specified image or description. Triggers can be configured so that Frigate executes a specific actions when a tracked object's image or description matches a predefined image or text, based on a similarity threshold. Triggers are managed per camera and can be configured via the Frigate UI in the Settings page under the Triggers tab.

:::note

Semantic Search must be enabled to use Triggers.

:::

### Configuration

Triggers are defined within the `semantic_search` configuration for each camera in your Frigate configuration file or through the UI. Each trigger consists of a `friendly_name`, a `type` (either `thumbnail` or `description`), a `data` field (the reference image event ID or text), a `threshold` for similarity matching, and a list of `actions` to perform when the trigger fires - `notification`, `sub_label`, and `attribute`.

Triggers are best configured through the Frigate UI.

#### Managing Triggers in the UI

1. Navigate to the **Settings** page and select the **Triggers** tab.
2. Choose a camera from the dropdown menu to view or manage its triggers.
3. Click **Add Trigger** to create a new trigger or use the pencil icon to edit an existing one.
4. In the **Create Trigger** wizard:
   - Enter a **Name** for the trigger (e.g., "Red Car Alert").
   - Enter a descriptive **Friendly Name** for the trigger (e.g., "Red car on the driveway camera").
   - Select the **Type** (`Thumbnail` or `Description`).
   - For `Thumbnail`, select an image to trigger this action when a similar thumbnail image is detected, based on the threshold.
   - For `Description`, enter text to trigger this action when a similar tracked object description is detected.
   - Set the **Threshold** for similarity matching.
   - Select **Actions** to perform when the trigger fires.
     If native webpush notifications are enabled, check the `Send Notification` box to send a notification.
     Check the `Add Sub Label` box to add the trigger's friendly name as a sub label to any triggering tracked objects.
     Check the `Add Attribute` box to add the trigger's internal ID (e.g., "red_car_alert") to a data attribute on the tracked object that can be processed via the API or MQTT.
5. Save the trigger to update the configuration and store the embedding in the database.

When a trigger fires, the UI highlights the trigger with a blue dot for 3 seconds for easy identification. Additionally, the UI will show the last date/time and tracked object ID that activated your trigger. The last triggered timestamp is not saved to the database or persisted through restarts of Frigate.

### Usage and Best Practices

1. **Thumbnail Triggers**: Select a representative image (event ID) from the Explore page that closely matches the object you want to detect. For best results, choose images where the object is prominent and fills most of the frame.
2. **Description Triggers**: Write concise, specific text descriptions (e.g., "Person in a red jacket") that align with the tracked object’s description. Avoid vague terms to improve matching accuracy.
3. **Threshold Tuning**: Adjust the threshold to balance sensitivity and specificity. A higher threshold (e.g., 0.8) requires closer matches, reducing false positives but potentially missing similar objects. A lower threshold (e.g., 0.6) is more inclusive but may trigger more often.
4. **Using Explore**: Use the context menu or right-click / long-press on a tracked object in the Grid View in Explore to quickly add a trigger based on the tracked object's thumbnail.
5. **Editing triggers**: For the best experience, triggers should be edited via the UI. However, Frigate will ensure triggers edited in the config will be synced with triggers created and edited in the UI.

### Notes

- Triggers rely on the same Jina AI CLIP models (V1 or V2) used for semantic search. Ensure `semantic_search` is enabled and properly configured.
- Reindexing embeddings (via the UI or `reindex: True`) does not affect trigger configurations but may update the embeddings used for matching.
- For optimal performance, use a system with sufficient RAM (8GB minimum, 16GB recommended) and a GPU for `large` model configurations, as described in the Semantic Search requirements.

### FAQ

#### Why can't I create a trigger on thumbnails for some text, like "person with a blue shirt" and have it trigger when a person with a blue shirt is detected?

TL;DR: Text-to-image triggers aren’t supported because CLIP can confuse similar images and give inconsistent scores, making automation unreliable. The same word–image pair can give different scores and the score ranges can be too close together to set a clear cutoff.

Text-to-image triggers are not supported due to fundamental limitations of CLIP-based similarity search. While CLIP works well for exploratory, manual queries, it is unreliable for automated triggers based on a threshold. Issues include embedding drift (the same text–image pair can yield different cosine distances over time), lack of true semantic grounding (visually similar but incorrect matches), and unstable thresholding (distance distributions are dataset-dependent and often too tightly clustered to separate relevant from irrelevant results). Instead, it is recommended to set up a workflow with thumbnail triggers: first use text search to manually select 3–5 representative reference tracked objects, then configure thumbnail triggers based on that visual similarity. This provides robust automation without the semantic ambiguity of text to image matching.
