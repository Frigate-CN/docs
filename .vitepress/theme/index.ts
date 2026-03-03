import Teek from "vitepress-theme-teek";
import "vitepress-theme-teek/index.css";
import './custom.css'
import CustomLayout from "./CustomLayout.vue";
import ResponsiveGrid from "./ResponsiveGrid.vue";
import StreamAI from "./StreamAI.vue";
import Question from "./Question.vue";
import ShmCalculator from "./ShmCalculator.vue";
import DockerComposeGenerator from "./DockerComposeGenerator.vue";
import DetailsCollapse from "./DetailsCollapse.vue";
import InfoIcon from "./InfoIcon.vue";
import { initComponent } from 'vitepress-plugin-legend/component';
import '@fortawesome/fontawesome-free/css/all.min.css'

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
    app.component('StreamAI', StreamAI)
    app.component('Question', Question) // 全局注册组件
    app.component('ShmCalculator', ShmCalculator)
    app.component('DockerComposeGenerator', DockerComposeGenerator)
    app.component('DetailsCollapse', DetailsCollapse)
    app.component('InfoIcon', InfoIcon)
  },
  extends: Teek,
  Layout: CustomLayout,
};