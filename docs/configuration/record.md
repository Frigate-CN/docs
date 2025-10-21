---
id: record
title: 录制功能
---

启用录制功能后，视频将存储在容器的`/media/frigate/recordings`目录下（主机的实际路径为你Docker设置挂载`/media/frigate`对应的路径）。录制的文件结构为`YYYY-MM-DD/HH/<摄像头名称>/MM.SS.mp4`（使用UTC时间）。这些录制直接从摄像头流写入，不经过重新编码。每个摄像头支持可配置的保留策略。当决定是否删除录制时，Frigate会选择**录制保留**和**追踪物体/目标**中最大的保留周期值。

新的录制片段会从摄像头流写入缓存，只有符合设置的录制保留策略时才会移动到硬盘存储。

H265编码的录制只能在Chrome 108+、Edge和Safari浏览器中能够正常播放。其他浏览器需要设置为使用H264编码进行录制。

:::tip
国产浏览器（例如360浏览器）基本上基于Chrome内核进行开发，大多数内核版本高于108，基本上能正常播放H265编码的视频。
:::

## 常见录制配置例子 {#common-recording-configurations}

### 最保守方案：保存所有视频 {#most-conservative-ensure-all-video-is-saved}

对于需要在没有检测到画面变动时也保存连续视频的环境，以下配置将保存3天内的所有视频。3天后，只有**画面变动**且属于 [**核查**](/configuration/review) 中`警报`或`检测`的视频会保留30天。

```yaml
record:
  enabled: True  # 只有设置了enabled为True时录制功能才会生效 # [!code highlight]
  retain: # 所有原始录制保留 
    days: 3 # [!code highlight]
    mode: all # 将在3天期间保存所有的录制视频，包括没有画面变动或没有检测到物体/目标的视频 [!code highlight]
  alerts: # 核查警报类型录制
    retain:
      days: 30 # [!code highlight]
      mode: motion # 将在最上面的3天后，仅保存画面有变动且属于核查中"警报"的视频30天 [!code highlight]
  detections: # 核查检测类型录制
    retain:
      days: 30 # [!code highlight]
      mode: motion # 将在最上面的3天后，仅保存画面有变动且属于核查中"检测"的视频30天 [!code highlight]
```

### 减少存储：仅保存检测到画面变动的视频 {#reduced-storage-only-saving-video-when-motion-is-detected}

为了减少存储需求，可以调整配置**只保留检测到画面变动**的视频。

```yaml
record:
  enabled: True
  retain:
    days: 3 # [!code highlight]
    mode: motion # 只会保存画面变动的视频 [!code highlight]
  alerts:
    retain:
      days: 30 # [!code highlight]
      mode: motion # 将在最上面的3天后，仅保存画面有变动且属于核查中"警报"的视频30天 [!code highlight]
  detections:
    retain:
      days: 30 # [!code highlight]
      mode: motion # 将在最上面的3天后，仅保存画面有变动且属于核查中"检测"的视频30天 [!code highlight]
```

### 最小方案：仅保存警报视频 {#minimum-alerts-only}

如果只想保留检测追踪到`物体/目标`期间的视频，可以参考以下配置。不属于[核查](../configuration/review.md)中**警报**的视频将不会保留。

```yaml
record:
  enabled: True
  retain:
    days: 0 # 设置为0后默认就不会录制所有没有指定类型的监控视频 [!code highlight]
  alerts: # 这里指定只有警报的视频会录制，会无视上面的设定
    retain:
      days: 30 # [!code highlight]
      mode: motion # [!code highlight]
```

## 存储空间不足时Frigate会删除旧录制吗？ {#will-frigate-delete-old-recordings-if-my-storage-runs-out}

从Frigate 0.12开始，当剩余存储空间不足1小时时，系统会自动删除最早的2小时录制。

## 配置录制保留策略 {#configuring-recording-retention}

Frigate支持连续录制和基于追踪`物体/目标`的录制，具有独立的保留模式和保留期限。

:::tip

保留配置支持小数，例如可以设置为保留`0.5`天（12小时）。

:::

### 连续录制 {#continuous-recording}

可以通过以下配置设置保留连续录制的天数（X为数字），默认情况下连续录制被禁用。

```yaml
record:
  enabled: True
  retain:
    days: 1 # <- 保留连续录制的天数 [!code highlight]
```

连续录制支持不同的保留模式，[详见下文](#what-do-the-different-retain-modes-mean)

### 针对识别到的物体/目标的录制 {#object-recording}

可以为分类为警报和检测的回放条目分别指定保留天数。

```yaml
record:
  enabled: True
  alerts:
    retain:
      days: 10 # <- 保留警报录制的天数 [!code highlight]
  detections:
    retain:
      days: 10 # <- 保留检测录制的天数 [!code highlight]
```

此配置将保留与警报和检测重叠的录制片段10天。由于多个追踪 物体/目标 可能引用相同的录制片段，这样可以避免存储重复内容并减少总体存储需求。

**警告**：必须在配置中启用录制功能。如果摄像头在配置中禁用了录制，通过上述方法启用将不会生效。

## 不同保留模式的含义 {#what-do-the-different-retain-modes-mean}

Frigate 以10秒为片段保存配置了`record`功能的视频流。这些选项决定了哪些录制片段会被保留（也会影响追踪物体/目标）。

假设您配置门铃摄像头保留最近2天的连续录制：

- 使用`all`选项会保留这2天内的全部48小时录制（不管画面有没有变动）
- 使用`motion`选项只会保留 Frigate 检测到画面变动的部分监控片段。这是相对折中的方案。该方案不会保留全部48小时的视频，但可能会保留画面变动并且会额外保存一段时间的片段。
- 使用`active_objects`选项只会保留正在活动的`物体/目标`（非静止）的片段

警报（`alerts`）和检测（`detections`）也有相同的选项，但只会保存与之相对应的录制。

以下配置示例将保留7天所有画面变动片段，保存14天活动的`物体/目标`片段：

```yaml
record:
  enabled: True
  retain:
    days: 7
    mode: motion
  alerts:
    retain:
      days: 14
      mode: active_objects
  detections:
    retain:
      days: 14
      mode: active_objects
```

上述配置可以全局应用或针对单个摄像头设置。

## 可以只在特定时间进行"连续"录制吗？

通过Frigate页面、Home Assistant或MQTT，可以设置摄像头只在特定情况或时间进行录制。

## 如何导出录制文件 {#how-do-i-export-recordings}

可以通过在**核查**页面中右键点击（电脑）或长按（手机）回放条目，或在摄像头的**历史**页面中点击导出按钮来导出录制。导出的录制会通过主导航栏中的导出页面进行管理和搜索，也可下载为录制文件。

::: tip

请不要直接从 Frigate 保存视频的路径直接获取视频，也无法设置默认保存录制文件时间长度，如需要导出视频，请使用 Frigate 内的<mark>导出</mark>功能来导出指定时间的录制，然后在<mark>导出</mark>页面下载录制文件。

:::

### 延时摄影导出 {#time-lapse-export}

延时摄影导出只能通过[HTTP API](https://docs.frigate.video/integrations/api/export-recording-export-camera-name-start-start-time-end-end-time-post.api.mdx)实现。

默认情况下，延时摄影以25倍速和30FPS导出。这意味着每25秒的实际录制会被压缩为1秒的延时视频（无音频）。

要配置加速倍数、帧率等参数，可以使用`timelapse_args`配置参数。以下示例将延时速度改为60倍（1小时录制压缩为1分钟），帧率25FPS：

```yaml
record:
  enabled: True
  export:
    timelapse_args: "-vf setpts=PTS/60 -r 25"
```

:::tip

当全局使用`hwaccel_args`时，延时生成会使用硬件编码。编码器会自行决定行为，可能导致输出文件过大。
可以使用ffmpeg参数`-qp n`（n代表量化参数值）来减小输出文件大小，调整该值可以在质量和文件大小之间取得平衡。

:::

## Apple设备H.265流兼容性说明 {#apple-compatibility-with-h265-streams}

使用Safari浏览器的Apple设备在播放H.265格式录制时可能出现兼容性问题。为确保在Apple设备上的正常播放，建议启用[Apple兼容性选项](/configuration/camera_specific.md#safari浏览器下的h265摄像头支持)。

## 同步录制与硬盘上的文件 {#syncing-recordings-with-disk}

在某些情况下，录制文件可能被删除但Frigate并不知道。可以启用录制同步功能，让Frigate检查文件系统并删除数据库中不存在的文件记录。

```yaml
record:
  sync_recordings: True
```

此功能用于修复文件差异，而非完全删除数据库条目。如果你清理了所有监控文件，请务必不要使用`sync_recordings`，而是停止Frigate容器，直接删除`frigate.db`数据库后重新启动。

:::warning

同步操作会占用大量CPU资源，大多数情况下不需要启用，仅在必要时使用。

:::