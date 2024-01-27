<script setup lang="ts">
import { NAvatar, NButton, NCard, NGi, NGrid, NInput, NLayout, NLayoutSider, NSkeleton, NSpace, NTabPane, NTabs, useMessage } from 'naive-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Wallet from './components/wallet.vue'
import Detail from './components/detail.vue'
import Password from './components/password.vue'
import Invite from './components/invite.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { TitleBar } from '@/components/base'
import { useAuthStore, useGlobalStoreWithOut } from '@/store'
import defaultAvatar from '@/assets/avatar.png'
import { fetchVisitorCountAPI, fetchSyncVisitorDataAPI } from '@/api/balance'
import { fetchUpdateInfoAPI } from '@/api/index'
import { t } from '@/locales'
import type { ResData } from '@/api/types'

const useGlobalStore = useGlobalStoreWithOut()
const authStore = useAuthStore()
const router = useRouter()
const visitorCount = ref(0)

const userBalance = computed(() => authStore.userBalance)
const isUseWxLogin = computed(() => authStore.globalConfig?.isUseWxLogin)

const loading = ref(true)
const isLogin = computed(() => authStore.isLogin)
const ms = useMessage()

const email = computed(() => authStore.userInfo.email || '')
const isBindWx = computed(() => authStore.userInfo.isBindWx)
const avatar = ref(authStore.userInfo.avatar ?? defaultAvatar)
const username = ref(authStore.userInfo.username ?? '未登录')
const sign = ref(authStore.userInfo.sign ?? '我是一台基于深度学习和自然语言处理技术的 AI 机器人，旨在为用户提供高效、精准、个性化的智能服务。')

const btnDisabled = ref(false)

const { isSmallLg, isMobile } = useBasicLayout()

async function getVisitorCount(){
	const res: ResData = await fetchVisitorCountAPI()
	visitorCount.value = res.data || 0
}

async function syncVisitorData(){
	const res: ResData =  await fetchSyncVisitorDataAPI()
	if(res.success){
    ms.success('已同步数据完成')
	}
	getVisitorCount()
}

async function updateUserInfo(options: { avatar?: string; username?: string; sign?: string }) {
  try {
    btnDisabled.value = true
    const res: ResData = await fetchUpdateInfoAPI(options)
    btnDisabled.value = false
    if (!res.success)
      return ms.error(res.message)
    ms.success(t('common.updateUserSuccess'))
    authStore.getUserInfo()
  }
  catch (error) {
    btnDisabled.value = false
  }
}

function checkRoute() {
  if (isLogin.value)
    return
  authStore.setLoginDialog(true)
}

onMounted(() => {
  checkRoute()
	getVisitorCount()
})

function logOut() {
  authStore.logOut()
  router.push('/')
}
setTimeout(() => {
  loading.value = false
}, 500)
</script>

<template>
  <NLayout has-sider class="flex h-full">
    <NLayoutSider v-if="!isSmallLg" content-style="padding: 24px;" bordered width="380">
      <div class="flex flex-col justify-center items-center">
        <div class="text-2xl text-primary self-start mb-14 flex justify-between w-full">
          <span>Profile</span>
          <NButton tertiary type="error" @click="logOut">
            退出登录
          </NButton>
        </div>
        <NAvatar
          :size="148"
          :src="avatar"
          :fallback-src="defaultAvatar"
        />
        <b class="mt-3 text-lg text-[#555]">{{ username }}</b>
        <span class="text-[#95aac9] mt-2"> {{ email }}</span>
        <div class="text-[#555] mt-3 px-4">
          {{ sign }}
        </div>

        <div class="  self-start mt-16">
          <div class="text-xl text-primary">
            我在本站的使用记录
          </div>
          <div class="flex items-center space-x-4 pl-3 mt-3">
            <span class="flex-shrink-0 w-[100px] text-keft text-primary">基础模型积分:</span>
            <div class="w-[230px]">
              {{ userBalance.useModel3Count || "0" }} 积分
            </div>
          </div>
          <div class="flex items-center space-x-4 pl-3 mt-3">
            <span class="flex-shrink-0 w-[100px] text-keft text-primary">高级模型积分:</span>
            <div class="w-[230px]">
              {{ userBalance.useModel4Count || "0" }} 积分
            </div>
          </div>
          <div class="flex items-center space-x-4 pl-3 mt-3">
            <span class="flex-shrink-0 w-[100px] text-keft text-primary">基础模型使用:</span>
            <div class="w-[230px]">
              {{ userBalance.useModel3Token || "0" }} Token
            </div>
          </div>
          <div class="flex items-center space-x-4 pl-3 mt-3">
            <span class="flex-shrink-0 w-[100px] text-keft text-primary">高级模型使用:</span>
            <div class="w-[230px]">
              {{ userBalance.useModel4Token || "0" }} Token
            </div>
          </div>
          <div class="flex items-center space-x-4 pl-3 mt-3">
            <span class="flex-shrink-0 w-[100px] text-keft text-primary">绘画使用积分:</span>
            <div class="w-[230px]">
              {{ userBalance.useDrawMjToken || "0" }} 积分
            </div>
          </div>

          <div v-if="isUseWxLogin" class="flex items-center space-x-4 pl-3 mt-3">
            <span class="flex-shrink-0 w-[100px] text-keft text-primary">绑定微信:</span>
            <div class="w-[230px]">
              <NButton v-if="!isBindWx" text @click="useGlobalStore.updateBindwxDialog(true)">
                点击绑定微信
              </NButton>
              <span v-else>已绑定微信</span>
            </div>
          </div>

					<div v-if="visitorCount > 0" class="flex items-center space-x-4 pl-3 mt-3">
            <span class="flex-shrink-0 w-[100px] text-keft text-primary">绑定微信:</span>
            <div class="w-[230px]">
              <NButton  text @click="syncVisitorData">
                点击同步访客数据
              </NButton>
            </div>
          </div>
        </div>
      </div>
      <div v-if="userBalance.expirationTime" class="flex text-[red]  pt-8 text-base font-bold">
        <span>会员过期时间：</span>
        <span>{{ userBalance.expirationTime }}</span>
      </div>
    </NLayoutSider>

    <div class="flex flex-col " :class="[isMobile ? 'w-full' : 'flex-1']" :style="{ padding: isMobile ? '10px' : '0 28px 0 28px' }">
      <TitleBar title="个人中心" des="编辑个人信息、查看更多详情" :padding="isMobile ? 1 : 1" />
      <NTabs type="line" animated class="mt-5 flex-1  ">
        <NTabPane v-if="isSmallLg" name="detail" tab="我的详情">
          <Detail />
        </NTabPane>
        <NTabPane name="account" tab="我的钱包">
          <Wallet />
        </NTabPane>
        <NTabPane name="baseInfo" tab="基础信息">
          <NCard>
            <template #header>
              <NSkeleton v-if="loading || !isLogin" size="medium" width="20%" />
              <template v-else>
                <div>用户基础设置</div>
              </template>
            </template>
            <NSpace v-if="loading || !isLogin" vertical>
              <NSkeleton height="40px" size="medium" />
              <NSkeleton height="40px" size="medium" />
              <NSkeleton height="80px" size="medium" />
            </NSpace>
            <template v-else>
              <NGrid x-gap="12" :cols="1">
                <NGi>
                  <div class="flex items-center space-x-4">
                    <span class="flex-shrink-0 w-[60px]">{{ $t('setting.avatarLink') }}</span>
                    <div class="flex-1">
                      <NInput v-model:value="avatar" placeholder="请填写头像地址" />
                    </div>
                    <NButton size="tiny" text type="primary" @click="updateUserInfo({ avatar })">
                      {{ $t('common.update') }}
                    </NButton>
                  </div>
                  <div class="flex items-center space-x-4 mt-5">
                    <span class="flex-shrink-0 w-[60px]">{{ $t('setting.name') }}</span>
                    <div class="flex-1">
                      <NInput v-model:value="username" placeholder="请编辑您的用户名" maxlength="12" show-count clearable />
                    </div>
                    <NButton size="tiny" text type="primary" @click="updateUserInfo({ username })">
                      {{ $t('common.update') }}
                    </NButton>
                  </div>
                  <div class="flex  space-x-4 mt-5">
                    <span class="flex-shrink-0 w-[60px]">{{ $t('setting.sign') }}</span>
                    <div class="flex-1">
                      <NInput v-model:value="sign" placeholder="请编辑您的签名" maxlength="128" show-count clearable type="textarea" />
                    </div>
                    <NButton size="tiny" text type="primary" @click="updateUserInfo({ sign })">
                      {{ $t('common.update') }}
                    </NButton>
                  </div>
                </NGi>
              </NGrid>
            </template>
          </NCard>
        </NTabPane>

        <NTabPane name="password" tab="密码管理">
          <Password />
        </NTabPane>
        <NTabPane name="invite" tab="邀请得福利">
          <Invite />
        </NTabPane>
      </NTabs>
    </div>
  </NLayout>
</template>
