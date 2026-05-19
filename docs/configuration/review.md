---
id: review
title: 核查
---

Frigate 界面中的核查页面用于快速查看摄像头录制到的历史感兴趣片段。_核查条目_ 在垂直时间轴上显示，并以预览网格形式呈现——这些是经过带宽优化的低帧率、低分辨率视频。将鼠标悬停或滑动预览会播放视频并将其标记为已核查。如果需要更深入的分析，可以点击预览，将显示全帧率、全分辨率的完整录像。

核查条目可按日期、目标类型和摄像头进行筛选。

### 核查条目 vs 被追踪目标（原"事件"） {#review-items-vs-tracked-objects-formerly-events}

在 Frigate 0.13 及更早版本中，界面显示的是"事件"。一个事件等同于一个被追踪或检测到的目标。在 Frigate 0.14 及更高版本中，核查条目是一个时间段，其中可能有任意数量的被追踪目标处于活动状态。

举例来说，假设有两个人从你家门前走过，其中一人牵着一条狗。与此同时，一辆汽车从他们身后的街道驶过。

在此场景下，Frigate 0.13 及更早版本会在界面中显示 4 个"事件"——每个人一个，狗一个，汽车一个。即使这些事件在时间上重叠，你也需要分别观看 4 段视频。

在 0.14 及更高版本中，所有这些活动都被合并成一个单独的核查条目，其开始和结束时间涵盖了所有这些活动。同一摄像头的核查条目不会重叠。一旦你观看了该摄像头的那段时间录像，它就会被标记为已核查。

## 警报与检测 <Badge type="tip" text="0.14.0 和 以上版本" /> {#alerts-and-detections}

Frigate 录制的每段视频对你的重要程度可能有所不同。比如，进入你私人领地的人可能比在人行道上走过的人更值得关注。因此，在 Frigate 0.14 后，将核查条目分类为 _警报_ 和 _检测_。默认配置下，所有 `person` 和 `car` 都被视为警报。你可以通过配置所需区域来细化核查条目的分类。

:::note

警报和检测会对核查条目中被追踪的目标进行分类，但 Frigate 必须首先通过你配置的检测器（如 Coral、OpenVINO 等）检测到这些目标才能进行分类。默认情况下，目标跟踪器仅检测 `person`。设置 `alerts` 和 `detections` 的 `labels` 不会自动启用新目标的检测。要检测更多目标，你应在全局或摄像头配置中添加更多标签：

```yaml
objects:
  track:
    - person
    - car
    - ...
```

关于 Frigate 默认模型可追踪的目标列表，请参阅[目标文档](objects.md)。
:::

## 限制警报的标签类型 {#restricting-alerts-to-specific-labels}

默认情况下，只有当检测到 `person` 或 `car` 时，核查条目才会被标记为警报。配置警报标签以包含任何目标或音频标签。

```yaml
# 可在摄像头级别覆盖
review:
  alerts:
    labels:
      - car
      - cat
      - dog
      - person
      - speech
```

## 限制检测的标签类型 {#restricting-detections-to-specific-labels}

默认情况下，所有不符合警报条件的检测将被归类为检测。但你可以进一步过滤检测，仅包含特定标签或特定区域。

```yaml
# 可在摄像头级别覆盖
review:
  detections:
    labels:
      - bark
      - dog
```

## 从警报或检测中排除摄像头 {#excluding-a-camera-from-alerts-or-detections}

要从警报或检测中排除特定摄像头，在摄像头级别的警报或检测标签字段提供一个空列表。

例如，要排除摄像头 _gatecamera_ 的所有检测：

```yaml
cameras:
  gatecamera:
    review:
      detections:
        labels: []
```

## 将核查条目限制在特定区域 {#restricting-review-items-to-specific-zones}

默认情况下，如果在摄像头画面的任何位置检测到 `review -> alerts -> labels` 和 `review -> detections -> labels` 中的目标，就会创建一个核查条目。你可能希望配置为仅当目标进入关注区域时才创建核查条目，[详见区域文档](./zones.md#restricting-alerts-and-detections-to-specific-zones)

:::info

由于区域不适用于音频，音频标签默认始终标记为检测。

:::
