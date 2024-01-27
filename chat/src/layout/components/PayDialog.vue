<script setup lang='ts'>
import type { CountdownInst } from 'naive-ui'
import { NButton, NCountdown, NIcon, NModal, NRadio, NRadioGroup, NSkeleton, NSpace, NSpin, useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { CloseOutline, PaperPlaneOutline } from '@vicons/ionicons5'
import { useAuthStore, useGlobalStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { fetchOrderBuyAPI, fetchOrderQueryAPI } from '@/api/order'

import type { ResData } from '@/api/types'
import QRCode from '@/components/common/QRCode/index.vue'
import alipay from '@/assets/alipay.png'
import wxpay from '@/assets/wxpay.png'
defineProps<Props>()

const { isMobile } = useBasicLayout()

const authStore = useAuthStore()
const useGlobal = useGlobalStore()
const POLL_INTERVAL = 1000
const ms = useMessage()
const active = ref(true)
const payType = ref('alipay') // 默认支付宝支付

interface Props {
  visible: boolean
}

/* 是否是微信环境 */
const isWxEnv = computed(() => {
  const ua = window.navigator.userAgent.toLowerCase()
  return ua.match(/MicroMessenger/i) && ua?.match(/MicroMessenger/i)?.[0] === 'micromessenger'
})

/* 开启的支付平台 */
const payPlatform = computed(() => {
  const { payHupiStatus, payEpayStatus, payMpayStatus, payWechatStatus } = authStore.globalConfig
  if (Number(payWechatStatus) === 1)
    return 'wechat'

  if (Number(payEpayStatus) === 1)
    return 'epay'

  if (Number(payMpayStatus) === 1)
    return 'mpay'

  if (Number(payHupiStatus) === 1)
    return 'hupi'

  return null
})

/* 支付平台开启的支付渠道 */
const payChannel = computed(() => {
  const { payEpayChannel, payMpayChannel } = authStore.globalConfig
  if (payPlatform.value === 'mpay')
    return payMpayChannel ? JSON.parse(payMpayChannel) : []

  if (payPlatform.value === 'epay')
    return payEpayChannel ? JSON.parse(payEpayChannel) : []

  if (payPlatform.value === 'wechat')
    return ['wxpay']

  if (payPlatform.value === 'hupi')
    return ['wxpay']

  return []
})

const plat = computed(() => payType.value === 'wxpay' ? '微信' : '支付宝')
const countdownRef = ref<CountdownInst | null>()

const isRedirectPay = computed(() => {
  const { payEpayApiPayUrl } = authStore.globalConfig
  return (payPlatform.value === 'epay' && payEpayApiPayUrl.includes('submit')) || payPlatform.value === 'mpay'
})

watch(payType, () => {
  getQrCode()
  countdownRef.value?.reset()
})

const orderId = ref('')
let timer: any
const payTypes = computed(() => {
  return [
    { label: '微信支付', value: 'wxpay', icon: wxpay, payChannel: 'wxpay' },
    { label: '支付宝支付', value: 'alipay', icon: alipay, payChannel: 'alipay' },
  ].filter(item => payChannel.value.includes(item.payChannel))
})

const queryOrderStatus = async () => {
  if (!orderId.value)
    return
  const result: ResData = await fetchOrderQueryAPI({ orderId: orderId.value })
  const { success, data } = result
  if (success) {
    const { status } = data
    if (status === 1) {
      clearInterval(timer)
      ms.success('恭喜你支付成功、祝您使用愉快！')
      active.value = false
      authStore.getUserInfo()
      setTimeout(() => {
        useGlobal.updatePayDialog(false)
      }, 2000)
    }
  }
}

const orderInfo = computed(() => useGlobal?.orderInfo)
const url_qrcode = ref('')
const qrCodeloading = ref(true)
const redirectloading = ref(true)
const redirectUrl = ref('')

function handleCloseDialog() {
  useGlobal.updateOrderInfo({})
  clearInterval(timer)
}

/* 请求二维码 */
async function getQrCode() {
  !isRedirectPay.value && (qrCodeloading.value = true)
  isRedirectPay.value && (redirectloading.value = true)
  let qsPayType = null
  qsPayType = payType.value
  if (payPlatform.value === 'wechat')
    qsPayType = isWxEnv.value ? 'jsapi' : 'native'

  try {
    const res: ResData = await fetchOrderBuyAPI({ goodsId: orderInfo.value.pkgInfo.id, payType: qsPayType })
    const { data, success, message } = res
    if (!success)
      return ms.error(message)

    const { url_qrcode: code, orderId: id, redirectUrl: url } = data
    redirectUrl.value = url
    orderId.value = id
    url_qrcode.value = code
    qrCodeloading.value = false
    redirectloading.value = false
  }
  catch (error) {
    useGlobal.updatePayDialog(false)
    qrCodeloading.value = false
    redirectloading.value = false
  }
}

/* 跳转支付 */
function handleRedPay() {
  window.open(redirectUrl.value)
}

async function handleOpenDialog() {
  await getQrCode()
  timer = setInterval(() => {
    queryOrderStatus()
  }, POLL_INTERVAL)
}

function handleFinish() {
  ms.error('支付超时，请重新下单!')
  clearInterval(timer)
  useGlobal.updatePayDialog(false)
  // useGlobal.updateGoodsDialog(true)
}
</script>

<template>
  <NModal :show="visible" style="width: 90%; max-width: 750px" :on-after-enter="handleOpenDialog" :on-after-leave="handleCloseDialog">
    <div class="p-4 bg-white rounded dark:bg-slate-800">
      <div class="flex justify-between" @click="useGlobal.updatePayDialog(false)">
        <div class="flex text-xl font-bold mb-[20px] bg-currentflex items-center ">
          <NIcon size="25" color="#0e7a0d">
            <PaperPlaneOutline />
          </NIcon>
          <span class="ml-[8px]">商品支付</span>
        </div>
        <NIcon size="20" color="#0e7a0d" class="cursor-pointer">
          <CloseOutline />
        </NIcon>
      </div>
      <div class="p-4 ">
        <div><span class="whitespace-nowrap font-bold">需要支付：</span> <i class="text-xl text-[red] font-bold">{{ `￥${orderInfo.pkgInfo?.price}` }}</i></div>
        <div class="mt-2 flex">
          <span class="whitespace-nowrap font-bold">套餐名称：</span><span class="ml-2"> {{ orderInfo.pkgInfo?.name }}</span>
        </div>
        <div class="mt-2 flex">
          <span class="whitespace-nowrap font-bold">套餐描述：</span><span class="ml-2"> {{ orderInfo.pkgInfo?.des }} </span>
        </div>
        <!-- <div class="flex mt-3">
          <span class="whitespace-nowrap font-bold">套餐详情：</span>
          <div class="flex flex-col space-y-2 pl-2 w-full ">
            <div class="flex justify-between w-[300px] ">
              <span>基础模型额度</span>
              <span>100 次</span>
            </div>
            <div class="flex justify-between w-[300px] ">
              <span>基础模型额度</span>
              <span>20 次</span>
            </div>
            <div class="flex justify-between w-[300px] ">
              <span>MJ绘画额度</span>
              <span>20 次</span>
            </div>
          </div>
        </div> -->

        <div class="flex justify-center" :class="[isMobile ? 'flex-col' : 'flex-row', isRedirectPay ? 'flex-row-reverse' : '']">
          <div>
            <!-- <div style="white-space: nowrap" class="mt-6 w-full text-center font-bold text-sm">
              请在 <span class="w-[60px] inline-block text-[red] text-left"><NCountdown :active="active" :duration="300 * 1000" :on-finish="handleFinish" /></span> 时间内完成支付！
            </div> -->
            <div class="flex items-center justify-center my-3 relative ">
              <!-- qrCodeloading -->
              <NSpin v-if="qrCodeloading && !isRedirectPay" size="large" class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              <NSkeleton v-if="qrCodeloading" :width="240" :height="240" :sharp="false" size="medium" />

              <!-- epay -->
              <QRCode v-if="payPlatform === 'epay' && !qrCodeloading && !redirectloading && !isRedirectPay" :value="url_qrcode" :size="240" />
              <img v-if="payType === 'wxpay' && !qrCodeloading && !isRedirectPay" :src="wxpay" class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 bg-[#fff]">
              <img v-if="payType === 'alipay' && !qrCodeloading && !isRedirectPay" :src="alipay" class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 bg-[#fff]">

              <!-- wechat -->
              <QRCode v-if="payPlatform === 'wechat' && !qrCodeloading" :value="url_qrcode" :size="240" />

              <div v-if="isRedirectPay" class="flex flex-col" :class="[isRedirectPay && isMobile ? 'ml-0' : 'ml-20']">
                <span class="mb-10 mt-5 text-base">当前站长开通了跳转支付</span>

                <!-- mapy 跳转支付 -->
                <NButton v-if="isRedirectPay" type="primary" ghost :disabled="redirectloading" :loading="redirectloading" @click="handleRedPay">
                  点击前往支付
                </NButton>
              </div>

              <!-- hupi -->
              <iframe v-if="payPlatform === 'hupi' && !redirectloading" class="w-[280px] h-[280px] scale-90" :src="url_qrcode" frameborder="0" />
            </div>
            <span v-if="!isRedirectPay" class="flex items-center justify-center text-lg ">
              {{ `打开${plat}扫码支付` }}
            </span>
          </div>
          <div class=" flex flex-col" :class="[isMobile ? 'w-full ' : ' ml-10 w-[200] ']">
            <!-- <h4 class="mb-10 font-bold text-lg">
              支付方式
            </h4> -->
            <div style="white-space: nowrap" class="mt-6 w-full text-center font-bold text-sm" :class="[isMobile ? 'mb-2' : 'mb-10']">
              请在 <span class="w-[60px] inline-block text-[red] text-left"><NCountdown ref="countdownRef" :active="active" :duration="300 * 1000" :on-finish="handleFinish" /></span> 时间内完成支付！
            </div>
            <NRadioGroup v-model:value="payType" name="radiogroup" class="flex">
              <NSpace :vertical="!isMobile" justify="center" :size="isMobile ? 10 : 35" class="w-full">
                <NRadio v-for="pay in payTypes" :key="pay.value" :value="pay.value">
                  <div class="flex items-center">
                    <img class="h-4 object-contain mr-2" :src="pay.icon" alt=""> {{ pay.label }}
                  </div>
                </NRadio>
              </NSpace>
            </NRadioGroup>
          </div>
        </div>
      </div>
    </div>
  </NModal>
</template>
