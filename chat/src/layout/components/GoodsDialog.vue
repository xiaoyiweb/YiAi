<script setup lang='ts'>
import { NButton, NCard, NGrid, NGridItem, NIcon, NModal, NSkeleton, NSpace, useDialog, useMessage } from 'naive-ui'
import { CloseOutline } from '@vicons/ionicons5'
import { computed, ref } from 'vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { fetchGetPackageAPI } from '@/api/crami'
import { fetchOrderBuyAPI } from '@/api/order'
import { fetchGetJsapiTicketAPI } from '@/api/user'

import type { ResData } from '@/api/types'
import preferentialIcon from '@/assets/images/preferential.png'
import { useAuthStore, useGlobalStoreWithOut } from '@/store'
defineProps<Props>()
declare let WeixinJSBridge: any
declare let wx: any
const authStore = useAuthStore()
const useGlobalStore = useGlobalStoreWithOut()
const loading = ref(true)
const { isSmallMd } = useBasicLayout()
const packageList = ref<Pkg[]>([])
const message = useMessage()
const dialog = useDialog()
const dialogLoading = ref(false)

const isWxEnv = computed(() => {
  const ua = window.navigator.userAgent.toLowerCase()
  return ua.match(/MicroMessenger/i) && ua?.match(/MicroMessenger/i)?.[0] === 'micromessenger'
})
const payPlatform = computed(() => {
  const { payHupiStatus, payEpayStatus, payMpayStatus, payWechatStatus } = authStore.globalConfig
  if (Number(payWechatStatus) === 1)
    return 'wechat'

  if (Number(payMpayStatus) === 1)
    return 'mpay'

  if (Number(payHupiStatus) === 1)
    return 'hupi'

  if (Number(payEpayStatus) === 1)
    return 'epay'
  return null
})

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

interface Props {
  visible: boolean
}

interface Pkg {
  id: number
  name: string
  coverImg: string
  des: string
  price: number
  model3Count: number
  model4Count: number
  drawMjCount: number
  extraReward: number
  extraPaintCount: number
  createdAt: Date
}
function openDialog() {
  openDrawerAfter()
  if (isWxEnv.value)
    jsapiInitConfig()
}

function handleCloseDialog() {
  packageList.value = []
  loading.value = true
}

/* 微信环境jsapi注册 */
async function jsapiInitConfig() {
  const url = window.location.href.replace(/#.*$/, '')
  const res: ResData = await fetchGetJsapiTicketAPI({ url })
  const { appId, nonceStr, timestamp, signature } = res.data
  if (!appId)
    return

  wx.config({
    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
    appId, // 必填，公众号的唯一标识
    timestamp, // 必填，生成签名的时间戳
    nonceStr, // 必填，生成签名的随机串
    signature, // 必填，签名
    jsApiList: ['chooseWXPay'], // 必填，需要使用的JS接口列表
  })
  wx.ready(() => {})
  wx.error(() => {})
}

function onBridgeReady(data: { appId: string; timeStamp: string; nonceStr: string; package: string; signType: string; paySign: string }) {
  const { appId, timeStamp, nonceStr, package: pkg, signType, paySign } = data
  WeixinJSBridge.invoke('getBrandWCPayRequest', {
    appId, // 公众号ID，由商户传入
    timeStamp, // 时间戳，自1970年以来的秒数
    nonceStr, // 随机串
    package: pkg,
    signType, // 微信签名方式：
    paySign, // 微信签名
  },
  (res: any) => {
    if (res.err_msg === 'get_brand_wcpay_request:ok') {
      message.success('购买成功、祝您使用愉快!')
      setTimeout(() => {
        authStore.getUserInfo()
        useGlobalStore.updateGoodsDialog(false)
      }, 500)
    }
    else {
      message.warning('您还没有支付成功哟！')
    }
  })
}

async function handleBuyGoods(pkg: Pkg) {
  if (dialogLoading.value)
    return

  // 如果是微信环境判断有没有开启微信支付,开启了则直接调用jsapi支付即可
  if (isWxEnv.value && payPlatform.value === 'wechat' && Number(authStore.globalConfig.payWechatStatus) === 1) {
    if (typeof WeixinJSBridge == 'undefined') {
      if (document.addEventListener) {
        document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false)
      }
      else if (document.attachEvent) {
        document.attachEvent('WeixinJSBridgeReady', onBridgeReady)
        document.attachEvent('onWeixinJSBridgeReady', onBridgeReady)
      }
    }
    else {
      const res: ResData = await fetchOrderBuyAPI({ goodsId: pkg.id, payType: 'jsapi' })
      const { success, data } = res
      success && onBridgeReady(data)
    }
    return
  }

  /* 其他场景打开支付窗口 */
  useGlobalStore.updateOrderInfo({ pkgInfo: pkg })
  useGlobalStore.updateGoodsDialog(false)
  useGlobalStore.updatePayDialog(true)
  // dialogLoading.value = true
  // const { id: goodsId, name, des } = pkg
  // try {
  //   /* 如果在微信环境 则微信官方支付渠道为jsapi支付 */
  //   if (payPlatform.value === 'wechat')
  //     payType = isWxEnv.value ? 'jsapi' : 'native'

  //   const res: ResData = await fetchOrderBuyAPI({ goodsId, payType })
  //   dialogLoading.value = false
  //   const { success, data } = res
  //   if (success) {
  //     /* 如果是微信环境并且开启了微信登录则调用jsapi支付 */
  //     if (isWxEnv.value && payPlatform.value === 'wechat') {
  //       if (typeof WeixinJSBridge == 'undefined') {
  //         if (document.addEventListener) {
  //           document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false)
  //         }
  //         else if (document.attachEvent) {
  //           document.attachEvent('WeixinJSBridgeReady', onBridgeReady)
  //           document.attachEvent('onWeixinJSBridgeReady', onBridgeReady)
  //         }
  //       }
  //       else {
  //         onBridgeReady(data)
  //       }
  //       return
  //     }

  //     useGlobalStore.updateOrderInfo({ ...data, pkgInfo: pkg })
  //     useGlobalStore.updateGoodsDialog(false)
  //     const { isRedirect, redirectUrl } = data
  //     if (isRedirect)
  //       window.open(redirectUrl)

  //     else
  //       useGlobalStore.updatePayDialog(true)
  //   }
  // }
  // catch (error) {
  //   dialogLoading.value = false
  // }
}

async function openDrawerAfter() {
  loading.value = true
  try {
    const res: ResData = await fetchGetPackageAPI({ status: 1, size: 30 })
    packageList.value = res.data.rows
    loading.value = false
  }
  catch (error) {
    loading.value = false
  }
}

function handleSuccess(pkg: Pkg) {
  const { name } = pkg
  dialog.success({
    title: '订单确认',
    content: `欢迎选购、确定购买${name}么！`,
    negativeText: '我再想想',
    positiveText: '确认购买',
    onPositiveClick: () => {
      if (!payChannel.value.length)
        message.warning('管理员还未开启支付！')

      handleBuyGoods(pkg)
    },
  })
}
</script>

<template>
  <NModal :show="visible" :style="{ maxWidth: `${packageList.length > 4 ? 1200 : packageList.length * 250}px`, minWidth: isSmallMd ? '100%' : '1000px' }" :on-after-enter="openDialog" :on-after-leave="handleCloseDialog">
    <div class="p-4 bg-white rounded dark:bg-slate-800 max-h-4/5">
      <div class=" flex cursor-pointer justify-between ">
        <span class="text-xl">选购商品</span>
        <NIcon size="20" color="#0e7a0d" @click="useGlobalStore.updateGoodsDialog(false)">
          <CloseOutline />
        </NIcon>
      </div>
      <div v-if="!loading" class="p-4">
        <NGrid :x-gap="15" :y-gap="15" :cols="isSmallMd ? 1 : packageList.length > 4 ? 4 : packageList.length" class="mt-3">
          <NGridItem v-for="(item, index) in packageList" :key="index">
            <NCard size="small" embedded>
              <template #header>
                <div class="relative">
                  <b>{{ item.name }}</b>
                  <img v-if="item.extraReward === 1" :src="preferentialIcon" class="w-8 absolute -right-4 -top-3">
                </div>
              </template>
              <template #cover>
                <img :src="item.coverImg" class="h-[130px] object-cover">
              </template>
              <div>
                <p>{{ item.des }}</p>
                <div class="flex justify-between items-end min-h-28">
                  <span class="text-sm font-bold mr-1 w-[120px]">基础模型额度</span>
                  <span class="font-bold">{{ item.model3Count }}</span>
                </div>
                <div class="flex justify-between items-end min-h-28">
                  <span class="text-sm font-bold mr-1 w-[120px]">高级模型额度</span>
                  <span class="font-bold">{{ item.model4Count }}</span>
                </div>
                <div class="flex justify-between items-end min-h-28">
                  <span class="text-sm font-bold mr-1 w-[120px]">MJ绘画额度</span>
                  <span class="font-bold">{{ item.drawMjCount }}</span>
                </div>
                <div class="flex justify-between items-end mt-5">
                  <i class="text-xl text-[red] font-bold">{{ `￥${item.price}` }}</i>
                  <NButton type="primary" dashed size="small" @click="handleSuccess(item)">
                    购买套餐
                  </NButton>
                </div>
              </div>
            </NCard>
          </NGridItem>
        </NGrid>
      </div>
      <div v-if="loading" class="p-4">
        <NGrid :x-gap="15" :y-gap="15" :cols="isSmallMd ? 1 : 4" class="mt-3">
          <NGridItem v-for="(index) in 4" :key="index">
            <NSpace vertical>
              <NSkeleton height="130px" width="100%" />
              <NSkeleton height="210px" width="100%" :sharp="false" />
            </NSpace>
          </NGridItem>
        </NGrid>
      </div>
    </div>
  </NModal>
</template>
