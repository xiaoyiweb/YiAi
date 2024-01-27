<script setup lang="ts">
import { NConfigProvider, NGlobalStyle, dateZhCN } from 'naive-ui'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ClientJS } from 'clientjs'
import { ss } from './utils/storage'
import { NaiveProvider } from '@/components/common'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'
import { useAuthStore, useGlobalStoreWithOut, useChatStore } from '@/store'
const client = new ClientJS()
const chatStore = useChatStore()

// Get the client's fingerprint id
const fingerprint = client.getFingerprint()
const authStore = useAuthStore()
const useGlobalStore = useGlobalStoreWithOut()
const router = useRouter()
useGlobalStore.updateFingerprint(fingerprint)
const { theme, lightThemeOverrides, darkThemeOverrides } = useTheme()
const { language } = useLanguage()

const homePath = computed(() => authStore.globalConfig?.clientHomePath)
const faviconPath = computed(() => authStore.globalConfig?.clientFavoIconPath || '/favicon.svg')
const isAutoOpenNotice = computed(() => Number(authStore.globalConfig?.isAutoOpenNotice) === 1)

async function loadBaiduCode() {
  const baiduCode: any = authStore.globalConfig?.baiduCode || ''
  if (!baiduCode)
    return
  const scriptElem = document.createElement('script')
  const escapedCode = baiduCode.replace(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi, '$1')
  scriptElem.innerHTML = escapedCode
  document.head.appendChild(scriptElem)
}

function setDocumentTitle() {
  document.title = authStore.globalConfig?.siteName || 'AI'
}

const themeOverrides = computed(() => {
  const config = !theme.value ? lightThemeOverrides : darkThemeOverrides
  return config
})

function goHome() {
  homePath.value && router.push(homePath.value)
}

function noticeInit() {
  const showNotice = ss.get('showNotice')
  if (!showNotice && isAutoOpenNotice.value) {
    useGlobalStore.updateNoticeDialog(true)
  }
  else {
    if (Date.now() > Number(showNotice) && isAutoOpenNotice.value)
      useGlobalStore.updateNoticeDialog(true)
  }
}

/* 动态设置网站ico svg格式 */
const link = document.createElement('link')
link.rel = 'shortcut icon'
link.href = faviconPath.value
link.type = 'image/svg+xml'
document.getElementsByTagName('head')[0].appendChild(link)

onMounted(async () => {
  goHome()
  await chatStore.getBaseModelConfig()
  loadBaiduCode()
  setDocumentTitle()
  noticeInit()
})
</script>

<template>
  <NConfigProvider
    class="h-full "
    :theme="theme"
    :theme-overrides="themeOverrides"
    :locale="language"
    :date-locale="dateZhCN"
    preflight-style-disabled
  >
    <NaiveProvider>
      <RouterView />
    </NaiveProvider>
    <NGlobalStyle />
  </NConfigProvider>
</template>
