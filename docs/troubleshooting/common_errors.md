---
id: common_errors
title: 常见错误消息
---

本页面是你在 Frigate 日志中可能看到的错误消息索引，包括每条消息的含义以及下一步该怎么做。它按问题类型组织，而非按记录消息的组件分类。

在开始之前有两件事需要了解：

- **这些消息中有许多来自 FFmpeg、go2rtc、GPU 驱动或操作系统，而不是 Frigate 本身。**Frigate 捕获并重新记录它们的输出，因此 Frigate 界面中显示的日志级别并不总是反映原始严重程度。
- **包装错误将真正原因放在下一行。**当 Frigate 记录诸如 `Error occurred when attempting to maintain recording cache` 之类的通用消息时，实际的异常会紧随其后。当摄像头的 FFmpeg 进程退出时，Frigate 会记录 `The following ffmpeg logs include the last 100 lines prior to exit` 并转储该摄像头的 FFmpeg 输出。始终阅读这些行，答案通常就在其中。

## 摄像头连接和流 {#camera-connection-and-streams}

### Connection refused / No route to host / 401 Unauthorized / 404 Not Found {#connection-refused-no-route-to-host-401-404}

这些是 FFmpeg 关于访问摄像头（或 go2rtc 转流）的错误。`Connection refused` 和 `No route to host` 表示该地址没有服务在监听或主机不可达；`401 Unauthorized` 是凭证错误；`404 Not Found` 是流路径错误（或 `restream` 输入指向了不存在的 go2rtc 流名称）。达到并发连接限制的摄像头有时也会对在 VLC 中正常工作的 URL 返回 `refused` 或 `401`。

有关如何隔离流，请参阅 [go2rtc 故障排除](/troubleshooting/go2rtc#1-阅读-go2rtc-日志)。

### No frames received from &lt;camera&gt; in 20 seconds. Exiting ffmpeg... {#no-frames-received-in-20-seconds}

FFmpeg 正在运行，但已停止传送视频达 20 秒，因此 Frigate 的摄像头看门狗将其重启。流至少连接过一次，然后中断：摄像头重启、网络断开、摄像头驱逐了连接，或解码器停滞。如果它循环重复，说明流不稳定。

### Ffmpeg process crashed unexpectedly for &lt;camera&gt; {#ffmpeg-process-crashed-unexpectedly}

检测 FFmpeg 进程自行退出。此消息只是通知；原因在 Frigate 紧接着转储的 100 行 FFmpeg 日志中（在该块中查找 `Failed to sync surface`、`Connection refused`、编解码器或音频错误）。相关的看门狗消息包括 `<camera> exceeded fps limit`，意味着摄像头发送帧的速度超过了 `detect.fps`（通常是摄像头的实际帧率与配置的不同）。

### Non-monotonic DTS / non monotonically increasing dts to muxer / Queue input is backward in time {#non-monotonically-increasing-dts}

这些是 FFmpeg 消息，表示摄像头在视频流或音频流上发送了时间戳乱序的数据包。此类时间戳抖动在 WiFi 摄像头和转流或代理源中很常见；其他原因包括摄像头"智能编解码器"/H.264+/H.265+ 模式或摄像头时钟跳变。持续大量出现这些消息通常会导致流停滞并触发看门狗重启 FFmpeg。

在大多数情况下，解决方法是改善网络、减少系统资源使用或换用非 WiFi 摄像头。一般来说，不推荐使用 WiFi 摄像头。

在视频流上，这可能影响录制：因为录制是直接复制而不重新编码，FFmpeg 无法修复时间戳，分段复用器通常会提前分割，产生 1 秒的分段和缓存积压。参见[录制：分段只有 1 秒长](/troubleshooting/recordings#分段只有-1-秒长)。

在音频流上，消息可能来自输出的音频编码。如果音频流是问题所在，让 go2rtc 对其进行转码可能会有帮助，方法是在摄像头的 go2rtc 流中添加 `#audio=aac`，为所有消费转流的组件产生干净的时间戳。

### RTP: PT=xx: bad cseq (packet loss / reordering) {#bad-cseq}

这是一条 FFmpeg 消息，表示 RTP 数据包乱序到达，这几乎总是意味着流正在使用 UDP 传输。Frigate 的 RTSP 预设会强制使用 TCP，因此看到此消息表明使用了自定义 `input_args`、`preset-rtsp-udp` 或未使用 TCP 的 go2rtc 源。请切换到 TCP，除非你的摄像头[仅支持 UDP](/configuration/camera_specific#仅支持-udp-的摄像头)。

### error while decoding MB / non-existing PPS referenced (corrupt frames) {#error-while-decoding-mb-non-existing-pps}

FFmpeg 解码器消息，表示接收到的视频比特流不完整或损坏。每次流启动时出现几条此类消息是正常的（解码器在第一个关键帧之前连接），Frigate 会丢弃它们。持续出现则表示真正的丢包——来自 WiFi 或饱和链路、过载的摄像头，或由其他问题引起的 FFmpeg 重启循环。应修复底层的不稳定因素，而不是关注这些消息本身。

### Could not find codec parameters for stream ... unspecified size {#could-not-find-codec-parameters}

这是一条 FFmpeg 消息，表示它探测了流但从未看到足够的可解码视频来确定帧大小，通常是因为在长 GOP 流上探测窗口在第一个关键帧之前结束，或者流没有传送可用视频。如果是 Reolink HTTP 流，请使用 `preset-http-reolink`，它会提高探测大小，正是为了解决这种情况。

## 录制 {#recording}

### No new recording segments were created for &lt;camera&gt; in the last 120s {#no-new-recording-segments}

Frigate 的录制看门狗正在重启录制 FFmpeg 进程，因为摄像头停止产生可用的录制。消息措辞区分了不同情况：`No new recording segments` 表示没有新的分段文件到达缓存，说明 ffmpeg 无法从录制流中获取视频；两种 `valid` 变体表示录制正在到达但持续无法通过验证。无论哪种情况，问题都出在摄像头或网络侧，重启是 Frigate 尝试恢复的行为。

参见[录制：未创建新的录制分段](/troubleshooting/recordings#no-new-recording-segments-were-created)。

### Invalid or missing video stream in segment. Discarding. {#invalid-or-missing-video-stream-in-segment}

缓存的录制分段验证失败并被删除，原因是没有可读的视频流或时长不合理。这几乎总是意味着摄像头在分段写入中途停止发送可用的视频：摄像头重启、断开连接、并发连接数耗尽，或链路不稳定（如 WiFi 或故障的交换机端口）。摄像头时间戳损坏（"智能编码" / H.264+ 模式）会导致损坏分段变体。相同的流故障会触发录制看门狗，因此上述重启通常与这些消息同时出现。

参见[录制：分段中视频流无效或缺失](/troubleshooting/recordings#invalid-or-missing-video-stream-in-segment)。

### 录制静默失败无法保存（不兼容的音频编解码器） {#incompatible-audio-codec}

某些摄像头音频编解码器（G.711 变体，如 `pcm_alaw` 和 `pcm_mulaw`）无法存储在 MP4 容器中，因此即使实时画面正常，分段也永远不会最终完成。

参见[录制：不兼容的音频编解码器](/troubleshooting/recordings#不兼容的音频编解码器——录制静默失败)，了解将音频转码为 AAC 的 FFmpeg 预设。

### Error occurred when attempting to maintain recording cache {#error-maintaining-recording-cache}

这是一个通用包装；真正的异常在下一行日志中。通常是 `[Errno 28] No space left on device` 或网络共享上的 `[Errno 17] File exists`。

参见[录制缓存警告和错误](/troubleshooting/recordings#我看到-error--error-occurred-when-attempting-to-maintain-recording-cache-消息)，涵盖此消息及常见的 `Errno` 情况。

## 硬件加速 {#hardware-acceleration}

### Failed to sync surface / Failed to download frame: -5 / Error while filtering {#failed-to-sync-surface}

FFmpeg 与 GPU 驱动之间的 VAAPI/QSV 硬件帧同步失败，不是 Frigate 的 bug。它通常出现在检测流在 GPU 上进行缩放或解码时。

参见 [GPU: Failed to download frame: -5](/troubleshooting/gpu#failed-to-download-frame--5)，其中按顺序列出了修复方法（切换 VAAPI/QSV 预设、更改 `LIBVA_DRIVER_NAME`、使用 H.264 子流、将检测分辨率和 fps 与流匹配）。

### No decoder surfaces left / Can't allocate a surface {#no-decoder-surfaces-left}

两者都表示 GPU 解码表面耗尽：`No decoder surfaces left` 是 NVIDIA NVDEC，`Can't allocate a surface` 是 Intel QSV。这是表面池耗尽，通常是因为在一个 GPU 上同时进行硬件解码的摄像头太多（消费级 NVIDIA 显卡有驱动强制的同时解码会话数量限制）。减少在该 GPU 上解码的摄像头数量，将部分摄像头在 CPU 上解码，或换用无会话数量上限的硬件。

### nvidia-container-cli: nvml error: driver not loaded {#nvidia-container-cli-nvml-error}

这来自 NVIDIA 容器运行时在启动容器时，不是 Frigate 的问题，容器根本不会启动。NVIDIA 驱动未在主机上加载。在排查 Frigate 之前，先确认 `nvidia-smi` 在主机本身上（而不是容器内）是否正常工作。在虚拟机或 LXC 中，驱动必须在客户机内部可用。参见[硬件：Nvidia GPU](/configuration/hardware_acceleration_video)。

## 检测器和模型 {#detectors-and-models}

### Illegal instruction (core dumped) {#illegal-instruction}

进程被 CPU 杀死，因为它执行了不支持的指令。在 Frigate 中有两种不同的原因：

- **Coral EdgeTPU** 在新内核上使用了过时的 gasket 驱动。参见 [EdgeTPU: Illegal instruction](/troubleshooting/edgetpu#尝试以-pci-方式加载-tpu--fatal-python-error-illegal-instruction)。
- **不支持 AVX/AVX2 的 CPU**，在启用语义搜索、人脸识别、车牌识别、分类或音频转录时。这些功能使用的库是用 AVX 编译的，在不支持它的 CPU（通常是 2020 年 Tiger Lake 代之前的 Intel Celeron/Pentium）上会立即崩溃。参见 [CPU 要求](/frigate/planning_setup#cpu)。

### ONNX Runtime InvalidProtobuf / failed to load model {#onnx-invalidprotobuf}

ONNX Runtime 无法解析模型文件。文件存在但其内容不是有效的 ONNX 模型，通常是因为 `model_cache` 中的下载损坏或中断，或者 `model.path` 指向了错误的文件。删除缓存的模型文件让 Frigate 重新下载，并确认 `model.path` 指向实际的 `.onnx` 模型。参见 [ONNX 检测器配置](/configuration/object_detectors#onnx)。

### CUDA failure 999 / CUDA failure 901 {#cuda-failure-999-901}

ONNX Runtime CUDA 错误。`999`（`cudaErrorUnknown`）是通用的、不可恢复的 CUDA 上下文故障，通常是主机和容器之间的驱动/运行时版本不匹配或 GPU 处于异常状态。`901` 是 CUDA 图捕获错误，指向操作不可捕获的自定义模型。对于 `999`，将主机驱动与容器的 CUDA 版本对齐，并确认 GPU 健康。

### Can't get OPTIMIZATION_CAPABILITIES property as no supported devices found {#openvino-no-supported-devices}

OpenVINO 找不到配置的设备（通常是 `GPU` 或 `NPU`）。最常见的原因是 `/dev/dri` 渲染节点未传入容器，或者当集成 GPU 和独立 GPU 共存时映射了错误的渲染节点。

参见 [GPU: no supported devices found](/troubleshooting/gpu#cant-get-optimization_capabilities-property-as-no-supported-devices-found)。

## 内存和存储 {#memory-and-storage}

### Fatal Python error: Bus error {#fatal-python-error-bus-error}

Frigate 共享内存（`/dev/shm`）不足。容器的 `shm_size` 对于检测流的数量和分辨率来说太小，或者你在启动后添加了摄像头但未增加它。

参见[计算所需的 shm-size](/frigate/installation#计算所需的-shm-size)。如果无法增加 `shm_size`，降低 `SHM_MAX_FRAMES` 环境变量可减少 Frigate 每个摄像头缓冲的帧数。

### [Errno 28] No space left on device {#errno-28-no-space-left}

某个文件系统已满：录制卷（`/media/frigate`）、缓存 tmpfs（`/tmp/cache`）或 `/dev/shm`。检查是哪一个，并注意 inode 耗尽可能产生此错误，而 `df -h` 仍显示有可用空间。

参见[录制：No space left on device](/troubleshooting/recordings#我看到-error--error-occurred-when-attempting-to-maintain-recording-cache-消息)。

### 容器退出或重启但日志中没有错误 {#container-exits-with-no-logs}

静默退出通常是主机或容器的内存不足杀手。因为 `/dev/shm` 和 `/tmp/cache` 是内存支持的，它们计入容器的内存限制，因此激进的 shm 或缓存大小设置可能触发它。给容器更多内存，或减少 shm/缓存大小，并检查主机的 OOM 消息（`dmesg`）。

## 数据库 {#database}

### database is locked {#database-is-locked}

SQLite 无法获取写锁。Frigate 的超时已经根据摄像头数量进行了调整，因此在正常的本地磁盘操作下，这基本上只发生在数据库位于网络共享（SMB/NFS）上时（文件锁不可靠），或者两个实例指向同一个文件时。

参见[数据库已锁定](/troubleshooting/faqs#错误-database-is-locked)。

### database disk image is malformed {#database-disk-image-is-malformed}

SQLite 数据库文件已损坏，通常发生在硬断电、网络共享数据库或具有不安全写入语义的文件系统之后。Frigate 不会自动修复它，但通常可以手动恢复数据库。

**首先停止 Frigate**，然后直接处理数据库文件（默认路径 `/config/frigate.db`）。首先检查实际出了什么问题：

```bash
sqlite3 frigate.db "PRAGMA integrity_check;"
```

如果报告的唯一问题是索引相关的（如 `row 14 missing from index recordings_path` 或 `non-unique entry in index ...`），重建索引通常就足够了，且这是破坏性最小的修复：

```bash
sqlite3 frigate.db "REINDEX;"
```

如果完整性检查报告页面或字节级损坏（例如 `Multiple uses for byte 2706 of page 142272`），将可读内容转储到新数据库：

```bash
# 转储仍可读取的内容
sqlite3 frigate.db .dump > frigate.dump

# 保留损坏的文件，然后从转储重建
mv frigate.db frigate.db.bak
cat frigate.dump | sqlite3 frigate.db

# 确认重建的数据库是干净的，这应该打印 "ok"
sqlite3 frigate.db "PRAGMA integrity_check;"
```

存储在损坏页面中的行无法恢复，因此预计会丢失一些追踪目标、核查项或缩略图。录制文件本身是磁盘上的文件，不受影响。

作为最后手段，停止 Frigate，删除 `frigate.db`，然后重启。Frigate 会重新创建它，但现有录制会丢失所有元数据。如果数据库旁边存在 `backup.db`，那是 Frigate 在上次架构迁移之前写入的，恢复它可以恢复该时间点之前的所有内容。

重复损坏通常指向底层存储：将数据库移出网络共享，在树莓派上检查电源供电和 SD 卡或 SSD。

## 启动和 Web 访问 {#startup-and-web-access}

### Unable to start Frigate in safe mode / Starting Frigate in safe mode {#unable-to-start-frigate-in-safe-mode}

当你的配置在启动时验证失败时，Frigate 会打印验证错误（包含行号），然后以**安全模式**启动：一个最小配置，没有摄像头且 MQTT 禁用，因此界面仍然可以访问。在安全模式下，唯一可用的页面是配置编辑器，它显示验证错误，你可以在修复后保存并重启。请注意，录制保留和存储清理在安全模式下**不会**运行，因此不要让低磁盘空间的系统长时间处于此模式。

`Unable to start Frigate in safe mode` 意味着即使是最小配置也失败了，这表明你的 `auth`、`proxy` 或 `database` 部分有错误，或者配置文件根本不是有效的 YAML。安全模式不是持久性的；修复配置并重启，Frigate 会恢复正常。

### 502 Bad Gateway / connection refused to 127.0.0.1:5001 {#502-bad-gateway}

Web 服务器已启动，但 Frigate 后端（端口 5001）尚未响应。到目前为止最常见的原因是页面在启动期间加载：API 最后绑定，在数据库迁移（大型数据库可能需要几分钟）、模型下载和进程启动之后，而 Web 服务器已经在提供服务。等待启动完成。如果持续存在，说明后端未能启动，原因在更早的日志中。这也解释了加载 `/ws` 时出现的 `connection refused to 127.0.0.1:5001`，因为每个经过身份验证的请求首先向该端口发出身份验证子请求。
