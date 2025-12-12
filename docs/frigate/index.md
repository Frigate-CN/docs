---
frontmatter.title: 'Frigate'
id: index
title: 介绍
slug: /
---

一个完整的本地网络视频录像机（NVR），专为[Home Assistant](https://www.home-assistant.io)设计，具备 AI 目标/物体检测功能。使用 OpenCV 和 TensorFlow 在本地为 IP 摄像头执行实时物体检测。

强烈推荐使用 GPU 或者 AI 加速器（例如[Google Coral 加速器](https://coral.ai/products/) 或者 [Hailo](https://hailo.ai/)等）。它们的运行效率远远高于现在的顶级 CPU，并且功耗也极低。

- 通过[自定义组件](https://github.com/blakeblackshear/frigate-hass-integration)与 Home Assistant 紧密集成
- 设计上通过仅在必要时和必要地点寻找目标，最大限度地减少资源使用并最大化性能
- 大量利用多进程处理，强调实时性而非处理每一帧
- 使用非常低开销的画面变动检测（也叫运动检测）来确定运行目标检测的位置
- 使用 TensorFlow 进行目标检测，并运行在单独的进程中以达到最大 FPS
- 通过 MQTT 进行通信，便于集成到其他系统中
- 根据检测到的物体设置保留时间进行视频录制
- 24/7 全天候录制
- 通过 RTSP 重新流传输以减少摄像头的连接数
- 支持 WebRTC 和 MSE，实现低延迟的实时观看

## 中文社区

欢迎关注我们的[bilibili](https://space.bilibili.com/3546894915602564)，获取最新动态

欢迎加入[QQ 群](https://qm.qq.com/q/9TKCsqbgdO)，一起吹水和讨论

## 截图

![Live View](/img/live-view.png)

![Review Items](/img/review-items.png)

![Media Browser](/img/media_browser-min.png)

![Notification](/img/notification-min.png)
