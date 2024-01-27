<script setup lang='ts'>
import { computed, onMounted, watch } from 'vue'
import { NLayout } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import Sider from './components/sider/index.vue'
import ChatBase from './chatBase.vue'
import emptyChat from './components/emptyChat/index.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useChatStore } from '@/store'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()
const { isMobile } = useBasicLayout()
const isLogin = computed(() => authStore.isLogin)
const collapsed = computed(() => appStore.siderCollapsed)
const dataSources = computed(() => chatStore.groupList)
const appId = computed(() => route.query.appId as string)

watch(isLogin, async (newVal, oldVal) => {
  if (newVal && !oldVal)
    await chatStore.queryMyGroup()
})

const getMobileClass = computed(() => {
  if (isMobile.value)
    return ['rounded-none', 'shadow-none']
  return ['rounded-md', 'shadow-md', 'dark:border-neutral-800']
})

const getContainerClass = computed(() => {
  return [
    'h-full',
    { 'pl-[260px]': !isMobile.value && !collapsed.value },
  ]
})

/* 有appId的特殊处理 */
async function handleAppId(appId: string) {
  const id = +appId
  router.replace({ name: 'Chat', query: {} })
  const isHasGroup = chatStore.groupList.find((item: any) => item.appId === id)
  if (!isHasGroup) {
    await chatStore.addNewChatGroup(id)
    await chatStore.queryMyGroup()
  }
  else {
    await chatStore.setActiveGroup(isHasGroup.uuid)
  }
}

onMounted(() => {
  if (appId.value)
    handleAppId(appId.value)
})
</script>

<template>
  <div class="h-full dark:bg-[#24272e] transition-all">
    <div class="h-full overflow-hidden" :class="getMobileClass">
      <NLayout class="z-40 transition" :class="getContainerClass" has-sider>
        <Sider class="h-full" />
        <!-- <NLayoutContent class="h-full"> -->
        <div class="w-full flex-1">
          <ChatBase v-if="dataSources.length" />
          <emptyChat v-if="!dataSources.length" />
        </div>
        <!-- </NLayoutContent> -->
      </NLayout>
    </div>
  </div>
</template>
