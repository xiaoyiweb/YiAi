<script setup lang='ts'>
import { computed, onMounted, ref, watch } from 'vue'
import { NScrollbar } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import ListItem from './ListItem.vue'
import { SvgIcon } from '@/components/common'
import { useAppStore, useChatStore, useAuthStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'

const { isMobile } = useBasicLayout()
const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()

const customKeyId = ref(100)

const dataSources = computed(() => chatStore.groupList)
const groupKeyWord = computed(() => chatStore.groupKeyWord)
watch(dataSources, () => customKeyId.value = customKeyId.value + 1)
watch(groupKeyWord, () => customKeyId.value = customKeyId.value + 1)
const isLogin = computed(() => authStore.isLogin)

// utc格式转换
function formatUtcTime(utcTime: Date | string) {
  const date = new Date(utcTime)
  const shanghaiTime = date.getTime() + 8 * 60 * 60 * 1000
  const shanghaiDate = new Date(shanghaiTime).getTime()
  return shanghaiDate
}

const today = new Date().setHours(0, 0, 0, 0)
const stickyList = computed(() => dataSources.value.filter(item => groupKeyWord.value ? (item.title.includes(groupKeyWord.value) && item.isSticky) : item.isSticky))
const appList = computed(() => dataSources.value.filter(item => groupKeyWord.value ? (item.title.includes(groupKeyWord.value) && !item.isSticky && item.appId) : (!item.isSticky && item.appId)))
const todayList = computed(() => dataSources.value.filter((item: any) => {
  if (groupKeyWord.value)
    return item.title.includes(groupKeyWord.value) && !item.isSticky && !item.appId && formatUtcTime(item.createdAt) >= today

  else return !item.isSticky && !item.appId && formatUtcTime(item.createdAt) >= today
}))
const otherList = computed(() => dataSources.value.filter((item: any) => {
  if (groupKeyWord.value)
    return item.title.includes(groupKeyWord.value) && !item.isSticky && !item.appId && formatUtcTime(item.createdAt) < today

  else return !item.isSticky && !item.appId && formatUtcTime(item.createdAt) < today
}))
/* 选中切换对话 */
async function handleSelect(group: Chat.History) {
	const { uuid } = group;
  if (isActive(uuid))
    return

  await chatStore.setActiveGroup(uuid)
  if (route.name !== 'Chat')
    router.push('/chat')

  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

/* 删除对话组 */
async function handleDelete(params: Chat.History) {
  event?.stopPropagation()
  await chatStore.deleteGroup(params)
  await chatStore.queryMyGroup()

  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

/* 判断是不是当前选中 */
function isActive(uuid: number) {
  return chatStore.active === uuid
}

onMounted(() => {
  chatStore.queryMyGroup()
})
</script>

<template>
  <NScrollbar class="px-4">
    <div class="flex flex-col gap-3 text-sm">
      <template v-if="!dataSources.length">
        <div class="flex flex-col items-center mt-4 text-center text-neutral-300">
          <SvgIcon icon="ri:inbox-line" class="mb-2 text-3xl" />
          <span>{{ $t('common.noData') }}</span>
        </div>
      </template>
      <template v-else>
        <ListItem v-if="stickyList.length" :key="1000 + customKeyId" title="置顶" :data-sources="stickyList" @select="handleSelect" @delete="handleDelete" />
        <ListItem v-if="appList.length" :key="2000 + customKeyId" title="应用分类组" :data-sources="appList" @select="handleSelect" @delete="handleDelete" />
        <ListItem v-if="todayList.length" :key="3000 + customKeyId" title="今天" :data-sources="todayList" @select="handleSelect" @delete="handleDelete" />
        <ListItem v-if="otherList.length" :key="4000 + customKeyId" title="其他" :data-sources="otherList" @select="handleSelect" @delete="handleDelete" />
      </template>
    </div>
  </NScrollbar>
</template>
