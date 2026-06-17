---
id: go2rtc
title: go2rtc
---

Frigate 使用内置的 go2rtc 来驱动多项关键功能：

- WebRTC 或 MSE 实时监控，支持音频、更高分辨率和帧率，而 jsmpeg 流仅限于检测流且不支持音频
- Home Assistant 集成中的摄像头实时流支持
- RTSP 转流，供其他消费者使用以减少与摄像头视频流的连接数

:::tip[大多数用户不再需要手动配置 go2rtc]

**摄像头设置向导**是添加摄像头的推荐方式。在设置 > 全局配置 > 摄像头管理中点击**添加摄像头**，向导会探测你的摄像头并为你写入配置——包括 go2rtc 转流和实时流映射——因此 go2rtc 会自动配置好。

本指南主要适用于**从旧版本升级且现有摄像头尚未使用 go2rtc**的用户，或想手动微调视频流（例如转码浏览器无法播放的编解码器）的用户。无论摄像头如何添加，[go2rtc 故障排除指南](/troubleshooting/go2rtc)都适用。

:::

## 手动添加 go2rtc 流

如果你使用向导添加了摄像头，go2rtc 已配置好——你可以直接跳到[故障排除](/troubleshooting/go2rtc)。以下步骤适用于升级用户中尚未使用 go2rtc 的现有摄像头，或任何想手动配置流的用户。

通过添加要用于实时监控的流来配置 go2rtc 连接到你的摄像头。在此步骤中避免更改配置的其他部分。注意 go2rtc 支持[多种不同的流类型](https://github.com/AlexxIT/go2rtc/tree/v1.9.13#module-streams)，不仅仅是 rtsp。

:::tip

为获得最佳体验，请将 `go2rtc` 下的流名称设置为与摄像头名称一致，这样 Frigate 会自动映射它并能为摄像头使用更好的实时监控选项。

有关更多信息，请参阅[实时监控文档](/configuration/live#setting-streams-for-live-ui)。

:::

```yaml
go2rtc:
  streams:
    back:
      - rtsp://user:password@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2
```

将此添加到配置后，重启 Frigate 并通过从仪表板点击单个摄像头来尝试观看实时流。它应该比原来的 jsmpeg 流看起来更清晰、更流畅。

### 后续步骤

1. 如果你添加到 go2rtc 的流也被 Frigate 用于 `record` 或 `detect` 功能，你可以迁移配置以从 RTSP 转流拉取，以减少与摄像头的连接数，如[此处](/configuration/restream#reduce-connections-to-camera)所示。
2. 如果你的摄像头支持双向通话，你可以[设置 WebRTC](/configuration/live#webrtc-extra-configuration)。注意 WebRTC 仅支持特定的音频格式，可能需要在路由器上开放端口。
3. 如果你的摄像头支持双向通话，你必须使用 `#backchannel=0` 配置你的流，以防止 go2rtc 阻止其他应用程序访问摄像头的音频输出。请参阅转流文档中的[防止 go2rtc 阻止双向音频](/configuration/restream#two-way-talk-restream)。

## 故障排除

如果你的流无法播放、没有音频、CPU 占用过高或有其他异常，请参阅专门的 [go2rtc 故障排除指南](/troubleshooting/go2rtc)。它逐步介绍了如何隔离问题所在，并涵盖了最常见的问题——不支持的编解码器、H.265/HEVC、音频、WebRTC 和双向通话、FFmpeg 8 硬件加速转码以及摄像头特定的怪异行为。

## Homekit 配置

要将摄像头流添加到 Homekit，必须在 Docker 中将 Frigate 配置为使用 `host` 网络模式。完成后，你可以使用 go2rtc Web 界面（通过端口 1984 访问，默认禁用）将摄像头共享导出到 Homekit。所做的任何更改都会自动保存到 `/config/go2rtc_homekit.yml`。
