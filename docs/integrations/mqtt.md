---
id: mqtt
title: MQTT
---

这些是 Frigate 生成的 MQTT 消息。默认的 topic_prefix 是 `frigate`，但可以在配置文件中更改。

## 通用 Frigate 主题 {#general-frigate-topics}

### `frigate/available`

设计用于作为 Home Assistant 的可用性主题。可能的消息有：
"online"：在 Frigate 运行并发布其初始状态后发布。请注意，此消息在每次连接到代理时都会发布，因此如果代理重启或连接断开并恢复，它会重新发布，而 Frigate 本身并不会重启。
"offline"：Frigate 停止后发布

### `frigate/restart`

导致 Frigate 退出。Docker 应配置为在退出时自动重启容器。

### `frigate/events`

为每个更改的被追踪目标发布的消息。第一条消息在被追踪目标不再被标记为 false_positive 时发布。当 Frigate 找到被追踪目标的更好快照或发生区域更改时，它将发布具有相同 id 的消息。当被追踪目标结束时，发布最后一条消息，并设置 `end_time`。

```json
{
  "type": "update", // new, update, end
  "before": {
    "id": "1607123955.475377-mxklsc",
    "camera": "front_door",
    "frame_time": 1607123961.837752,
    "snapshot": {
      "frame_time": 1607123965.975463,
      "box": [415, 489, 528, 700],
      "area": 12728,
      "region": [260, 446, 660, 846],
      "score": 0.77546,
      "attributes": []
    },
    "label": "person",
    "sub_label": null,
    "top_score": 0.958984375,
    "false_positive": false,
    "start_time": 1607123955.475377,
    "end_time": null,
    "score": 0.7890625,
    "box": [424, 500, 536, 712],
    "area": 23744,
    "ratio": 2.113207,
    "region": [264, 450, 667, 853],
    "current_zones": ["driveway"],
    "entered_zones": ["yard", "driveway"],
    "thumbnail": null,
    "has_snapshot": false,
    "has_clip": false,
    "active": true, // 便捷属性，这严格来说是 "stationary" 的反义
    "stationary": false, // 目标是否被视为静止
    "motionless_count": 0, // 目标保持静止的帧数
    "position_changes": 2, // 目标从静止位置移动的次数
    "attributes": {
      "face": 0.64
    }, // 在任何时候在目标上识别出的具有最高分数的属性
    "current_attributes": [], // detailed data about the current attributes in this frame
    "current_estimated_speed": 0.71, // 对于通过启用了速度估算的区域移动的目标，当前估算速度（mph 或 kph）
    "average_estimated_speed": 14.3, // 对于通过启用了速度估算的区域移动的目标，平均估算速度（mph 或 kph）
    "velocity_angle": 180, // 对于通过启用了速度估算的区域移动的目标，相对于帧的行进方向
    "recognized_license_plate": "ABC12345", // 汽车目标的识别车牌号
    "recognized_license_plate_score": 0.933451
  },
  "after": {
    "id": "1607123955.475377-mxklsc",
    "camera": "front_door",
    "frame_time": 1607123962.082975,
    "snapshot": {
      "frame_time": 1607123965.975463,
      "box": [415, 489, 528, 700],
      "area": 12728,
      "region": [260, 446, 660, 846],
      "score": 0.77546,
      "attributes": []
    },
    "label": "person",
    "sub_label": ["John Smith", 0.79],
    "top_score": 0.958984375,
    "false_positive": false,
    "start_time": 1607123955.475377,
    "end_time": null,
    "score": 0.87890625,
    "box": [432, 496, 544, 854],
    "area": 40096,
    "ratio": 1.251397,
    "region": [218, 440, 693, 915],
    "current_zones": ["yard", "driveway"],
    "entered_zones": ["yard", "driveway"],
    "thumbnail": null,
    "has_snapshot": false,
    "has_clip": false,
    "active": true, // 便捷属性，这严格来说是 "stationary" 的反义
    "stationary": false, // 目标是否被视为静止
    "motionless_count": 0, // 目标保持静止的帧数
    "position_changes": 2, // 目标改变位置的次数
    "attributes": {
      "face": 0.86
    }, // 在任何时候在目标上识别出的具有最高分数的属性
    "current_attributes": [
      // 有关此帧中当前属性的详细数据
      {
        "label": "face",
        "box": [442, 506, 534, 524],
        "score": 0.86
      }
    ],
    "current_estimated_speed": 0.77, // 对于通过启用了速度估算的区域移动的目标，当前估算速度（mph 或 kph）
    "average_estimated_speed": 14.31, // 对于通过启用了速度估算的区域移动的目标，平均估算速度（mph 或 kph）
    "velocity_angle": 180, // 对于通过启用了速度估算的区域移动的目标，相对于帧的行进方向
    "recognized_license_plate": "ABC12345", // 汽车目标的识别车牌号
    "recognized_license_plate_score": 0.933451
  }
}
```

### `frigate/tracked_object_update`

为被追踪目标元数据的更新发布的消息，例如：

#### 生成式 AI 描述更新 {#generative-ai-description-update}

```json
{
  "type": "description",
  "id": "1607123955.475377-mxklsc",
  "description": "The car is a red sedan moving away from the camera."
}
```

#### 人脸识别更新 {#face-recognition-update}

```json
{
  "type": "face",
  "id": "1607123955.475377-mxklsc",
  "name": "John",
  "score": 0.95,
  "camera": "front_door_cam",
  "timestamp": 1607123958.748393
}
```

#### 车牌识别更新 {#license-plate-recognition-update}

```json
{
  "type": "lpr",
  "id": "1607123955.475377-mxklsc",
  "name": "John's Car",
  "plate": "123ABC",
  "score": 0.95,
  "camera": "driveway_cam",
  "timestamp": 1607123958.748393
}
```

#### 目标分类更新 {#object-classification-update}

当 [目标分类](/configuration/custom_classification/object_classification) 对分类结果达成共识时发布的消息。

**子标签类型：**

```json
{
  "type": "classification",
  "id": "1607123955.475377-mxklsc",
  "camera": "front_door_cam",
  "timestamp": 1607123958.748393,
  "model": "person_classifier",
  "sub_label": "delivery_person",
  "score": 0.87
}
```

**Attribute type:**

```json
{
  "type": "classification",
  "id": "1607123955.475377-mxklsc",
  "camera": "front_door_cam",
  "timestamp": 1607123958.748393,
  "model": "helmet_detector",
  "attribute": "yes",
  "score": 0.92
}
```

### `frigate/reviews`

为每个更改的核查项目发布的消息。第一条消息在 `detection` 或 `alert` 启动时发布。

在以下情况下将发布具有相同 ID 的 `update`：

- 严重性从 `detection` 变为 `alert`
- 检测到其他目标
- 目标通过人脸、车牌识别等方式被识别

当核查活动结束时，发布最后一条 `end` 消息。

```json
{
  "type": "update", // new, update, end
  "before": {
    "id": "1718987129.308396-fqk5ka", // review_id
    "camera": "front_cam",
    "start_time": 1718987129.308396,
    "end_time": null,
    "severity": "detection",
    "thumb_path": "/media/frigate/clips/review/thumb-front_cam-1718987129.308396-fqk5ka.webp",
    "data": {
      "detections": [
        // 事件 ID 列表
        "1718987128.947436-g92ztx",
        "1718987148.879516-d7oq7r",
        "1718987126.934663-q5ywpt"
      ],
      "objects": ["person", "car"],
      "sub_labels": [],
      "zones": [],
      "audio": []
    }
  },
  "after": {
    "id": "1718987129.308396-fqk5ka",
    "camera": "front_cam",
    "start_time": 1718987129.308396,
    "end_time": null,
    "severity": "alert",
    "thumb_path": "/media/frigate/clips/review/thumb-front_cam-1718987129.308396-fqk5ka.webp",
    "data": {
      "detections": [
        "1718987128.947436-g92ztx",
        "1718987148.879516-d7oq7r",
        "1718987126.934663-q5ywpt"
      ],
      "objects": ["person", "car"],
      "sub_labels": ["Bob"],
      "zones": ["front_yard"],
      "audio": []
    }
  }
}
```

### `frigate/triggers`

当摄像头 `semantic_search` 配置中定义的触发器触发时发布的消息。

```json
{
  "name": "car_trigger",
  "camera": "driveway",
  "event_id": "1751565549.853251-b69j73",
  "type": "thumbnail",
  "score": 0.85
}
```

### `frigate/stats`

以可配置的间隔发布与 `/api/stats` 相同的数据。

### `frigate/camera_activity`

返回关于每台摄像头、其当前功能以及是否检测到画面变动、目标等的数据。可以通过发布到 `frigate/onConnect` 来触发

### `frigate/notifications/set`

用于打开和关闭通知的主题。期望值为 `ON` 和 `OFF`。

### `frigate/notifications/state`

包含通知当前状态的主题。发布的值为 `ON` 和 `OFF`。

## Frigate 摄像头主题 {#frigate-camera-topics}

### `frigate/<camera_name>/status/<role>`

发布每个已启用角色（`audio`、`detect`、`record`）的当前健康状态。可能的值为：

- `online`：流正在运行并被处理
- `offline`：流处于离线状态并正在重启
- `disabled`：摄像头当前已关闭（通过 `enabled/set` 主题在运行时关闭，或通过配置文件永久禁用）。参见[摄像头状态](/configuration/live#camera-state)了解区别。

这些状态反映的是 Frigate 对该角色的进程状态，而非摄像头的可达性。因此，一个无法访问的摄像头会在看门狗重启 ffmpeg 时在 `offline` 和 `online` 之间交替。应等待状态稳定（例如使用 Home Assistant 的 `for:`），而不是在收到单条消息时立即处理。

### `frigate/<camera_name>/<object_name>`

发布摄像头的目标计数，用作 Home Assistant 中的传感器。
`all` 可用作 object_name 来统计摄像头的所有目标。

### `frigate/<camera_name>/<object_name>/active`

发布摄像头的活动目标计数，用作 Home Assistant 中的传感器。
`all` 可用作 object_name 来统计摄像头的所有活动目标。

### `frigate/<zone_name>/<object_name>`

发布区域的目标计数，用作 Home Assistant 中的传感器。
`all` 可用作 object_name 来统计区域的所有目标。

### `frigate/<zone_name>/<object_name>/active`

发布区域的活动目标计数，用作 Home Assistant 中的传感器。
`all` 可用作 object_name 来统计区域的所有目标。

### `frigate/<camera_name>/<object_name>/snapshot`

发布检测到的目标类型的 jpeg 编码帧。当目标不再被检测到时，发布最高置信度图像或再次发布原始图像。

快照的高度和裁剪可以在配置中配置。

### `frigate/<camera_name>/audio/<audio_type>`

当检测到某种类型的音频时发布 "ON"，未检测到时发布 "OFF"，用作 Home Assistant 中的传感器。

`all` 可用作 audio_type 来表示所有音频类型的状态。

### `frigate/<camera_name>/audio/dBFS`

发布在此摄像头上检测到的音频的 dBFS 值。

**注意：** 需要启用音频检测

### `frigate/<camera_name>/audio/rms`

发布在此摄像头上检测到的音频的 rms 值。

**注意：** 需要启用音频检测

### `frigate/<camera_name>/audio/transcription`

发布在此摄像头上检测到的音频的转录文本。

**注意：** 需要启用音频检测和转录

### `frigate/<camera_name>/classification/<model_name>`

发布状态分类模型为摄像头检测到的当前状态。主题名称包括在分类设置中配置的模型名称。
发布的值是检测到的状态类名称（例如，`open`、`closed`、`on`、`off`）。状态仅在更改时发布，有助于减少不必要的 MQTT 流量。

### `frigate/<camera_name>/enabled/set`

用于在运行时打开或关闭 Frigate 对摄像头的处理的主题。期望值为 `ON` 和 `OFF`。更改会在 Frigate 重启后保持（参见[运行时开关持久化](/configuration/live#runtime-toggle-persistence)）。要永久更改配置值，请使用 Frigate 界面的**设置 → 全局配置 → 摄像头管理**。参见[摄像头状态](/configuration/live#camera-state)了解关闭和禁用摄像头的区别。

### `frigate/<camera_name>/enabled/state`

包含摄像头处理当前运行时状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/detect/set`

用于打开和关闭摄像头目标检测的主题。期望值为 `ON` 和 `OFF`。更改会在 Frigate 重启后保持（参见[运行时开关持久化](/configuration/live#runtime-toggle-persistence)）。

### `frigate/<camera_name>/detect/state`

包含摄像头目标检测当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/audio/set`

用于打开和关闭摄像头音频检测的主题。期望值为 `ON` 和 `OFF`。更改会在 Frigate 重启后保持（参见[运行时开关持久化](/configuration/live#runtime-toggle-persistence)）。

### `frigate/<camera_name>/audio/state`

包含摄像头音频检测当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/audio_transcription/set`

用于打开和关闭摄像头[实时音频转写](/configuration/audio_detectors#live-transcription)的主题。期望值为 `ON` 和 `OFF`。转写文本发布到 `frigate/<camera_name>/audio/transcription`。

`ON` 仅在摄像头的配置中启用了音频转写时生效。与其他摄像头开关不同，此开关不会在 Frigate 重启后保持。

**注意：**需要启用音频检测和转写

### `frigate/<camera_name>/audio_transcription/state`

包含摄像头实时音频转写当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/recordings/set`

用于打开和关闭摄像头录制的主题。期望值为 `ON` 和 `OFF`。更改会在 Frigate 重启后保持（参见[运行时开关持久化](/configuration/live#runtime-toggle-persistence)）。

### `frigate/<camera_name>/recordings/state`

包含摄像头录制当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/snapshots/set`

用于打开和关闭摄像头快照的主题。期望值为 `ON` 和 `OFF`。更改会在 Frigate 重启后保持（参见[运行时开关持久化](/configuration/live#runtime-toggle-persistence)）。

### `frigate/<camera_name>/snapshots/state`

包含摄像头快照当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/motion/set`

用于打开和关闭摄像头画面变动检测的主题。期望值为 `ON` 和 `OFF`。
注意：如果未禁用检测，关闭画面变动检测将失败。

### `frigate/<camera_name>/motion`

camera_name 当前是否正在检测画面变动。期望值为 `ON` 和 `OFF`。
注意：最初检测到画面变动后，将设置 `ON`，直到 `mqtt_off_delay` 秒（默认为 30 秒）内未检测到画面变动。

### `frigate/<camera_name>/motion/state`

包含摄像头画面变动检测当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/improve_contrast/set`

用于打开和关闭摄像头 improve_contrast 的主题。期望值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/improve_contrast/state`

包含摄像头 improve_contrast 当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/motion_threshold/set`

用于调整摄像头画面变动阈值的主题。期望值为整数。

### `frigate/<camera_name>/motion_threshold/state`

包含摄像头当前画面变动阈值的主题。发布的值为整数。

### `frigate/<camera_name>/motion_contour_area/set`

用于调整摄像头画面变动轮廓面积的主题。期望值为整数。

### `frigate/<camera_name>/motion_contour_area/state`

包含摄像头当前画面变动轮廓面积的主题。发布的值为整数。

### `frigate/<camera_name>/review_status`

包含摄像头当前活动状态的主题。可能的值为 `NONE`、`DETECTION` 或 `ALERT`。

### `frigate/<camera_name>/ptz`

向摄像头发送 PTZ 命令的主题。

| 命令                  | 说明                                                                              |
| --------------------- | -------------------------------------------------------------------------------- |
| `preset_<preset_name>` | 发送命令移动到名为 `<preset_name>` 的预设                                         |
| `MOVE_<dir>`          | 发送命令在 `<dir>` 方向持续移动，可能值为 [UP, DOWN, LEFT, RIGHT]                |
| `ZOOM_<dir>`          | 发送命令在 `<dir>` 方向持续缩放，可能值为 [IN, OUT]                              |
| `STOP`                | 发送命令停止移动                                                                  |

### `frigate/<camera_name>/ptz_autotracker/set`

用于打开和关闭摄像头 PTZ 自动追踪器的主题。期望值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/ptz_autotracker/state`

包含摄像头 PTZ 自动追踪器当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/ptz_autotracker/active`

用于确定 PTZ 自动追踪器是否正在主动追踪目标的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/review_alerts/set`

用于打开或关闭摄像头核查警报的主题。期望值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/review_alerts/state`

包含摄像头核查警报当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/review_detections/set`

用于打开或关闭摄像头核查检测的主题。期望值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/review_detections/state`

包含摄像头核查检测当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/object_descriptions/set`

用于打开或关闭摄像头生成式 AI 目标描述的主题。期望值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/object_descriptions/state`

包含摄像头生成式 AI 目标描述当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/review_descriptions/set`

用于打开或关闭摄像头生成式 AI 核查总结的主题。期望值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/review_descriptions/state`

包含摄像头生成式 AI 核查总结当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/birdseye/set`

用于打开和关闭摄像头 Birdseye 的主题。期望值为 `ON` 和 `OFF`。Birdseye 模式必须在配置中启用。

### `frigate/<camera_name>/birdseye/state`

包含摄像头 Birdseye 当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/birdseye_mode/set`

用于设置摄像头 Birdseye 模式的主题。Birdseye 提供不同的模式来自定义摄像头在何种情况下显示。

_注意：将值从 `CONTINUOUS` 更改为 `MOTION | OBJECTS` 将需要最多 30 秒才能将摄像头从视图中移除。_

| 命令        | 说明                                                      |
| ----------- | --------------------------------------------------------- |
| `CONTINUOUS` | 始终包含                                                  |
| `MOTION`    | 当过去 30 秒内检测到画面变动时显示                            |
| `OBJECTS`   | 如果在过去 30 秒内追踪了活动目标则显示                    |

### `frigate/<camera_name>/birdseye_mode/state`

包含摄像头 Birdseye 模式当前状态的主题。发布的值为 `CONTINUOUS`、`MOTION`、`OBJECTS`。

### `frigate/<camera_name>/notifications/set`

用于打开和关闭通知的主题。期望值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/notifications/state`

包含通知当前状态的主题。发布的值为 `ON` 和 `OFF`。

### `frigate/<camera_name>/notifications/suspend`

用于暂停通知一定分钟数的主题。期望值为整数。

### `frigate/<camera_name>/notifications/suspended`

包含通知暂停到的时间戳的主题。发布的值为 UNIX 时间戳，如果未暂停通知则为 0。
