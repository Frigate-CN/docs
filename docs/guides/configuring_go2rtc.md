---
id: configuring_go2rtc
title: 配置 go2rtc
---

# 配置 go2rtc
Frigate内置了 go2rtc 功能。
虽然你可以让Frigate直接使用你的摄像头的FFmpeg视频流而不是通过go2rtc，但如果你需要以下功能，则必须配置 go2rtc。使用 go2rtc 有以下优点：

- WebRTC 或 MSE 实时监控，能够支持音频、更高的分辨率和帧率，比仅限于检测流且不支持音频的 jsmpeg 流效果更好
- Home Assistant 集成中摄像头的实时流支持
- RTSP 中继，用于其他用户，以减少与摄像头流的连接数

# 设置 go2rtc 流

首先，你需要在 Frigate 配置文件中添加想用于实时查看的流，配置 go2rtc 连接到你的摄像头流。在这一步中避免更改配置的其他部分。注意，go2rtc 支持[多种不同的流类型](https://github.com/AlexxIT/go2rtc/tree/v1.9.9#module-streams)，不仅仅是 rtsp。

:::tip

为获得最佳体验，你应该将 `go2rtc` 下的流名称设置为与摄像头名称相匹配，这样 Frigate 就可以自动映射并为摄像头使用更好的实时查看选项。

更多信息请参见[实时查看文档](../configuration/live.md#为实时页面设置视频流)。

:::

```yaml
go2rtc:
  streams:
    back: ## <- 这里的back为摄像头名称，根据你的实际情况进行调整
      - rtsp://user:password@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2 ## <- 这里的rtsp为摄像头流地址
```

将此配置添加后，重启 Frigate 并尝试从仪表板点击单个摄像头来观看实时流。它应该比原始的 jsmpeg 流看起来更清晰流畅。

### 如果视频无法播放怎么办？

- 检查日志：

  - 在 Frigate 界面 侧边栏的日志部分访问 go2rtc 日志。
  - 如果 go2rtc 连接摄像头有问题，你应该能在日志中看到一些错误消息。

- 检查 go2rtc Web 界面：如果你在日志中没有看到任何错误，尝试通过 go2rtc 的 web 界面查看摄像头。

  - 在浏览器中访问 1984 端口来访问 go2rtc 的 web 界面。
    - 如果通过 Home Assistant 使用 Frigate，需要启用 1984 端口的 web 界面。
    - 如果使用 Docker，需要在访问 web 界面前转发 1984 端口。
  - 点击特定摄像头的 `stream` 查看是否正在接收摄像头流。

- 检查视频编解码器：

  - 如果摄像头流在 go2rtc 中工作但在浏览器中不工作，可能是视频编解码器不受支持。
  - 如果使用 H265，切换到 H264。参考 go2rtc 文档中的[视频编解码器兼容性](https://github.com/AlexxIT/go2rtc/tree/v1.9.9#codecs-madness)。
  - 如果无法从 H265 切换到 H264，或者流格式不同（如 MJPEG），使用 [FFmpeg 参数](https://github.com/AlexxIT/go2rtc/tree/v1.9.9#source-ffmpeg)重新编码视频。它支持旋转和调整视频源大小以及硬件加速。请记住，将视频从一种格式转换为另一种格式是一项资源密集型任务，使用内置的 jsmpeg 查看可能更好。
    ```yaml
    go2rtc:
      streams:
        back:
          - rtsp://user:password@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2
          - "ffmpeg:back#video=h264#hardware"
    ```

- 如果需要，切换到 FFmpeg：

  - 某些摄像头流可能需要使用 go2rtc 中的 ffmpeg 模块。这会导致启动时间较慢，但与更多流类型兼容。

    ```yaml
    go2rtc:
      streams:
        back:
          - ffmpeg:rtsp://user:password@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2
    ```

  - 如果你能看到视频但没有音频，这很可能是因为你的摄像头的音频流编解码器不是 AAC。
  - 如果可能，在摄像头固件中将摄像头的音频设置更新为 AAC。
  - 如果你的摄像头不支持 AAC 音频，且你想要音频，则需要告诉 go2rtc 按需将音频重新编码为 AAC。这将使用额外的 CPU 并增加一些延迟。要按需添加 AAC 音频，你可以按如下方式更新 go2rtc 配置：

    ```yaml
    go2rtc:
      streams:
        back:
          - rtsp://user:password@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2
          - "ffmpeg:back#audio=aac"
    ```

    如果你需要同时转换音频和视频流，可以使用以下配置：

    ```yaml
    go2rtc:
      streams:
        back:
          - rtsp://user:password@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2
          - "ffmpeg:back#video=h264#audio=aac#hardware"
    ```

    当使用 ffmpeg 模块时，你可以这样添加 AAC 音频：

    ```yaml
    go2rtc:
      streams:
        back:
          - "ffmpeg:rtsp://user:password@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2#video=copy#audio=copy#audio=aac#hardware"
    ```

:::warning

当使用 Frigate 插件时，如果要从外部访问 go2rtc 流（例如通过 VLC），你必须首先启用 RTSP Restream 端口。
你可以在 Home Assistant 中访问 Frigate 插件配置页面，在"显示禁用端口"部分下显示隐藏选项来完成此操作。

:::

## 后续步骤

1. 如果你添加到 go2rtc 的流也被 Frigate 用于 `record` 或 `detect` 角色，你可以将配置迁移到从 RTSP 转流中获取，以减少与摄像头的连接数，如[这里](../configuration/restream#with-single-stream)所示。
2. 如果你的摄像头支持双向通话，还可以[设置 WebRTC](../configuration/live#webrtc-extra-configuration)，使Frigate可以使用双向通话。注意，WebRTC **仅支持** 特定的音频格式，以及可能需要在路由器上开放相关端口。

## 重要注意事项

如果你配置 go2rtc 发布 HomeKit 摄像头流，在配对时配置会写入容器内的 `/dev/shm/go2rtc.yaml` 文件。这些更改必须手动复制到 Frigate 配置的 `go2rtc` 部分，以便在重启后保持不变。