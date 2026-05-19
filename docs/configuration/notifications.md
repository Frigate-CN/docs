---
id: notifications
title: 通知功能
---

# 通知功能

:::warning

注意，受限于 Google 相关服务在中国大陆地区被屏蔽，该功能可能**无法在中国大陆地区使用**。

如有手机通知的需求，建议使用 MQTT 配合 Home Assistant 通知功能。

:::

Frigate 采用 [WebPush 协议](https://web.dev/articles/push-notifications-web-push-protocol)实现原生通知功能，该协议使用 [VAPID 规范](https://tools.ietf.org/html/draft-thomson-webpush-vapid)通过加密方式向网页应用推送通知。

:::info

推送通知需要 Frigate 服务器能够访问浏览器供应商的推送服务（如 Google FCM、Mozilla autopush）。详见[网络需求](/frigate/network_requirements#push-notifications)。

:::

## 设置通知功能 {#setting-up-notifications}

使用通知功能需满足以下条件：

- 必须通过安全的 `https` 连接访问 Frigate（参见[认证文档](/configuration/authentication)）
- 需使用支持的浏览器（目前已知 Chrome、Firefox 和 Safari 支持）
- 如需外部接收通知，Frigate 必须可从外部访问
- iOS 设备需在「设置 > Apps > Safari > 高级 > 功能」中启用通知开关

### 配置 {#configuration}

启用通知功能并填写必要字段。

可选修改默认通知冷却时间。冷却时间也可按摄像头单独覆盖。

以下情况将阻止通知发送：

- 全局冷却时间未过（自任意摄像头上次通知以来）
- 特定摄像头的冷却时间未过

#### 全局通知 {#global-notifications}

```yaml
notifications:
  enabled: True
  email: "johndoe@gmail.com"
  cooldown: 10 # 任意摄像头发送下一条通知前等待 10 秒
```

#### 按摄像头通知 {#per-camera-notifications}

```yaml
cameras:
  doorbell:
    ...
    notifications:
      enabled: True
      cooldown: 30 # 门铃摄像头发送下一条通知前等待 30 秒
```

### 设备注册 {#registration}

启用通知后，在所有希望接收通知的设备上点击 `注册通知` 按钮，注册后台工作进程。完成后需重启 Frigate，然后通知将开始发送。

## 支持的通知类型 {#supported-notifications}

当前仅支持核查警报通知，更多通知类型将在未来添加。

:::note
目前仅 Chrome 支持带图片的通知，Safari 和 Firefox 仅显示标题和文字内容。
:::

## 降低通知延迟 {#reduce-notification-latency}

不同平台处理通知的方式各异，可能需要调整设置以获得最佳效果。

### Android 设备 {#android}

多数安卓手机具有电池优化设置。为确保可靠接收通知，建议为浏览器（Chrome/Firefox）禁用电池优化。若以 PWA 形式运行 Frigate，也需同时禁用 Frigate 应用的电池优化。
