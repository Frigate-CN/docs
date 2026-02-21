#!/bin/bash

# 下载 Weblate 翻译文件脚本

# 设置变量
OUTPUT_DIR="./docs"
OUTPUT_FILE="translation.json"
DOWNLOAD_URL="https://hosted.weblate.org/api/translations/frigate-nvr/objects/zh_Hans/file/"

# 检查环境变量
if [ -z "$VITE_WEBLATE_TOKEN" ]; then
    echo "错误: 环境变量 VITE_WEBLATE_TOKEN 未设置"
    exit 1
fi

# 创建输出目录（如果不存在）
mkdir -p "$OUTPUT_DIR"

# 下载翻译文件
echo "正在从 Weblate 下载翻译文件..."

curl -L \
    -H "Authorization: Token $VITE_WEBLATE_TOKEN" \
    -o "$OUTPUT_DIR/$OUTPUT_FILE" \
    "$DOWNLOAD_URL"

# 检查下载是否成功
if [ $? -eq 0 ]; then
    echo "翻译文件已成功下载到 $OUTPUT_DIR/$OUTPUT_FILE"
else
    echo "错误: 下载翻译文件失败"
    exit 1
fi
