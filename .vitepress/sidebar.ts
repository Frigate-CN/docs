export const sidebar = [
  {
    text: 'Frigate',
    items: [
      { text: '介绍', link: '/frigate/' },
      { text: '硬件', link: '/frigate/hardware' },
      { text: '安装规划', link: 'frigate/planning_setup' },
      { text: '安装', link: '/frigate/installation' },
      { text: '更新', link: '/frigate/updating' },
      { text: '摄像头设置', link: '/frigate/camera_setup' },
      { text: '视频处理管线', link: '/frigate/video_pipeline' },
      { text: '术语表', link: '/frigate/glossary' },
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
          { text: '概述', link: '/configuration/' },
          { text: '参考', link: '/configuration/reference' },
          { text: 'Go2RTC 配置参考', link: 'https://github.com/AlexxIT/go2rtc/tree/v1.9.9#configuration' },
        ]
      },
      {
        text: '检测',
        items: [
          { text: '对象检测器', link: '/configuration/object_detectors' },
          { text: '音频检测器', link: '/configuration/audio_detectors' },
        ]
      },
      {
        text: '识别',
        items: [
          { text: '语义搜索', link: '/configuration/semantic_search' },
          { text: '生成式AI', link: '/configuration/genai' },
          { text: '人脸识别', link: '/configuration/face_recognition' },
          { text: '车牌识别', link: '/configuration/license_plate_recognition' },
          { text: '鸟类分类', link: '/configuration/bird_classification' },
        ]
      },
      {
        text: '摄像头',
        items: [
          { text: '摄像头', link: '/configuration/cameras' },
          { text: '回顾', link: '/configuration/review' },
          { text: '录制', link: '/configuration/record' },
          { text: '快照', link: '/configuration/snapshots' },
          { text: '运动检测', link: '/configuration/motion_detection' },
          { text: '鸟瞰图', link: '/configuration/birdseye' },
          { text: '实时', link: '/configuration/live' },
          { text: '重新流式传输', link: '/configuration/restream' },
          { text: '自动跟踪', link: '/configuration/autotracking' },
          { text: '特定摄像头', link: '/configuration/camera_specific' },
        ]
      },
      {
        text: '对象',
        items: [
          { text: '对象过滤器', link: '/configuration/object_filters' },
          { text: '遮罩', link: '/configuration/masks' },
          { text: '区域', link: '/configuration/zones' },
          { text: '对象', link: '/configuration/objects' },
          { text: '静止对象', link: '/configuration/stationary_objects' },
        ]
      },
      {
        text: '硬件加速',
        items: [
          { text: '视频硬件加速', link: '/configuration/hardware_acceleration_video' },
          { text: '增强硬件加速', link: '/configuration/hardware_acceleration_enrichments' },
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
    text: 'Frigate+',
    items: [
      { text: '介绍', link: '/plus/' },
      { text: '标注', link: '/plus/annotating' },
      { text: '第一个模型', link: '/plus/first_model' },
      { text: '常见问题', link: '/plus/faq' },
    ]
  },
  {
    text: '常见问题',
    items: [
      { text: '常见问题问答', link: '/troubleshooting/faqs' },
      { text: '录制', link: '/troubleshooting/recordings' },
      { text: 'GPU', link: '/troubleshooting/gpu' },
      { text: 'EdgeTPU', link: '/troubleshooting/edgetpu' },
    ]
  },
  {
    text: '开发',
    items: [
      { text: '贡献', link: '/development/contributing' },
      { text: '贡献板', link: '/development/contributing-boards' },
    ]
  },
];