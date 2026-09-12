---
frontmatter.title: 'Frigate'
id: index
title: 介绍
slug: /
---

一个完整的本地 NVR，专为 Home Assistant 设计，具备 AI 目标检测功能。使用 OpenCV 和 TensorFlow 在本地为 IP 摄像头执行实时目标检测。

使用[推荐检测器](/frigate/hardware#detectors)是可选的，但强烈推荐。CPU 检测仅应用于测试目的。

- 通过[自定义组件](https://github.com/blakeblackshear/frigate-hass-integration)与 Home Assistant 紧密集成
- 设计上通过仅在必要时和必要地点寻找目标，最大限度地减少资源使用并最大化性能
- 大量利用多进程处理，强调实时性而非处理每一帧
- 使用非常低开销的画面变动检测来确定运行目标检测的位置
- 使用 TensorFlow 进行目标检测，并运行在单独的进程中以达到最大 FPS
- 通过 MQTT 进行通信，便于集成到其他系统中
- 根据检测到的目标设置保留时间进行录像
- 通过 RTSP 转流以减少摄像头的连接数
- 动态组合所有追踪摄像头的鸟瞰视图

## 中文社区

欢迎关注我们的[bilibili](https://space.bilibili.com/3546894915602564)，获取最新动态

欢迎加入[QQ 群](https://qm.qq.com/q/9TKCsqbgdO)，一起吹水和讨论

关注我们的`微信服务号`，获取更新动态，以及我们将会在未来提供微信通知功能。
![微信公众号](/assets/wx-qrcode.jpg)

## 截图 {#screenshots}

![Live View](/img/live-view.png)

![Review Items](/img/review-items.png)

![Media Browser](/img/media_browser-min.png)

![Notification](/img/notification-min.png)
