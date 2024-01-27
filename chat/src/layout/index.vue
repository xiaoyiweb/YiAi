<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { NLayoutContent, useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import SiderBar from './siderBar/index.vue'
import FooterBar from './footerBar/index.vue'
import Login from './components/Login.vue'
import PayDialog from './components/PayDialog.vue'
import GoodsDialog from './components/GoodsDialog.vue'
import NoticeDialog from './components/NoticeDialog.vue'
import BindWxDialog from './components/BindWx.vue'
import SignInDialog from './components/SignInDialog.vue'
import ModelDialog from './components/modelDialog.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useGlobalStoreWithOut } from '@/store'
import { fetchLoginByCodeAPI, fetchWxLoginRedirectAPI } from '@/api/user'
import Loading from '@/components/base/Loading.vue'
import type { ResData } from '@/api/types'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const useGlobalStore = useGlobalStoreWithOut()
const appStore = useAppStore()
const ms = useMessage()
const payDialog = computed(() => useGlobalStore.payDialog)
const goodsDialog = computed(() => useGlobalStore.goodsDialog)
const noticeDialog = computed(() => useGlobalStore.noticeDialog)
const bindWxDialog = computed(() => useGlobalStore.bindWxDialog)
const signInDialog = computed(() => useGlobalStore.signInDialog)
const modelDialog = computed(() => useGlobalStore.modelDialog)
const { isMobile } = useBasicLayout()
const loginDialog = computed(() => authStore.loginDialog)
const globalConfigLoading = computed(() => authStore.globalConfigLoading)
const theme = computed(() => appStore.theme)
const bgColor = computed(() => theme.value === 'dark' ? '#24272e' : '#fff')
const isLogin = computed(() => authStore.isLogin)
const wechatSilentLoginStatus = computed(() => Number(authStore.globalConfig?.wechatSilentLoginStatus) === 1)
const homePath = computed(() => authStore.globalConfig?.clientHomePath)

/* 如果在vx环境并且携带了code则静默登录 */

function handleCheckOtherLoginByToken() {
  const { token } = route.query
  if (token) {
    authStore.setToken(token)
    const name = route.name
    router.replace({ name, query: {} })
    ms.success('账户登录成功、开始体验吧！')
    authStore.getUserInfo()
  }
}

/* 微信环境静默登录 */
async function loginByWechat() {
  if (homePath.value || !wechatSilentLoginStatus.value)
    return
  if (isLogin.value)
    return

  /* 如果在vx环境并且携带了code则静默登录 */
  const { code } = route.query

  if (code) {
    const res: ResData = await fetchLoginByCodeAPI({ code: code as string })
    if (res.success) {
      authStore.setToken(res.data)
      authStore.getUserInfo()
    }
  }
  else {
    const url = window.location.href.replace(/#.*$/, '')
    const res: ResData = await fetchWxLoginRedirectAPI({ url })
    if (res.success)
      window.location.href = res.data
  }
}

function init() {
  const ua = window.navigator.userAgent.toLowerCase()
  if (ua.match(/MicroMessenger/i) && ua?.match(/MicroMessenger/i)?.[0] === 'micromessenger')
    loginByWechat()
}

onMounted(() => {
  init()
  handleCheckOtherLoginByToken()
})

const getMobileMainClass = computed(() => {
  if (isMobile.value)
    return ['rounded-none', 'shadow-none']
  return ['dark:border-neutral-800']
})

const getMobileLayoutClass = computed(() => {
  if (isMobile.value)
    return ['flex-col']
  return ['dark:border-neutral-800']
})
</script>

<template>
  <div class="h-full dark:bg-[#24272e] transition-all p-0">
    <div class="h-full overflow-hidden">
      <div class="z-40 transition flex h-full relative" :class="getMobileLayoutClass">
        <SiderBar v-if="!isMobile" />
        <NLayoutContent class="h-full" style="flex: 1" :class="getMobileMainClass">
          <RouterView v-slot="{ Component, route }">
            <component :is="Component" :key="route.fullPath" />
          </RouterView>
        </NLayoutContent>
        <FooterBar v-if="isMobile" />
        <Loading v-if="globalConfigLoading" :bg-color="bgColor" />
      </div>
      <Login :visible="loginDialog" />
      <PayDialog :visible="payDialog" />
      <GoodsDialog :visible="goodsDialog" />
      <NoticeDialog :visible="noticeDialog" />
      <BindWxDialog :visible="bindWxDialog" />
      <SignInDialog :visible="signInDialog" />
			<ModelDialog :visible="modelDialog" />
    </div>
  </div>
</template>
