<script setup>
import Teek from "vitepress-theme-teek";

const { Layout } = Teek;
</script>

<template>
  <Teek.Layout>

    
  </Teek.Layout>
</template>

<style scoped>
.feature-section {
  margin: 20px 0;
}

.section-content {
  padding: 20px;
}

.section-image {
  width: 100%;
  height: 300px;
  border-radius: 8px;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: #333;
}

p {
  line-height: 1.6;
  color: #555;
}

/* 响应式调整 - 在手机上图片在上，文字在下 */
@media (max-width: 768px) {
  .feature-section {
    flex-direction: column-reverse !important;
  }
  
  .image-column {
    order: 1;
  }
  
  .content-column {
    order: 2;
  }
}
</style>