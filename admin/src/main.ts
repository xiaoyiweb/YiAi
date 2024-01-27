import './utils/system.copyright'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import pinia from './store'
import router from './router'
import useSettingsStore from './store/modules/settings'

// 自定义指令
import directive from '@/utils/directive'

// 加载 svg 图标
import 'virtual:svg-icons-register'

// 全局样式
import '@/assets/styles/globals.scss'

// 加载 iconify 图标（element plus）
import { downloadAndInstall } from '@/iconify-ep'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(ElementPlus)
app.use(pinia)
app.use(router)
directive(app)
if (useSettingsStore().settings.app.iconifyOfflineUse) {
  downloadAndInstall()
}

app.mount('#app')
