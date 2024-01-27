<script lang="ts" setup>
import { NSkeleton, NSpace, NTabPane, NTabs, useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { TitleBar } from '@/components/base'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { fetchGetPackageAPI } from '@/api/crami'
import { fetchOrderBuyAPI } from '@/api/order'
import { SvgIcon } from '@/components/common'
import type { ResData } from '@/api/types'
import { useAuthStore, useGlobalStoreWithOut } from '@/store'
const authStore = useAuthStore()
const { isMobile } = useBasicLayout()
const message = useMessage()
const useGlobalStore = useGlobalStoreWithOut()

const isWxEnv = computed(() => {
  const ua = window.navigator.userAgent.toLowerCase()
  return ua.match(/MicroMessenger/i) && ua?.match(/MicroMessenger/i)?.[0] === 'micromessenger'
})

interface Pkg {
  id: number
  name: string
  coverImg: string
  des: string
  days: number
  rechargeType: number
  model3Count: number
  model4Count: number
  drawMjCount: number
  expireDateCn: string
  createdAt: Date
  price: number
}

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
  if (payPlatform.value === 'wechat')
    return ['wxpay']

  if (payPlatform.value === 'epay')
    return payEpayChannel ? JSON.parse(payEpayChannel) : []

  if (payPlatform.value === 'mpay')
    return payMpayChannel ? JSON.parse(payMpayChannel) : []

  if (payPlatform.value === 'hupi')
    return ['wxpay']

  return []
})

const packageList = ref<Pkg[]>([])
const pkgType = ref(1)
const loading = ref(false)

async function queryPkg() {
  try {
    loading.value = true
    const res: ResData = await fetchGetPackageAPI({ status: 1, type: pkgType.value, size: 30 })
    packageList.value = res.data.rows
    loading.value = false
  }
  catch (error) {
    loading.value = false
  }
}

const tips = computed(() => {
  return isMobile.value ? '尽情探索，欢迎光临我们的在线商店！' : '尽情探索，欢迎光临我们的在线商店、感谢您选择我们、让我们一同开启愉悦的购物之旅！'
})

function updateTabs(val: number) {
  pkgType.value = val
  queryPkg()
}

async function handlePayPkg(pkg: Pkg) {
  if (!payChannel.value.length)
    message.warning('管理员还未开启支付！')
  handleBuyGoods(pkg)
}

async function handleBuyGoods(pkg: Pkg) {
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
}

function onBridgeReady(data: { appId: string; timeStamp: string; nonceStr: string; package: string; signType: string; paySign: string }) {
  const { appId, timeStamp, nonceStr, package: pkg, signType, paySign } = data
  if (!appId)
    return
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

onMounted(() => {
  queryPkg()
})
</script>

<template>
  <div class="main min-h-screen bg-center dark:bg-[#2F2E34] h-full flex flex-col overflow-hidden ">
    <TitleBar title="会员商场" :des="tips" :class="[isMobile ? 'px-3' : 'px-24']" />
    <div class=" flex justify-center items-center" :style="{ height: isMobile ? '60px' : '180px' }">
      <NTabs type="segment" :style="{ width: isMobile ? '90%' : '400px' }" @update:value="updateTabs">
        <NTabPane :name="1" tab="会员限时套餐" />
        <NTabPane :name="-1" tab="叠加永久次卡" />
      </NTabs>
    </div>
    <div class="flex-1 pb-10 overflow-y-auto " :class="[isMobile ? 'px-3' : 'px-28']">
      <div v-if="!loading" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-10 px-4 ">
        <div v-for="item in packageList" :key="item.id" class="border dark:border-[#ffffff17] h-[580px] rounded-xl card-item flex flex-col" @click="handlePayPkg(item)">
          <div class="w-full rounded-t-xl overflow-hidden border dark:border-[#ffffff17] relative " :style="{ height: '40%' }">
            <img :src="item.coverImg" class="object-cover w-full h-full cover" alt="">
            <div class="absolute left-1/2 bottom-0 transform -translate-x-1/2 -translate-y-1/2 text-lg text-[#fff] ]">
              {{ item.name }}
            </div>
          </div>
          <div class="p-5  text-lg h-[160px]  border-b dark:border-[#ffffff17] overflow-hidden relative ">
            {{ item.des }}
            <span class="absolute bottom-1 right-2  font-semibold text-red-500  italic">￥{{ item.price }}</span>
          </div>
          <div class="flex p-4 border-b dark:border-[#ffffff17] flex-col space-y-4">
            <div class="flex justify-between">
              <span>基础模型额度</span>
              <span>{{ item.model3Count || 0 }} 积分</span>
            </div>
            <div class="flex justify-between ">
              <span>高级模型额度</span>
              <span>{{ item.model4Count || 0 }} 积分</span>
            </div>
            <div class="flex justify-between ">
              <span>MJ绘画额度</span>
              <span>{{ item.drawMjCount || 0 }} 积分</span>
            </div>
          </div>
          <div class="px-4 flex-1 flex items-center justify-between">
            <div class="flex items-end">
              <span>套餐有效期 </span>
              <span class="ml-2 text-[#3076fd] text-lg">{{ item.days > 0 ? `${item.days} 天` : `永久` }}</span>
            </div>
            <div class="line" />
            <div>
              <SvgIcon class="text-lg right-icon" icon="bi:arrow-right" />
            </div>
          </div>
        </div>
      </div>
      <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-10 px-4">
        <div v-for="item in 4" :key="item" class="border dark:border-[#ffffff17] h-[580px] rounded-xl card-item flex flex-col">
          <div class="w-full rounded-t-xl overflow-hidden" :style="{ height: '40%' }">
            <NSkeleton height="100%" width="100%" />
          </div>
          <div class="p-5  text-lg h-[160px]  border-b dark:border-[#ffffff17] overflow-ellipsis ">
            <NSpace vertical>
              <NSkeleton text :repeat="4" width="100%" :sharp="false" />
            </NSpace>
          </div>
          <div class="flex p-4 border-b dark:border-[#ffffff17] flex-col space-y-4">
            <NSpace vertical>
              <NSkeleton text :repeat="4" width="100%" :sharp="false" />
            </NSpace>
          </div>
          <div class="px-4 flex-1 flex items-center justify-between">
            <NSkeleton text :repeat="1" width="100%" :sharp="false" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.card-item{
	transition: all .85s;
	cursor: pointer;
	&:hover{
		.right-icon {
			transform: scale(1.5);
			color: #3076fd;
		}
		.cover{
			transform: scale(1.2);
			filter: brightness(1);
		}
		.line{
			flex: 1;
		}
	}
	.cover{
		transition: all .55s;
		filter: brightness(.8);
	}
	.right-icon{
		transition: all .35s;
	}
	.line{
		height: 2px;
		margin-left: 50px;
		background-color: #3076fd;
		width: 0;
		transition: all .3s;
	}
}
</style>
