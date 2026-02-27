---
id: homekit
title: HomeKit
---

Frigate 摄像机可以通过 go2rtc 集成到 Apple HomeKit 中。这允许你直接在 iOS、iPadOS、macOS 和 tvOS 设备上的 Apple Home 应用中查看你的摄像机视频流。

## 概述

HomeKit 集成完全通过 go2rtc 处理，go2rtc 内嵌在 Frigate 中。go2rtc 提供必要的 HomeKit 配件协议（HAP）服务器，将你的摄像机暴露给 HomeKit。

## 设置

所有 HomeKit 配置和配对都应通过 **go2rtc WebUI** 完成。

### 访问 go2rtc WebUI

go2rtc WebUI 可通过以下地址访问：

```
http://<frigate_host>:1984
```

将 `<frigate_host>` 替换为 Frigate 服务器的 IP 地址或主机名。需要注意的是，你必须要在容器上打开端口 1984 才能访问 go2rtc WebUI。

### 配对摄像机

1. 导航到位于 `http://<frigate_host>:1984` 的 go2rtc WebUI
2. 使用 `add` 部分将新摄像机添加到 HomeKit
3. 按照屏幕上的指示为你的摄像机生成配对码

## 要求

- Frigate 必须使用主机网络模式在你的本地网络上可访问
- 你的 iOS 设备必须与 Frigate 位于同一网络上
- 端口 1984 必须可访问才能使用 go2rtc WebUI
- 有关详细的 go2rtc 配置选项，请参阅 [go2rtc 文档](https://github.com/AlexxIT/go2rtc)
