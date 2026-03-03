<script setup lang="ts">
import { TkTransitionCollapse } from "vitepress-theme-teek";
import { ref } from "vue";

const question1 = ref(false);
const question2 = ref(false);
const question3 = ref(false);
const question4 = ref(false);
const question5 = ref(false);
</script>

<template>
  <div class="question-item">
    <button class="question-btn" @click="question1 = !question1">Frigate 支持哪些硬件平台？</button>
    <TkTransitionCollapse>
      <div v-show="question1" class="question-answer">
        除了支持常见的 x86 架构设备（例如<a href="/frigate/hardware.html#openvino-intel" target="_blank">Intel</a>、<a href="/frigate/hardware.html#rocm-amd-gpu" target="_blank">AMD</a>的主机），我们还支持一些 ARM开发板，例如<a href="/frigate/hardware.html#rockchip-平台" target="_blank">瑞芯微Rockchip</a>、<a href="/frigate/hardware.html#hailo-8" target="_blank">树莓派</a>* 以及<a href="/frigate/hardware.html#nvidia-jetson" target="_blank">NVIDIA Jetson</a>等。
        <br />
        <i class="question-note">* 树莓派需要额外的 Hailo 加速卡才能进行检测识别物体。</i>
      </div>
    </TkTransitionCollapse>
  </div>
  <div class="question-item">
    <button class="question-btn" @click="question2 = !question2">Frigate 支持多少路监控？</button>
    <TkTransitionCollapse>
      <div v-show="question2" class="question-answer">
        Frigate没有限制监控路数，实际支持的路数受限于硬件的性能。你可以参阅我们的<a href="/frigate/planning_setup.html#%E6%96%B0%E5%AE%89%E8%A3%85%E8%A7%84%E5%88%92%E6%8C%87%E5%8D%97" target="_blank">新安装规划指南</a>，提前规划选择你的硬件配置。
      </div>
    </TkTransitionCollapse>
  </div>
  <div class="question-item">
    <button class="question-btn" @click="question3 = !question3">Frigate 有手机 APP 吗？</button>
    <TkTransitionCollapse>
      <div v-show="question3" class="question-answer">
        我们没有官方的手机 APP，但你可以考虑通过<a href="/configuration/pwa.html" target="_blank">PWA</a>，即浏览器添加桌面图标的方式，就能获得全屏的页面，体验非常接近原生 APP。不过在此之前，你需要能够公网访问到 Frigate。
      </div>
    </TkTransitionCollapse>
  </div>
  <div class="question-item">
    <button class="question-btn" @click="question4 = !question4">Frigate 支持哪些摄像头？</button>
    <TkTransitionCollapse>
      <div v-show="question4" class="question-answer">
        只要你的摄像头支持 RTSP 协议，Frigate 就能支持。RTSP 协议是摄像头主流的一种视频传输协议，目前几乎所有商用摄像头（例如 TP-Link、海康威视、大华等）都支持 RTSP 流，部分家用级摄像头（如新款 360 摄像头）也支持在设置中开启。但部分家用摄像头（例如小米、萤石）不支持 RTSP。你可以咨询摄像头厂商你的型号是否支持 RTSP 流。
      </div>
    </TkTransitionCollapse>
  </div>
  <div class="question-item">
    <button class="question-btn" @click="question5 = !question5">Frigate 收费吗？</button>
    <TkTransitionCollapse>
      <div v-show="question5" class="question-answer">
        Frigate 本体功能完全免费！没有任何限制！不过我们也有提供 <strong>Frigate+</strong>* 订阅服务，通过该服务你可以训练更适合你的 AI 识别模型。当然，你也可以自行通过第三方工具来训练模型！
        <br />
        <i class="question-note">* Frigate+ 订阅服务主体在海外，可能不符合国内相关政策要求。我们正在准备国内提供类似的服务。</i>
      </div>
    </TkTransitionCollapse>
  </div>
  <div class="question-item">
    <button class="question-btn" @click="question5 = !question5">Frigate 安全吗？</button>
    <TkTransitionCollapse>
      <div v-show="question5" class="question-answer">
        Frigate 是一个开源项目，我们的代码完全公开透明，任何人都可以查看和审计我们的代码。我们也非常重视用户的隐私和数据安全，我们不会主动收集用户的任何个人信息或视频数据。
        <br>需要注意的是，我们无法阻止用户的<strong>不当的配置造成的安全风险</strong>，请你务必了解每一个设置项的作用，尤其是不要开启容器的无鉴权端口（默认为5000）！如果觉得输入密码麻烦，请使用浏览器自带的密码管理功能保存密码。
      </div>
    </TkTransitionCollapse>
  </div>
</template>

<style scoped>
.question-item {
  margin-bottom: 20px;
}
.question-btn {
  margin-bottom: 10px;
  font-size: 1.2em;
  font-weight: bold;
}
.question-answer {
  
}
.question-note {
  font-size: 0.8em;
  color: #666;
}
</style>