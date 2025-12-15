---
id: license_plate_recognition
title: 车牌识别(LPR) <Badge type="tip" text="0.16.0 和 以上版本" />
---

:::tip

车牌识别功能需要依赖外部下载的模型文件。相关模型托管在 Github 上。

如果你在中国大陆地区，请参考[通过 Docker 安装](../frigate/installation.md#docker)的教程，在`environment`中配置`GITHUB_ENDPOINT`环境变量，否则功能可能无法正常使用。

:::

Frigate 能够识别车辆上的车牌，并自动将检测到的字符添加到**识别的车牌**（`recognized_license_plate`）字段，或将[已知名称](#matching)作为子标签（`sub_label`）添加到车辆（`car`）类型的追踪目标中。常见用例包括识别驶入车道的车辆或街道上经过车辆的车牌。

当车牌清晰可见时，车牌识别的效果最佳。对于移动车辆，Frigate 会持续优化识别过程，保留置信度最高的结果。当车辆停稳后，车牌识别功能仍会在短时间内继续运行，以尝试识别车牌。

当识别到车牌时，识别结果会：

- 作为子标签`sub_label`（[已知车牌](#matching)）或`recognized_license_plate`字段（未知车牌）添加到**浏览**页面的追踪目标中
- 在核查的**核查项细节**面板中可见
- 在浏览的**目标追踪详情**面板中可见（子标签 和 识别的车牌）
- 可通过浏览中的**更多筛选项**菜单进行过滤
- 通过 MQTT 主题`frigate/events`发布，作为`car`追踪目标的`sub_label`(已知)或`recognized_license_plate`(未知)

## 模型要求

- 如果你的**目标/物体检测模型**（例如收费的 **Frigate+** 模型或者其他自己训练的模型）支持检测车牌（`license_plate`），则应该在[追踪标签列表](../plus/index.md#label-attributes)中添加`license_plate`标签。可以是全局设置或针对特定摄像头设置。这将提高车牌识别模型的准确性和性能。

- 如果你的模型不支持检测车牌（`license_plate`），依然可以可运行车牌识别。这个情况 Frigate 将使用额外的轻量级 YOLOv9 车牌检测模型，可配置在 CPU 或 GPU 上运行。这种情况下，**不要**在追踪目标列表中定义`license_plate`，否则功能无法正常使用。

:::tip

默认模型和目前市面上大部分的模型都不支持检测车牌

:::

:::note

在默认模式下，Frigate 的车牌识别需要先检测到车辆（`car`）后才能识别车牌。如果你使用**专业的车牌识别摄像头**并且画面会放大到无法检测出车辆（`car`）的程度，也可以运行车牌识别，但配置参数与默认模式不同。详见下文[专用 LPR 摄像头](#专用lpr摄像头)部分。

:::

## 最低系统要求

车牌识别功能通过在你的系统本地运行 AI 模型实现。其中 `YOLOv9` 车牌检测模型和 `OCR` 识别模型（[PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)）均为轻量化设计，可根据你的系统配置选择在 `CPU` 或 `GPU` 上运行。该功能至少需要 `4GB` 内存支持。

## 配置

车牌识别默认禁用。在配置文件中启用：

```yaml
lpr:
  enabled: True
```

与其他 Frigate 增强功能一样，车牌识别必须全局启用。如果不想在某些摄像头上运行车牌识别，可在摄像头级别禁用：

```yaml
cameras:
  garage: # 例如在花园的摄像头就不启用车牌识别
    ... # 此处为省略的内容
    lpr: # 加入高亮的这部分代码禁用该摄像头的车牌识别 [!code ++]
      enabled: False # [!code ++]
```

对于非专用 LPR 摄像头，请确保摄像头配置为检测`car`类型目标，且 Frigate 确实检测到了车辆。否则 LPR 不会运行。

与其他实时处理器一样，车牌识别运行在配置中`detect`角色定义的摄像头流上。为确保最佳性能，请在摄像头固件中选择适合你场景和需求的分辨率。

## 高级配置

在配置的全局层级使用这些可选参数微调 LPR 功能。唯一应在摄像头级别设置的可选参数是`enabled`、`min_area`和`enhancement`。

### 检测

- **`detection_threshold`**: 运行识别前所需的车牌检测置信度分数
  - 默认: `0.7`
  - 注意: 此字段仅适用于独立车牌检测模型，对于内置车牌检测的模型(如 Frigate+)应使用`threshold`和`min_score`物体/目标过滤器
- **`min_area`**: 定义运行识别前车牌的最小面积(像素单位)
  - 默认: `1000`像素。注意：这是面积测量(长 × 宽)，1000 像素代表图像中约 32×32 像素的正方形
  - 根据摄像头`detect`流的分辨率，可增加此值以忽略过小或过远的车牌
- **`device`**: 运行车牌检测和识别模型的设备
  - 默认: `CPU`
  - 可以设置为 `CPU`、`GPU` 或 GPU 的设备数字 ID。对于没有原生车牌检测模型的用户，使用 GPU 可能提高模型性能，特别是 YOLOv9 车牌检测器模型。然而，对于那些目标检测模型可直接识别车牌（`license_plate`）的用户来说，在 GPU 上运行车牌识别相比在 CPU 上运行，几乎没有性能提升。
- **`model_size`**: 用于识别车牌上文本区域的模型大小
  - 默认: `small`
  - 可选`small`或`large`。
  - 小型模型（`small`）能够识别拉丁字符和中文字符。国内用户请务必使用该选项。
  - 大型模型（`large`）只能识别拉丁字符。模型使用增强的文本检测器，能更准确地找到车牌上的文字，但比`small`模型更慢。
  - 如果你的国家或地区不使用多行车牌，应使用小型模型（`small`），因为它在单行车牌上的性能要好得多。

### 识别

- **`recognition_threshold`**: 将车牌作为`recognized_license_plate`和/或`sub_label`添加目标所需的识别置信度分数
  - 默认: `0.9`
- **`min_plate_length`**: 指定检测到的车牌必须具有的最小字符数才能作为`recognized_license_plate`和/或`sub_label`添加目标
  - 用于过滤短、不完整或不正确的检测
- **`format`**: 定义预期车牌格式的正则表达式。不匹配此格式的车牌将被丢弃
  - `"^[A-Z]{1,3} [A-Z]{1,2} [0-9]{1,4}$"`匹配如"B AB 1234"或"M X 7"的车牌
  - `"^[A-Z]{2}[0-9]{2} [A-Z]{3}$"`匹配如"AB12 XYZ"或"XY68 ABC"的车牌
  - 可使用 https://regex101.com/ 等网站测试正则表达式

### 匹配 {#matching}

- **`known_plates`**: 字符串或正则表达式列表，当识别到的车牌匹配已知值时，为该车辆（`car`）目标分配自定义`sub_label`
  - 这些标签会显示在 UI、过滤器和通知中
  - 未知车牌仍会保存，但添加到`recognized_license_plate`字段而非`sub_label`
- **`match_distance`**: 允许在匹配检测到的车牌与已知车牌时有微小变化(缺失/错误字符)
  - 例如设置`match_distance: 1`允许车牌`ABCDE`匹配`ABCBE`或`ABCD`
  - 此参数不适用于定义为正则表达式的已知车牌。要使用`match_distance`，应在`known_plates`中定义车牌的完整字符串

### 图像增强

- **`enhancement`**: 0 到 10 之间的值，调整在识别前对捕获车牌应用的图像增强级别。此预处理步骤有时可提高准确性但也可能适得其反
  - 默认: `0`(无增强)
  - 较高值会增加对比度、锐化细节并减少噪点，但过度增强会使字符模糊或失真，实际上使 Frigate 更难识别
  - 如果在多个摄像头上运行 LPR，最好在摄像头级别调整此设置
  - 如果 Frigate 已能正确识别车牌，保持此设置为默认值`0`。但如果经常遇到字符问题或不完整车牌，而你自己已能轻松阅读车牌，可尝试从 5 开始逐步增加此值。你应观察不同增强级别对车牌的影响。使用`debug_save_plates`配置选项(见下文)

### 归一化规则（Normalization Rules）

- **`replace_rules`**：用于归一化检测到的车牌的正则替换规则列表。这些规则会按顺序依次应用，并且在指定 `format` 正则之前执行。每条规则必须包含：`pattern`（可以是字符串或正则表达式）以及`replacement`（字符串，也支持 [backrefs](https://docs.python.org/3/library/re.html#re.sub)，例如 `\1`）。这些规则可用于处理常见的 OCR 问题，如噪声字符、分隔符或易混淆字符（例如将 `'O'` 替换为 `'0'`）。

这些规则必须在 `lpr` 配置的**全局层级**定义。

```yaml
lpr:
  replace_rules:
    - pattern: '[%#*?]' # 移除噪声符号
      replacement: ''
    - pattern: '[= ]' # 将 = 或空格规范化为短横线 -
      replacement: '-'
    - pattern: 'O' # 将 'O' 替换为 '0'（常见 OCR 错误）
      replacement: '0'
    - pattern: 'I' # 将 'I' 替换为 '1'
      replacement: '1'
    - pattern: '(\w{3})(\w{3})' # 将 6 个字符分成两组（例如 ABC123 → ABC-123）—— 使用单引号保留反斜杠
      replacement: '\1-\2'
```

- **规则按顺序执行**：在上面的例子中，先清理噪声，再处理分隔符，然后进行字符替换，最后进行分组拆分。
- **反向引用**（`\1`、`\2`）可实现动态替换（例如捕获组）。
- 规则所做的任何改动都会打印到 LPR 调试日志中。
- **小贴士**：你可以使用 regex101.com 等工具测试正则表达式模式。

### 调试

- **`debug_save_plates`**: 设为`True`保存检测到的车牌文字图像用于调试。这些图像存储在`/media/frigate/clips/lpr`，按`<摄像头>/<事件ID>`分子目录，基于捕获时间戳命名
  - 这些保存的图像不是完整车牌而是检测到的文字区域。文字检测模型有时会在车牌上找到多个文字区域是正常的。用它们分析 Frigate 识别了什么文字以及图像增强如何影响检测
  - 注意: Frigate 不会自动删除这些调试图像。一旦 LPR 正常运行，应禁用此选项并手动删除保存的文件以释放存储空间

## 配置示例

这些配置参数可在配置的全局层级使用。唯一应在摄像头级别设置的可选参数是`enabled`、`min_area`和`enhancement`。

```yaml
lpr:
  enabled: True
  min_area: 1500 # 忽略面积小于1500像素的车牌
  min_plate_length: 4 # 仅识别4个或更多字符的车牌
  known_plates:
    老婆的车辆:
      - '京A·C1234'
    大儿子:
      - '京*·*567' # 能同时匹配 京A·A4567 和 京B·CH567 注意"*"将匹配任意数量字符
    我的车:
      - '京A·[S5]3334' # 同时匹配 京A·S3334和 京A·53334
    货车:
      - '黑C·1[0-9]{3}[A-Z]' # 同时匹配 黑C·1123A, 黑C·1456Z 的车牌
```

```yaml
lpr:
  enabled: True
  min_area: 4000 # 仅对较大车牌运行识别(4000像素代表图像中约63×63像素的正方形)
  recognition_threshold: 0.85
  format: ^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}·[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$ # 适配中国大陆地区车牌的正则
  match_distance: 1 # 允许车牌匹配中一个字符的变化
  replace_rules:
    - pattern: 'O'
      replacement: '0'
  known_plates:
    老婆的车:
      - '京A·C1234'
```

:::note

如果你某个摄像头配置了检测汽车（`car`）或摩托车（`motorcycle`），但你又不想让 Frigate 为该摄像头运行车牌识别，可以在摄像头级别单独禁用该功能：

```yaml
cameras:
  side_yard: # <- 摄像头的名字
    lpr: # [!code ++]
      enabled: False # 单独为side_yard摄像头禁用车牌识别 [!code ++]
    ...
```

:::

## 专用 LPR 摄像头

专用 LPR 摄像头是具有强大光学变焦的单用途摄像头，用于捕捉远处车辆的车牌，通常具有精细调校的设置以在夜间捕捉车牌。

要将摄像头标记为专用 LPR 摄像头，在摄像头配置中添加`type: "lpr"`。

:::note
Frigate 的车牌识别（LPR）专用模式专为窄视角摄像头优化设计，该模式要求摄像头必须采用特定角度安装，然后精确调焦至仅能捕获车牌画面。若你的摄像头**用于拍摄场景全景而非聚焦车牌特写**，则**不建议使用**此模式。
:::

用户可根据是否使用 Frigate+(或原生`license_plate`检测)模型以两种不同方式配置 Frigate 的专用 LPR 模式：

### 使用 Frigate+(或原生`license_plate`检测)模型

使用 Frigate+模型(或任何能原生检测`license_plate`的模型)的用户可利用`license_plate`检测功能。这使得车牌在专用 LPR 模式下被视为标准物体/目标，意味着警报、检测、快照、区域和其他 Frigate 功能正常工作，车牌通过配置的物体/目标检测器高效检测。

使用`license_plate`检测模型的专用 LPR 摄像头配置示例：

```yaml
# LPR全局配置
lpr:
  enabled: True
  device: CPU # 也可用GPU(如果可用)

# 专用LPR摄像头配置
cameras:
  dedicated_lpr_camera:
    type: 'lpr' # 必需以使用专用LPR摄像头模式
    ffmpeg: ... # 添加你的流
    detect:
      enabled: True
      fps: 5 # 如果车辆快速移动可增至10。高于15不必要也不推荐
      min_initialized: 2
      width: 1920
      height: 1080
    objects:
      track:
        - license_plate
      filters:
        license_plate:
          threshold: 0.7
    motion:
      threshold: 30
      contour_area: 60 # 使用增大值过滤小的运动变化
      improve_contrast: false
      mask: 0.704,0.007,0.709,0.052,0.989,0.055,0.993,0.001 # 确保摄像头时间戳被遮罩
    record:
      enabled: True # 如果只想要快照可禁用录制
    snapshots:
      enabled: True
    review:
      detections:
        labels:
          - license_plate
```

此设置下：

- 车牌被视为 Frigate 中的正常物体/目标
- 分数、警报、检测、和快照按预期工作
- 快照上会有车牌边界框
- MQTT 主题`frigate/events`会发布追踪目标更新
- 调试页面会显示`license_plate`边界框
- 如果使用 Frigate+模型并想提交专用 LPR 摄像头图像用于模型训练和微调，在 Frigate+网站上标注快照中的`car`和`license_plate`，即使车辆几乎不可见

### 使用次级 LPR 管道(无 Frigate+)

如果没有使用 Frigate+模型，可使用 Frigate 内置的次级专用 LPR 管道。在此模式下，Frigate 绕过标准物体/目标检测管道，在检测到运动时对全帧运行本地车牌检测器模型。

使用次级管道的专用 LPR 摄像头配置示例：

```yaml
# LPR全局配置
lpr:
  enabled: True
  device: CPU # 也可用GPU(如果可用)
  detection_threshold: 0.7 # 必要时更改

# 专用LPR摄像头配置
cameras:
  dedicated_lpr_camera:
    type: 'lpr' # 必需以使用专用LPR摄像头模式
    lpr:
      enabled: True
      enhancement: 3 # 可选，在尝试识别字符前增强图像
    ffmpeg: ... # 添加你的流
    detect:
      enabled: False # 禁用Frigate标准物体/目标检测管道
      fps: 5 # 必要时增加，但高值可能减慢Frigate增强管道并使用大量CPU
      width: 1920
      height: 1080
    objects:
      track: [] # 无Frigate+模型的专用LPR模式必需
    motion:
      threshold: 30
      contour_area: 60 # 使用增大值过滤小的运动变化
      improve_contrast: false
      mask: 0.704,0.007,0.709,0.052,0.989,0.055,0.993,0.001 # 确保摄像头时间戳被遮罩
    record:
      enabled: True # 如果只想要快照可禁用录制
    review:
      detections:
        enabled: True
        retain:
          default: 7
```

此设置下：

- 绕过标准物体/目标检测管道。专用 LPR 摄像头上检测到的任何车牌在 Frigate 中类似于手动事件处理。你必须不指定`license_plate`作为追踪目标
- 检测到运动时，车牌检测器在全帧上运行，并根据检测`fps`设置处理帧
- Review 项目始终分类为`detection`
- 始终保存快照
- 不使用区域和目标遮罩
- MQTT 主题`frigate/events`不会发布带车牌边界框和分数的追踪目标更新，但如果启用录制，`frigate/reviews`会发布。如果识别为[已知车牌](#matching)，会发布带更新`sub_label`字段的消息；如果识别出字符，会发布带更新`recognized_license_plate`字段的消息
- 车牌快照在得分最高时刻保存并出现在 Explore 中
- 调试页面不显示`license_plate`边界框

### 总结

| 功能                  | 原生`license_plate`检测模型(如 Frigate+) | 次级管道(无原生模型或 Frigate+)           |
| --------------------- | ---------------------------------------- | ----------------------------------------- |
| 车牌检测              | 使用`license_plate`作为追踪目标          | 运行专用 LPR 管道                         |
| FPS 设置              | 5(快速移动车辆可增加)                    | 5(快速移动车辆可增加，但可能使用更多 CPU) |
| 物体/目标检测         | 应用标准 Frigate+检测                    | 绕过标准物体/目标检测                     |
| 调试页面              | 可能显示`license_plate`边界框            | 可能不显示`license_plate`边界框           |
| MQTT `frigate/events` | 发布追踪目标更新                         | 发布有限更新                              |
| Explore               | 识别的车牌在 More Filters 中可用         | 识别的车牌在 More Filters 中可用          |

通过选择适当的配置，用户可根据是否使用 Frigate+模型或次级 LPR 管道优化专用 LPR 摄像头。

### 使用专用 LPR 摄像头模式的最佳实践

- 调整画面变动检测并增加`contour_area`，直到只有车辆通过时创建较大的运动框(对于 1920×1080 检测流可能在 50-90 之间)。增加`contour_area`过滤小的运动区域，防止在没有车辆通过的帧中寻找车牌浪费资源
- 禁用`improve_contrast`运动设置，特别是在夜间运行 LPR 且画面大部分黑暗时。这将防止小像素变化和小的运动区域触发车牌检测
- 确保用画面变动遮罩覆盖摄像头时间戳，防止其被误检测为车牌
- 对于非 Frigate+用户，可能需要更改摄像头设置以获得更清晰的图像，或如果夜间车牌识别不准确，降低全局`recognition_threshold`配置
- 次级管道模式在 CPU 或 GPU(取决于`device`配置)上运行本地 AI 模型检测车牌。增加检测`fps`将按比例增加资源使用

## 常见问题

### 为什么我的车牌没有被检测和识别？ {#why-isnt-my-license-plate-being-detected-and-recognized}

请确保：

- 你的摄像头对车牌有清晰、人类可读、光线充足的视角。如果你无法读取车牌字符，即使模型识别出了 `license_plate`，Frigate 也肯定无法读取。这可能需要根据你的场景和车辆行驶速度更改摄像头的视频大小、质量或帧率设置。
- 车牌在图像中足够大（尝试调整 `min_area`）或增加摄像头流的分辨率。
- 你的增强级别（如果已从默认值 `0` 更改）不要太高。过多的增强会运行太多的降噪，导致车牌字符变得模糊且无法读取。
- 如果你使用的是 Frigate+ 模型或可以检测车牌的自定义模型，请确保将 `license_plate` 添加到你的追踪目标列表中。如果你使用的是随 Frigate 一起提供的免费模型，你不应该将 `license_plate` 添加到追踪目标列表中。

已识别的车牌将在调试页面中显示为目标标签，并将出现在探索中更多过滤器弹出窗口的"已识别车牌"选择框中。

如果你仍然遇到检测车牌的问题，请从基本配置开始，并参见下面的调试提示。

### 我可以在不检测 `car` 目标的情况下运行 LPR 吗？

在正常 LPR 模式下，Frigate 需要先检测到 `car` 才能识别车牌。如果你有专用的 LPR 摄像头，你可以将摄像头类型更改为 `"lpr"` 以使用专用 LPR 摄像头算法。但这有重要的注意事项。请参阅上面的专用 LPR 摄像头部分。

### 如何提高检测准确性？

- 使用具有良好分辨率的高质量摄像头
- 调整 `detection_threshold` 和 `recognition_threshold` 值
- 定义 `format` 正则表达式以过滤掉无效的检测

### LPR 在夜间工作吗？

是的，但性能取决于摄像头质量、照明和红外功能。确保你的摄像头能在夜间捕获清晰的车牌图像。

### 我可以将 LPR 限制在特定区域吗？

LPR 与其他 Frigate 功能增强一样，在摄像头级别而不是区域级别运行。虽然你不能直接将 LPR 限制在特定区域，但你可以通过设置 `min_area` 值来过滤掉较小的检测，从而控制何时运行识别。

### 如何匹配具有轻微变化的已知车牌？

使用 `match_distance` 允许小的字符不匹配。或者在 `known_plates` 中定义多个变体。

### 如何调试 LPR 问题？

- 首先查阅 [为什么我的车牌没有被检测和识别](#why-isnt-my-license-plate-being-detected-and-recognized)。如果问题仍然存在，请按照以下步骤排查： 1.启用调试日志以查看 Frigate 的具体运行情况

1. 首先从一个精简的车牌识别配置开始：

   - 删除或注释掉你车牌识别配置中的所有内容，包括 `min_area`（最小检测区域）、`min_plate_length`（最小车牌长度）、`format`（车牌格式）、`known_plates`（已知车牌）以及 `enhancement`（增强）等参数，只保留 `enabled` 和 `debug_save_plates`。让 Frigate 使用默认值运行。

     ```yaml
     lpr:
       enabled: true
       debug_save_plates: true # [!code ++]
     ```

2. 开启调试日志，查看 Frigate 检测识别的细节
   - 通过向 logger 配置添加`frigate.data_processing.common.license_plate: debug`来启用 LPR 调试日志。这些日志**非常详细**，因此**仅在必要时**保持启用状态。在重启后生效。

```yaml
logger:
  default: info
  logs: # [!code ++]
    frigate.data_processing.common.license_plate: debug # [!code ++]
```

3. 确保车牌被**检测到**

如果你使用的是 Frigate+或`license_plate`检测模型：

- 查看调试页面(设置-->调试)以确保检测到`license_plate`。
- 查看`frigate/events`的 MQTT 消息以验证检测到的车牌。
- 如果车牌未被检测到，你可能需要调整 license_plate 目标的`min_score`和/或`threshold`参数。

如果你**没有**使用 Frigate+或`license_plate`检测模型：

- 查看调试日志中 YOLOv9 车牌检测器的消息。
- 如果车牌未被检测到，你可能需要调整`detection_threshold`参数。

4. 确保检测到的车牌上的字符被**识别**

- 启用`debug_save_plates`将检测到的车牌文本图像保存到剪辑目录(`/media/frigate/clips/lpr`)。确保这些图像可读且文本清晰。
- 查看调试页面以实时查看车牌识别情况。对于非专用 LPR 摄像头，当 LPR 启用并正常工作时，car 或 motorcycle 标签将变为识别出的车牌。
- 根据[上文](#高级配置)的建议调整`recognition_threshold`设置。

### LPR 会减慢我的系统吗？

LPR 的性能影响取决于你的硬件。确保你至少有 4GB RAM 和能够胜任的 CPU 或 GPU 以获得最佳结果。如果你运行的是专用 LPR 摄像头模式，与运行原生检测车牌的模型的用户相比，资源使用量会更高。为你的专用 LPR 摄像头调整画面变动检测设置，以便车牌检测模型仅在必要时运行。

### 我在功能增强指标中看到 YOLOv9 车牌检测指标，但我有 Frigate+ 或可以检测 `license_plate` 的自定义模型。为什么 YOLOv9 模型在运行？

如果你启用了 LPR 但没有在全局或摄像头级别将 `license_plate` 定义为要追踪的目标，YOLOv9 车牌检测器模型将运行（并且指标将出现）。

如果你在不想运行 LPR 的摄像头上检测 `car`，请确保在摄像头级别禁用 LPR。如果你确实想在这些摄像头上运行 LPR，请确保将 `license_plate` 定义为要追踪的目标。

### 看起来 Frigate 将我的摄像头时间戳识别为车牌。如何防止这种情况？

如果车辆靠近摄像头的时间戳行驶，可能会发生这种情况。你可以通过摄像头固件移动时间戳，或在 Frigate 中为其应用遮罩。

如果你使用的是原生检测 `license_plate` 的模型，请在时间戳上添加 `license_plate` 类型的**目标遮罩**和**画面变动遮罩**。

如果你使用的是专用 LPR 摄像头模式，只需要在时间戳上添加**画面变动遮罩**。
