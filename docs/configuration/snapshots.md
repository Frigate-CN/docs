---
id: snapshots
title: 快照功能
---

Frigate 可以为每个检测到的对象保存快照图片到`/media/frigate/clips`目录，文件命名为`<摄像头名称>-<ID>.jpg`格式。这些快照也可以通过[API 接口](/integrations/api/event-snapshot-events-event-id-snapshot-jpg-get.api.mdx)访问。

对于启用了 Frigate+的用户，快照可以在 Frigate+面板中查看，方便快速提交到 Frigate+服务。

如果只想保存进入特定区域的对象的快照，请参阅[区域文档](./zones.md#restricting-snapshots-to-specific-zones)中的相关说明。

通过 MQTT 发送的快照配置可以在[配置文件](https://docs.frigate.video/configuration/)中的`cameras -> your_camera -> mqtt`部分设置。
