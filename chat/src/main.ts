import { createApp } from 'vue'
import { useMessage } from 'naive-ui'
import '@/styles/lib/viewer.css'
import VueViewer from 'v-viewer'
import App from './App.vue'
import { setupI18n } from './locales'
import { setupAssets, setupScrollbarStyle } from './plugins'
import { setupStore } from './store'
import { setupRouter } from './router'
import { MotionPlugin } from "@vueuse/motion";

import '@/styles/transition.less'
import '@/styles/notice.less'

window.$message = useMessage()

async function bootstrap() {
  const app = createApp(App)
  app.use(VueViewer)
	app.use(MotionPlugin)
  setupAssets()
  setupScrollbarStyle()
  setupStore(app)
  setupI18n(app)
  await setupRouter(app)
  app.mount('#app')
}

bootstrap()
