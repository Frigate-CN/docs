
<template>
  <div class="home-section-content">
    <div class="block-item">
      <div class="block-preview">
        <img src="/assets/detection.png" alt="Preview">
      </div>
      <div class="block-content">
        <h1 class="underline">本地智能识别，大幅降低误报</h1>
        <p>传统安防设备依赖简单移动侦测，调校复杂且误报率高。Frigate采用本地AI目标检测技术，无需依赖云端，普通硬件也能精准识别人员、车辆等目标，有效减少误报。你的监控数据全程本地处理，隐私更安全。</p>
      </div>
    </div>
    <div class="block-item">
      <div class="block-preview">
        <img src="/assets/review.png" alt="Preview">
      </div>
      <div class="block-content">
        <h1 class="underline">别让影子和风干扰识别</h1>
        <p>Frigate通过本地AI智能分析，自动过滤摄像头因阴影变化和风吹草动产生的误报，让你专注于真正重要的目标检测。搭载AI加速器时，系统每秒可处理100+个目标检测，精准识别人员、车辆等关键目标，确保监控视频的每一帧都得到有效分析，重要画面一帧不漏。</p>
      </div>
    </div>
    <div class="block-item">
      <div class="block-preview">
        <img src="/assets/driveway_zones-min.png" alt="Preview">
      </div>
      <div class="block-content">
        <h1 class="underline">利用区域功能精准微调事件与警报</h1>
        <p>Frigate可实时追踪物体，并能精准判断人员开始走上你家门阶的确切时刻，或是车辆驶入你私家车位的具体时间。基于精确位置信息优化你的通知设置。</p>
      </div>
    </div>
    <div class="block-item">
      <div class="block-preview">
        <img src="/assets/hass-opt.png" alt="Preview">
      </div>
      <div class="block-content">
        <h1 class="underline">与Home Assistant及其他自动化平台集成</h1>
        <p>通过将目标检测功能集成至Home Assistant、OpenHab、Node-RED或任何支持MQTT的平台，为你的家赋予"智慧之眼"。Frigate不仅深度对接Home Assistant媒体浏览器，提供低延迟摄像头实体，还能开放实时传感器与开关接口——让你随心所欲地构建自动化场景与通知系统。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-section-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.underline:after {
    border-left: 1.5em solid #3c3d40;
    display: block;
    content: "";
    height: 2px;
    margin-top: .5em;
}

.home-section-content .block-item {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.block-item {
  margin-bottom: 1.66667em;
}

.block-content,
.block-preview {
  flex: 1; /* 可根据需求调整宽度比例 */
}

/* 奇数项：内容在左，预览在右 */
.block-item:nth-child(odd) .block-content {
  order: 1;
  margin-right: 4em;
}

.block-item:nth-child(odd) .block-preview {
  order: 2;
}

/* 偶数项：内容在右，预览在左 */
.block-item:nth-child(even) .block-content {
  order: 2;
  margin-left: 4em;
}

.block-item:nth-child(even) .block-preview {
  order: 1;
}

.block-preview img {
  -webkit-filter: drop-shadow(2px 2px .25rem #2b2b2b);
  filter: drop-shadow(2px 2px .25rem #2b2b2b);
}

@media (max-width: 768px) {
  .content {
    padding: 12px;
    gap: 16px;
  }

  .block-item {
    flex-direction: column !important; /* 强制垂直排列 */
    align-items: stretch; /* 让子项撑满宽度 */
  }

  .block-content,
  .block-preview {
    width: 100% !important;
    order: unset !important; /* 取消 order 控制，全部按 HTML 书写顺序排列 */
  }

  .block-item {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .block-item .block-preview {
    order: -1; /* 让图片排到最上面 */
  }

  .block-item .block-preview {
    order: -1;
  }

  .block-item .block-content {
    order: 1;
    margin: 0px !important;
  }
}
</style>