import Teek from "vitepress-theme-teek";
import "vitepress-theme-teek/index.css";
import './custom.css'
import CustomLayout from "./CustomLayout.vue";
import ResponsiveGrid from "./ResponsiveGrid.vue";
import Question from "./Question.vue";
import { initComponent } from 'vitepress-plugin-legend/component';
import 'vitepress-plugin-legend/dist/index.css';

export default {
  ...Teek,
  enhanceApp({ app }) {
    if (typeof window !== 'undefined') {
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "szgj4w86ky");
    }
    // 注册全局组件
    initComponent(app);
    app.component('ResponsiveGrid', ResponsiveGrid)
    app.component('Question', Question) // 全局注册组件
  },
  extends: Teek,
  Layout: CustomLayout,
};