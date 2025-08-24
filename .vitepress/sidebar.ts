export const sidebar = [
  {
    text: 'Frigate',
    items: [
      { text: '<i class="fa-solid fa-indent"></i>介绍', link: '/frigate/' },
      { text: '<i class="fa-solid fa-server"></i>推荐硬件', link: '/frigate/hardware' },
      { text: '<i class="fa-solid fa-list-check"></i>安装规划', link: 'frigate/planning_setup' },
      { text: '<i class="fa-solid fa-download"></i>安装', link: '/frigate/installation' },
      { text: '<i class="fa-solid fa-circle-up"></i>更新', link: '/frigate/updating' },
      { text: '<i class="fa-solid fa-clapperboard"></i>摄像头设置', link: '/frigate/camera_setup' },
      { text: '<i class="fa-solid fa-timeline"></i>视频处理管线', link: '/frigate/video_pipeline' },
      { text: '<i class="fa-solid fa-file-lines"></i>术语表', link: '/frigate/glossary' },
    ]
  },
  {
    text: '向导',
    items: [
      { text: '入门指南', link: '/guides/getting_started' },
      { text: '配置 go2rtc', link: '/guides/configuring_go2rtc' },
      { text: 'HA 通知', link: '/guides/ha_notifications' },
      { text: 'HA 网络存储', link: '/guides/ha_network_storage' },
      { text: '反向代理', link: '/guides/reverse_proxy' },
    ]
  },
  {
    text: '配置',
    items: [
      {
        text: '配置文件',
        items: [
          { text: '<i class="fa-solid fa-gears"></i>概述', link: '/configuration/' },
          { text: '<i class="fa-solid fa-list"></i>完整参考', link: '/configuration/reference' },
          { text: 'Go2RTC 配置参考', link: 'https://github.com/AlexxIT/go2rtc/tree/v1.9.9#configuration' },
        ]
      },
      {
        text: '检测',
        items: [
          { text: '<i class="fa-solid fa-person"></i>对象检测器', link: '/configuration/object_detectors' },
          { text: '<i class="fa-solid fa-volume-high"></i>音频检测器', link: '/configuration/audio_detectors' },
        ]
      },
      {
        text: '识别',
        items: [
          { text: '<i class="fa-solid fa-magnifying-glass-arrow-right"></i>语义搜索', link: '/configuration/semantic_search' },
          { text: '<i class="fa-solid fa-comment"></i>生成式AI', link: '/configuration/genai' },
          { text: '<i class="fa-solid fa-face-smile"></i>人脸识别', link: '/configuration/face_recognition' },
          { text: '<i class="fa-solid fa-car-side"></i>车牌识别', link: '/configuration/license_plate_recognition' },
          { text: '<i class="fa-solid fa-dove"></i>鸟类分类', link: '/configuration/bird_classification' },
        ]
      },
      {
        text: '<i class="far fa-camera"></i>摄像头',
        items: [
          { text: '<i class="far fa-camera"></i>摄像头', link: '/configuration/cameras' },
          { text: '<i class="fa-solid fa-check"></i>核查（原事件）', link: '/configuration/review' },
          { text: '<i class="fa-solid fa-compact-disc"></i>录制', link: '/configuration/record' },
          { text: '<i class="fa-solid fa-file-image"></i>快照', link: '/configuration/snapshots' },
          { text: '<i class="fa-solid fa-person-walking"></i>画面变动检测', link: '/configuration/motion_detection' },
          { text: '<i class="fa-solid fa-crow"></i>鸟瞰图', link: '/configuration/birdseye' },
          { text: '<i class="fa-solid fa-circle-play"></i>实时监控', link: '/configuration/live' },
          { text: '<i class="fa-regular fa-file-video"></i>重新流式传输', link: '/configuration/restream' },
          { text: '<i class="fa-solid fa-users-viewfinder"></i>自动跟踪', link: '/configuration/autotracking' },
          { text: '<i class="fa-solid fa-circle-info"></i>特定摄像头', link: '/configuration/camera_specific' },
        ]
      },
      {
        text: '对象',
        items: [
          { text: '<i class="fa-solid fa-filter"></i>对象过滤器', link: '/configuration/object_filters' },
          { text: '<i class="fa-solid fa-crop"></i>遮罩', link: '/configuration/masks' },
          { text: '<i class="fa-solid fa-crop-simple"></i>区域', link: '/configuration/zones' },
          { text: '<i class="fa-solid fa-person-circle-check"></i>对象', link: '/configuration/objects' },
          { text: '<i class="fa-solid fa-wheelchair"></i>静止对象', link: '/configuration/stationary_objects' },
        ]
      },
      {
        text: '硬件加速',
        items: [
          { text: '<i class="fa-solid fa-video"></i>视频硬件加速', link: '/configuration/hardware_acceleration_video' },
          { text: '<i class="fa-solid fa-microchip"></i>增强硬件加速', link: '/configuration/hardware_acceleration_enrichments' },
        ]
      },
      {
        text: '扩展配置',
        items: [
          { text: '认证', link: '/configuration/authentication' },
          { text: '通知', link: '/configuration/notifications' },
          { text: 'FFmpeg 预设', link: '/configuration/ffmpeg_presets' },
          { text: 'PWA', link: '/configuration/pwa' },
          { text: 'TLS', link: '/configuration/tls' },
          { text: '高级', link: '/configuration/advanced' },
        ]
      },
    ]
  },
  {
    text: 'API接口',
    items: [
      { text: 'Frigate+', link: '/integrations/plus' },
      { text: 'Home Assistant', link: '/integrations/home-assistant' },
      {
        text: 'HTTP API',
        link: 'https://docs.frigate.video/integrations/api/frigate-http-api',
      },
      { text: 'MQTT', link: '/integrations/mqtt' },
      { text: '指标', link: '/configuration/metrics' },
      { text: '第三方扩展', link: '/integrations/third_party_extensions' },
    ]
  },
  {
    text: '<i><img src="/img/logo.svg" width="14" height="14" style="display: inline;"></i>Frigate+',
    items: [
      { text: '介绍', link: '/plus/' },
      { text: '标注', link: '/plus/annotating' },
      { text: '第一个模型', link: '/plus/first_model' },
      { text: '常见问题', link: '/plus/faq' },
    ]
  },
  {
    text: '<i class="fa-solid fa-circle-question"></i>常见问题',
    items: [
      { text: '常见问题问答', link: '/troubleshooting/faqs' },
      { text: '录制', link: '/troubleshooting/recordings' },
      { text: 'GPU', link: '/troubleshooting/gpu' },
      { text: 'EdgeTPU', link: '/troubleshooting/edgetpu' },
    ]
  },
  {
    text: '<i class="fa-solid fa-code"></i>开发',
    items: [
      { text: '如何贡献代码', link: '/development/contributing' },
      { text: '贡献开发板支持', link: '/development/contributing-boards' },
    ]
  },
];