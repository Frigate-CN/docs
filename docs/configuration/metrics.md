---
id: metrics
title: 监控指标
---

# 监控指标

Frigate 在 `/api/metrics` 端点提供 Prometheus 格式的监控指标，可用于监测 Frigate 实例的性能和运行状态。

## 启用遥测 {#enabling-telemetry}

Prometheus 指标通过遥测配置暴露。启用或配置遥测以控制指标可用性。

指标默认在 `/api/metrics` 可用，无需额外配置。

## 可用指标 {#available-metrics}

### 系统指标

- `frigate_cpu_usage_percent{pid="", name="", process="", type="", cmdline=""}` - 进程 CPU 使用率百分比
- `frigate_mem_usage_percent{pid="", name="", process="", type="", cmdline=""}` - 进程内存使用率百分比
- `frigate_gpu_usage_percent{gpu_name=""}` - GPU 利用率百分比
- `frigate_gpu_mem_usage_percent{gpu_name=""}` - GPU 显存使用率百分比

### 摄像头指标

- `frigate_camera_fps{camera_name=""}` - 摄像头帧率
- `frigate_detection_fps{camera_name=""}` - 每秒检测次数
- `frigate_process_fps{camera_name=""}` - 每秒处理帧数
- `frigate_skipped_fps{camera_name=""}` - 每秒跳过的帧数
- `frigate_detection_enabled{camera_name=""}` - 摄像头检测功能启用状态
- `frigate_audio_dBFS{camera_name=""}` - 音频 dBFS 值
- `frigate_audio_rms{camera_name=""}` - 音频 RMS 值

### 检测器指标

- `frigate_detector_inference_speed_seconds{name=""}` - 目标检测耗时（秒）
- `frigate_detection_start{name=""}` - 检测器启动时间（Unix 时间戳）

### 存储指标

- `frigate_storage_free_bytes{storage=""}` - 存储剩余空间（字节）
- `frigate_storage_total_bytes{storage=""}` - 存储总容量（字节）
- `frigate_storage_used_bytes{storage=""}` - 存储已用空间（字节）
- `frigate_storage_mount_type{mount_type="", storage=""}` - 存储挂载类型信息

这些指标报告的是操作系统对整个文件系统的统计值（与 `df` 的数据相同），而非 Frigate 自身的录制占用量。有关此值与界面中显示的录制用量的区别，请参阅[理解存储用量](/configuration/record#understanding-storage-usage)。

### 服务指标

- `frigate_service_uptime_seconds` - 服务运行时间（秒）
- `frigate_service_last_updated_timestamp` - 指标更新时间（Unix 时间戳）
- `frigate_device_temperature{device=""}` - 设备温度

### 事件指标

- `frigate_camera_events{camera="", label=""}` - 自指标收集器启动以来的摄像头事件计数

## Prometheus 配置 {#configuring-prometheus}

在 Prometheus 中添加以下配置来收集 Frigate 指标：

```yaml
scrape_configs:
  - job_name: "frigate"
    metrics_path: "/api/metrics"
    static_configs:
      - targets: ["frigate:5000"]
    scrape_interval: 15s
```

## 查询示例 {#example-queries}

以下是几个实用的 PromQL 查询示例：

```promql
# 所有进程的平均 CPU 使用率
avg(frigate_cpu_usage_percent)

# GPU 显存总使用率
sum(frigate_gpu_mem_usage_percent)

# 指定摄像头的检测帧率（5 分钟滑动窗口）
rate(frigate_detection_fps{camera_name="front_door"}[5m])

# 存储空间使用百分比
(frigate_storage_used_bytes / frigate_storage_total_bytes) * 100

# 过去 1 小时各摄像头的事件计数
increase(frigate_camera_events[1h])
```

## Grafana 仪表板 {#grafana-dashboard}

你可以使用这些指标创建 Grafana 仪表板来监控 Frigate 实例，建议监控以下内容：

- CPU、内存和 GPU 使用率趋势
- 摄像头帧率和检测频率
- 存储空间使用情况和趋势
- 各摄像头事件计数
- 系统温度监控

我们将在后续更新中提供示例 Grafana 仪表板的 JSON 配置。

## 指标类型 {#metric-types}

Frigate 提供的指标采用以下 Prometheus 指标类型：

- **计数器（Counter）**：只增不减的累计值（如 `frigate_camera_events`）
- **仪表盘（Gauge）**：可升降的瞬时值（如 `frigate_cpu_usage_percent`）
- **信息（Info）**：用于元数据的键值对（如 `frigate_storage_mount_type`）

有关 Prometheus 指标类型的更多信息，请参阅 [Prometheus 官方文档](https://prometheus.io/docs/concepts/metric_types/)。
