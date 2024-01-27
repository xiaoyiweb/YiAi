<script setup lang='ts'>
import { NButton, NCard, NModal, NSkeleton, NSpace } from 'naive-ui'
import { computed, ref } from 'vue'
import { marked } from 'marked'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useGlobalStoreWithOut } from '@/store'
import { fetchGetGlobalNoticeAPI } from '@/api/global'

import type { ResData } from '@/api/types'
import { ss } from '@/utils/storage'
defineProps<Props>()

interface Props {
  visible: boolean
}

interface Notice {
  noticeInfo: string
  noticeTitle: string
}

const notice = ref<Notice>({
  noticeInfo: '',
  noticeTitle: '',
})

const appStore = useAppStore()
const useGlobalStore = useGlobalStoreWithOut()
const loading = ref(true)
const darkMode = computed(() => appStore.theme === 'dark')
const { isSmallLg } = useBasicLayout()
const theme = computed(() => appStore.theme)

const html = computed(() => {
  if (!notice.value.noticeInfo)
    return ''
  return marked(notice.value.noticeInfo)
})

function handleCloseDialog() {
  loading.value = true
}

function handleClose() {
  useGlobalStore.updateNoticeDialog(false)
}

async function queryNotice() {
  const res: ResData = await fetchGetGlobalNoticeAPI()
  const { success, data } = res
  if (success)
    notice.value = data
}

async function openDrawerAfter() {
  await queryNotice()
  loading.value = false
}

function handleReminder() {
  useGlobalStore.updateNoticeDialog(false)
  ss.set('showNotice', Date.now() + 24 * 60 * 60 * 1000)
}
</script>

<template>
  <NModal :show="visible" class="p-0 noticeDialog" :style="{ maxWidth: '780px', minWidth: isSmallLg ? '100%' : '780px' }" :on-after-enter="openDrawerAfter" :on-after-leave="handleCloseDialog">
    <NSpace vertical>
      <NCard closable @close="handleClose">
        <template #header>
					<div v-if="loading"   class="px-[20px]" >
						<NSkeleton text width="30%" />
					</div>
          <template v-else>
            <span class="text-xl">{{ notice.noticeTitle }}</span>
          </template>
        </template>
				<div v-if="loading"   class="px-[20px]" >
						<NSkeleton  text :repeat="10" />
				</div>
        <template v-else>
          <div :class="[darkMode ? 'text-[#fff]' : 'text-[#000]', 'pb-5']" :style="{ background: theme === 'dark' ? '#2c2c32' : '#fff' }" class="p-[20px] markdown-body markdown-body-generate max-h-[500px] overflow-y-auto overflow-x-hidden" v-html="html" />
        </template>
        <div class="flex justify-end py-3 px-5">
          <NButton type="primary"  @click="handleReminder">
            24小时不再提示
          </NButton>
        </div>
      </NCard>
    </NSpace>
  </NModal>
</template>

<style scoped>
 /deep/ .n-card__content{
	padding: 0 !important;
}
</style>
