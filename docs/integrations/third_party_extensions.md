---
id: third_party_extensions
title: 第三方扩展
---

作为开源项目，其他开发者可以修改和扩展 Frigate 已有的丰富功能。
本页面旨在概述可以添加到家庭 NVR 设置中的扩展。此列表并非详尽无遗，可以通过 PR 方式扩展到 Frigate 文档中。这些服务大多设计为通过 5000 端口与 Frigate 的未认证 API 接口进行交互。

:::warning

本页面不对展示的项目进行推荐或评级。
在系统上安装任何内容之前，请使用你自己的知识来评估和审查它们。

:::

## [摄像头卡片增强（原名 Frigate 卡片）](https://card.camera/#/README)

[摄像头卡片增强](https://card.camera/#/README) 是一款与 Frigate 深度集成的 Home Assistant 仪表盘组件。

## [Double Take](https://github.com/skrashevich/double-take)

[Double Take](https://github.com/skrashevich/double-take)为人脸识别的图像处理和训练提供了统一的 UI 和 API。
它支持自动为 Frigate 中检测和识别到的人物对象设置子标签。
这是[原始 Double Take 项目](https://github.com/jakowenko/double-take)的一个分支（修复了错误并添加了新功能），不幸的是，原始项目已不再由作者维护。

## [Frigate Notify](https://github.com/0x2142/frigate-notify)

[Frigate Notify](https://github.com/0x2142/frigate-notify)是一个简单的应用程序，设计用于将 Frigate 的通知发送到你喜欢的平台。适用于独立安装的 Frigate - 不需要 Home Assistant，MQTT 虽不是必须但推荐使用。

## [Frigate Snap-Sync](https://github.com/thequantumphysicist/frigate-snap-sync/)

[Frigate Snap-Sync](https://github.com/thequantumphysicist/frigate-snap-sync/) 是一个与 Frigate 协同工作的程序。当 Frigate 生成快照或核查记录时（未来还可扩展更多触发事件），该程序会自动将文件上传至你指定的一个或多个远程服务器。

## [Frigate telegram](https://github.com/OldTyT/frigate-telegram)

[Frigate telegram](https://github.com/OldTyT/frigate-telegram)使得可以将 Frigate 的事件发送到 Telegram。事件以文本描述、视频和缩略图的形式作为消息发送。

## [Periscope](https://github.com/maksz42/periscope)

[Periscope](https://github.com/maksz42/periscope)是一款轻量级 Android 应用，可将旧设备改造为 Frigate NVR 的实时监控查看器。该应用支持 Android 2.2 及以上系统（包括 Android TV），提供身份验证和 HTTPS 安全连接功能。

## [Scrypted - Frigate 桥接插件](https://github.com/apocaliss92/scrypted-frigate-bridge)

[Scrypted - Frigate 桥接插件](https://github.com/apocaliss92/scrypted-frigate-bridge)是一款可将 Frigate 的检测结果、移动侦测数据、视频片段接入 Scrypted 的插件，同时还提供模板，用于导出 Frigate 上的转播配置。
