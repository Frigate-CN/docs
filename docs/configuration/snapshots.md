---
id: snapshots
title: 快照功能
---

Frigate 可以为每个检测到的对象保存快照图片到`/media/frigate/clips`目录，文件命名为`<摄像头名称>-<ID>.jpg`格式。

快照是捕捉追踪目标最佳时刻的单张静止图像——即 Frigate 在场景中跟随该目标时看到的最清晰帧。与连续视频的[录制](./record.md)不同，快照是每个追踪目标在追踪结束后保存的一张代表性图像。

启用快照后，Frigate 会为每个追踪目标保存一张图像到 `/media/frigate/clips`，命名为 `<camera>-<id>-clean.webp`。干净图像始终无任何标注（无时间戳、边界框或裁剪）地存储，因此你拥有原始帧的未修改副本。边界框和时间戳等标注在通过 [HTTP API](/integrations/api/event-snapshot-events-event-id-snapshot-jpg-get.api.mdx) 请求快照时按需应用——参见下文[渲染](#干净快照)。

几点需要注意：

- 快照按追踪目标保存，因此即使启用了录制，未检测到目标的摄像头也不会产生快照。
- 快照和录制独立配置和保留——启用一个不会启用另一个。
- 对于启用了 Frigate+的用户，快照可以在 Frigate+面板中查看，方便快速提交到 Frigate+服务。
- 如果只想保存进入特定区域的对象的快照，请参阅[区域文档](./zones.md#restricting-snapshots-to-specific-zones)中的相关说明。
- 通过 MQTT 发送的快照配置可以在[配置文件](https://docs.frigate.video/configuration/)中的`cameras -> your_camera -> mqtt`部分设置。

## 帧选择

Frigate 不会保存每一帧 —— 它会为每个被跟踪的对象选择一个"最佳"帧，并将其用于快照和干净快照。当对象在帧之间被跟踪时，Frigate 会根据检测置信度、对象大小以及是否存在面部或车牌等关键属性，持续评估当前帧是否优于之前的最佳帧。对象触及画面边缘的帧会被降低优先级。跟踪结束后，快照会使用被确定为最佳的帧写入磁盘。

MQTT 快照发布频率更高 —— 在跟踪期间每次发现更好的缩略图帧时，或者当前最佳图像超过 `best_image_timeout`（默认：60秒）时发布。这些使用在 `cameras -> your_camera -> mqtt` 下配置的独立标注设置。

## 干净快照

Frigate 可以为每个事件生成最多两个快照文件，分别用于不同的场景：

| 版本 | 文件 | 标注 | 使用位置 |
| --- | --- | --- | --- |
| **常规快照** | `<camera>-<id>.jpg` | 遵循你的 `timestamp`、`bounding_box`、`crop` 和 `height` 设置 | API（`/api/events/<id>/snapshot.jpg`）、MQTT（`<camera>/<label>/snapshot`）、UI 中的浏览面板 |
| **干净快照** | `<camera>-<id>-clean.webp` | 始终无标注 —— 无边界框、无时间戳、无裁剪、全分辨率 | API（`/api/events/<id>/snapshot-clean.webp`）、[Frigate+](/plus/first_model) 提交、UI 中的"下载纯净快照" |

MQTT 快照在 `cameras -> your_camera -> mqtt` 下单独配置，与干净快照无关。

干净快照是向 [Frigate+](/plus/first_model) 提交事件所必需的 —— 如果你计划使用 Frigate+，无论其他快照设置如何，都应保持启用 `clean_copy`。

如果你不使用 Frigate+，并且 `timestamp`、`bounding_box` 和 `crop` 都已禁用，那么常规快照实际上已经是纯净的，因此 `clean_copy` 不会带来任何好处，只会占用额外的磁盘空间。在这种情况下，你可以安全地设置 `clean_copy: False`。
