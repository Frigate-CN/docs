import Teek from "vitepress-theme-teek";
import "vitepress-theme-teek/index.css";
import './custom.css'
import CustomLayout from "./CustomLayout.vue";
import ResponsiveGrid from "./ResponsiveGrid.vue";

export default {
  ...Teek,
  enhanceApp({ app }) {
    // 注册全局组件
    app.component('ResponsiveGrid', ResponsiveGrid)
  },
  extends: Teek,
  Layout: CustomLayout,
};