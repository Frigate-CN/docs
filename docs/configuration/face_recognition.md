---
id: face_recognition
title: 人脸识别
---

人脸识别功能通过将检测到的人脸与预先学习的人脸数据进行匹配，来识别已知个体。当识别出已知`人`员时，他们的姓名将作为`sub_label`添加。这些信息会显示在UI界面、过滤器中，也会包含在通知中。

## 模型要求

### 人脸检测

当运行Frigate+模型(或任何原生支持人脸检测的自定义模型)时，应确保在[跟踪对象列表](../plus/#可用标签类型)中添加`face`标签，可以是全局设置或针对特定摄像头。这将允许人脸检测与物体检测同时运行，提高效率。

当运行默认的COCO模型或其他不包含`face`作为可检测标签的模型时，人脸检测将通过CV2使用运行在CPU上的轻量级DNN模型进行。在这种情况下，您不应在跟踪对象列表中定义`face`。

:::note

Frigate 需要先检测到 `person`（人） 后才能检测和识别人脸。

:::

### 人脸识别

Frigate支持两种人脸识别模型类型：

- **small(小型)**: Frigate将运行FaceNet嵌入模型进行人脸识别，该模型在CPU上本地运行。此模型针对效率进行了优化，但准确性较低。
- **large(大型)**: Frigate将运行大型ArcFace嵌入模型，该模型针对准确性进行了优化。建议仅在拥有集成或独立显卡时使用。更多信息请参阅[功能增强](/configuration/hardware_acceleration_enrichments.md)文档。

在这两种情况下，都会使用轻量级的人脸关键点检测模型在运行识别前对齐人脸。

所有系统特性都是在你本地进行的。

## 最低系统要求

`small`模型针对效率进行了优化，可在CPU上运行，大多数CPU都能高效运行该模型。

`large`模型针对准确性进行了优化，强烈建议使用集成或独立GPU。

## 配置

人脸识别默认禁用，必须在UI界面或配置文件中启用后才能使用。人脸识别是全局配置设置。

```yaml
face_recognition:
  enabled: true
```

与Frigate的其他实时处理器一样，人脸识别功能依赖于配置文件中detect角色定义的摄像头视频流。为确保最佳性能，请根据实际监控场景和需求，在摄像头固件中为此视频流设置合适的分辨率。

## 高级配置

使用以下可选参数在配置的全局级别微调人脸识别。在摄像头级别只能设置 `enabled` 和 `min_area` 这两个可选参数。

### 检测

- `detection_threshold`: 运行识别前所需的人脸检测置信度分数：
  - 默认值: `0.7`
  - 注意: 此字段仅适用于独立的人脸检测模型，对于内置人脸检测的模型应使用`min_score`进行过滤。
- `min_area`: 定义运行识别前人脸的最小尺寸(以像素为单位)。
  - 默认值: `500`像素。
  - 根据摄像头`detect`流的分辨率，可以增加此值以忽略过小或过远的人脸。

### 识别

- `model_size`: 使用的模型大小，可选`small`或`large`
- `unknown_score`: 将人员标记为潜在匹配的最低分数，低于此分数的匹配将被标记为未知。
  - 默认值: `0.8`。
- `recognition_threshold`: 将人脸添加为对象子标签所需的识别置信度分数。
  - 默认值: `0.9`。
- `min_faces`: 子标签应用于人员对象所需的最小人脸识别次数
  - 默认值: `1`
- `save_attempts`: 保存用于训练的已识别人脸图像数量。
  - 默认值: `100`。
- `blur_confidence_filter`: 启用计算人脸模糊程度并据此调整置信度的过滤器。
  - 默认值: `True`。


## 使用方法

请按照以下步骤开始：
1. 在配置文件中**启用人脸识别**功能并重启 Frigate。
2. 使用Frigate页面中人脸库（Face Library）部分的**添加人脸**按钮向导**上传人脸**。然后阅读下方内容，了解扩展训练集的最佳做法。
3. 当 Frigate 检测并尝试识别人脸时，它会出现在人脸库的**训练**标签页中，同时显示相关的识别置信度。
4. 在**训练**标签页中，您可以将人脸**分配**给新的或现有的人员，以提高未来的识别准确性。

## 创建完备的训练集

人脸识别所需的足够训练集图像数量取决于多个因素：

- 数据集的多样性：包含光照、姿态和面部表情变化的多样化数据集，每个人所需的图像数量会比多样性较低的数据集少。
- 期望的准确性：期望的准确性越高，通常需要的图像越多。

以下是一些通用指导原则：

- 最低要求：对于基本人脸识别任务，通常建议每人至少5-10张图像。
- 推荐：对于更健壮和准确的系统，每人20-30张图像是一个良好的起点。
- 理想情况：为了获得最佳性能，特别是在具有挑战性的条件下，每人50-100张图像会更有益。

人脸识别的准确性很大程度上取决于训练数据的质量。建议分阶段构建人脸训练库。

:::tip

选择包含在人脸训练集中的图像时，建议始终遵循以下建议：

- 如果难以辨认人物面部的细节，则对训练没有帮助。
- 避免曝光过度/不足的图像。
- 避免模糊/像素化的图像。
- 避免使用红外线(灰度)图像进行训练。模型是在彩色图像上训练的，能够从灰度图像中提取特征。
- 使用戴帽子/太阳镜的人物图像可能会混淆模型。
- 不要一次性上传过多相似的图像，建议每人训练不超过4-6张相似图像，以避免过拟合。

:::

### 关于“训练”标签页​​
在人脸库的​​“训练”标签页​​中，会显示近期的人脸识别尝试记录。系统会将检测到的人脸图像按照其可能匹配的人员进行分组。

每张人脸图像都会标注一个名称（或标记为未知），并附带此次识别的置信度分数。虽然每张图像都可以用于特定人员的系统训练，但并非所有图像都适合用于训练。

请参考以下指南，了解选择训练图像的最佳实践。

### 第一步 - 打好基础

首次启用人脸识别时，建立高质量的图像基础非常重要。建议首先为每个人上传1-5张"肖像"照片。确保照片中人物的面部是正面的，没有侧转，这将提供一个良好的起点。

然后建议使用Frigate中的`人脸库`选项卡，在检测到每个人时选择和训练图像。在建立坚实基础时，强烈建议仅训练正面图像。忽略从识别侧面人脸的摄像头获取的图像。

目标是平衡图像质量的同时，也要包含各种条件(白天/夜晚、不同天气、不同时间段等)的图像，以确保每个人的训练图像具有多样性，避免过拟合。

一旦某个人开始在正面训练图像上持续被正确识别（置信度>90%），这些图像已经被可靠识别。本步骤的目标是训练清晰但置信度较低的正面图像，直到给定人物的绝大多数正面图像都能被持续正确识别。然后就可以进入下一步。

### 第二步 - 扩展数据集

当正面图像的识别表现良好后，开始选择稍微有角度的图像进行训练。重要的是仍然选择那些能看到足够面部细节以识别某人的图像。

## 常见问题

### 如何调试人脸识别问题？
请从[使用方法](#使用方法)说明章节开始，并重新阅读上方[模型要求](#模型要求)的说明。

1.确保系统能**检测**到 `person` 目标。Frigate会自动对检测到的`person`进行人脸扫描，所有识别到的人脸将显示在Frigate界面"人脸库"的"训练"标签页中。

  若您使用的是 Frigate+ 或能检测 `face` 的模型：

  - 通过调试页面（设置 --> 调试）确认系统是否同时检测到`person`和`face`目标
  - 若未检测到人脸，可能需要调整 `face` 对象的 `min_score` 阈值

  若您​**​未使用** ​​Frigate+ 或能检测 `face` 的模型：
  
  - 检查 `detect` 视频流的分辨率，确保其足够高以捕捉 `person` 目标的人脸细节
  - 若人脸检测失败，可能需要降低`detection_threshold`阈值


2.所有检测到的人脸将进入**识别**阶段：
  - 请确保已按照上述建议完成至少一个人脸样本的训练
  - 根据上文说明调整`recognition_threshold`参数


### 模糊的画面会影响检测效果吗？
检测精度确实会随着摄像头/视频流质量的提升而改善。若您使用的摄像头标注了DORI（检测-观察-识别-辨认）参数范围，建议重点关注该指标。这个技术参数定义了摄像头在不同距离上对人体实现检测、观察、识别和辨认的能力范围。其中"辨认"距离最为关键——摄像头标称的这个距离值，实际上就是人脸识别功能能够稳定生效的最远物理距离。

### 为什么不能批量上传照片？

有方法地添加照片到库中非常重要，批量导入照片(特别是来自普通照片库)会导致特定场景下的过拟合，降低识别性能。

### 为什么不能批量重新处理人脸？

人脸嵌入模型的工作原理是将人脸分解为不同的特征。这意味着当重新处理图像时，只有角度相似的图像才会影响其分数。

### 为什么未知人员的分数与已知人员相似？

这可能由几个不同原因引起，但通常表明训练集需要改进。这通常与过拟合有关：

- 如果每个人只训练少量图像，特别是这些图像非常相似时，识别模型会过度专门化于这些特定图像。
- 当提供不同姿态、光照和表情的图像时，算法会提取这些变化中一致的特征。
- 通过在多样化的图像集上训练，算法对输入图像中的微小变化和噪声变得不那么敏感。

### 在训练选项卡中看到分数超过阈值，但没有分配子标签？

Frigate会考虑每个人物对象的所有识别尝试的分数。分数会根据人脸区域持续加权，只有当一个人物被持续自信地识别时，才会为其分配子标签。这避免了单次高置信度识别影响结果的情况。

### 可以同时使用其他人脸识别软件(如DoubleTake)和内置的人脸识别吗？

不可以，使用其他人脸识别服务会干扰Frigate内置的人脸识别。当使用double-take时，如果还希望使用内置的人脸识别功能，必须禁用sub_label功能。

### 人脸识别会在录制流上运行吗？

人脸识别不会在录制流上运行，这有很多不利原因：
1. 访问录制的延迟意味着通知中不会包含已识别人员的姓名，因为识别要到之后才能完成。
2. 使用的嵌入模型在固定图像尺寸上运行，因此较大的图像会被缩小以匹配。
3. 运动清晰度比额外像素重要得多，过度压缩和运动模糊对结果的影响比分辨率更大。

### 直接用iPhone拍照时出现未知错误

iOS设备默认使用HEIC（高效图像容器）格式保存照片，但该格式不支持上传。若选择`large`格式（而非`original`原生），系统将自动转换为JPG格式，从而确保正常上传。

### 如何删除人脸数据库并重新开始？

Frigate在其数据库中不存储任何与人脸识别相关的内容。您可以通过以下两种方式之一重置人脸数据库：
通过Frigate用户界面直接删除所有人脸数据

删除`/media/frigate/clips/faces`目录下的所有内容
