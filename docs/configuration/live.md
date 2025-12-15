---
id: live
title: 实时监控页面
---

Frigate 能够智能地在实时监控页面仪表板上显示你的摄像头流。默认情况下，Frigate 采用的“智能视频流”技术，当没有检测到活动时，摄像头图像每分钟更新一次以节省带宽和资源。一旦检测到任何画面变动或有活动目标，摄像头会无缝切换到实时流。

::: warning

需要注意的是，在没配置`go2rtc`时，默认使用的`jsmpeg`方法是没有声音的。如果希望实时监控能够听到声音，请参考[文档](../guides/configuring_go2rtc.md)来配置`go2rtc`。

:::

### 实时监控页面技术

Frigate 智能地使用三种不同的视频流技术在仪表板和单摄像头页面上显示你的摄像头流，根据网络带宽、播放器错误或双向通话等功能需求在不同可用模式间切换。要获得最高质量和流畅度的实时监控页面，需要按照[逐步指南](../guides/configuring_go2rtc.md)配置内置的`go2rtc`。

使用`jsmpeg`会消耗更多浏览器和客户端 GPU 资源。强烈推荐使用 [go2rtc](../guides/configuring_go2rtc.md)，它能提供更流畅的体验。

| 来源   | 帧率                              | 分辨率 | 音频                   | 需要 go2rtc | 说明                                                                                                   |
| ------ | --------------------------------- | ------ | ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| jsmpeg | 与`detect -> fps`相同，上限 10fps | 720p   | 无                     | 否          | 分辨率可配置，但如需更高分辨率和更好帧率推荐使用 go2rtc。未配置 go2rtc 时 Frigate 将默认采用这个方式。 |
| mse    | 原生                              | 原生   | 是(取决于音频编解码器) | 是          | iPhone 需要 iOS 17.1+，Firefox 仅支持 h.264。配置 go2rtc 后 Frigate 将默认采用这个方式。               |
| webrtc | 原生                              | 原生   | 是(取决于音频编解码器) | 是          | 需要额外配置。当 MSE 失败或使用摄像头双向通话功能时，Frigate 会尝试使用 WebRTC。                       |

### 摄像头设置建议

如果使用 go2rtc，应在摄像头固件中调整以下设置以获得最佳实时监控页面体验：

- 视频编解码器：**H.264** - 提供与所有实时监控页面技术和浏览器最兼容的视频编解码器。避免使用任何"智能编解码器"或"+"编解码器，如**H.264+**或**H.265+**以及**Smart H.265**等，这些非标准编解码器会移除关键帧(见下文)。
- 音频编解码器：**AAC** - 提供与所有支持音频的实时监控页面技术和浏览器最兼容的音频编解码器。
- I 帧间隔（也叫关键帧间隔、帧间空间或 GOP 长度）：匹配摄像头的帧率，或选择"1x"(对于 Reolink 摄像头的帧间空间)。例如，如果你的流输出 20fps，I 帧间隔应为 20（或 Reolink 上的 1x）。高于帧率的值会导致流开始播放时间更长。有关关键帧的更多信息，请参阅[此页面](https://gardinal.net/understanding-the-keyframe-interval/)。对于多数用户而言这可能不是什么问题，但需注意：若你同时将视频流用于`record`（录制）功能，1 倍关键帧间隔（i-frame interval）会导致更高的存储空间占用

摄像头的默认视频和音频编解码器可能不总是与你的浏览器兼容，这就是为什么建议将它们设置为`H.264`和`AAC`。有关编解码器支持信息，请参阅[go2rtc 文档](https://github.com/AlexxIT/go2rtc?tab=readme-ov-file#codecs-madness)。

### 音频支持

MSE 需要`PCMA/PCMU`或`AAC`音频，WebRTC 需要`PCMA/PCMU`或`opus`音频。如果想同时支持 MSE 和 WebRTC，则需要在转流配置中确保两者都启用。

```yaml
go2rtc:
  streams:
    rtsp_cam: # <- RTSP流
      - rtsp://192.168.1.5:554/live0 # <- 支持视频和AAC音频的流
      - 'ffmpeg:rtsp_cam#audio=opus' # <- 将音频转码为缺失编解码器(通常是opus)的视频流副本
    http_cam: # <- HTTP流
      - http://192.168.50.155/flv?port=1935&app=bcs&stream=channel0_main.bcs&user=user&password=password # <- 支持视频和AAC音频的流
      - 'ffmpeg:http_cam#audio=opus' # <- 将音频转码为缺失编解码器(通常是opus)的视频流副本
```

如果摄像头不支持 AAC 音频或实时监控页面有问题，尝试直接转码为 AAC 音频：

```yaml
go2rtc:
  streams:
    rtsp_cam: # <- RTSP流
      - 'ffmpeg:rtsp://192.168.1.5:554/live0#video=copy#audio=aac' # <- 复制视频流并将音频转码为AAC
      - 'ffmpeg:rtsp_cam#audio=opus' # <- 提供WebRTC支持
```

如果摄像头没有音频且实时监控页面有问题，应让 go2rtc 仅发送视频：

```yaml
go2rtc:
  streams:
    no_audio_camera:
      - ffmpeg:rtsp://192.168.1.5:554/live0#video=copy
```

### 为实时监控页面设置视频流

可以配置 Frigate 允许手动选择要在实时页面中查看的视频流。例如，你可能想在移动设备上查看摄像头的子流，而在桌面设备上查看全分辨率流。设置`live -> streams`列表将在页面的实时监控页面中填充一个下拉菜单，让你可以选择不同的流。此流设置是**独立保存在设备**的，保存在浏览器的本地存储中。

此外，在界面中创建和编辑摄像头组时，可以选择要用于摄像头组实时仪表板的视频流。

:::note

Frigate 的默认仪表板（所有摄像头）在播放摄像头实时流时将始终使用你在`streams:`中定义的第一个条目。

:::

使用“别名”以及 go2rtc 流名称来配置`streams`选项。

使用 Frigate 内置的 go2rtc 是使用此功能的必要条件。不能在`live > streams`配置中指定视频流地址，只能指定 go2rtc 流名称。

```yaml
go2rtc:
  streams:
    test_cam: # [!code highlight]
      - rtsp://192.168.1.5:554/live_main # <- 支持视频和AAC音频的流
      - 'ffmpeg:test_cam#audio=opus' # <- 将音频转码为opus以支持webrtc的流副本
    test_cam_sub:
      - rtsp://192.168.1.5:554/live_sub # <- 支持视频和AAC音频的流
    test_cam_another_sub:
      - rtsp://192.168.1.5:554/live_alt # <- 支持视频和AAC音频的流

cameras:
  test_cam:
    ffmpeg:
      output_args:
        record: preset-record-generic-audio-copy
      inputs:
        - path: rtsp://127.0.0.1:8554/test_cam # <--- 这里的名称必须与转流中的摄像头名称匹配
          input_args: preset-rtsp-restream
          roles:
            - record
        - path: rtsp://127.0.0.1:8554/test_cam_sub # <--- 这里的名称必须与转流中的camera_sub名称匹配
          input_args: preset-rtsp-restream
          roles:
            - detect
    live:
      streams: # <--- Frigate 0.16及更高版本支持多流
        主流: test_cam # <--- 指定"别名"后跟 go2rtc 流名称 [!code highlight]
        子流: test_cam_sub
        特殊流: test_cam_another_sub
```

### WebRTC 额外配置 {#webrtc-extra-configuration}

WebRTC 通过在端口`8555`上创建 TCP 或 UDP 连接工作。但是，它需要额外配置：

- 对于外部访问(通过互联网)，设置路由器将端口`8555`(TCP 和 UDP)转发到 Frigate 设备的端口`8555`。
- 对于局域网/本地访问，除非通过 HA 插件运行，否则还需要在 go2rtc 配置中设置 WebRTC 候选列表。例如，如果`192.168.1.10`是运行 Frigate 设备的本地 IP：

  ```yaml title="config.yml"
  go2rtc:
    streams:
      test_cam: ...
    webrtc: # [!code ++]
      candidates: # [!code ++]
        - 192.168.1.10:8555 # [!code ++]
        - stun:8555 # [!code ++]
  ```

- 对于通过 Tailscale 的访问，必须将 Frigate 系统的 Tailscale IP 添加为 WebRTC 候选。Tailscale IP 都以`100.`开头，并保留在`100.64.0.0/10` CIDR 块中。
- 请注意，某些浏览器可能不支持 H.265（HEVC）编码。你可以通过[此链接](https://github.com/AlexxIT/go2rtc?tab=readme-ov-file#codecs-madness)查看当前浏览器版本是否兼容 H.265。

:::tip

如果 Frigate 已作为 Home Assistant 插件安装，可能不需要此额外配置，因为 Frigate 使用 Supervisor 的 API 生成 WebRTC 候选。

但是，如果出现问题，建议手动定义候选。如果 Frigate 插件未能生成有效候选，你应该这样做。如果发生错误，你将在初始化期间的插件日志页面中看到类似以下的警告：

```log
[WARN] Failed to get IP address from supervisor
[WARN] Failed to get WebRTC port from supervisor
```

:::

:::note

如果 WebRTC 正常运行遇到困难，并且你正在使用 docker 运行 Frigate，可以尝试更改容器网络模式：

- `network: host`，在此模式下不需要转发任何端口。Frigate 容器内的服务将完全访问主机机器的网络接口，就像它们原生运行而不是在容器中一样。这个模式必须解决任何端口冲突。虽然 go2rtc 推荐此网络模式，但我们建议仅在必要时使用。
- `network: bridge`是默认网络驱动程序，桥接网络是转发网络段间流量的链路层设备。需要转发任何希望从主机 IP 访问的端口。

如果不在主机模式下运行，需要为容器映射端口`8555`：

docker-compose.yml

```yaml
services:
  frigate:
    ...
    ports:
      - "8555:8555/tcp" # WebRTC tcp 模式
      - "8555:8555/udp" # WebRTC udp 模式
```

:::

有关更多信息，请参阅[go2rtc WebRTC 文档](https://github.com/AlexxIT/go2rtc/tree/v1.8.3#module-webrtc)。

### 双向通话 {#two-way-talk}

对于支持双向通话的设备，可以配置 Frigate 从 Web UI 的摄像头实时监控页面中使用该功能。你应该：

- 设置 go2rtc 与[WebRTC](#webrtc-extra-configuration)。
- 确保通过 https 访问 Frigate(可能需要[打开端口 8971](/frigate/installation/#端口))。
- 对于 Home Assistant Frigate 卡片，[按照文档](http://card.camera/#/usage/2-way-audio)获取正确的源。

要使用 Reolink 门铃的双向通话，应使用[推荐的 Reolink 配置](/configuration/camera_specific#reolink-cameras)

请查看 [go2rtc 代码库](https://github.com/AlexxIT/go2rtc?tab=readme-ov-file#two-way-audio) 中支持双向通话的摄像头列表，来确定你摄像头兼容性。对于属于 `ONVIF Profile T` 类别的摄像头，你可以使用 [ONVIF 合规产品数据库](https://www.onvif.org/conformant-products/) 的功能列表来检查是否存在 `AudioOutput`（音频输出）功能。支持 `ONVIF Profile T` 的摄像头**通常**也支持该功能，但由于支持情况不一致，即使明确列出此功能的摄像头也可能无法正常工作。如果数据库中没有你的摄像头，建议不要购买该摄像头，或咨询制造商的客服以了解该功能是否可用。

为防止 go2rtc 阻止其他应用程序访问你摄像头的双向音频，你必须将流配置为 `#backchannel=0`。请参阅重流文档中的 [防止 go2rtc 阻止双向音频](../configuration/restream.md#two-way-talk-restream)。

### 摄像头组仪表板上的视频流选项

Frigate 在摄像头组编辑面板中提供了一个对话框，其中包含几个用于摄像头组仪表板上视频流的选项。这些设置是*每设备*的，并保存在你设备的本地存储中。

- 使用`live -> streams`配置选项选择流（详见上文[**为实时监控页面设置视频流**](#为实时监控页面设置视频流)）
- 视频流类型：
  - **无视频流**：摄像头图像每分钟仅更新一次，不会进行实时视频流。
  - **智能视频流**(默认，推荐设置)：当没有检测到活动时，智能视频流每分钟更新一次摄像头图像以节省带宽和资源，因为画面没有什么变化。当检测到画面变动或目标时，图像无缝切换到实时流。
  - **持续视频流**：当在仪表板上可见时，摄像头图像始终是实时流，即使没有检测到活动。连续视频流可能导致高带宽使用和性能问题，**请谨慎使用。**
- **兼容模式**：仅当摄像头的实时流显示颜色伪影且图像右侧有对角线时才启用此选项。在启用之前，尝试将摄像头的`detect`宽度和高度设置为标准宽高比(例如：640x352 变为 640x360，800x443 变为 800x450，2688x1520 变为 2688x1512 等)。根据你的浏览器和设备，可能不支持同时使用兼容模式的多个摄像头，因此只有在更改配置无法解决颜色伪影和对角线时才使用此选项。

:::note

默认情况下仪表板下的“所有摄像头”将始终使用智能视频流（除非你已在系统设置中全局禁用了自动实时监控功能），或在`streams`配置了的情况下使用设置的第一个条目。如果想更改这些默认设置中的任何一个，请创建一个摄像头组然后单独进行设置。“所有摄像头”组下无法调整视频流是预期行为。

:::

### 禁用摄像头

可以通过 Frigate 页面和[MQTT](../integrations/mqtt#frigatecamera_nameenabledset)临时禁用摄像头以节省系统资源。禁用时，Frigate 的 ffmpeg 进程将终止并停止录制，同时暂停目标检测，实时仪表板显示禁用消息的空白图像。仍可通过页面访问禁用摄像头的回放条目、追踪目标和历史录像。

:::note
通过 Frigate 页面或 MQTT 禁用摄像头是临时操作，重启 Frigate 后就会恢复。
:::

对于转流摄像头，go2rtc 保持活动状态，但除非有外部客户端使用(如 Home Assistant 中的高级摄像头卡片使用 go2rtc 源)，否则不会使用系统资源进行解码或处理。

注意，通过配置文件禁用的摄像头(`enabled: False`)会移除页面上该摄像头所有相关内容，包括历史录像访问。要保留访问权限同时禁用摄像头，请在配置中保持启用状态，并在页面上或使用 MQTT 临时禁用它。

### Live player error messages

When your browser runs into problems playing back your camera streams, it will log short error messages to the browser console. They indicate playback, codec, or network issues on the client/browser side, not something server side with Frigate itself. Below are the common messages you may see and simple actions you can take to try to resolve them.

- **startup**

  - What it means: The player failed to initialize or connect to the live stream (network or startup error).
  - What to try: Reload the Live view or click _Reset_. Verify `go2rtc` is running and the camera stream is reachable. Try switching to a different stream from the Live UI dropdown (if available) or use a different browser.

  - Possible console messages from the player code:

    - `Error opening MediaSource.`
    - `Browser reported a network error.`
    - `Max error count ${errorCount} exceeded.` (the numeric value will vary)

- **mse-decode**

  - What it means: The browser reported a decoding error while trying to play the stream, which usually is a result of a codec incompatibility or corrupted frames.
  - What to try: Check the browser console for the supported and negotiated codecs. Ensure your camera/restream is using H.264 video and AAC audio (these are the most compatible). If your camera uses a non-standard audio codec, configure `go2rtc` to transcode the stream to AAC. Try another browser (some browsers have stricter MSE/codec support) and, for iPhone, ensure you're on iOS 17.1 or newer.

  - Possible console messages from the player code:

    - `Safari cannot open MediaSource.`
    - `Safari reported InvalidStateError.`
    - `Safari reported decoding errors.`

- **stalled**

  - What it means: Playback has stalled because the player has fallen too far behind live (extended buffering or no data arriving).
  - What to try: This is usually indicative of the browser struggling to decode too many high-resolution streams at once. Try selecting a lower-bandwidth stream (substream), reduce the number of live streams open, improve the network connection, or lower the camera resolution. Also check your camera's keyframe (I-frame) interval — shorter intervals make playback start and recover faster. You can also try increasing the timeout value in the UI pane of Frigate's settings.

  - Possible console messages from the player code:

    - `Buffer time (10 seconds) exceeded, browser may not be playing media correctly.`
    - `Media playback has stalled after <n> seconds due to insufficient buffering or a network interruption.` (the seconds value will vary)

## 实时监控页面常见问题

1. **为什么我的实时监控页面中没有声音？**

   你必须要给摄像头配置[go2rtc](../configuration/guides/configuring_go2rtc.md)后的视频流才能在实时监控中听到声音。如果已配置 go2rtc，需要确保摄像头发送 PCMA/PCMU 或 AAC 音频。如果无法更改摄像头的音频编解码器，需要使用 go2rtc[转码音频](https://github.com/AlexxIT/go2rtc?tab=readme-ov-file#source-ffmpeg)。

   请注意，低带宽模式下播放器仅播放画面。即使已设置 go2rtc，也**不能够在低带宽模式下听到声音**。

2. **Frigate 显示我处于"低带宽模式"。这是什么意思？**

   Frigate 根据多种因素（例如用户选择的模式（如双向通话）、摄像头的设置、浏览器功能和可用带宽等）智能选择实时视频流技术，并优先尽可能快地显示摄像头流的最新实时监控页面。

   配置 go2rtc 后，实时监控页面最初尝试使用更清晰、流畅的视频流技术 (MSE) 加载和播放流。而 加载超时、达到流缓冲的低带宽条件 或 视频流解码错误 将导致 Frigate 切换到分配`detect`功能的视频流，并使用 jsmpeg 格式进行传输。这就是页面标记为“低带宽模式”的原因。在实时仪表板上，当配置智能视频流且活动停止时，模式会自动重置。详情页面没有自动重置机制，但可以使用右上角设置中的**重置**选项强制重新加载流。

   Errors in stream playback (e.g., connection failures, codec issues, or buffering timeouts) that cause the fallback to low bandwidth mode (jsmpeg) are logged to the browser console for easier debugging. These errors may include:

   - Network issues (e.g., MSE or WebRTC network connection problems).
   - Unsupported codecs or stream formats (e.g., H.265 in WebRTC, which is not supported in some browsers).
   - Buffering timeouts or low bandwidth conditions causing fallback to jsmpeg.
   - Browser compatibility problems (e.g., iOS Safari limitations with MSE).

   To view browser console logs:

   1. Open the Frigate Live View in your browser.
   2. Open the browser's Developer Tools (F12 or right-click > Inspect > Console tab).
   3. Reproduce the error (e.g., load a problematic stream or simulate network issues).
   4. Look for messages prefixed with the camera name.

   These logs help identify if the issue is player-specific (MSE vs. WebRTC) or related to camera configuration (e.g., go2rtc streams, codecs). If you see frequent errors:

   - Verify your camera's H.264/AAC settings (see [Frigate's camera settings recommendations](#camera_settings_recommendations)).
   - Check go2rtc configuration for transcoding (e.g., audio to AAC/OPUS).
   - Test with a different stream via the UI dropdown (if `live -> streams` is configured).
   - For WebRTC-specific issues, ensure port 8555 is forwarded and candidates are set (see (WebRTC Extra Configuration)(#webrtc-extra-configuration)).
   - If your cameras are streaming at a high resolution, your browser may be struggling to load all of the streams before the buffering timeout occurs. Frigate prioritizes showing a true live view as quickly as possible. If the fallback occurs often, change your live view settings to use a lower bandwidth substream.

3. **我的摄像头似乎没有在实时仪表板上实时播放。为什么？**

   在默认实时仪表板("所有摄像头")上，当没有检测到活动时，摄像头图像每分钟更新一次以节省带宽和资源。一旦检测到任何活动，摄像头无缝切换到全分辨率实时流。如果想自定义此行为，请使用**摄像头组**。

4. **我在实时监控页面上看到一条奇怪的对角线，但我的录像看起来没问题。如何修复？**

   这是由于`detect`**宽度或高度设置不正确**(或自动检测不正确)导致的，导致 jsmpeg 播放器的渲染引擎显示略微失真的图像。应将`detect`分辨率放大到标准宽高比(例如：640x352 变为 640x360，800x443 变为 800x450，2688x1520 变为 2688x1512 等)。如果将分辨率更改为匹配标准(4:3、16:9 或 32:9 等)宽高比无法解决问题，可以在摄像头组仪表板的流设置中启用"兼容模式"。根据你的浏览器和设备，可能不支持同时使用兼容模式的多个摄像头，因此只有在更改`detect`宽度和高度无法解决颜色伪影和对角线时才使用此选项。

5. **“智能视频流”如何工作？**

   因为场景的静态图像看起来与没有画面变动或活动的实时流完全相同，智能视频流在没有检测到活动时每分钟更新一次摄像头图像以节省带宽和资源。一旦发生任何活动(画面变动或检测到目标/音频检测)，摄像头无缝切换到实时流。

   此静态图像从配置中`detect`角色定义的流中提取。当检测到活动时，`detect`流的图像立即开始以约 5 帧/秒的速度更新，以便你可以看到活动，直到实时播放器加载并开始播放。这通常只需要一两秒钟。如果实时播放器超时、缓冲或有视频流错误，则加载 jsmpeg 播放器并从`detect`角色播放仅视频流。当活动结束时，销毁播放器并显示静态图像，直到再次检测到活动，然后重复此过程。

   智能视频流依赖于正确调整摄像头的画面变动`threshold`和`contour_area`配置值。使用 UI 设置中的画面变动调谐器实时调整这些值。

   Frigate 默认并推荐使用此设置，因为它能显著节省网络带宽，特别是使用高分辨率摄像头的情况下。

6. **我已取消静音某些面板上的摄像头，但还是听不到声音。为什么？**

   如果你的摄像头正在播放视频流（如右上角的红点所示，或设置为连续视频流模式），你的浏览器可能会在你与页面交互前阻止音频播放。这是**浏览器有意设计**的限制。详见[这篇文章](https://developer.mozilla.org/zh-CN/docs/Web/Media/Guides/Autoplay#%E8%87%AA%E5%8A%A8%E6%92%AD%E6%94%BE%E5%8A%9F%E8%83%BD%E7%AD%96%E7%95%A5)。许多浏览器都有白名单功能可以更改此行为。

7. **我的摄像头画面出现大量花屏以及失真 ​​**

部分摄像头硬件不支持高分辨率视频流的多路连接，可能导致这种画面问题。这种情况建议使用`go2rtc`对高分辨率视频流做[转流](restream.md)处理，专门用于实时监控画面和录像存储。

8. **Why does my camera stream switch aspect ratios on the Live dashboard?**

   Your camera may change aspect ratios on the dashboard because Frigate uses different streams for different purposes. With go2rtc and Smart Streaming, Frigate shows a static image from the `detect` stream when no activity is present, and switches to the live stream when motion is detected. The camera image will change size if your streams use different aspect ratios.

   To prevent this, make the `detect` stream match the go2rtc live stream's aspect ratio (resolution does not need to match, just the aspect ratio). You can either adjust the camera's output resolution or set the `width` and `height` values in your config's `detect` section to a resolution with an aspect ratio that matches.

   Example: Resolutions from two streams

   - Mismatched (may cause aspect ratio switching on the dashboard):

     - Live/go2rtc stream: 1920x1080 (16:9)
     - Detect stream: 640x352 (~1.82:1, not 16:9)

   - Matched (prevents switching):
     - Live/go2rtc stream: 1920x1080 (16:9)
     - Detect stream: 640x360 (16:9)

   You can update the detect settings in your camera config to match the aspect ratio of your go2rtc live stream. For example:

   ```yaml
   cameras:
     front_door:
       detect:
         width: 640
         height: 360 # set this to 360 instead of 352
       ffmpeg:
         inputs:
           - path: rtsp://127.0.0.1:8554/front_door # main stream 1920x1080
             roles:
               - record
           - path: rtsp://127.0.0.1:8554/front_door_sub # sub stream 640x352
             roles:
               - detect
   ```
