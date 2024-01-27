<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, onBeforeMount, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { SvgIcon } from '@/components/common'
import { useAuthStore, useGlobalStoreWithOut } from '@/store'
import { fetchQueryMenuAPI } from '@/api/config'

interface MenuItem {
  id: number
  menuName: string
  menuPath: string
  menuIcon: string
  menuTipText: string
  menuIframeUrl: string
  isJump: boolean
  isNeedAuth: boolean
}
const menuLista = ref<MenuItem[]>([])
const message = useMessage()

async function queryMenu() {
  const res: any = await fetchQueryMenuAPI({ menuPlatform: 0 })
  if (!res.success)
    return
  menuLista.value = res.data
}
const useGlobalStore = useGlobalStoreWithOut()
const router = useRouter()
const route = useRoute()
const activeRoutePath = computed(() => route.path)
const authStore = useAuthStore()
const iframeSrc = computed(() => useGlobalStore.iframeUrl)
const isLogin = computed(() => authStore.isLogin)

function handleToPage(menu: MenuItem) {
  const { menuPath, isJump, menuIframeUrl, isNeedAuth } = menu
  if (isNeedAuth && !isLogin.value) {
    message.warning('请先登录后访问！')
    authStore.setLoginDialog(true)
    return
  }
  useGlobalStore.updateIframeUrl('')
  if (menuPath) {
    return router.push({ path: menuPath })
  }
  else {
    if (isJump) {
      window.open(menuIframeUrl)
    }
    else {
      useGlobalStore.updateIframeUrl(menuIframeUrl)
      router.push({ path: '/extend' })
    }
  }
}

function isActive(item: MenuItem) {
  const { menuIframeUrl, menuPath } = item
  if (menuIframeUrl)
    return menuIframeUrl === iframeSrc.value

  if (menuPath)
    return menuPath === activeRoutePath.value
}

onBeforeMount(() => {
  queryMenu()
})
</script>

<template>
  <footer class="bg-white dark:bg-[#25272c]">
    <div
      class="grid border-t py-1 dark:border-t-neutral-800 grid-cols-2"
      :style="{
        gridTemplateColumns: `repeat(${menuLista.length}, minmax(0, 1fr))`,
      }"
    >
      <a
        v-for="item in menuLista"
        :key="item.id"
        :class="[isActive(item) ? 'text-[#4b9e5f] dark:text-[#86dfba]' : '']"
        class="cursor-pointer text-center leading-4"
        @click="handleToPage(item)"
      >
        <span class="inline-block text-xl">
          <SvgIcon :icon="item.menuIcon" class="mb-1 inline-block text-lg" /></span>
        <p class="text-xs">{{ item.menuTipText }}</p>
      </a>
    </div>
  </footer>
</template>
