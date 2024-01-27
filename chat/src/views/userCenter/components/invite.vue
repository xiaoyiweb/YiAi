<script setup lang="ts">
import { NAvatar, NButton, NCard, NDataTable, NGrid, NGridItem, NSpace, useMessage } from 'naive-ui'
import { computed, h, onMounted, reactive, ref } from 'vue'
import clipboard3 from 'vue-clipboard3'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAuthStore } from '@/store'
import { fetchGenInviteCodeAPI, fetchGetInviteRecordAPI } from '@/api/user'
import type { ResData } from '@/api/types'
const { toClipboard } = clipboard3()

const authStore = useAuthStore()
const inviteCode = computed(() => authStore.userInfo.inviteCode)
const globalConfig = computed(() => authStore.globalConfig)
const { isSmallXl, isMobile } = useBasicLayout()
const ms = useMessage()
const regLoading = ref(false)

interface InviteRecord {
  avatar: string
  email: string
  username: string
  status: number
  createdAt: Date
}

const paginationReg = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => {
    paginationReg.page = page
    queryInviteRecord()
  },
  onUpdatePageSize: (pageSize: number) => {
    paginationReg.pageSize = pageSize
    paginationReg.page = 1
    queryInviteRecord()
  },
})

const columns = computed(() => {
  return [
    {
      title: '头像',
      key: 'avatar',
      render(row: InviteRecord) {
        return h(
          NAvatar,
          {
            src: row.avatar,
            size: 'small',
            round: true,
          },
        )
      },
    },
    {
      title: '用户名称',
      key: 'username',
    },
    {
      title: '用户邮箱',
      key: 'email',
    },
    {
      title: '受邀人状态',
      key: 'status',
      render(row: InviteRecord) {
        return h(
          NButton,
          {
            type: row.status === 1 ? 'primary' : 'error',
            size: 'small',
            round: true,
            quaternary: true,
          },
          {
            default: () => row.status === 1 ? '已认证' : '未激活',
          },
        )
      },
    },
    {
      title: '邀请时间',
      key: 'createdAt',
      render(row: InviteRecord) {
        return h(
          'div',
          {
            style: {
              fontSize: '12px',
              color: '#999',
            },
          },
          () => row.createdAt,
        )
      },
    },
    {
      title: '获得奖励状态',
      key: 'status',
      render(row: InviteRecord) {
        return h(
          NButton,
          {
            type: row.status === 1 ? 'success' : 'warning',
            size: 'small',
            round: true,
            quaternary: true,
          },
          {
            default: () => row.status === 1 ? '已领取邀请奖励' : '等待受邀人确认',
          },
        )
      },
    },
  ]
})

const data = ref([])

async function genMyInviteCode() {
  const res: ResData = await fetchGenInviteCodeAPI()
  if (!res.data)
    return ms.error(res.message)
  ms.success('生成邀请链接成功')
  authStore.getUserInfo()
}

async function queryInviteRecord() {
  try {
    regLoading.value = true
    const res: ResData = await fetchGetInviteRecordAPI({ page: paginationReg.page, size: paginationReg.pageSize })
    data.value = res.data.rows
    regLoading.value = false
  }
  catch (error) {
    regLoading.value = false
  }
}

async function copyInviteCode() {
  if (!inviteCode.value)
    return ms.error('请先生成您的专属邀请链接！')
  const path = `${window.location.href}?inVitecode=${inviteCode.value}`
  try {
    await toClipboard(path)
    ms.success('复制专属邀请链接成功！')
  }
  catch (error) {
    ms.error('当前设置不支持自动复制、手动复制吧！')
  }
}

onMounted(() => {
  queryInviteRecord()
})
</script>

<template>
  <NCard>
    <template #header>
      <div>邀用户、得福利!</div>
    </template>
    <NGrid :x-gap="24" :y-gap="24" :cols=" isSmallXl ? 1 : 3" class="mt-3">
      <NGridItem class="border rounded-sm p-3  dark:border-[#ffffff17]" :span="2">
        <div class="text-[#95aac9]  mb-2 text-base">
          我的邀请码
        </div>
        <div class="flex justify-between" :class="[isSmallXl ? 'flex-col mt-3' : '']">
          <b class="text-2xl text-[#555] dark:text-[#fff] whitespace-nowrap"> {{ inviteCode || '********' }}</b>
          <NSpace :class="[isSmallXl ? ' mt-3' : '']">
            <NButton type="success" @click="genMyInviteCode">
              生成专属邀请码
            </NButton>
            <NButton type="primary" @click="copyInviteCode">
              复制专属邀请链接
            </NButton>
          </NSpace>
        </div>
      </NGridItem>
      <NGridItem v-if="Number(globalConfig?.inviteSendStatus) === 1" class="border rounded-sm p-3  dark:border-[#ffffff17]" :span="1">
        <b class="text-[000]">Tips</b>
        <div class="flex flex-col text-[#707384]">
          <span>邀请一位用户赠送{{ globalConfig.inviteGiveSendModel3Count }}积分基础模型额度+{{ globalConfig.inviteGiveSendModel4Count }}积分高级模型额度+{{ globalConfig.inviteGiveSendDrawMjCount }}MJ绘画积分额度</span>
          <span>收到邀请用户获得{{ globalConfig.invitedGuestSendModel3Count }}积分基础模型额度+{{ globalConfig.invitedGuestSendModel4Count }}积分高级模型额度+{{ globalConfig.invitedGuestSendDrawMjCount }}MJ绘画积分额度</span>
        </div>
      </NGridItem>
    </NGrid>
  </NCard>
  <NCard class="mt-5">
    <template #header>
      <div>邀请记录</div>
    </template>
    <NDataTable :loading="regLoading" :remote="true" pagination-behavior-on-filter="first" class="min-h-[350px]" :columns="columns" :data="data" :pagination="paginationReg" :scroll-x="500" />
  </NCard>
</template>
