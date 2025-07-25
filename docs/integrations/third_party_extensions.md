---
id: third_party_extensions
title: 第三方扩展
---

作为开源项目，其他开发者可以修改和扩展Frigate已有的丰富功能。
本页面旨在概述可以添加到家庭NVR设置中的扩展。此列表并非详尽无遗，可以通过PR方式扩展到Frigate文档中。这些服务大多设计为通过5000端口与Frigate的未认证API接口进行交互。

:::warning

本页面不对展示的项目进行推荐或评级。
在系统上安装任何内容之前，请使用您自己的知识来评估和审查它们。

:::
高级摄像头卡片
高级摄像头卡片
## [高级摄像头卡片（原名Frigate卡片）](https://card.camera/#/README)

[高级摄像头卡片](https://card.camera/#/README) 是一款与Frigate深度集成的Home Assistant仪表盘组件。

## [Double Take](https://github.com/skrashevich/double-take)

[Double Take](https://github.com/skrashevich/double-take)为人脸识别的图像处理和训练提供了统一的UI和API。
它支持自动为Frigate中检测和识别到的人物对象设置子标签。
这是[原始Double Take项目](https://github.com/jakowenko/double-take)的一个分支（修复了错误并添加了新功能），不幸的是，原始项目已不再由作者维护。

## [Frigate Notify](https://github.com/0x2142/frigate-notify)

[Frigate Notify](https://github.com/0x2142/frigate-notify)是一个简单的应用程序，设计用于将Frigate的通知发送到您喜欢的平台。适用于独立安装的Frigate - 不需要Home Assistant，MQTT虽不是必须但推荐使用。

## [Frigate Snap-Sync](https://github.com/thequantumphysicist/frigate-snap-sync/)

[Frigate Snap-Sync](https://github.com/thequantumphysicist/frigate-snap-sync/) 是一个与Frigate协同工作的程序。当Frigate生成快照或核查记录时（未来还可扩展更多触发事件），该程序会自动将文件上传至您指定的一个或多个远程服务器。

## [Frigate telegram](https://github.com/OldTyT/frigate-telegram)

[Frigate telegram](https://github.com/OldTyT/frigate-telegram)使得可以将Frigate的事件发送到Telegram。事件以文本描述、视频和缩略图的形式作为消息发送。

## [Periscope](https://github.com/maksz42/periscope)
[Periscope](https://github.com/maksz42/periscope)是一款轻量级Android应用，可将旧设备改造为Frigate NVR的实时监控查看器。该应用支持Android 2.2及以上系统（包括Android TV），提供身份验证和HTTPS安全连接功能。