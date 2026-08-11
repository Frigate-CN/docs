---
id: homekit
title: HomeKit
---

Frigate 摄像机可以通过 go2rtc 导出到 Apple HomeKit。每台导出的摄像机在 iOS、iPadOS、macOS 和 tvOS 设备上的 Apple Home 应用中显示为一个配件。

## 概述 {#overview}

导出摄像机完全通过 go2rtc 处理，go2rtc 内嵌在 Frigate 中。go2rtc 提供必要的 HomeKit 配件协议（HAP）服务器，因此你的摄像机会作为独立配件发布到 HomeKit。

:::note

这与导入 HomeKit 摄像机相反。go2rtc 也可以与现有的 HomeKit 摄像机（Aqara、Eve、Eufy 等）配对并将其用作视频源，这正是 go2rtc WebUI 中 `add` 页面的用途。该页面会发现在你网络上的 HomeKit 配件，不会列出你的 Frigate 摄像机。它不用于导出。

:::

## 要求 {#requirements}

- Frigate 必须以 `network_mode: host` 运行，以便 HomeKit 可以通过 mDNS 发现你的摄像机
- 你的 Apple 设备必须与 Frigate 位于同一网络上
- 端口 1984 必须可访问，以便你能访问 go2rtc WebUI

HomeKit 还对视频流本身有严格限制。go2rtc 直接传递你的视频流而不进行缩放或重新编码，因此你导出的流必须已满足以下要求：

- **视频：** H.264，1920x1080、1280x720 或 320x240
- **音频：** Opus，单声道，16 kHz

摄像机的全分辨率流通常不满足要求。请参阅下方的[导出兼容流](#exporting-a-compatible-stream)。

## 配置 {#configuration}

HomeKit 设置存储在 `/config/go2rtc_homekit.yml` 中。这是与你的 Frigate 配置分开的文件，因为 go2rtc 需要在设备配对时把你的配对信息写回该文件。

使用 go2rtc 配置编辑器编辑它，该编辑器直接写入此文件：

```
http://<frigate_host>:1984/editor.html
```

将 `<frigate_host>` 替换为 Frigate 服务器的 IP 地址或主机名。编辑器最初为空，直到你添加 HomeKit 部分，因为该文件只存放你的 HomeKit 设置，而不是其余 go2rtc 配置。

:::warning

不要将 `homekit:` 部分放在 Frigate 配置的 `go2rtc:` 部分中。

Frigate 每次启动都会重新生成该配置，因此 go2rtc 无法将你的配对信息保存到其中。配对看似成功，但下次重启后会因 `PairVerify with unknown client_id` 而失败。如果该部分同时存在于两个位置，你保存的配对信息会在每次重启时被清除。

:::

为每台要导出的摄像机添加一个条目。键必须与 go2rtc 流的名称匹配，PIN 必须是 8 位数字。这是 Home 应用称为设置代码的数字：

```yaml
homekit:
  front_door:
    name: Front Door
    pin: "12345678"
```

如果键与 go2rtc 流不匹配，go2rtc 会在启动时记录 `[homekit] missing stream:` 日志，该摄像机不会出现在 Home 应用中。

:::note

go2rtc 根据此键派生每个配件的 HomeKit 身份，因此稍后重命名它会导致摄像机显示为新配件，需要重新配对。在配对前确定名称。

:::

Frigate 启动时只保留此文件中的 `homekit:` 部分，因此不要在其中存储流或其他 go2rtc 设置。

### 导出兼容流 {#exporting-a-compatible-stream}

如果摄像机的流不满足上述要求，在 Frigate 配置中定义缩放的转流，并让 HomeKit 指向该流而不是原始流：

```yaml
go2rtc:
  streams:
    front_door:
      - rtsp://user:password@192.168.1.50:554/stream
    front_door_homekit:
      - "ffmpeg:front_door#video=h264#width=1280#height=720#audio=opus/16000"
```

```yaml
# /config/go2rtc_homekit.yml
homekit:
  front_door_homekit:
    name: Front Door
    pin: "12345678"
```

添加 `#hardware=cuda`、`#hardware=vaapi` 或适合你系统的值以使用 GPU 进行转码。请注意，NVENC 无法编码宽度超过 4096 像素的 H.264，因此非常宽的流必须如上所示缩小，而不仅仅重新编码。

## 配对摄像机 {#pairing-cameras}

1. 添加 `homekit:` 部分后重启 Frigate
2. 在 Apple Home 应用中，选择**添加配件**，然后选择**更多选项**手动输入代码
3. 选择你的摄像机并输入你配置的 PIN 作为设置代码
4. 确认 `/config/go2rtc_homekit.yml` 中摄像机的下方现在出现 `pairings:` 列表

配对信息会自动保存回该文件。如果第 4 步未显示 `pairings:` 列表，请检查 Frigate 日志中的 `[homekit] can't save`，这意味着 `/config/go2rtc_homekit.yml` 中缺少 `homekit:` 部分。

有关详细的 go2rtc 配置选项，请参阅 [go2rtc 文档](https://github.com/AlexxIT/go2rtc)。
