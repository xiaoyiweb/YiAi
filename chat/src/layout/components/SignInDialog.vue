<script setup lang='ts'>
import { NAlert, NButton, NCalendar, NCard, NModal, NSpace, NSpin, useMessage } from 'naive-ui'
import { computed, ref } from 'vue'
import { addDays, isThisMonth } from 'date-fns/esm'
import { SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useGlobalStoreWithOut } from '@/store'
import { fetchSignInAPI, fetchSignLogAPI } from '@/api/signin'
import type { ResData } from '@/api/types'

interface Props {
  visible: boolean
}
defineProps<Props>()
const authStore = useAuthStore()
const useGlobalStore = useGlobalStoreWithOut()
const loading = ref(false)
const { isMobile } = useBasicLayout()
const signInData = ref([])
const ms = useMessage()
const { isSmallLg } = useBasicLayout()
// const value = ref(addDays(Date.now(), 1).valueOf())
const value = undefined
const signInLoading = ref(false)

function handleCloseDialog() {
  loading.value = false
}

function handleClose() {
  useGlobalStore.updateSignInDialog(false)
}

function isDateDisabled(timestamp: number) {
  if (!isThisMonth(timestamp))
    return true
  return false
}

/* 连续签到天数 */
const consecutiveDays = computed(() => authStore.userInfo.consecutiveDays)
const signInModel3Count = computed(() => Number(authStore.globalConfig?.signInModel3Count) || 0)
const signInModel4Count = computed(() => Number(authStore.globalConfig?.signInModel4Count) || 0)
const signInMjDrawToken = computed(() => Number(authStore.globalConfig?.signInMjDrawToken) || 0)

function signed(month: number, date: number) {
  if (!signInData.value.length)
    return false
  const str = `${new Date().getFullYear()}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
  const res: any = signInData.value.find((item: any) => item.signInDate === str)
  return !res ? false : res?.isSigned
}

const hasSignedInToday = computed(() => {
  if (loading.value)
    return false
  const month = new Date().getMonth() + 1
  const date = new Date().getDate()
  return !signed(month, date)
})

async function getSigninLog() {
  try {
    loading.value = true
    const res: ResData = await fetchSignLogAPI()
    signInData.value = res.data
    loading.value = false
  }
  catch (error) {
    loading.value = false
  }
}

async function handleSignIn() {
  try {
    signInLoading.value = true
    const res: ResData = await fetchSignInAPI()
    if (res.success)
      ms.success('签到成功！')
    getSigninLog()
    authStore.getUserInfo()
    signInLoading.value = false
  }
  catch (error) {
    signInLoading.value = false
  }
}

async function openDrawerAfter() {
  getSigninLog()
}
</script>

<template>
  <NModal :show="visible" :style="{ maxWidth: '650px', minWidth: isSmallLg ? '100%' : '650px' }" :on-after-enter="openDrawerAfter" :on-after-leave="handleCloseDialog">
    <NSpace vertical>
      <NCard closable @close="handleClose">
        <template #header>
          <span class="text-base">签到奖励 <span>（已连续签到<b class="text-[red]">{{ consecutiveDays }}</b>天）</span></span>
        </template>
        <NAlert class="mb-5 p-0 !bg-[#ccddff]" :show-icon="false" type="primary">
          每日签到赠送：
          <span v-if="signInModel3Count > 0"><b class=" text-[red]">{{ signInModel3Count }}</b>积分基础模型对话额度</span>
          <span v-if="signInModel4Count > 0"><b class="ml-2 text-[red]">{{ signInModel4Count }}</b>积分高级模型对话额度</span>
          <span v-if="signInMjDrawToken > 0"><b class="ml-2 text-[red]">{{ signInMjDrawToken }}</b>点绘画积分额度</span>
        </NAlert>
        <NSpin :show="loading">
          <NCalendar v-model:value="value" style="height:420px" #="{ month, date }" :is-date-disabled="isDateDisabled">
            <div v-if="signed(month, date)" class="flex items-center w-full mt-2">
              <SvgIcon icon="heroicons:gift" class="text-xl text-[#5A91FC]" />
              <span v-if="!isMobile" class="ml-2 text-xs">已签到</span>
            </div>
          </NCalendar>
        </NSpin>
        <div v-if="hasSignedInToday" class="flex mt-3 w-full mt-14">
          <NButton style="width: 100%" type="primary" round :loading="signInLoading" @click="handleSignIn">
            今日尚未签到、点击签到
          </NButton>
        </div>
				<div v-if="!hasSignedInToday" class="flex mt-8 w-full mt-14">
          <NButton style="width: 100%" type="primary" round :loading="signInLoading" >
            今日已成功签到
          </NButton>
        </div>
      </NCard>
    </NSpace>
  </NModal>
</template>

<style lang="less">
.n-calendar-header__extra{
	display: none !important;
}
</style>
