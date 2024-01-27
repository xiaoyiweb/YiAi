<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { NCountdown, NImage, NSkeleton, NSpin, useMessage, NButton, CountdownInst } from 'naive-ui'
import { fetchGetQRCodeAPI, fetchGetQRSceneStrAPI, fetchLoginBySceneStrAPI } from '@/api/user'
import type { ResData } from '@/api/types'
import { SvgIcon } from '@/components/common'
import { useAuthStore } from '@/store'
import { ss } from '@/utils/storage'
import Motion from '@/utils/motion/index'
let timer: any
import wechatIcon from '@/assets/wechat.png'
import Send from './send.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'

interface Emit {
	(ev: 'changeLoginType', val: string): void
}
const emit = defineEmits<Emit>()

const wxLoginUrl = ref('')
const sceneStr = ref('')
const activeCount = ref(false)
const Nmessage = useMessage()
const authStore = useAuthStore()
const countdownRef = ref<CountdownInst | null>()
const phoneLoginStatus = computed(() => Number(authStore.globalConfig.phoneLoginStatus) === 1)
const { isMobile } = useBasicLayout()

const emailLoginStatus = computed(() => Number(authStore.globalConfig.emailLoginStatus) === 1)
function loadImage(src: string) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function getSeneStr() {
  const params = { invitedBy: ss.get('invitedBy') }
  const res: ResData = await fetchGetQRSceneStrAPI(params)
  if (res.success) {
    sceneStr.value = res.data
    getQrCodeUrl()
  }
}

async function loginBySnece() {
  if (!sceneStr.value)
    return
  const res: ResData = await fetchLoginBySceneStrAPI({ sceneStr: sceneStr.value })
  if (res.data) {
    clearInterval(timer)
    Nmessage.success('账户登录成功、开始体验吧！')
    authStore.setToken(res.data)
    authStore.getUserInfo()
    authStore.setLoginDialog(false)
    if(isMobile.value){
            window.location.reload()
    }
    ss.remove('invitedBy')
  }
}

async function getQrCodeUrl() {
  const res: ResData = await fetchGetQRCodeAPI({ sceneStr: sceneStr.value })
  if (res.success) {
    activeCount.value = true
    await loadImage(res.data)
    wxLoginUrl.value = res.data
    timer = setInterval(() => {
      loginBySnece()
    }, 1000)
  }
}

function handleTimeDown() {
  clearInterval(timer)
  getSeneStr()
  countdownRef.value?.reset()
}

onMounted(() => {
  getSeneStr()
})

onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>

<template>
  <div class="w-full h-full flex flex-col items-center">
		<div class="text-[#374151] dark:text-white font-bold text-[20px] mt-[50px]">微信扫码登录</div>
    <div style="white-space: nowrap" class="mt-[20px] w-full text-center font-bold text-sm">
      <p>
        <span class="w-[65px] inline-block font-normal text-[#FF505C] text-left"><NCountdown ref="countdownRef" :active="activeCount" :duration="60 * 1000" :on-finish="handleTimeDown" /></span> 秒后二维码将刷新
      </p>
    </div>

		<Motion :delay="200" :scale="0.5" :duration="500">
			<div class="w-[280px] h-[280px] wechat-shadow flex flex-col justify-center items-center relative select-none mt-[20px]">
				<NImage
					v-if="wxLoginUrl"
					preview-disabled
					class="w-[220px] h-[220px] select-none"
					:src="wxLoginUrl"
				/>
				<NSkeleton v-else height="230px" width="220px" animated />
				<NSpin v-if="!wxLoginUrl" size="large" class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />

				<div class="mt-2 text-[#222222] dark:text-white font-normal flex items-center">
					<img :src="wechatIcon" class="w-[16px]  mr-1" alt="">
					微信扫码
				</div>
			</div>
		</Motion>
		<Motion :delay="200">
			<div class="flex items-center justify-center space-x-5 mt-[36px] ">
				<n-button v-if="emailLoginStatus" ghost class="!px-10" @click="emit('changeLoginType', 'email')">
					<SvgIcon class="text-xl mr-2 text-[#3076fd]" icon="clarity:email-line" />
					邮箱号登录
				</n-button>
				<n-button  v-if="phoneLoginStatus" ghost  class="!px-10"  @click="emit('changeLoginType', 'phone')">
					<SvgIcon  class="text-xl mr-2 text-[#3076fd]" icon="clarity:mobile-phone-solid" />
					手机号登录
				</n-button>
			</div>
		</Motion>

		<Motion :delay="400">
		<Send/>
		</Motion>

  </div>
</template>


<style>
.wechat-shadow{
	box-shadow: 0px 8px 10px 1px rgba(0,0,0,0.1608);
}
</style>
