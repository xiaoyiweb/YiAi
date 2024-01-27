<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NAvatar, NButton } from 'naive-ui'
import { useAuthStore, useGlobalStoreWithOut } from '@/store'
import defaultAvatar from '@/assets/avatar.png'

const authStore = useAuthStore()
const router = useRouter()

const { userBalance } = authStore
const useGlobalStore = useGlobalStoreWithOut()
const email = computed(() => authStore.userInfo.email || '')
const isBindWx = computed(() => authStore.userInfo.isBindWx)
const avatar = ref(authStore.userInfo.avatar ?? defaultAvatar)
const username = ref(authStore.userInfo.username ?? '未登录')
const sign = ref(authStore.userInfo.sign ?? '我是一台基于深度学习和自然语言处理技术的 AI 机器人，旨在为用户提供高效、精准、个性化的智能服务。')

function logOut() {
  authStore.logOut()
  router.push('/')
}
const isLogin = computed(() => authStore.isLogin)
onMounted(() => {
  if (!isLogin.value)
    authStore.setLoginDialog(true)
})
</script>

<template>
  <div class="flex flex-col justify-center items-center">
    <div class="text-2xl text-primary self-start mb-3 flex justify-between w-full">
      <span>Profile</span>
      <NButton v-if="isLogin" tertiary type="error" @click="logOut">
        退出登录
      </NButton>
      <NButton v-if="!isLogin" tertiary type="success" @click="authStore.setLoginDialog(true)">
        点击登入
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

    <div class="  self-start ">
      <div class="flex pl-3 pt-3 text-base font-bold text-primary">
        <span>我的账户余额</span>
      </div>
      <div v-if="userBalance.expirationTime" class="flex pl-3 pt-3 text-base font-bold text-primary">
        <span>会员过期时间：</span>
        <span>{{ userBalance.expirationTime }}</span>
      </div>

      <div class="flex items-center space-x-4 pl-3 mt-3">
        <span class="flex-shrink-0 w-24 text-primary">基础模型余额:</span>
        <div class="w-[200px]">
          {{ userBalance.sumModel3Count || "0" }} 积分
        </div>
      </div>
      <div class="flex items-center space-x-4 pl-3 mt-3">
        <span class="flex-shrink-0 w-24 text-primary">高级模型余额:</span>
        <div class="w-[200px]">
          {{ userBalance.sumModel4Count || "0" }} 积分
        </div>
      </div>
      <div class="flex items-center space-x-4 pl-3 mt-3">
        <span class="flex-shrink-0 w-24 text-primary">绘画余额:</span>
        <div class="w-[200px]">
          {{ userBalance.sumDrawMjCount || "0" }} 积分
        </div>
      </div>

      <div class="flex items-center space-x-4 pl-3 mt-3">
        <span class="flex-shrink-0 w-24 text-primary">绑定微信:</span>
        <div class="w-[200px]">
          <NButton v-if="!isBindWx" text @click="useGlobalStore.updateBindwxDialog(true)">
            点击绑定微信
          </NButton>
          <span v-else>已绑定微信</span>
        </div>
      </div>
    </div>
  </div>
</template>
