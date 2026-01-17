---
id: memory
title: 内存占用
---

Frigate 内置了基于 [memray](https://bloomberg.github.io/memray/) 的内存分析功能，可用于排查内存相关问题。该功能支持对 Frigate 指定模块进行内存分析，从而定位内存泄漏、内存过度分配或其他内存异常问题。

## 开启内存分析功能

内存分析功能由环境变量 `FRIGATE_MEMRAY_MODULES` 控制。将该变量的值设为需要分析的模块名称列表，多个模块名称用英文逗号分隔即可：

```yaml
# docker-compose 配置示例
services:
  frigate:
    ...
    environment:
      - FRIGATE_MEMRAY_MODULES=frigate.embeddings,frigate.capture
```

```bash
# docker run 运行示例
docker run -e FRIGATE_MEMRAY_MODULES="frigate.embeddings" \
   ...
   --name frigate <frigate_image>
```

### 模块名称说明

Frigate 的各类进程均采用基于模块的命名规则。常用的模块名称如下：

- `frigate.review_segment_manager` - 回看片段处理模块
- `frigate.recording_manager` - 录像管理模块
- `frigate.capture` - 摄像头视频采集进程（所有摄像头的采集进程均使用该模块名）
- `frigate.process` - 摄像头视频处理/目标追踪进程（所有摄像头的处理进程均使用该模块名）
- `frigate.output` - 输出处理模块
- `frigate.audio_manager` - 音频处理模块
- `frigate.embeddings` - 特征向量处理模块

如需对**指定摄像头**进行内存分析，也可以填写完整的进程名称（包含摄像头专属标识）：

```bash
FRIGATE_MEMRAY_MODULES=frigate.capture:front_door
```

当你填写某一模块名（如 `frigate.capture`）时，所有以此模块名作为前缀的进程都会被纳入分析范围。例如，配置 `frigate.capture` 会对所有摄像头的视频采集进程进行内存分析。

## 工作原理

1. **二进制文件生成**：开启内存分析后，memray 会在 `/config/memray_reports/` 目录下生成二进制文件（`.bin` 格式），该文件会随着进程的运行实时、持续更新数据。

2. **HTML 报告自动生成**：当进程正常退出时，Frigate 会自动执行以下操作：
   - 停止 memray 的内存追踪
   - 生成 HTML 火焰图分析报告
   - 将报告保存至 `/config/memray_reports/<module_name>.html` 路径下

3. **崩溃数据留存**：若进程发生崩溃（如触发 SIGKILL 信号、程序段错误等），对应的二进制文件会被完整保留，文件内包含进程崩溃前的所有内存数据。你可以基于该二进制文件手动生成 HTML 分析报告。

## 查看分析报告

### 自动生成的报告
当进程正常退出后，你可在 `/config/memray_reports/` 目录中找到对应的 HTML 报告文件。直接在浏览器中打开该文件，即可查看交互式火焰图，直观展示内存占用的变化规律。

### 手动生成报告
若进程发生崩溃，或需要基于已有的二进制文件生成报告，可通过以下方式手动创建 HTML 分析报告：

- 在 Frigate 容器内执行 memray 命令：
```bash
docker-compose exec frigate memray flamegraph /config/memray_reports/<module_name>.bin
# 或使用如下命令
docker exec -it <容器名称或容器ID> memray flamegraph /config/memray_reports/<module_name>.bin
```

- 也可将容器内的 `.bin` 文件复制到宿主机，在本地环境（需已安装 memray）执行生成命令：
```bash
docker cp <容器名称或容器ID>:/config/memray_reports/<module_name>.bin /tmp/
memray flamegraph /tmp/<module_name>.bin
```

## 报告解读

memray 生成的火焰图可展示以下核心信息：
- **内存分配时序**：查看代码中内存分配的具体位置
- **调用栈信息**：梳理触发内存分配的完整调用链路
- **内存热点**：定位占用内存最多的函数或代码执行路径
- **内存泄漏**：识别内存被分配后未释放的异常规律

交互式的 HTML 报告支持以下操作：
- 放大查看指定时间段的内存数据
- 按函数名称筛选相关内存分配信息
- 查看内存分配的详细数据
- 导出报告数据用于深度分析

## 最佳实践

1. **按需开启分析**：仅在出现内存异常问题时开启该功能，无需长期启用，内存分析会产生少量性能开销。
2. **精准指定模块**：无需对所有模块进行分析，仅针对你怀疑存在问题的模块开启即可。
3. **保证运行时长**：让进程运行足够长的时间，才能捕获到具备参考价值的内存占用规律。
4. **检查二进制文件**：若 HTML 报告未自动生成（如进程崩溃后），请前往 `/config/memray_reports/` 目录检查是否存在 `.bin` 文件，并基于该文件手动生成报告。
5. **对比多份报告**：在不同时间节点生成分析报告，对比内存占用规律，以此识别内存变化趋势。

## 故障排查

### 未生成任何分析报告
- 检查环境变量的配置是否正确
- 确认填写的模块名称完全匹配（名称区分大小写）
- 查看日志中是否存在 memray 相关报错信息
- 确保 `/config/memray_reports/` 目录已创建且具备写入权限

### 进程崩溃，未完成报告生成
- 前往 `/config/memray_reports/` 目录查找对应的 `.bin` 文件
- 执行命令手动生成 HTML 报告：`memray flamegraph <file>.bin`
- 该二进制文件中包含了进程崩溃前的全部内存数据

### 报告中无任何数据
- 确认进程已运行足够长的时间，能够生成有效分析数据
- 检查 memray 是否已正常安装（Frigate 镜像中已默认集成）
- 核实目标进程是否成功启动并正常运行（查看进程日志）

如需了解更多关于 memray 工具及报告解读的内容，请参阅 [memray 官方文档](https://bloomberg.github.io/memray/)。