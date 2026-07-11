---
id: recordings
title: 录制故障排除
---

## 为什么我的录制不工作？（录制列表为空，"No recordings found for this time"）

如果 Frigate 显示实时视频但历史视图为空，或者你看到"No recordings found for this time"（未找到此时间段的录制），原因几乎总是以下三类之一。片段首先写入 RAM 缓存，只有在满足保留策略（retention）_且_摄像头的 `record` 流产生有效、可存储的视频时，才会移动到磁盘。按顺序排查：保留策略配置是迄今为止最常见的原因。

在深入排查之前，为录制维护程序启用调试日志，以便查看片段是否被写入磁盘：

```yaml
logger:
  logs:
    frigate.record.maintainer: debug
```

正常工作的摄像头会记录类似 `Copied /media/frigate/recordings/{segment_path} in 0.2 seconds` 的日志行。如果你从未看到这些日志，说明没有片段到达磁盘，问题指向摄像头/流或存储部分。

### 保留策略配置问题

#### 录制已启用，但没有任何内容被保存

这是最常见的原因。仅设置 `record.enabled: True` **不会**保存任何录像：**连续录制默认是禁用的**，缓存中的片段只有在匹配已配置的保留策略时才会被移动到磁盘。你必须至少配置 `continuous`、`motion`、`alerts` 或 `detections` 保留策略之一。

要保存所有视频（最保守的选项），配置连续保留策略：

```yaml
record:
  enabled: True
  continuous:
    days: 3 # 保留所有录像 3 天
```

参见[录制](/configuration/record)了解完整的常用配置选项，包括减少存储和仅警报的配置方案。

#### 画面变动或事件录制保存的内容比你预期的少

如果你只配置了 `motion`、`alerts` 或 `detections` 保留策略（没有 `continuous`），Frigate 会根据保留策略的 `mode` 选择性保留录像：

- **`mode: motion`**（默认）仅保留包含画面变动的片段。如果你的[画面变动遮罩](/configuration/motion_detection)覆盖了活动发生的区域，或者画面变动灵敏度太低，即使录制已"开启"，也不会保留任何内容。
- **`mode: active_objects`** 仅保留有被追踪目标正在移动的片段。
- **`mode: all`** 保留窗口内的每个片段。

如果你期望连续录像但只配置了画面变动/事件保留策略，请按上述方式添加 `continuous` 保留期。要验证画面变动是否真的被检测到，请在调试视图或界面的 Motion Tuner（画面变动调节器）中观察画面变动框。

#### 警报和检测录制需要正常工作的目标检测

`alerts` 和 `detections` 保留策略只保留与被追踪目标时间重叠的录像，因此它们依赖目标检测正常运行：

- **检测必须启用。** 如果 `detect: enabled: False`，则永远不会创建警报或检测，因此警报/检测保留策略不保留任何内容。（连续和画面变动录制在检测禁用时仍然工作。）
- **目标必须被你的模型支持。** 如果你追踪你的模型不支持的 targets（例如默认模型下的 `deer` 或 `license_plate`），Frigate 永远不会检测到它，也永远不会为其录制。检查日志中的警告并移除不支持的目标或切换到包含它们的模型（例如 [Frigate+](/plus/)）。

#### 你在使用过时的教程

配置键在主版本之间会变化。例如，旧的 `clips` 配置已经很久不存在了。如果你从旧的博客文章或视频中复制了配置，请根据当前的[参考配置](/configuration/advanced/reference)验证每一个键。

### 摄像头和流问题

#### 不兼容的音频编解码器（录制静默失败无法保存）

Frigate 将录像存储在 MP4 容器中，某些摄像头的音频编解码器（最常见的是 `pcm_alaw`、`pcm_mulaw` 或其他 G.711 变体）**无法放入 MP4 容器**。当发生这种情况时，ffmpeg 无法写入片段，不会保存任何录像，即使实时画面正常。这是 Tapo、TP-Link VIGI 和某些 Reolink 摄像头的常见原因。

使用适当的 [ffmpeg 预设](/configuration/ffmpeg_presets)将音频转码为 AAC（或完全丢弃）：

```yaml {3,4}
cameras:
  your_camera:
    ffmpeg:
      output_args:
        record: preset-record-generic-audio-aac # 将音频转码为 AAC
        # 或 preset-record-generic 以录制无音频的视频
```

#### 录制流无法连接

类似 `No new recording segments were created for <camera> in the last 120s` 的消息意味着 ffmpeg 无法读取 `record` 流。诊断方法：

- 确认在你的摄像头 `ffmpeg.inputs` 中确实有一个流被分配了 `record` 角色。
- 打开 go2rtc 网页界面（端口 `1984`），点击每个流确认其能正常播放。go2rtc 错误如 `wrong response on DESCRIBE` 或 `start from CONN state` 表示摄像头连接失败。
- 在 VLC 或 `ffplay` 中测试确切的 RTSP URL（使用正确的路径、端口和凭据）。
- 如果你通过 go2rtc 重流传流，确保 `record` 输入路径指向正确的 go2rtc 流名称。在摄像头之间复制配置时忘记更新流名称是一个常见错误。

#### 录制回放无视频（或完全无法播放）

Frigate 直接复制 `record` 流而不重新编码，因此回放取决于你的浏览器是否支持摄像头的编解码器。H265/HEVC 录像可能在某些浏览器中无法播放。如果录像显示为仅音频或黑屏，你的摄像头可能在发送你的浏览器无法解码的编解码器。配置摄像头输出 **H264** 以获得最大的兼容性。

#### 片段仅约 1 秒长

如果录制流使用"Smart Codec"/H.264+ 模式或在流传输中途更改编码参数，损坏的时间戳会导致片段被过于频繁地分割并填满缓存。这会产生"Too many unprocessed recording segments"警告。参见[下方章节](#i-see-the-message-warning--too-many-unprocessed-recording-segments-in-cache-for-camera-this-likely-indicates-an-issue-with-the-detect-stream)了解完整诊断。

### 存储和挂载问题

#### 存储卷未正确挂载

如果录制卷（`/media/frigate`）指向错误位置、不可写，或网络/加密挂载在启动时挂载失败，Frigate 无法保存录制，或者会静默写入到启动驱动器，然后因为驱动器看起来远小于预期而激进地清除。

- 将主机的实际容量（`df -h`）与 Frigate 界面中**存储**页面报告的内容进行对比。不匹配（例如 Frigate 报告约 220 GB 而你的存储驱动器是 4 TB）意味着绑定挂载解析到了错误的文件系统。
- 验证 Docker `volumes` 映射中的主机路径（`- /your/storage:/media/frigate`）存在且容器可写。
- 对于可能间歇性失败的挂载，使用 `chattr +i` 保护空目录的挂载点，这样当挂载缺失时 Frigate 会报错（而不是静默写入启动驱动器）。
- 检查 `dmesg` 和系统日志，查看录制消失时间点附近是否有文件系统或 I/O 错误。

如果录制确实正在写入但复制太慢无法跟上，参见下方["无法跟上录制片段"](#i-see-the-message-warning--unable-to-keep-up-with-recording-segments-in-cache-for-camera-keeping-the-5-most-recent-segments-out-of-6-and-discarding-the-rest)章节。

## 我已将 Frigate 配置为仅在有画面变动时录制，但即使没有画面变动也似乎在录制。为什么？

你需要：

- 确保摄像头的时间戳被画面变动遮罩覆盖。即使场景中没有画面变动，如果画面变动检测设置过于敏感，可能会将时间戳计为画面变动。
- 如果启用了音频检测，请记住任何高于`min_volume`的音频都会被视为画面变动。
- 通过编辑配置文件或使用UI中的画面变动调节器来[调整你的画面变动检测设置](../configuration/motion_detection.md)。

## 我看到警告信息：WARNING : Unable to keep up with recording segments in cache for camera. Keeping the 5 most recent segments out of 6 and discarding the rest...（无法跟上摄像头录制片段的缓存。保留6个中最新的5个片段，丢弃其余部分...）

这个警告意味着录制维护程序无法足够快地将录制片段从 RAM 缓存移动到磁盘。当缓存填满时，Frigate 会丢弃最旧的片段以避免内存耗尽和崩溃，因此你会丢失录制的录像。这几乎总是存储吞吐量或系统资源问题。按以下步骤排查原因。

### 第 1 步：启用录制调试日志

第一步是测量每个片段从 RAM 缓存移动到磁盘所需的时间。为录制维护程序启用调试日志：

```yaml
logger:
  logs:
    frigate.record.maintainer: debug
```

这会添加显示每个片段复制耗时的日志行：

```
DEBUG   : Copied /media/frigate/recordings/{segment_path} in 0.2 seconds.
```

让它运行直到警告开始出现，这样你可以确认在错误发生时磁盘是否确实在变慢。

### 第 2 步：解读复制时间

复制耗时告诉你该朝哪个方向调查：

- **持续长于约 1 秒**：你的存储无法跟上传入的录制。继续第 3-5 步诊断慢存储。
- **持续远低于 1 秒**：存储足够快，问题更有可能是 CPU 或资源争用。跳到第 6 步。

### 第 3 步：检查内存、交换空间、缓存和磁盘利用率

如果 CPU、内存、磁盘吞吐量或总线 I/O 不足，Frigate 内部的任何设置都无法帮助。在警告发生时检查每个可用系统资源的方面。

### 第 4 步：检查你的存储类型

挂载网络共享是存储录制的流行选择，但这可能导致复制时间减慢并造成问题。一些用户发现使用 `NFS` 而不是 `SMB` 可以显著减少复制时间并解决问题。同时确保运行 Frigate 的设备与网络共享之间的网络连接稳定且快速也很重要。饱和或不可靠的链路会阻塞复制。

### 第 5 步：检查你的挂载选项

一些用户发现通过 `fstab` 使用 `sync` 选项挂载驱动器会导致性能大幅下降并引发此问题。使用 `async` 替代可以大大减少复制时间。

### 第 6 步：排除 CPU 负载

如果复制时间持续低于 1 秒但你仍看到警告，机器的 CPU 负载可能太高，导致 Frigate 没有足够的资源来跟上。尝试暂时关闭其他服务和任何资源密集型的 Frigate 功能，看看问题是否改善。

## 我看到警告信息：WARNING : Too many unprocessed recording segments in cache for camera. This likely indicates an issue with the detect stream...（缓存中未处理的录制片段过多，这通常表明检测流存在问题...）

这个警告意味着受影响摄像头的检测流已落后或停止处理帧。Frigate 的录制缓存保存着等待检测器分析的片段。当堆积超过 6 个片段时，Frigate 会丢弃最旧的片段以防止缓存填满。

:::warning

此错误是一个**症状**，不是根因。实际原因总是记录在这些消息**开始出现之前**的日志中。你必须查看从 Frigate 启动到首次出现此警告的完整日志，以确定真正的问题。

:::

### 第 1 步：获取完整日志

收集从 Frigate 启动到错误首次出现的完整日志。查找在"Too many unprocessed"消息**之前**出现的错误或警告。根因就在那里。

### 第 2 步：检查缓存目录

进入 Frigate 容器并检查录制缓存：

```
docker exec -it frigate ls -la /tmp/cache
```

每个摄像头应该只有少量 `.mp4` 片段文件。如果某个摄像头的文件数量明显多于其他摄像头，该摄像头就是问题来源。单个摄像头的问题可能连锁反应导致所有摄像头出现此错误。

### 第 3 步：验证片段时长

录制片段应该大约 10 秒长。对缓存中的片段运行 `ffprobe` 检查：

```
docker exec -it frigate ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 /tmp/cache/<camera>@<segment>.mp4
```

如果片段只有 ~1 秒而不是 ~10 秒，摄像头正在发送损坏的时间戳数据，导致片段被过于频繁地分割，以预期速度 10 倍的速度填满缓存。

**短片段的常见原因：**

- **摄像头上启用了"Smart Codec"或"Smart+"**：这些功能在流传输中途动态更改编码参数，这会损坏时间戳。在摄像头设置中禁用它们。
- **在流传输中更改编解码器、比特率或分辨率**：活动流期间的任何编码更改都可能导致不可预测的片段分割。
- **摄像头固件错误**：检查摄像头制造商的固件更新。

:::tip

你无需手动运行 `ffprobe` 来检查此问题。打开摄像头的**摄像头探测信息**对话框（系统 → 系统指标 → 摄像头页面上的信息图标），检查**关键帧分析**部分。它会探测录制流并标记稀疏或可变的关键帧，这正是智能/"+"编解码器（H.264+/H.265+）和过长关键帧间隔所产生的问题。

:::

### 第 4 步：检查检测器是否卡住

如果检测流不处理帧，片段将堆积。常见原因：

- **检测分辨率过高**：使用子码流进行检测，而非全分辨率主流。
- **检测 FPS 过高**：5 fps 是检测的推荐上限。
- **模型过大**：使用较小的模型变体（例如 YOLO `s` 或 `t` 尺寸，而非 `e` 或 `x`）。使用 320x320 输入尺寸而非 640x640，除非你拥有强大的专用检测器。
- **虚拟化**：在虚拟机中运行 Frigate（尤其是 Proxmox）可能导致检测器挂起或停顿。这是虚拟化环境中 GPU/TPU 直通的已知问题，不是 Frigate 能修复的。推荐在裸机上以 Docker 方式运行 Frigate。

### 第 5 步：检查 GPU 是否挂起

在宿主机上，检查 `dmesg` 中是否有 GPU 相关错误：

```
dmesg | grep -i -E "gpu|drm|reset|hang"
```

类似 `trying reset from guc_exec_queue_timedout_job` 的消息或其他 GPU 重置/挂起消息表示驱动或硬件问题。确保你的内核和 GPU 驱动（尤其是 Intel）是最新的。

### 第 6 步：验证硬件加速配置

不正确的 `hwaccel_args` 预设可能导致 ffmpeg 静默失败或消耗过多 CPU，使检测器资源不足。

- 升级 Frigate 后，验证你的预设是否匹配你的硬件（例如 `preset-intel-qsv-h264` 而非已弃用的 `preset-vaapi`）。
- 对于 h265 摄像头，使用对应的 h265 预设（例如 `preset-intel-qsv-h265`）。
- 注意 `hwaccel_args` 仅与检测流相关。Frigate 不解码录制流。

### 第 7 步：验证 go2rtc 流配置

确保 go2rtc 配置中的 ffmpeg 源名称与正确的摄像头流匹配。配置错误的流名称（例如在摄像头之间复制配置时忘记更新流引用）将导致使用错误的流或流完全失败。

### 第 8 步：检查系统资源

如果以上都不适用，问题可能是一般性资源限制。在宿主机上监控以下内容：

- **CPU 使用率**：CPU 过载会阻止检测器跟上。
- **RAM 和交换空间**：过度交换会显著减慢所有 I/O 操作。
- **磁盘 I/O**：使用 `iotop` 或 `iostat` 检查是否饱和。
- **存储空间**：验证 Frigate 存储卷上有可用空间（检查 Frigate 界面中的存储页面）。

尝试暂时禁用资源密集型功能如 `genai` 和 `face_recognition`，看问题是否解决。这可以帮助判断检测器是否被占用资源。

## 我看到错误信息：ERROR : Error occurred when attempting to maintain recording cache（尝试维护录制缓存时发生错误）

此消息意味着录制维护程序在将片段从缓存移动到磁盘时遇到了错误。这是一个**通用包装器**：实际原因总是记录在**紧接的下一行**。Frigate 通常会恢复并继续运行，但任何受影响的片段都会丢失，所以值得解决。


:::warning

始终阅读紧接此消息的下一行。"Error occurred when attempting to maintain recording cache"本身不告诉你任何信息；下一行的异常（例如 `[Errno 28] No space left on device` 或 `[Errno 17] File exists`）才是真正的问题。

:::

由于这些是操作系统级别的错误，必须在**宿主机**上解决，而不是在 Frigate 的配置中。下面是常见的底层错误。

### [Errno 28] No space left on device（设备空间不足）

Frigate 正在写入的文件系统已满。需要检查的事项：

- **录制卷确实已满。** 用 `df -h` 检查映射到 `/media/frigate` 的路径在宿主机上的可用空间，并查看 Frigate 界面中的**存储**页面。
- **磁盘显示有可用空间但仍然是"满的"。** 这通常意味着文件系统的 **inode** 已用完（用 `df -i` 检查），或者由于不正确的绑定挂载，录制落到了与你预期不同的、更小的文件系统上。参见上方[存储卷未正确挂载](#存储卷未正确挂载)。
- **`/tmp/cache` 已满。** 如果你将 `/tmp/cache` 挂载为小的 `tmpfs`，积压的片段会填满它。增加 tmpfs 大小，或者解决导致片段堆积的原因（参见上方[缓存中未处理的录制片段过多](#i-see-the-message-warning--too-many-unprocessed-recording-segments-in-cache-for-camera-this-likely-indicates-an-issue-with-the-detect-stream)章节）。
- **宿主机在 Frigate 能清除之前阻止写入。** 在某些系统上（例如 Unraid 有填充阈值），宿主机在 Frigate 的紧急清理能运行之前就停止写入。在卷上留出更多余量，或降低保留策略让 Frigate 更快清除。

### [Errno 17] File exists（文件已存在，伴随 ffmpeg "Error writing trailer" 或 "unable to re-open output file"）

类似 `[Errno 17] File exists: '/media/frigate/recordings/.../<camera>'` 的错误，经常伴随 ffmpeg 错误如 `Unable to re-open ... output file for shifting data` 或 `Error writing trailer: No such file or directory`，这是**不可靠的网络共享**（NFS 或 SMB）的标志。挂载正在断开、提供过时的目录条目或处理文件锁定有误。

- 确认到 NAS 的网络连接稳定且快速。间歇性链路会零星产生这些错误。
- 对于录制挂载，推荐**使用 NFS 而非 SMB**；多位用户发现 NFS 更可靠、更快。
- 检查你的 `fstab`/挂载选项中影响一致性或性能的设置（参见上方第 5 步中的 `sync` vs `async` 说明）。
- 启用 `frigate.record.maintainer` 调试日志以确认错误是否与共享不可用的时间点吻合。

### 错误引用了你手动重命名或删除的摄像头名称

如果下一行错误引用了一个在你的配置中不再存在的摄像头名称，那么是来自重命名或删除操作的孤立数据留在了持久化的 `/tmp/cache` 卷中。

- 按[安装文档](/frigate/installation#storage)中推荐的，为 `/tmp/cache` 使用 `tmpfs` 挂载，可以防止旧摄像头名称下的过期缓存文件在重启后依然存在，从而完全避免此问题。
- 如果错误持续存在，停止 Frigate 并从 `/tmp/cache` 中删除旧摄像头名称的任何残留片段。