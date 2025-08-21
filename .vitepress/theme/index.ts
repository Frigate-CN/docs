import Teek from "vitepress-theme-teek";
import "vitepress-theme-teek/index.css";
import './custom.css'
import CustomLayout from "./CustomLayout.vue";
import ResponsiveGrid from "./ResponsiveGrid.vue";
import { initComponent } from 'vitepress-plugin-legend/component';
import 'vitepress-plugin-legend/dist/index.css';

export default {
  ...Teek,
  enhanceApp({ app }) {
    // 注册全局组件
    initComponent(app);
    app.component('ResponsiveGrid', ResponsiveGrid)
  },
  extends: Teek,
  Layout: CustomLayout,
};