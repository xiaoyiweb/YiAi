<script setup lang='ts'>
import { computed, ref, onMounted, watch } from 'vue'
import { NLayout, NLayoutContent } from 'naive-ui'
import Sider from './components/siderbar/index.vue'
import Apps from './components/main/index.vue'
import Playground from './components/playground/index.vue'
import Header from './components/header/index.vue'
import type { App } from './components/helpter'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useChatStore } from '@/store'
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()
const { isMobile } = useBasicLayout()
const isLogin = computed(() => authStore.isLogin)
const collapsed = computed(() => appStore.siderCollapsed)
const grid = ref<any>(null)
const theme = computed(() => appStore.theme)
let ctx = null
// watch(isLogin, async (newVal, oldVal) => {
//   if (newVal && !oldVal)

// })
const activeApp = ref<App>({})

function handleRunApp(app: App) {
  activeApp.value = app
}

function handleClosePlayground() {
  activeApp.value = {}
}
watch(theme, () => draw())

function draw() {
    const { innerWidth, innerHeight } = window;
    grid.value.width = innerWidth - 0;
    grid.value.height = innerHeight - 0;
    ctx = grid.value.getContext("2d");
    const [width, height] = [grid.value.width, grid.value.height];
    const singel = 20;
    const wCount = Math.floor(width / singel);
    const hCount = Math.floor(height / singel);
    const color = theme.value === 'light' ? "#00000080" : "#ffffff66";
    for (let i = 0; i < hCount; i++) {
      for (let j = 0; j < wCount; j++) {
        drawPoint({ x: j * singel + 20, y: i * singel + 20 }, color);
      }
    }
  }

	/* 绘制点 */
  function drawPoint({ x, y }, color) {
    ctx.fillStyle = color
    ctx.beginPath();
    ctx.rect(x, y, 1, 1);
    ctx.fill();
  }

const isRunApp = computed(() => Object.keys(activeApp.value).length > 0)

const getMobileClass = computed(() => {
  if (isMobile.value)
    return ['rounded-none', 'shadow-none']
  return ['rounded-md', 'shadow-md', 'dark:border-neutral-800']
})

onMounted(() => draw())
</script>

<template>
  <div class="h-full dark:bg-[#24272e] transition-all">
    <div class="h-full overflow-hidden flex flex-col" :class="getMobileClass">
      <!-- <div class="h-12  header border-[#e1e1e1] dark:border-[#ffffff17] border-b-2">
        <Header />
      </div> -->
      <NLayout class="transition flex-1 h-full w-full" has-sider>
				<canvas ref="grid" class="absolute left-0 right-0 bottom-0 top-0 z-0 bg-[#f3f4fc] dark:bg-[#101014]" ></canvas>
        <div v-if="!isMobile" class="h-full">
          <!-- <Sider /> -->
        </div>
        <div class="flex flex-col w-full ">
          <!-- <div class="playground" :class="[isRunApp ? 'mb-4 z-10  border-[#0000000a] dark:border-[#ffffff17]' : '', isMobile ? '' : 'border-b dark:border-[#ffffff17]']" :style="{ height: isRunApp ? isMobile ? '100%' : '530px' : 0 }">
            <Playground :app="activeApp" @close="handleClosePlayground" />
          </div> -->
          <!-- <NLayoutContent v-if="isMobile ? !isRunApp : true" :class="[isRunApp ? 'border-t dark:border-[#ffffff17]' : '']" class="w-full z-10 relative !bg-transparent"> -->
            <Apps @run-app="handleRunApp" />
          <!-- </NLayoutContent> -->
						<!-- :style="{ background: bg}" -->
        </div>
      </NLayout>
    </div>
  </div>
</template>

<style>
.header{
	box-shadow: 0 2px 4px 1px rgba(0,0,0,.08);
}

.playground{
	transition: all .5s cubic-bezier(0.25, 0.1, 0.25, 1);
	/* border-bottom: 1px solid rgba(0,0,0,.04); */
}
</style>
