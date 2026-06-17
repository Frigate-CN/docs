---
id: objects
title: 可检测的目标类型
---

<script setup>
import labels from "../labelmap.txt?raw";
import translation from "../translation.json"

const getLabelName = (text) => text.replace(/^\d+\s+/, "").replace(" ", "_");
const getTranslation = (label) => translation[label];
</script>

Frigate 包含以下来自 Google Coral 测试数据的目标标签。

请注意：

- `car` 被列出两次，因为 `truck` 默认被重命名为 `car`。这两种目标类型经常被混淆。
- 默认情况下，仅追踪 `person`。要追踪其他目标类型，请在目标设置中配置。
- 默认的 COCO 标签的模型中的 `mouse` 并不是老鼠，而是鼠标。
- 具体检测的目标类型取决于你模型的支持。

<ul>
  <li v-for='text in labels.split("\n")' :key='text'>
    {{getLabelName(text)}}<span v-if='getTranslation(getLabelName(text))'>（{{getTranslation(getLabelName(text))}}）</span>
  </li>
</ul>

## 配置追踪目标 {#configuring-tracked-objects}

默认情况下，Frigate 仅追踪人（`person`）。要追踪其他目标类型，请将其添加到追踪目标列表中。

```yaml
objects:
  # 可选：从labelmap.txt中要追踪的对象列表（默认值：如下所示）
  track:
    # 注意，下方添加的目标/物体为英文，可以参考本页面下方的列表来添加
    - person # 人
    - cat # 猫
    - dog # 狗
    - car # 车辆
```

要在摄像头级别覆盖：

```yaml
cameras:
  front_door:
    objects:
      track:
        - person
        - car
```

## 过滤目标 {#filtering-objects}

目标过滤器通过约束每种目标类型的大小、形状和置信度阈值来帮助减少误报。过滤器可在全局或按摄像头配置。

```yaml
objects:
  filters:
    person:
      min_area: 5000
      max_area: 100000
      min_ratio: 0.5
      max_ratio: 2.0
      min_score: 0.5
      threshold: 0.7
```

要在摄像头级别覆盖：

```yaml
cameras:
  front_door:
    objects:
      filters:
        person:
          min_area: 5000
          threshold: 0.7
```

## 目标过滤遮罩 {#object-filter-masks}

目标过滤遮罩可阻止特定目标类型在摄像头画面的特定区域被检测。这些遮罩检查边界框的底部中心点。全局遮罩适用于所有目标类型，而按目标遮罩仅适用于指定类型。

```yaml
objects:
  # 应用于所有目标类型的全局遮罩
  mask:
    mask1:
      friendly_name: "目标过滤遮罩区域"
      enabled: true
      coordinates: "0.000,0.000,0.781,0.000,0.781,0.278,0.000,0.278"
  # 按目标遮罩
  filters:
    person:
      mask:
        mask1:
          friendly_name: "人员过滤遮罩"
          enabled: true
          coordinates: "0.000,0.000,0.781,0.000,0.781,0.278,0.000,0.278"
```

:::note

全局遮罩与任何目标特定遮罩组合使用。两者都基于边界框底部中心点进行检查。

:::

## 自定义模型 {#custom-models}

镜像中已包含适用于 CPU 和 EdgeTPU（Coral）的模型。你可以通过卷挂载使用自定义模型：

- CPU 模型：`/cpu_model.tflite`
- EdgeTPU 模型：`/edgetpu_model.tflite`
- 标签文件：`/labelmap.txt`

如果自定义模型与默认配置不同，你还需要更新[模型配置](advanced/system.md#model)。
