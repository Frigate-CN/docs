---
id: cameras
title: 摄像头配置
---

## 使用添加摄像头向导添加摄像头 {#adding-a-camera-with-the-add-camera-wizard}

添加摄像头向导是添加摄像头的推荐方式。点击 <NavPath path="设置 > 全局配置 > 摄像头管理" /> 中的 **Add Camera**。该向导会连接你的摄像头、测试每个流并为你生成摄像头配置，包括 [go2rtc](go2rtc.md) 转流和实时视图流映射，因此标准设置无需手动编写 YAML。

### 步骤 1：命名与连接 {#step-1-name-and-connection}

输入摄像头名称以及主机或 IP 地址和凭证，然后选择向导如何查找摄像头的流：

- **探测摄像头（Probe camera）**通过 ONVIF 查询摄像头（ONVIF 端口通常为 80 或 8080），并获取其流 URL。某些摄像头使用独立的 ONVIF/服务账号而非设备管理员用户，部分还要求启用**使用摘要认证（Use digest authentication）**。
- **手动选择（Manual selection）**根据你选择的摄像头品牌模板构建流 URL（Dahua/Amcrest/EmpireTech、Hikvision/Uniview/Annke、Ubiquiti、Reolink、Axis、TP-Link 或 Foscam）。选择 **Other** 直接输入自定义 RTSP URL。非 RTSP 流类型必须[手动配置](#setting-up-camera-inputs)。

你输入的名称会被转为小写，空格变为下划线。如果结果仍不是有效的配置键，向导会生成一个安全名称，并将你输入的内容保存为 `friendly_name`。

### 步骤 2：探测或截图 {#step-2-probe-or-snapshot}

在探测模式下，向导会报告摄像头返回的信息（制造商、型号、固件、配置文件数量以及是否支持 PTZ、预置位和[自动追踪](autotracking.md)）以及发现的 RTSP URL。测试每个候选流，查看其分辨率、帧率和编解码器以及截图，然后选择你想使用的流。

在手动模式下，向导会测试模板 URL 并显示相同的元数据和截图。

如果未找到 RTSP URL，可能是凭证错误或摄像头不支持 ONVIF。返回并使用手动选择。

### 步骤 3：流配置 {#step-3-stream-configuration}

为流分配[功能角色](#setting-up-camera-inputs)，并使用**添加另一个流（Add Another Stream）**添加摄像头的其他流，例如用于 `detect` 的子流与用于 `record` 的主流。至少有一个流必须具有 `detect` 角色才能继续。

**减少摄像头连接（Reduce connections to camera）**通过 go2rtc 转流路由输入，使 Frigate 和实时视图共享一个到摄像头的连接，而不是各自打开独立连接。详见[转流](restream.md)。

### 步骤 4：验证与测试 {#step-4-validation-and-testing}

连接每个流以获取实时预览、预估带宽数值和验证结果列表。向导会检查最常见的错误配置，包括：

- 检测分辨率过高（增加资源消耗）或过低导致无法可靠检测，或根本无法探测
- 标记为 `record` 的流的音频编解码器不是 AAC，或完全没有音频
- 标记为 `audio` 的流不包含音频流
- 对 `record` 角色使用转流输入
- 品牌特定问题，例如 Reolink 摄像头的 RTSP 流应使用 http-flv，或为 `detect` 选择了 Dahua/Hikvision 的子流

**使用流兼容模式（Use stream compatibility mode）**通过 go2rtc 的 ffmpeg 模块传递流。如果流在多次尝试后仍无法加载，请启用它。注意，这还会阻止该流的[双向通话](/configuration/live#two-way-talk)被检测到。

**保存新摄像头（Save New Camera）**会写入配置并立即启动摄像头，无需重启。

其他功能（包括[硬件加速](hardware_acceleration_video.md)、[双向通话](/configuration/live#two-way-talk)和音频转码）在摄像头添加后进行配置。有关摄像头型号的特定问题，请参阅[摄像头特定](camera_specific.md)文档。

## 删除摄像头 {#deleting-a-camera}

点击 <NavPath path="设置 > 全局配置 > 摄像头管理" /> 中的 **删除摄像头**，选择摄像头并确认。删除摄像头需要 `admin` 角色权限，且无法撤销。

:::warning

删除摄像头会永久移除其录制内容、追踪目标和配置。如果只想停止处理某个摄像头，请在 <NavPath path="设置 > 全局配置 > 摄像头管理" /> 中将其状态设为**关闭**或**禁用**。参见[摄像头状态](/configuration/live#camera-state)。

:::

删除摄像头会移除：

- 摄像头在配置文件中的部分，以及在任何[角色](authentication.md#user-roles)摄像头列表中的条目。没有任何摄像头的自定义角色也会被移除。
- 摄像头在数据库中的所有记录：追踪目标、审阅项目、录制内容、预览、时间线条目、保存的区域网格以及[触发器](semantic_search.md#triggers)。
- 摄像头的所有媒体文件：录制内容、快照、缩略图和预览片段。

[导出](/usage/exports)默认保留，因此已保存的录制内容在删除源摄像头后仍然保留。在确认步骤中打开**同时删除此摄像头的导出**以一并移除。

摄像头的进程会停止，更改立即生效，无需重启。如果生成的配置无法解析，Frigate 会恢复之前的配置并报告错误，而不会使 Frigate 处于损坏状态。

有两项不会被自动清理：

- **go2rtc 转流。** Frigate 会尽力停止以摄像头命名的正在运行的 [go2rtc](go2rtc.md) 转流，但配置文件中的转流条目仍然存在，并在下次重启时被重新创建。请在 <NavPath path="设置 > 系统 > go2rtc 转流" /> 或配置文件中移除它们。
- **摄像头分组。** 已删除的摄像头会继续出现在引用它的任何[摄像头分组](#setting-up-camera-groups)中。分组会跳过缺失的摄像头，因此这无害，但你可以编辑分组以移除过时条目。

## 设置摄像头输入源 {#setting-up-camera-inputs}

可以为每个摄像头配置多个输入源，并根据需求混合搭配每个输入源的功能。这样你可以使用低分辨率视频流进行物体检测，同时使用高分辨率视频流进行录制，反之亦然。

默认情况下摄像头是启用的，但可以通过设置`enabled: False`来禁用。通过配置文件禁用的摄像头不会出现在 Frigate 用户界面中，也不会消耗系统资源。

每个功能在每个摄像头中只能分配给一个输入源。可用的功能选项如下：

| 功能     | 描述                                                |
| -------- | --------------------------------------------------- |
| `detect` | 用于物体检测的主视频流。[文档](object_detectors.md) |
| `record` | 根据配置设置保存视频片段。[文档](record.md)         |
| `audio`  | 用于基于音频的检测。[文档](audio_detectors.md)      |

<ConfigTabs>
<TabItem value="图形化配置">

在摄像头配置的 **视频流（FFmpeg）** 部分添加输入源，并为每个输入源分配功能。

<FrigateConfigMock
  :auto-play="false"
  level="camera"
  section="ffmpeg"
  focus="inputs"
  camera-name="back"
  :values="{
    inputs: [
      {
        title: '视频流 1',
        path: 'rtsp://127.0.0.1:8554/back',
        mode: 'restream',
        stream: 'back',
        roles: ['detect'],
        inputArgMode: 'preset',
        inputArgPreset: 'preset-rtsp-restream',
        hwaccelMode: 'inherit',
      },
    ],
  }"
  hint="添加摄像头 RTSP 流地址，并为该输入源分配功能（例如 detect 用于目标检测）。"
/>

</TabItem>
<TabItem value="YAML配置文件">

```yaml
mqtt:
  host: mqtt.server.com
cameras: # [!code highlight]
  back: # <- back为示例摄像头名称，改为你需要的名称，暂时只支持英文数字和下划线 [!code ++]
    enabled: True # [!code ++]
    ffmpeg: # [!code ++]
      inputs: # [!code ++]
        # 摄像头rtsp流地址可查阅摄像头文档或互联网其他人分享的教程，下面的地址仅为范例
        # 可以考虑使用go2rtc，请参考文档后面的说明
        - path: rtsp://viewer:{FRIGATE_RTSP_PASSWORD}@10.0.10.10:554/cam/realmonitor?channel=1&subtype=2 # [!code ++]
          roles: # [!code ++]
            - detect # <- 用于目标/物体检测 [!code ++]
        # 可以设置不同的流用于不同功能，例如上面的流为子码流，节省带宽，适合检测，能够降低检测器负担
        # 而下方的主码流画面清晰，适合录制
        # 可以考虑使用go2rtc，请参考文档后面的说明
        - path: rtsp://viewer:{FRIGATE_RTSP_PASSWORD}@10.0.10.10:554/live # [!code ++]
          roles: # [!code ++]
            - record # <- 用于录制的视频流 [!code ++]
    detect: # [!code highlight]
      width: 1280 # <- 可选，默认Frigate会尝试自动检测分辨率 [!code highlight]
      height: 720 # <- 可选，默认Frigate会尝试自动检测分辨率 [!code highlight]
```

</TabItem>
</ConfigTabs>

:::tip

如果你希望实时监控能够有声音并且画面更流畅，可以考虑配置[go2rtc](../configuration/go2rtc)，并让摄像头的`path`使用 go2rtc 的[视频转流](../configuration/restream#reduce-connections-to-camera)地址。

:::

<ConfigTabs>
<TabItem value="图形化配置">

导航到 <NavPath path="设置 > 全局配置 > 摄像头管理" /> 并使用[添加摄像头向导](#adding-a-camera-with-the-add-camera-wizard)配置每个额外的摄像头。

</TabItem>
<TabItem value="YAML配置文件">

```yaml
mqtt: ...
cameras:
  back: ...
  front: ...
  side: ...
```

</TabItem>
</ConfigTabs>

:::note

如果你摄像头下只有一个视频流输入（`input`）且没有为其配置检测（`detect`）功能，Frigate 也会自动启动检测（`detect`）功能。即使你在配置中`detect`设置`enabled: False`禁用了物体/目标检测，Frigate **仍会解码视频流**以支持画面变动检测、鸟瞰图、API 图像和其他功能。

如果你打算 Frigate 只是拿来录制不进行物体/目标识别，仍建议设置一个低分辨率视频流并设置该视频流使用检测（`detect`）功能，以减少所需视频流解码的资源消耗。

:::

关于特定摄像头型号的设置，请查看[摄像头特定](camera_specific.md)信息。

## 设置摄像头 PTZ 控制 {#setting-up-camera-ptz-controls}

:::warning

并非所有 PTZ 摄像头都支持 ONVIF，这是 Frigate 用来与你的摄像头通信的标准协议。部分摄像头可能使用私有协议来进行控制，Frigate 不支持该方式。请检查[官方 ONVIF 兼容产品列表](https://www.onvif.org/conformant-products/)、你的摄像头文档或制造商网站，以确保你的 PTZ 支持 ONVIF。同时，请确保你的摄像头运行最新的固件。

:::

为摄像头配置 ONVIF 连接以启用 PTZ 控制。

<ConfigTabs>
<TabItem value="图形化配置">

<FrigateConfigMock
  level="camera"
  section="onvif"
  :values="{ host: '10.0.10.10', port: 8000, user: 'admin', password: 'password' }"
  :targets="[
    { field: 'host', hint: '填写摄像头的 IP 地址，例如 10.0.10.10。' },
    { field: 'port', hint: '填写摄像头的 ONVIF 端口，例如 8000。' },
    { field: 'user', hint: '填写摄像头的 ONVIF 用户名，例如 admin。' },
    { field: 'password', hint: '填写摄像头的 ONVIF 密码。' },
  ]"
/>

</TabItem>
<TabItem value="YAML配置文件">

```yaml {4-8}
cameras:
  back:
    ffmpeg: ...
    onvif:
      host: 10.0.10.10
      port: 8000
      user: admin
      password: password
```

</TabItem>
</ConfigTabs>

如果 ONVIF 连接成功，PTZ 控制将在摄像头的 Web 界面中可用。

如果摄像头连接成功但认证失败，两个可选字段可以帮助解决：

- `tls_insecure`：跳过 TLS 证书验证并以明文（`PasswordText`）而非哈希摘要（`PasswordDigest`）发送 ONVIF 密码。部分摄像头拒绝摘要令牌，仅接受明文。这会降低连接安全性，因此仅在受信任的本地网络中启用。
- `ignore_time_mismatch`：ONVIF 认证令牌包含时间戳，如果摄像头时钟与 Frigate 差异过大，摄像头会拒绝令牌。启用此项会使 Frigate 补偿时间偏差，使认证仍然成功。在摄像头和 Frigate 主机上运行 NTP 是推荐的修复方式；仅在"安全"环境中使用此选项，因为它会略微削弱令牌验证。

:::note

部分摄像头会使用独立的 ONVIF 账号，与设备的管理员凭证不同。如果使用管理员账号进行 ONVIF 认证失败，请尝试在摄像头固件中创建或使用专用的 ONVIF 用户。更多详情请查阅对应摄像头厂商的官方文档。

:::

:::tip

如果你的 ONVIF 摄像头不需要认证凭据，你可能仍需要为`user`和`password`指定空字符串，例如：`user: ""`和`password: ""`。

:::

如果你的摄像头有多个 ONVIF 配置文件，你可以使用 `profile` 选项指定用于 PTZ 控制的配置文件，按令牌或名称匹配。未设置时，Frigate 会选择第一个具有有效 PTZ 配置的配置文件。查看 Frigate 调试日志（`frigate.ptz.onvif: debug`）以查看摄像头的可用配置文件名称和令牌。

支持视野(FOV)内相对移动的 ONVIF 摄像头还可以配置为自动追踪移动物体并将其保持在画面中央。关于自动追踪的设置，请参阅[自动追踪](autotracking.md)文档。

## ONVIF PTZ 摄像头推荐 {#onvif-ptz-camera-recommendations}

以下工作与非工作 PTZ 摄像头列表基于用户反馈。如果你想反馈某厂商或某款摄像头存在的特定特性或问题，且这些问题对其他用户会有帮助，你可以发起一个拉取请求（pull request），将这些信息添加到此列表中。

在 [ONVIF 兼容产品数据库](https://www.onvif.org/conformant-products/)的 FeatureList（功能列表）​ 中，可以初步判断某款摄像头是否兼容 Frigate 的自动追踪功能。请查看该摄像头是否列出了 `PTZRelative`、`PTZRelativePanTilt`以及`PTZRelativeZoom`这些功能项。这些功能是实现自动追踪所必需的。不过需要注意的是，有些摄像头虽然声称支持，实际仍可能无法正常响应。如果这些功能项缺失，自动追踪功能将无法使用（不过网页界面中的基本云台变焦控制功能或许仍能使用）。除非下文确认某款摄像头能用，否则请避免选用数据库中没有相关条目的摄像头。

| 品牌或具体型号               | PTZ 控制 | 自动追踪 | 备注                                                                                                                                                                                                                       |
| ---------------------------- | :------: | :------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Amcrest                      |    ✅    |    ✅    | ⛔️ 一般来说 Amcrest 应该可以工作，但一些旧型号(如常见的 IP2M-841)不支持自动追踪                                                                                                                                            |
| Amcrest ASH21                |    ✅    |    ❌    | ONVIF 服务端口: 80                                                                                                                                                                                                         |
| Amcrest IP4M-S2112EW-AI      |    ✅    |    ❌    | 不支持 FOV 相对移动。                                                                                                                                                                                                      |
| Amcrest IP5M-1190EW          |    ✅    |    ❌    | ONVIF 端口: 80。不支持 FOV 相对移动。                                                                                                                                                                                      |
| Annke CZ504                  |    ✅    |    ✅    | 安克（Annke）官方支持提供了专用固件版本（[V5.7.1 build 250227](https://github.com/pierrepinon/annke_cz504/raw/refs/heads/main/digicap_V5-7-1_build_250227.dav)）以修复 ONVIF "TranslationSpaceFov" 问题 |
| Axis Q-6155E                 |    ✅    |    ❌    | ONVIF 服务端口：80；该摄像头不支持 MoveStatus 功能。                                                                                                                                                                       |
| Ctronics PTZ                 |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Dahua                        |    ✅    |    ✅    | 部分低端大华（lite 系列、picoo 系列等）据报告不支持自动追踪。这些型号通常没有四位数字型号加机箱前缀和选项后缀（例如 DH-P5AE-PV vs DH-SD49825GB-HNR）。 |
| Dahua DH-SD2A500HB           |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Dahua DH-SD49825GB-HNR       |    ✅    |    ✅    |                                                                                                                                                                                                                            |
| Dahua DH-P5AE-PV             |    ❌    |    ❌    |                                                                                                                                                                                                                            |
| Foscam                       |    ✅    |    ❌    | 一般支持 PTZ，但不支持相对移动。ONVIF 合规产品数据库中没有官方 ONVIF 认证和测试。                                                                                                                                           |
| Foscam R5                    |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Foscam SD4                   |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Hanwha XNP-6550RH            |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Hikvision                    |    ✅    |    ❌    | ONVIF 支持不完整(即使是最新固件 MoveStatus 也不会更新) - 在 HWP-N4215IH-DE 和 DS-2DE3304W-DE 型号上报告，但可能还有其他型号                                                                                                |
| Hikvision DS-2DE3A404IWG-E/W |    ✅    |    ✅    |                                                                                                                                                                                                                            |
| Reolink                      |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Speco O8P32X                 |    ✅    |    ❌    |                                                                                                                                                                                                                            |
| Sunba 405-D20X               |    ✅    |    ❌    | 原始型号和 4k 型号报告 ONVIF 支持不完整。怀疑所有型号都不兼容。                                                                                                                                                            |
| Tapo                         |    ✅    |    ❌    | 支持多种型号，ONVIF 服务端口: 2020                                                                                                                                                                                         |
| Uniview IPC672LR-AX4DUPK     |    ✅    |    ❌    | 固件声称支持 FOV 相对移动，但在发送 ONVIF 命令时摄像头实际上不会移动                                                                                                                                                       |
| Uniview IPC6612SR-X33-VG     |    ✅    |    ✅    | 保持`calibrate_on_startup`为`False`。有用户报告使用`absolute`缩放是有效的。                                                                                                                                                |
| Vikylin PTZ-2804X-I2         |    ❌    |    ❌    | ONVIF 支持不完整                                                                                                                                                                                                           |

## 设置摄像头分组 {#setting-up-camera-groups}

摄像头分组让你可以将摄像头组织在一起，使用共享的名称和图标，方便查看和筛选。始终会有一个包含所有摄像头的默认分组。

<ConfigTabs>
<TabItem value="图形化配置">

在实时监控面板上，按下主导航中的**铅笔图标**添加新的摄像头分组。配置分组名称、选择要包含的摄像头、选择图标并设置显示顺序。

<FrigateConfigMock
  :auto-play="false"
  :show-navigation-steps="false"
  section="camera_groups"
  :values="{
    name: 'front',
    cameras: [
      { name: 'driveway_cam', enabled: true },
      { name: 'garage_cam', enabled: true },
      { name: 'back_yard', enabled: false },
    ],
  }"
  :steps="[
    {
      focus: '',
      label: '点击铅笔图标',
      hint: '在实时监控面板左侧的主导航中，点击铅笔图标打开摄像头组弹窗。',
    },
    {
      focus: 'name',
      label: '查找名称',
      hint: '为分组设置一个名称（例如 front）。',
    },
    {
      focus: 'cameras',
      label: '查找摄像头',
      hint: '打开要加入该分组的摄像头开关。',
    },
  ]"
/>

</TabItem>
<TabItem value="YAML配置文件">

```yaml
camera_groups:
  front:
    cameras:
      - driveway_cam
      - garage_cam
    icon: LuCar
    order: 0
```

</TabItem>
</ConfigTabs>

## 双向音频 {#two-way-audio}

请参阅[此处](/configuration/live/#two-way-talk)的指南
