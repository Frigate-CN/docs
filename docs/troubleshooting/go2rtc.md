---
id: go2rtc
title: go2rtc 故障排除
---

本页涵盖内置 [go2rtc](/configuration/go2rtc) 的常见问题及解决方法，无论你的摄像头是通过设置向导添加的还是手动配置的。

当流无法播放或表现异常时，最重要的第一步是弄清问题出在管线的**哪个**环节。Frigate 的实时监控是一个链式流程——_摄像头 → go2rtc → 你的浏览器_——每个环节的故障原因不同。按顺序进行以下检查，然后跳转到对应的问题类别。

## 首先隔离问题

### 1. 查看 go2rtc 日志

在 Frigate 界面的侧边栏中的系统日志（选择 **go2rtc** 选项卡）中访问 go2rtc 日志。如果 go2rtc 无法连接到你的摄像头，你通常会在这里看到明确的错误——`401 Unauthorized`（凭据错误或编码不正确）、`Connection refused` / `timeout`（IP、端口错误或摄像头达到连接上限）或 `404 Not Found`（RTSP 路径错误或引用的流名称不存在）。

### 2. 在 go2rtc Web 界面中测试流

如果日志看起来正常，在端口 `1984` 上打开 go2rtc 自己的 Web 界面。这是最有用的诊断手段，因为它完全排除了 Frigate 界面的因素。

- 如果通过 Home Assistant 使用 Frigate，请在端口 `1984` 上启用 Web 界面（默认禁用——参见 [Home Assistant 端口](#home-assistant-和端口访问)）。
- 如果使用 Docker，在访问 Web 界面之前转发端口 `1984`。

打开你摄像头的流页面（`http://<frigate_host>:1984/stream.html?src=back`）并尝试每个播放器链接：

- **如果这里也无法播放**，问题在摄像头和 go2rtc之间（编解码器、凭据或传输），_而非_你的浏览器。在修改 Frigate 中的任何内容之前先在源头修复它。
- **如果这里某个播放器可以播放但 Frigate 的实时监控不行**，问题是浏览器/编解码器相关的——比较 **MSE** 和 **WebRTC** 链接。Frigate 优先使用 MSE，仅在 MSE 失败时（或用于双向通话）才尝试 WebRTC。如果 `mode=mse` 可以播放但 `mode=webrtc` 不行，你有 [WebRTC 编解码器问题](#webrtc-和双向通话)；如果都无法播放，你的浏览器无法解码该编解码器（通常是 H.265——参见 [H.265 / HEVC 摄像头](#h265--hevc-摄像头)）。

### 3. 检查协商的编解码器

你可以在 `http://frigate_ip:5000/api/go2rtc/streams`（或 `http://frigate_ip:5000/api/go2rtc/streams/back` 查看单个摄像头）查看详细的流信息——包括 go2rtc 与摄像头协商的确切视频和音频编解码器。这是"我的摄像头实际发送了什么？"的权威答案，比从摄像头 Web 界面猜测可靠得多。它还显示音频轨道是 `sendonly`/`recvonly`，这对[双向通话](#webrtc-和双向通话)很重要。

### 4. 使用 FFmpeg 模块修复编解码器

如果摄像头在 go2rtc 中可以播放但在你的浏览器中不行，则视频或音频编解码器不受支持。浏览器可以可靠地播放 **H.264** 视频和 **AAC** 音频；许多浏览器无法播放 H.265/HEVC，某些摄像头音频（G.711/PCM、MJPEG 容器等）完全无法播放。解决方法是让 go2rtc 使用其 FFmpeg 模块按需重新编码流。

在 Frigate 界面中，这是流源上的**使用兼容模式 (ffmpeg)** 开关；在 YAML 中，它是源 URL 上的 `ffmpeg:` 前缀。

```yaml
go2rtc:
  streams:
    back:
      - rtsp://user:password@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2
      # 在 GPU 上将视频转码为 H.264；仅在浏览器无法播放源编解码器时需要
      - "ffmpeg:back#video=h264#hardware"
```

仅转换音频（保持视频不变），或同时转换两者：

```yaml
go2rtc:
  streams:
    back:
      - rtsp://user:password@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2
      - "ffmpeg:back#audio=aac" # 仅音频——当视频已经可以播放时首选
      # 或同时转换视频和音频：
      # - "ffmpeg:back#video=h264#audio=aac#hardware"
```

:::warning

`#` 修饰符（`#video=`、`#audio=`、`#hardware`、`#backchannel=0`、…）**仅对带有 `ffmpeg:` 前缀的源生效**。将它们添加到裸 `rtsp://…#audio=opus` 源上无效——go2rtc 会忽略它们。同样，当源通过名称引用另一个流时（如 `ffmpeg:back#audio=aac`），名称必须与流键**完全**匹配（区分大小写），否则转码将静默地不会生成。这是最常见的配置错误。在 Frigate 界面中，**使用兼容模式 (ffmpeg)** 开关会为你添加 `ffmpeg:` 前缀。

:::

转码视频非常消耗资源。始终优先使用 `#video=copy`（**复制**选项），仅转换实际不受支持的轨道。如果你必须转码视频且没有可用的硬件编码器，内置的 jsmpeg 视图可能是更好的选择。

## 实时监控黑屏、缓冲或卡在"低带宽模式"

当实时监控显示黑屏、无限转圈或反复降级到较低质量的 jsmpeg 播放器（"低带宽模式"）时，流几乎总是包含浏览器无法通过 MSE 解码的内容——通常是 H.265 视频或非 AAC 音频轨道。在 go2rtc Web 界面（端口 `1984`）中确认：如果 MSE 在那里无法播放，Frigate 也无法播放，因为它使用相同的管线。

解决方法是生成 **H.264 + AAC** 流，可以通过更改摄像头固件编解码器或在 go2rtc 中转码（参见[使用 FFmpeg 模块修复编解码器](#4-使用-ffmpeg-模块修复编解码器)）。还有一些值得检查的事项：

- **将摄像头的 I 帧（关键帧）间隔设置为与其帧率匹配**（或在 Reolink 上设为"1x"），避免"智能"/"+"编解码器如 _H.264+_ 或 _H.265+_。过长的关键帧间隔会将第一个可解码帧延迟到超过 Frigate 的启动超时，从而强制回退到 jsmpeg。参见[摄像头设置建议](/configuration/live#camera-settings-recommendations)。
- **即使视频在 VLC 中可以播放，转圈也永不消失**，通常是因为不可播放的_音频_轨道导致播放停滞。丢弃或转码音频（见下文）。
- **局域网正常但远程/VPN 观看缓冲**，通常是延迟/抖动超过了 MSE 的启动缓冲——设置 [WebRTC](/configuration/live#webrtc-extra-configuration)，它会丢弃延迟帧而不是缓冲。

通用实时监控行为（智能流传输、MSE → WebRTC → jsmpeg 回退链以及如何阅读浏览器控制台错误）在[实时监控常见问题](/configuration/live#live-view-faq)中有详细记录。

## H.265 / HEVC 摄像头

浏览器中的 H.265/HEVC 播放不可靠且因版本而异。WebRTC 在某些浏览器上不支持 H.265，MSE/HEVC 支持因浏览器、操作系统以及是否存在硬件解码器而异。在 VLC、go2rtc Web 界面和 Frigate 录像中播放正常的 H.265 流，在实时监控中仍可能空白。

要获得可靠的实时监控，请为实时监控使用的流使用 **H.264**：

- 将实时监控指向摄像头的 H.264 **子流**，仅将 H.265 主流用于录制，或
- 在 go2rtc 中使用 FFmpeg 模块和 `#hardware` 将 H.265 转码为 H.264（软件 HEVC 转码非常消耗 CPU）。

将浏览器 HEVC 播放视为尽力而为。另请参见[通过 Safari 使用 H.265 摄像头](/configuration/camera_specific#h265-cameras-via-safari)。

## 实时监控无音频

实时监控音频有严格的编解码器要求，因播放器而异：**MSE 需要 AAC、PCMA 或 PCMU**，**WebRTC 需要 Opus、PCMA 或 PCMU**。许多摄像头默认使用这些集合之外的编解码器（或 PCM/G.711），因此播放器仅加载视频，不出现音频控制。

最稳健的方法是通过 FFmpeg 模块转码音频同时复制视频，在同一流上同时提供 AAC 轨道（用于 MSE）和 Opus 轨道（用于 WebRTC）：

```yaml
go2rtc:
  streams:
    back:
      - rtsp://user:password@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2 # 视频 + AAC 用于 MSE
      - "ffmpeg:back#audio=opus" # 为 WebRTC 添加 Opus 轨道
```

如果摄像头的原生音频也不是 AAC，则两者都转码：

```yaml
go2rtc:
  streams:
    back:
      - "ffmpeg:rtsp://user:password@10.0.10.10:554/live0#video=copy#audio=aac" # 视频复制 + AAC 用于 MSE
      - "ffmpeg:back#audio=opus" # Opus 用于 WebRTC
```

将摄像头固件设置为 AAC（和 H.264）可完全避免转码，在摄像头支持时始终是首选。有关更多详情和示例，请参阅[音频支持](/configuration/live#audio-support)。

## WebRTC 和双向通话

WebRTC 仅在 MSE 失败或使用摄像头双向通话功能时才会尝试；"所有摄像头"仪表板从不使用它。当它不工作时，原因几乎总是以下之一：

- **编解码器不匹配**——WebRTC 无法传输 H.265 或 AAC。支持 WebRTC 视图的流必须提供 Opus（或 PCMA/PCMU）音频和 H.264 视频。如上所示添加 `ffmpeg:back#audio=opus` 源。
- **端口 `8555` 不可达或未设置候选项**——WebRTC 需要端口 `8555`（TCP 和 UDP）开放并广播可达的候选项。在自定义/overlay 网络上运行的 Docker 安装中，go2rtc 可能会将不可达的容器 IP 广播为 ICE 候选项；设置 `webrtc.filters.candidates: []` 并仅提供主机局域网 IP 可解决此问题。参见 [WebRTC 额外配置](/configuration/live#webrtc-extra-configuration)。
- **双向通话**还需要安全上下文（HTTPS 或认证端口 `8971`，因为浏览器在纯 HTTP 上阻止麦克风访问）。摄像头的 RTSP 反向通道也必须正确处理——go2rtc 默认抢占反向通道，这会阻止其他消费者的双向音频并可能注入噪声。在主流上使用 `#backchannel=0` 禁用它，并使用单独的专用流进行通话，如[防止 go2rtc 阻止双向音频](/configuration/restream#two-way-talk-restream)中所述。

## 高 CPU 占用

如果 go2rtc 占用大量 CPU，几乎总是在进行软件转码。带有 `#video=h264` 或 `#audio=aac` 编解码器修饰符但**没有** `#hardware` 的 FFmpeg 源会在 CPU 上重新编码。（Frigate 的 `ffmpeg.hwaccel_args` 仅适用于 Frigate 自己的检测/录制进程——它_不会_加速 go2rtc 的转码。）

要保持 CPU 占用低：

- 仅转码真正不受支持的轨道，尽可能使用 `#video=copy` 让视频原封不动地通过。
- 当你必须转码视频时，始终添加 `#hardware`（界面中的**自动**硬件选项），以便在 GPU 上运行编码。注意下文的 [FFmpeg 8 设备要求](#使用-ffmpeg-8-进行硬件加速转码)。
- 不要为了给实时监控供流而转流高分辨率主流——即使使用 `#video=copy`，混合 4K/8MP+ 流本身就非常耗费资源。使用摄像头的低分辨率子流进行实时监控和检测，让 Frigate 直接拉取主流进行录制。

## 连接、认证和复杂密码

如果 go2rtc 对一个在 VLC 中可以正常使用的 URL 记录 `401 Unauthorized`，密码几乎肯定包含保留 URL 字符。**Frigate 会为其 `cameras.ffmpeg.inputs` 进行密码 URL 编码，但不会处理你在 `go2rtc.streams` 下编写的内容**——go2rtc 自己解析该 URL。你必须在 `go2rtc.streams` 部分自行对特殊字符进行 URL 编码（`@` → `%40`、`#` → `%23`、`?` → `%3F`、`%` → `%25` 等）。

注意不对称性：在 `cameras.ffmpeg.inputs` 下你应该使用**原始**密码（Frigate 会为你编码）——在那里预先编码会导致双重编码并失败。参见[处理复杂密码](/configuration/restream#handling-complex-passwords)。

重复的 `401`/`Connection refused` 错误也可能意味着摄像头达到了**并发连接限制**或触发了登录锁定。通过单个 [RTSP 转流](/configuration/restream#reduce-connections-to-camera)路由所有功能意味着摄像头只看到来自 go2rtc 的一个连接。

## 流名称必须到处一致

大量"更好的实时选项不可用"或 `404 Not Found` 问题归结为名称不匹配。同一个字符串必须一致使用：

- **go2rtc 流键**（`go2rtc.streams.<名称>`），
- 任何引用它的 `ffmpeg:<名称>#…` 源，
- 摄像头的转流输入路径（`rtsp://127.0.0.1:8554/<名称>`），以及
- 摄像头名称本身（以便 Frigate 自动为 MSE/WebRTC 映射）——或指向 go2rtc 流**名称**（而非路径）的显式 `live -> streams` 映射。

如果你在试验时重命名或删除了 go2rtc 流，然后实时流选择器显示空白条目，请清除浏览器中 Frigate URL 的站点数据——选择的流是按设备缓存在本地存储中的。

## 摄像头特定行为

多个摄像头品牌有已知的 go2rtc 怪异行为。这里不再重复，请参阅[特定摄像头配置](/configuration/camera_specific)页面，其中有详细介绍。要点：

- **Reolink**——许多型号的 RTSP 不可靠；推荐通过 FFmpeg 模块使用 **http-flv** 流，你必须在摄像头中启用 HTTP/RTMP 并**重启**它。6MP+ 型号通过 http-flv-enhanced 传输 H.265，需要 FFmpeg 8.0。参见 [Reolink 摄像头](/configuration/camera_specific#reolink-cameras)。
- **TP-Link Tapo**——使用 go2rtc 的原生 `tapo://` 源以获得稳定性和双向音频；过期的 RTSP 凭据通常可以通过在 go2rtc Web 界面中点击一次播放来恢复。
- **Ubiquiti/UniFi Protect**——使用 `rtspx://` 方案（不是 `rtsps://…?enableSrtp`）。
- **Amcrest/Dahua**——使用 `/cam/realmonitor?channel=1&subtype=N` 方案，其中 `subtype=0` 是主流。参见 [Amcrest 和 Dahua](/configuration/camera_specific#amcrest--dahua)。

## 非 RTSP 源和 FFmpeg 模块

go2rtc 的原生零拷贝处理仅支持格式良好的 RTSP H.264/H.265。其他任何内容——MJPEG、HTTP/HTTP-FLV、RTMP 或不常见的编解码器——必须通过在源前添加 `ffmpeg:` 前缀交给 FFmpeg 模块。某些摄像头流也需要这样做才能被解析，代价是启动稍慢。MJPEG 和其他非 H.264 源还需要 `#video=h264`（带 `#hardware`）才能用于 `record`、`detect` 或转流功能。完整示例请参见 [MJPEG 摄像头](/configuration/camera_specific#mjpeg-cameras)。

## 使用 FFmpeg 8 进行硬件加速转码

Frigate 0.18 默认搭载 **FFmpeg 8.0**，FFmpeg 8 在硬件加速滤波方面比早期版本更严格。每当 go2rtc 使用硬件加速转码视频时（任何使用 `#hardware`、`#hardware=vaapi` 或界面中的**自动**硬件选项的源），它都会构建一个使用 `hwupload` 滤镜将帧上传到 GPU 的滤波链。FFmpeg 8 现在拒绝这样做，除非被告知**使用哪个设备**——早期版本会自动选择一个。结果是原本可以工作的转码无法启动，实时监控永远无法加载，go2rtc 记录：

```
[hwupload] A hardware device reference is required to upload frames to.
[AVFilterGraph] Error initializing filters
Error opening output files: Invalid argument
```

解决方法是通过 `go2rtc -> ffmpeg -> global` 选项告诉 go2rtc 内置的 FFmpeg 使用哪个硬件设备。对于基于 **VAAPI** 的加速——涵盖大多数 Intel 和 AMD GPU，也是 go2rtc 在该硬件上自动选择的——将其指向你的渲染设备：

```yaml
go2rtc:
  ffmpeg:
    global: "-vaapi_device /dev/dri/renderD128"
  streams:
    back:
      - "ffmpeg:rtsp://user:password@10.0.10.10:554/live0#video=h264#hardware"
```

`/dev/dri/renderD128` 是常用的渲染节点；在有多个 GPU 的系统上你可能需要 `renderD129`（或更高），并且设备必须传入容器（如 Docker Compose 中的 `devices: - /dev/dri:/dev/dri`）。

如果你使用**不同的硬件加速后端**，你可能需要以相同方式指定其设备，使用与该后端匹配的选项而非 `-vaapi_device`。有关背景和其他示例，请参阅 [go2rtc FFmpeg 源文档](https://github.com/AlexxIT/go2rtc/tree/v1.9.13#source-ffmpeg)和上游报告（[go2rtc issue #1984](https://github.com/AlexxIT/go2rtc/issues/1984)）。

:::tip

如果你不在 go2rtc 中使用硬件加速转码，这不会影响你。如果你想完全避免此更改，可以通过在配置中设置 `ffmpeg -> path: "7.0"` 将 Frigate（及其内置的 go2rtc）固定回 FFmpeg 7.0。

:::

## Home Assistant 和端口访问

当作为 Home Assistant 插件运行 Frigate 时，go2rtc API（端口 `1984`）、RTSP 转流（端口 `8554`）和 WebRTC（端口 `8555`）默认**禁用且隐藏**。要使用它们——例如访问 go2rtc Web 界面进行故障排除，或在 VLC 等应用中外部打开 go2rtc 流——前往设置 > 插件 > Frigate > 配置 > 网络，点击**显示已禁用的端口**，启用你需要的端口并保存。使用主机的 IP 地址而非 `homeassistant.local` 等 mDNS 名称。

如果实时监控在 Frigate 界面中可以工作但在 Home Assistant 中不行，最常见的原因是 go2rtc 流名称与摄像头名称不匹配——将主要 go2rtc 流命名为与摄像头完全相同的名称，或添加 `live -> streams` 映射，以便集成可以解析转流。
