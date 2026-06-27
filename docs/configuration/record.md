---
id: record
title: 录制功能
---

import ConfigTabs from "@site/src/components/ConfigTabs";
import TabItem from "@theme/TabItem";
import NavPath from "@site/src/components/NavPath";

启用录制功能后，视频将存储在容器的`/media/frigate/recordings`目录下（主机的实际路径为你 Docker 设置挂载`/media/frigate`对应的路径）。录制的文件结构为`YYYY-MM-DD/HH/<摄像头名称>/MM.SS.mp4`（使用 UTC 时间）。这些录制直接从摄像头流写入，不经过重新编码。每个摄像头支持可配置的保留策略。当决定是否删除录制时，Frigate 会选择**录制保留**和**追踪物体/目标**中最大的保留周期值。

新的录制片段会从摄像头流写入缓存，只有符合设置的录制保留策略时才会移动到硬盘存储。

:::tip

要将特定片段保留超过保留期，请[导出](/usage/exports)它而不是增加整个摄像头的保留时间。导出文件单独保存，永远不会被保留策略删除。

:::

H265 编码的录制只能在 Chrome 108+、Edge 和 Safari 浏览器中能够正常播放。其他浏览器需要设置为使用 H264 编码进行录制。

:::tip
国产浏览器（例如 360 浏览器）基本上基于 Chrome 内核进行开发，大多数内核版本高于 108，基本上能正常播放 H265 编码的视频。
:::

## 常见录制配置例子 {#common-recording-configurations}

### 最保守方案：保存所有视频 {#most-conservative-ensure-all-video-is-saved}

对于需要在没有检测到画面变动时也保存连续视频的环境，以下配置将保存 3 天内的所有视频。3 天后，只有**画面变动**的视频会保留 30 天，7 天后，只有包含画面变动且属于 [**核查**](../configuration/review.md) 中`警报`或`检测`的视频会保留 30 天。

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 全局配置 > 录制" />。

- 将**启用录制**设为开启
- 将**连续保留 > 保留天数**设为 `3`
- 将**画面变动保留 > 保留天数**设为 `7`
- 将**警报保留 > 事件保留 > 保留天数**设为 `30`
- 将**警报保留 > 事件保留 > 保留模式**设为 `all`
- 将**检测保留 > 事件保留 > 保留天数**设为 `30`
- 将**检测保留 > 事件保留 > 保留模式**设为 `all`

</TabItem>
<TabItem value="yaml">

```yaml
record:
  enabled: True
  continuous:
    days: 3
  motion:
    days: 7
  alerts:
    retain:
      days: 30
      mode: all
  detections:
    retain:
      days: 30
      mode: all
```

</TabItem>
</ConfigTabs>

### 减少存储：仅保存检测到画面变动的视频 {#reduced-storage-only-saving-video-when-motion-is-detected}

为了减少存储需求，可以调整配置**只保留检测到画面变动**和活动的视频。

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 全局配置 > 录制" />。

- 将**启用录制**设为开启
- 将**画面变动保留 > 保留天数**设为 `3`
- 将**警报保留 > 事件保留 > 保留天数**设为 `30`
- 将**警报保留 > 事件保留 > 保留模式**设为 `motion`
- 将**检测保留 > 事件保留 > 保留天数**设为 `30`
- 将**检测保留 > 事件保留 > 保留模式**设为 `motion`

</TabItem>
<TabItem value="yaml">

```yaml
record:
  enabled: True
  motion:
    days: 3
  alerts:
    retain:
      days: 30
      mode: motion
  detections:
    retain:
      days: 30
      mode: motion
```

</TabItem>
</ConfigTabs>

### 最小方案：仅保存警报视频 {#minimum-alerts-only}

如果只想保留检测追踪到的目标活动期间的视频，可以参考以下配置。不属于[核查](../configuration/review.md)中**警报**的视频将不会保留。

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 全局配置 > 录制" />。

- 将**启用录制**设为开启
- 将**连续保留 > 保留天数**设为 `0`
- 将**警报保留 > 事件保留 > 保留天数**设为 `30`
- 将**警报保留 > 事件保留 > 保留模式**设为 `motion`

</TabItem>
<TabItem value="yaml">

```yaml
record:
  enabled: True
  continuous:
    days: 0
  alerts:
    retain:
      days: 30
      mode: motion
```

</TabItem>
</ConfigTabs>

## 预捕获和后捕获

`pre_capture` 和 `post_capture` 设置控制在警报或检测之前和之后各包含多少秒的视频。这些参数可以为警报和检测独立配置，可以全局设置，也可以针对每个摄像头进行覆盖。

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 全局配置 > 录制" /> 设置全局默认值，或导航到 <NavPath path="设置 > 摄像头配置 > （选择摄像头）> 录制" /> 为特定摄像头进行覆盖。

| 字段                                       | 说明                                  |
| ------------------------------------------ | ------------------------------------- |
| **警报保留 > 预捕获秒数**                  | 在警报事件之前包含的视频秒数          |
| **警报保留 > 后捕获秒数**                  | 在警报事件之后包含的视频秒数          |
| **检测保留 > 预捕获秒数**                  | 在检测事件之前包含的视频秒数          |
| **检测保留 > 后捕获秒数**                  | 在检测事件之后包含的视频秒数          |

</TabItem>
<TabItem value="yaml">

```yaml
record:
  enabled: True
  alerts:
    pre_capture: 5 # 警报之前包含的秒数
    post_capture: 5 # 警报之后包含的秒数
  detections:
    pre_capture: 5 # 检测之前包含的秒数
    post_capture: 5 # 检测之后包含的秒数
```

</TabItem>
</ConfigTabs>

- **默认值**：预捕获和后捕获均为 5 秒。
- **预捕获最大值**：60 秒。
- 这些设置按核查类别（警报和检测）应用，而非按目标类型。

### 预/后捕获如何与保留模式交互

`pre_capture` 和 `post_capture` 值定义了核查项前后的**时间窗口**，但实际保留在磁盘上的录制片段还必须匹配配置的**保留模式**。

- **`mode: all`** — 保留捕获窗口内的所有片段，无论是否检测到画面变动。
- **`mode: motion`**（默认） — 仅保留捕获窗口内包含画面变动的片段。这包括有活动追踪目标的片段，因为目标移动意味着画面变动。即使在预/后捕获范围内，没有画面变动的片段也会被丢弃。
- **`mode: active_objects`** — 仅保留捕获窗口内追踪目标正在积极移动的片段。有一般画面变动但没有活动目标的片段将被丢弃。

这意味着使用默认的 `motion` 模式时，如果捕获窗口的部分内容没有画面变动，你看到的录像可能少于配置的预/后捕获时长。

要确保始终保留完整的预/后捕获时长：

```yaml
record:
  enabled: True
  alerts:
    pre_capture: 10
    post_capture: 10
    retain:
      days: 30
      mode: all # 保留捕获窗口内的所有片段
```

:::note

由于录制片段以 10 秒为单位写入，预捕获时间取决于片段边界。实际的预捕获录像可能比配置的精确值略短或略长。

:::

### 在哪里查看预/后捕获录像

预捕获和后捕获的录像包含在**录制时间线**中，可在历史记录视图中查看。注意，预/后捕获设置仅影响哪些录制片段被**保留在磁盘上**——它们不会改变界面中显示的起止时间点。历史记录视图仍将以核查项的实际时间范围为中心，但你可以在时间线上前后拖动浏览已保留的预/后捕获录像。浏览视图显示的是按追踪目标实际可见时间裁剪的特定目标片段，因此预/后捕获时间不会反映在那里。

## 配置录制保留策略 {#configuring-recording-retention}

Frigate 支持连续录制和基于追踪`物体/目标`的录制，具有独立的保留模式和保留期限。

:::tip

保留配置支持小数，例如可以设置为保留`0.5`天（12 小时）。

:::

### 连续录制 {#continuous-and-motion-recording}

可以通过以下配置设置保留连续录制的天数（X 为数字），默认情况下连续录制被禁用。

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 全局配置 > 录制" />。

| 字段                       | 说明                          |
| -------------------------- | ----------------------------- |
| **启用录制**               | 为所有摄像头启用或禁用录制    |
| **连续保留 > 保留天数**    | 保留连续录制的天数            |
| **画面变动保留 > 保留天数** | 保留画面变动录像的天数        |

</TabItem>
<TabItem value="yaml">

```yaml
record:
  enabled: True
  continuous:
    days: 1 # <- 保留连续录制的天数
  motion:
    days: 2 # <- 保留画面变动录像的天数
```

</TabItem>
</ConfigTabs>

连续录制支持不同的保留模式，[详见下文](#configuring-recording-retention)。

### 针对识别到的物体/目标的录制 {#object-recording}

可以为分类为警报和检测的回放条目分别指定保留天数。

<ConfigTabs>
<TabItem value="ui">

导航到 <NavPath path="设置 > 全局配置 > 录制" />。

| 字段                                           | 说明                        |
| ---------------------------------------------- | --------------------------- |
| **启用录制**                                   | 为所有摄像头启用或禁用录制  |
| **警报保留 > 事件保留 > 保留天数**             | 保留警报录制的天数          |
| **检测保留 > 事件保留 > 保留天数**             | 保留检测录制的天数          |

</TabItem>
<TabItem value="yaml">

```yaml
record:
  enabled: True
  alerts:
    retain:
      days: 10 # <- 保留警报录制的天数
  detections:
    retain:
      days: 10 # <- 保留检测录制的天数
```

</TabItem>
</ConfigTabs>

此配置将保留与警报和检测重叠的录制片段 10 天。由于多个追踪 物体/目标 可能引用相同的录制片段，这样可以避免存储重复内容并减少总体存储需求。

## 可以只在特定时间进行"连续"录制吗？

通过 Frigate 页面、Home Assistant 或 MQTT，可以设置摄像头只在特定情况或时间进行录制。

## 如何导出录制文件 {#how-do-i-export-recordings}

可以通过在**核查**页面中右键点击（电脑）或长按（手机）回放条目，或在**历史**页面中点击导出按钮来导出录制。导出的录制会通过主导航栏中的导出页面进行管理和搜索。

### 使用 FFmpeg 参数自定义导出

对于高级用例，[自定义导出 HTTP API](../integrations/api/export-recording-custom-export-custom-camera-name-start-start-time-end-end-time-post.api.mdx) 允许你在导出录制时传递自定义 FFmpeg 参数：

```
POST /export/custom/{camera_name}/start/{start_time}/end/{end_time}
```

请求体接受 `ffmpeg_input_args` 和 `ffmpeg_output_args`，用于控制编码、帧率、滤镜和其他 FFmpeg 选项。如果两者均未提供，Frigate 默认使用延时输出设置（25 倍速，30 FPS）。

以下示例以 60 倍速、25 FPS 导出延时视频：

```json
{
  "name": "Front Door Time-lapse",
  "ffmpeg_output_args": "-vf setpts=PTS/60 -r 25"
}
```

#### CPU 回退

如果配置了硬件加速且导出失败（例如 GPU 不可用），在请求体中设置 `cpu_fallback: true` 可自动使用软件编码重试。

```json
{
  "name": "My Export",
  "ffmpeg_output_args": "-c:v libx264 -crf 23",
  "cpu_fallback": true
}
```

:::note

非管理员用户被限制使用可以访问文件系统的 FFmpeg 参数（如 `-filter_complex`、文件路径和协议引用）。管理员用户对 FFmpeg 参数拥有完全控制权限。

:::

:::tip

当配置了 `hwaccel_args` 时，导出会使用硬件编码。可以通过设置摄像头级别的 `hwaccel_args` 来为每个摄像头覆盖此设置（例如当摄像头分辨率超过硬件编码器限制时）。使用无法识别的值或空字符串会回退到软件编码（libx264）。

:::

:::tip

要减小输出文件大小，可在 `ffmpeg_output_args` 中添加 FFmpeg 参数 `-qp n`（其中 `n` 为量化参数值）。调整该值可以在你的场景中平衡质量和文件大小。

:::

## Apple 设备 H.265 流兼容性说明 {#apple-compatibility-with-h265-streams}

使用 Safari 浏览器的 Apple 设备在播放 H.265 格式录制时可能出现兼容性问题。为确保在 Apple 设备上的正常播放，建议启用[Apple 兼容性选项](/configuration/camera_specific.md#safari浏览器下的h265摄像头支持)。

## 同步媒体文件与磁盘 {#syncing-media-files-with-disk}

当数据库条目被删除但对应的文件仍保留在磁盘上时，媒体文件（事件快照、事件缩略图、核查缩略图、预览、导出和录制）可能成为孤立文件。

正常运行可能会在 Frigate 的计划清理之前留下少量孤立文件，但崩溃、配置更改或升级可能导致更多 Frigate 无法清理的孤立文件。此功能会检查文件系统中的媒体文件，并删除数据库中未被引用的任何文件。

可以使用 Frigate 界面中的维护面板或 API 端点 `POST /api/media/sync` 来触发媒体同步。使用 API 时，会返回一个任务 ID，操作在服务器上继续进行。可以通过 `/api/media/sync/status/{job_id}` 端点检查状态。

设置 `verbose: true` 会将每个孤立文件和数据库条目的详细报告写入 `/config/media_sync/<job_id>.txt`。对于录制，报告会将孤立的数据库条目（磁盘上缺少文件的数据库记录）与孤立文件（磁盘上没有对应数据库记录的文件）分开。

:::warning

此操作会占用大量 CPU 资源，并包含一个安全阈值：如果超过 50% 的文件将被删除，则中止操作。仅在必要时运行。如果你设置了 `force: true`，将绕过安全阈值；除非你确定删除是预期行为，否则不要使用 `force`。

:::

## 理解存储用量 {#understanding-storage-usage}

Frigate 报告的存储用量不会与操作系统使用 `df` 或 `du` 报告的完全一致。这是正常现象，不是 bug。以下各节解释了 Frigate 如何得出其存储数据，以及为什么它们与磁盘自身的统计不同。

### Frigate 如何测量录制用量

存储指标页面（<NavPath path="系统 > 存储" />）上的**录制内容**值——以及每个摄像头的**摄像头存储**明细——是 Frigate 已写入的录制片段大小的总和，数据取自 Frigate 的数据库。它**不是**通过扫描磁盘计算得出的。Frigate 以这种方式追踪用量是出于设计考虑：反复遍历整个磁盘来统计大小会使硬盘保持旋转状态并增加不必要的 I/O。

旁边显示的磁盘**总量**，以及 Frigate 用于决定何时删除录制的可用空间数据，则来自操作系统对挂载在 `/media/frigate` 的整个文件系统的报告。因此，页面上的**未使用**值是_磁盘总容量减去 Frigate 的录制内容_——而非磁盘的实际可用空间，当磁盘上存储了其他任何内容时，实际可用空间会更低。

### 哪些计入用量——以及为什么与 `df` 不一致

只有**录制片段**（`/media/frigate/recordings`）包含在录制存储总量中。许多其他内容会消耗实际的磁盘空间，但**不属于**该数值：

- **快照和缩略图**（`/media/frigate/clips`）——参见[快照](/configuration/snapshots)。它们的保留独立于录制。
- **预览视频**和**核查缩略图**（同样位于 `/media/frigate/clips` 下）。
- **导出文件**（`/media/frigate/exports`）——导出文件永远不会被保留策略删除。
- **数据库、已下载的检测模型，以及人脸/车牌训练图像**（存储在 `/config` 下）。
- **增强功能的调试图像**（`/media/frigate/clips`）——启用后，车牌识别的 `debug_save_plates` 和生成式 AI 的 `debug_save_thumbnails` 会保存车牌裁剪图和请求图像以供故障排除。

这些文件通常是"其他"或看似未计入的存储空间的解释——它们是真实的，属于 Frigate，只是不属于_录制_总量。这也是为什么将**录制内容**数值与 `df -h` 比较时总是存在差距：`df` 还会计算磁盘上的任何非 Frigate 数据、文件系统开销和保留块（ext4 默认为 root 保留约 5%，因此磁盘可能在录制接近总量之前就显示"已满"），以及最近删除但空间尚未回收的录制。

:::tip

存储页面并非旨在作为系统级的磁盘监控器——它显示的是 _Frigate 的录制内容_ 占用了多少空间。要查看真实的磁盘使用情况，请在主机上使用 `df -h`（可用空间）和 `du -sh`（每目录使用量）。

:::

### 可用空间与 `/media/frigate` 挂载

Frigate 报告的是**在容器内**实际挂载在 `/media/frigate` 的文件系统的容量和可用空间。如果外部驱动器或网络共享并未真正挂载在那里——缺少 `/etc/fstab` 条目、容器启动时共享离线，或主机未传递该路径——容器将回退到主机的操作系统磁盘，Frigate 将正确报告那个较小的磁盘，而非你预期的驱动器。

如果报告的容量与你的驱动器不匹配，需要检查的是挂载，而非 Frigate。从容器内部验证实际挂载的内容：

```bash
docker exec -it frigate df -h /media/frigate
docker exec -it frigate mount | grep media
```

有关卷的预期配置方式，请参阅[存储挂载布局](/frigate/installation#storage)。

### `/tmp/cache` 区域是独立的

录制片段首先写入 `/tmp/cache`——一个小型内存（`tmpfs`）区域——然后经过检查再移动到 `/media/frigate/recordings`。由于它是独立的且容量较小，`/tmp/cache` 可能会被填满并产生 `No space left on device` 错误，即使录制磁盘有大量空间——它们是不同的存储区域。请参阅[录制故障排除](/troubleshooting/recordings)以诊断缓存和慢速存储问题。

### 当指标与磁盘上的内容不匹配时

由于用量是在数据库中追踪的，直接在磁盘上删除录制文件——或升级后遗留的文件——不会更新报告的用量，甚至可能使其超过 100%。Frigate 不会感知它未录制的文件，也不会自动计数或删除它们。使用[同步媒体文件与磁盘](#syncing-media-files-with-disk)来协调数据库与磁盘上的实际内容。

## 存储空间不足时 Frigate 会删除旧录制吗？ {#will-frigate-delete-old-recordings-if-my-storage-runs-out}

会的。Frigate 会持续检查持有 `/media/frigate/recordings` 的**磁盘可用空间**。这与累加每个录制的大小不同：可用空间是操作系统已经在追踪的一个数字，Frigate 可以即时获取它而无需读取你的文件或唤醒磁盘——这也正是它依赖此检查而非扫描驱动器的原因。当剩余录制空间不足约一小时时——根据当前录制码率估算，**而非**固定百分比——Frigate 会删除最早的录制以回收空间并记录日志。此紧急清理会**不考虑保留设置**地优先删除最早的录制。

由于这是基于整个磁盘的可用空间，由此带来两个后果：

- 由于检查使用的是磁盘的实际可用空间，**任何**填满驱动器的内容——包括非 Frigate 文件——都可能触发删除你最早的录制。
- 清理可能在磁盘仍有较大百分比可用时运行（例如在码率较高或摄像头较多的情况下），因为阈值是"剩余录制空间不足约 1 小时"，而非"已满 X%"。

频繁的紧急清理通常意味着你配置的保留时间超过了磁盘可容纳的量。请减少保留天数，使正常的保留清理能跟上，紧急路径很少触发。
