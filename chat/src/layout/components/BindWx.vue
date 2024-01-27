<script setup lang='ts'>
import type { CountdownInst } from 'naive-ui'
import { NCountdown, NIcon, NImage, NModal, NSkeleton, NSpin, useMessage } from 'naive-ui'
import { ref } from 'vue'
import { CloseOutline, PaperPlaneOutline } from '@vicons/ionicons5'
import { fetchBindWxBySceneStrAPI, fetchGetQRCodeAPI, fetchGetQRSceneStrByBindAPI } from '@/api/user'
import { useAuthStore, useGlobalStoreWithOut } from '@/store'
import type { ResData } from '@/api/types'

defineProps<Props>()

const useGlobalStore = useGlobalStoreWithOut()
let timer: any
const countdownRef = ref<CountdownInst | null>()
const authStore = useAuthStore()
const activeCount = ref(false)
const wxLoginUrl = ref('')
const sceneStr = ref('')

interface Props {
  visible: boolean
}
const Nmessage = useMessage()

async function getSeneStr() {
  const res: ResData = await fetchGetQRSceneStrByBindAPI()
  if (res.success) {
    sceneStr.value = res.data
    getQrCodeUrl()
  }
}

async function getQrCodeUrl() {
  const res: ResData = await fetchGetQRCodeAPI({ sceneStr: sceneStr.value })
  if (res.success) {
    activeCount.value = true
    wxLoginUrl.value = res.data
    timer = setInterval(() => {
      bindWxBySnece()
    }, 1000)
  }
}

async function bindWxBySnece() {
  if (!sceneStr.value)
    return
  const res: ResData = await fetchBindWxBySceneStrAPI({ sceneStr: sceneStr.value })
  if (res.data) {
    clearInterval(timer)
    const { status, msg } = res.data
    if (status)
      Nmessage.success(msg)

    else
      Nmessage.error(msg)

    authStore.getUserInfo()
    useGlobalStore.updateBindwxDialog(false)
  }
}

function handleTimeDown() {
  clearInterval(timer)
  getSeneStr()
  countdownRef.value?.reset()
}

function openDialog() {
  getSeneStr()
}

function handleCloseDialog() {
  clearInterval(timer)
  wxLoginUrl.value = ''
  sceneStr.value = ''
  activeCount.value = false
}
</script>

<template>
  <NModal :show="visible" style="width: 90%; max-width: 700px" :on-after-enter="openDialog" :on-after-leave="handleCloseDialog">
    <div class="p-5 bg-white rounded dark:bg-slate-800">
      <div class="absolute top-3 right-3 cursor-pointer" @click="useGlobalStore.updateBindwxDialog(false)">
        <NIcon size="20" color="#0e7a0d">
          <CloseOutline />
        </NIcon>
      </div>
      <div class="flex text-xl font-bold mb-[20px] bg-currentflex items-center ">
        <NIcon size="25" color="#0e7a0d">
          <PaperPlaneOutline />
        </NIcon>
        <span class="ml-[8px]">绑定微信账户</span>
      </div>

      <div>
        <div style="white-space: nowrap" class=" w-full text-center font-bold text-sm py-5">
          <p>
            请在 <span class="w-[55px] inline-block text-[red] text-left"><NCountdown ref="countdownRef" :active="activeCount" :duration="120 * 1000" :on-finish="handleTimeDown" /></span> 时间内完成绑定
          </p>
        </div>
        <div class="my-2 flex justify-center relative">
          <NImage
            v-if="wxLoginUrl"
            preview-disabled
            width="230"
            :src="wxLoginUrl"
          />
          <NSkeleton v-else height="230px" width="230px" />
          <NSpin v-if="!wxLoginUrl" size="large" class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        <span class="flex items-center justify-center text-base py-5">
          打开微信扫码绑定账户
        </span>
      </div>
    </div>
  </NModal>
</template>
