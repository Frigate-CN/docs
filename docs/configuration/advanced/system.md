---
id: system
title: 系统
---

### 日志配置 {#logging}

#### Frigate 日志设置 {#frigate-logger}

可调整日志级别用于故障排查。

```yaml
logger:
  # 可选：默认日志级别（默认如下）
  default: info
  # 可选：按模块设置日志级别
  logs:
    frigate.mqtt: error
```

可用日志级别：`debug`、`info`、`warning`、`error`、`critical`

可配置模块示例：

- `frigate.app`
- `frigate.mqtt`
- `frigate.object_detection.base`
- `detector.<检测器名称>`
- `watchdog.<摄像头名称>`
- `ffmpeg.<摄像头名称>.<功能>` 注意：所有 FFmpeg 日志均以 `error` 级别记录

#### Go2RTC 日志设置 {#go2rtc-logging}

参考 [go2rtc 文档](https://github.com/AlexxIT/go2rtc?tab=readme-ov-file#module-log)配置日志

```yaml
go2rtc:
  streams:
    # ...
  log:
    exec: trace
```

### `environment_vars` {#environment_vars}

此配置项适用于无法直接修改容器环境的情况（如 Home Assistant OS）。Docker 用户应在 `docker run` 命令（`-e FRIGATE_MQTT_PASSWORD=secret`）或 `docker-compose.yml` 文件（`environment:` 部分）中设置环境变量。注意，此处设置的值以明文形式存储在配置文件中，因此如果目的是保护凭据安全，请改用 Docker 环境变量或 Docker secrets。

以 `FRIGATE_` 为前缀的变量可以在支持环境变量替换的配置字段（如 MQTT 主机和凭据、摄像头流 URL、ONVIF 主机和凭据）中使用 `{FRIGATE_VARIABLE_NAME}` 语法引用。

```yaml
environment_vars:
  FRIGATE_MQTT_USER: my_mqtt_user
  FRIGATE_MQTT_PASSWORD: my_mqtt_password

mqtt:
  host: "{FRIGATE_MQTT_HOST}"
  user: "{FRIGATE_MQTT_USER}"
  password: "{FRIGATE_MQTT_PASSWORD}"
```

#### TensorFlow 线程配置 {#tensorflow-thread-configuration}

如果在分类模型训练过程中遇到线程创建错误，可以限制 TensorFlow 的线程使用量：

```yaml
environment_vars:
  TF_INTRA_OP_PARALLELISM_THREADS: "2" # 单个运算内部的线程数（0 = 使用默认值）
  TF_INTER_OP_PARALLELISM_THREADS: "2" # 不同运算之间的线程数（0 = 使用默认值）
  TF_DATASET_THREAD_POOL_SIZE: "2" # 数据管道线程池大小（0 = 使用默认值）
```

### `database` {#database}

追踪的目标信息和录像信息存储在 `/config/frigate.db` 的 SQLite 数据库中。若删除该数据库，录像文件将变为孤立文件需手动清理，且不会显示在 Home Assistant 的媒体浏览器中。

若使用网络存储（SMB/NFS 等），启动时可能出现 `database is locked` 错误。可自定义数据库路径：

如果使用网络存储作为媒体文件夹，数据库可能需要放在自定义位置。

```yaml
database:
  path: /自定义路径/frigate.db
```

### `model` {#model}

使用自定义模型时需指定宽高尺寸。

自定义模型可能需要不同的输入张量格式。支持 RGB、BGR 或 YUV 色彩空间转换。输入张量形状参数需与模型要求匹配。

| 张量维度 | 描述       |
| -------- | ---------- |
| N        | 批量大小   |
| H        | 模型高度   |
| W        | 模型宽度   |
| C        | 色彩通道数 |

| 可用输入张量形状 |
| ---------------- |
| "nhwc"           |
| "nchw"           |

```yaml
model:
  path: /模型路径
  width: 320
  height: 320
  input_tensor: "nhwc"
  input_pixel_format: "bgr"
```

#### `labelmap` {#labelmap}

:::warning
自定义标签映射后需同步调整[警报标签](../review.md#restricting-alerts-to-specific-labels)配置
:::

可自定义标签映射，常见场景是合并易混淆的目标类型（如 car/truck）。默认已将 truck 重命名为 car。你无法添加新的目标类型，但可以更改模型中已有目标的名称。

```yaml
model:
  labelmap:
    2: vehicle
    3: vehicle
    5: vehicle
    7: vehicle
    15: animal
    16: animal
    17: animal
```

注意，如果在标签映射中重命名了目标，还需要更新 `objects -> track` 列表。

:::warning
部分标签有特殊处理逻辑，修改可能禁用相关功能：

- `person` 关联 `face` 和 `amazon`
- `car` 关联 `license_plate`、`ups`、`fedex`、`amazon`
:::

## 网络配置 {#network-configuration}

Frigate 公开了一些网络选项。IPv6 和监听端口在 `networking` 配置中设置（或从设置界面设置）；更高级的更改需要[自定义内置 Nginx 配置](#自定义-nginx-配置)。

### 启用 IPv6 {#enabling-ipv6}

默认情况下，Frigate 仅监听 IPv4。要同时监听 IPv6——在端口 `5000` 上，以及配置 TLS 时在 `8971` 上——在 `networking` 配置中启用：

```yaml
networking:
  ipv6:
    enabled: true
```

### 监听不同端口 {#listen-on-different-ports}

可以更改 Nginx 使用的监听端口。内部端口（未认证）和外部端口（已认证）可以独立更改。还可以使用 `ip:port` 格式指定 IP 地址，将端口绑定到特定接口。例如，这可用于防止内部端口暴露在容器外部。

```yaml
networking:
  listen:
    internal: 127.0.0.1:5000
    external: 8971
```

:::warning

此设置面向高级用户。对于大多数用例，建议更改 Docker Compose 文件的 `ports` 部分或使用 Docker `run` 的 `--publish` 选项，例如 `-p 443:8971`。更改 Frigate 的端口可能会导致某些集成失效。

:::

### 自定义 Nginx 配置

更高级的内部网络配置更改可以通过将你自己的 `nginx.conf` 绑定挂载到容器中来完成：

```yaml
services:
  frigate:
    container_name: frigate
    ...
    volumes:
      ...
      - /自定义路径/nginx.conf:/usr/local/nginx/conf/nginx.conf
```

## 基础路径 {#base-path}

默认情况下，Frigate 运行在根路径（`/`）。但某些设置需要让 Frigate 运行在自定义路径前缀下（例如 `/frigate`），特别是当 Frigate 位于需要基于路径路由的反向代理后面时。

### 通过 HTTP 头设置基础路径 {#set-base-path-via-http-header}

推荐方式是在上游反向代理中设置 `X-Ingress-Path` HTTP 头：

Nginx 示例：

```
location /frigate {
    proxy_set_header X-Ingress-Path /frigate;
    proxy_pass http://frigate_backend;
}
```

### 通过环境变量设置基础路径 {#set-base-path-via-environment-variable}

当无法通过 HTTP 头设置基础路径时，也可以通过 Docker Compose 文件中的 `FRIGATE_BASE_PATH` 环境变量设置：

```yaml
services:
  frigate:
    image: blakeblackshear/frigate:latest
    environment:
      - FRIGATE_BASE_PATH=/frigate
```

这可用于例如通过 Tailscale agent（https）访问 Frigate，只需将所有请求转发到基础路径（http）：

```
tailscale serve --https=443 --bg --set-path /frigate http://localhost:5000/frigate
```

## 自定义依赖 {#custom-dependencies}

### 自定义 FFmpeg {#custom-ffmpeg-build}

将静态编译的 `ffmpeg` 和 `ffprobe` 放入 `/config/custom-ffmpeg/bin`：

1. 下载 FFmpeg 并解压到 `/config/custom-ffmpeg`。确认 `ffmpeg` 和 `ffprobe` 二进制文件位于 `/config/custom-ffmpeg/bin`。
2. 更新 Frigate 配置中的 `ffmpeg.path`：

```yaml
ffmpeg:
  path: /config/custom-ffmpeg
```

3. 重启 Frigate

### 自定义 go2rtc 版本 {#custom-go2rtc-version}

Frigate 目前内置的 go2rtc 版本为 `v1.9.13`，在某些特定情况下，你可能希望运行不同版本的 go2rtc。

操作步骤如下：

1. 下载你系统对应的 [go2rtc](https://github.com/AlexxIT/go2rtc/releases) 二进制文件到 `/config` 目录
2. 将文件重命名为 `go2rtc`
3. 添加执行权限（在文件目录下执行 `chmod +x ./go2rtc`）
4. 重启 Frigate，自定义版本将被使用，你可以通过检查 go2rtc 日志来验证

## 配置文件验证 {#validating-your-configyml-file-updates}

Frigate 启动时会检查配置文件是否合法；若不合法，进程会直接退出。为减少更新配置时的中断，你有三种方式：

- 通过内置校验的网页编辑配置
- 使用配置 API
- 或通过 Frigate Docker 容器在命令行中进行验证

### 通过 API 验证 {#via-api}

Frigate 可通过 `/api/config/save` 接口接收 JSON 格式的新配置文件。通过此方式更新配置时，Frigate 会在保存前先验证配置的有效性；若配置无效，接口将返回 `400` 状态码。

```bash
curl -X POST http://frigate_host:5000/api/config/save -d @config.json
```

或使用 [`yq`](https://github.com/mikefarah/yq) 转换 YAML：

```bash
yq -o=json '.' config.yaml | curl -X POST 'http://frigate_host:5000/api/config/save?save_option=saveonly' --data-binary @-
```

### 命令行验证 {#via-command-line}

你也可以使用 Docker 容器本身在命令行中验证配置。在 CI/CD 中，你可以利用返回码判断配置是否有效——Frigate 在配置无效时返回 `1`，有效时返回 `0`。

```bash
docker run                                \
  -v $(pwd)/config.yml:/config/config.yml \
  --entrypoint python3                    \
  docker.cnb.cool/frigate-cn/frigate:stable  \
  -u -m frigate                           \
  --validate-config
```
