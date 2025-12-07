---
id: updating
title: 更新
---

# 更新 Frigate

Frigate 的当前稳定版本是 **0.16.3**。此版本的发布说明和任何重大变更可以在 [Frigate GitHub 发布页面](https://github.com/blakeblackshear/frigate/releases/tag/v0.16.3) 上找到。

保持 Frigate 的更新可确保您能够获得最新功能、性能改进和错误修复。更新过程根据您的安装方法（Docker、Home Assistant 插件等）略有不同。以下是最常见设置的说明。

## 开始之前

- **停止 Frigate**：对于大多数方法，您需要在备份和更新之前停止正在运行的 Frigate 实例。
- **备份您的配置**：在更新之前，始终备份您的 `/config` 目录（例如，`config.yml` 和 `frigate.db`，SQLite 数据库）。这确保如果出现问题，您可以回滚到上一个版本。
- **查看发布说明**：仔细阅读 [Frigate GitHub 发布页面](https://github.com/blakeblackshear/frigate/releases)，了解可能影响您设置的重大变更或配置更新。

## 使用 Docker 更新

如果您通过 Docker 运行 Frigate（推荐方法），请按照以下步骤操作：

1. **停止容器**：

   - 如果使用 Docker Compose：
     ```bash
     docker compose down frigate
     ```
   - 如果使用 `docker run`：
     ```bash
     docker stop frigate
     ```

2. **更新并拉取最新镜像**：

   - 如果使用 Docker Compose：
     - 编辑您的 `docker-compose.yml` 文件以指定所需的版本标签（例如，使用 `0.16.3` 而不是 `0.15.2`）。例如：
       ```yaml
       services:
         frigate:
           image: docker.cnb.cool/frigate-cn/frigate:0.16.3
       ```
     - 然后拉取镜像：
       ```bash
       docker pull docker.cnb.cool/frigate-cn/frigate:0.16.3
       ```
     - **`stable` 标签用户注意**：如果您的 `docker-compose.yml` 使用 `stable` 标签（例如，`docker.cnb.cool/frigate-cn/frigate:stable`），您不需要手动更新标签。拉取后，`stable` 标签始终指向最新的稳定版本。
   - 如果使用 `docker run`：
     - 使用适当的标签拉取镜像（例如，`0.16.3`、`0.16.3-tensorrt` 或 `stable`）：
       ```bash
       docker pull docker.cnb.cool/frigate-cn/frigate:0.16.3
       ```

3. **启动容器**：

   - 如果使用 Docker Compose：
     ```bash
     docker compose up -d
     ```
   - 如果使用 `docker run`，使用更新后的镜像标签重新运行您的原始命令（例如，来自 [安装](./installation.md#docker) 部分）。

4. **验证更新**：
   - 检查容器日志以确保 Frigate 成功启动：
     ```bash
     docker logs frigate
     ```
   - 访问 Frigate Web UI（默认：`http://<your-ip>:5000`）以确认新版本正在运行。版本号显示在系统指标页面的顶部。

### 注意事项

- 如果您已自定义其他设置（例如，`shm-size`），请确保它们在更新后仍然适用。
- 只要您拉取了正确的版本，Docker 将在重启容器时自动使用更新后的镜像。

## 更新 Home Assistant 插件

对于使用 Home Assistant 插件运行 Frigate 的用户：

1. **检查更新**：

   - 在 Home Assistant 中导航至 **设置 > 插件**。
   - 找到您安装的 Frigate 插件（例如，"Frigate NVR" 或 "Frigate NVR (Full Access)"）。
   - 如果有更新可用，您将看到一个"更新"按钮。

2. **更新插件**：

   - 点击 Frigate 插件旁边的"更新"按钮。
   - 等待过程完成。Home Assistant 将处理下载和安装新版本。

3. **重启插件**：

   - 更新后，转到插件页面并点击"重启"以应用更改。

4. **验证更新**：
   - 检查插件日志（在"日志"选项卡下）以确保 Frigate 启动时没有错误。
   - 访问 Frigate Web UI 以确认新版本正在运行。

### 注意事项

- 通过查看 [发布说明](https://github.com/blakeblackshear/frigate/releases) 确保您的 `/config/frigate.yml` 与新版本兼容。
- 如果使用自定义硬件（例如，Coral 或 GPU），请验证配置仍然有效，因为插件更新不会修改您的硬件设置。

## 回滚

如果更新导致问题：

1. 停止 Frigate。
2. 恢复您备份的配置文件和数据库。
3. 恢复到之前的镜像版本：
   - 对于 Docker：在您的 `docker run` 命令中指定较旧的标签（例如，`ghcr.io/blakeblackshear/frigate:0.15.2`）。
   - 对于 Docker Compose：编辑您的 `docker-compose.yml`，指定较旧的版本标签（例如，`ghcr.io/blakeblackshear/frigate:0.15.2`），并重新运行 `docker compose up -d`。
   - 对于 Home Assistant：如果需要，通过存储库手动重新安装之前的插件版本，并重启插件。
4. 验证旧版本是否再次运行。

## 故障排除

- **容器无法启动**：检查日志（`docker logs frigate`）中的错误。
- **网页无法加载**：确保端口（例如，5000、8971）仍然正确映射且服务正在运行。
- **硬件问题**：如果更新后检测或解码失败，重新检查特定硬件设置（例如，Coral、GPU）。

常见问题通常在 [FAQ](https://github.com/blakeblackshear/frigate/discussions) 中得到解答，固定在支持讨论的顶部。