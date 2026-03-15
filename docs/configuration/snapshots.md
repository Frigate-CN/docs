---
id: snapshots
title: 快照功能
---

Frigate 可以为每个检测到的对象保存快照图片到`/media/frigate/clips`目录，文件命名为`<摄像头名称>-<ID>.jpg`格式。这些快照也可以通过[API 接口](/integrations/api/event-snapshot-events-event-id-snapshot-jpg-get.api.mdx)访问。

对于启用了 Frigate+的用户，快照可以在 Frigate+面板中查看，方便快速提交到 Frigate+服务。

如果只想保存进入特定区域的对象的快照，请参阅[区域文档](./zones.md#restricting-snapshots-to-specific-zones)中的相关说明。

通过 MQTT 发送的快照配置可以在[配置文件](https://docs.frigate.video/configuration/)中的`cameras -> your_camera -> mqtt`部分设置。

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
