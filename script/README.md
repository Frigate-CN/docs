# Frigate 配置 Mock 构建脚本

本目录包含用于生成 `FrigateConfigMock` 组件所需 `manifest.json` 的脚本。

## 文件说明

| 文件                         | 说明                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `clone-frigate.sh`           | Clone 官方 Frigate 仓库到 `.frigate/` 目录（用于获取 i18n、section-configs、Settings.tsx） |
| `generate-mock-manifest.mjs` | 从 schema + i18n + section-configs 生成 `manifest.json`                                    |
| `config-schema.json`         | Frigate 配置的 JSON Schema（**手动维护**，见下方说明）                                     |

## 分支映射

脚本会根据文档项目的分支自动选择官方 Frigate 仓库的对应分支：

| 文档分支 | 官方 Frigate 分支 |
| -------- | ----------------- |
| `main`   | `master`          |
| `beta`   | `dev`             |

## 手动更新 config-schema.json

`config-schema.json` 是 `FrigateConfig.model_json_schema()` 的输出，需要从 Frigate Python 后端生成。当 Frigate 配置模型发生变化时，需要手动更新此文件。

### 生成方法

在 Frigate 源码目录中运行：

```bash
# 确保已安装 Frigate 的 Python 依赖
python3 -c "
import json
from frigate.config import FrigateConfig
from frigate.util.schema import get_config_schema

schema = get_config_schema(FrigateConfig)
print(json.dumps(schema, indent=2, ensure_ascii=False))
" > /path/to/docs/script/config-schema.json
```

或者从运行中的 Frigate 实例获取：

```bash
curl http://<frigate-host>/api/config/schema.json > script/config-schema.json
```

## 构建流程

`npm run docs:build` 会自动执行以下步骤：

1. `clone-frigate.sh` - Clone/更新官方 Frigate 仓库到 `.frigate/`
2. `generate-mock-manifest.mjs` - 读取 `config-schema.json` + `.frigate/` 中的 i18n 和配置文件，生成 `manifest.json`
3. `vitepress build` - 构建 Vitepress 文档站点

## 本地开发

```bash
# 仅生成 manifest（需要先运行 clone-frigate）
npm run build:mock

# 检查 manifest 是否最新
npm run check:mock

# 启动开发服务器（会自动生成 manifest）
npm run docs:dev
```
