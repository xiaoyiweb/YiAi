<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue'
import { NTooltip, useMessage } from 'naive-ui'
import { useUsingContext } from '../../hooks/useUsingContext'
import { SvgIcon } from '@/components/common'
import {
  useAppStore,
  useAuthStore,
  useChatStore,
  useGlobalStoreWithOut,
} from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'

import type { Theme } from '@/store/modules/app/helper'

defineProps<Props>()
const emit = defineEmits<Emit>()
const authStore = useAuthStore()
const { usingContext, toggleUsingContext } = useUsingContext()

interface Props {
  usingContext: boolean
}

interface Emit {
  (ev: 'export'): void
  (ev: 'toggleUsingContext'): void
  (ev: 'clear'): void
  (ev: 'scrollBtn'): void
}
const ms = useMessage()
const marks = ref({
  0: '死板',
  0.1: '专业',
  0.2: '准确',
  0.8: '平衡',
  1: '创造性',
  1.3: '离谱',
  1.6: '荒谬',
})
const themeOptions: {
  label: string
  key: Theme
  icon: string
}[] = [
  {
    label: 'Auto',
    key: 'auto',
    icon: 'ri:contrast-line',
  },
  {
    label: 'Light',
    key: 'light',
    icon: 'twemoji:sun',
  },
  {
    label: 'Dark',
    key: 'dark',
    icon: 'noto-v1:last-quarter-moon-face',
  },
]

const modelName = computed(() => {
  if (!chatStore.activeConfig)
    return
  const { modelTypeInfo, modelInfo } = chatStore.activeConfig
  if (!modelTypeInfo || !modelInfo)
    return
  return `${modelTypeInfo?.label} / ${modelInfo.modelName}`
})

const appStore = useAppStore()
const chatStore = useChatStore()
const useGlobalStore = useGlobalStoreWithOut()

const collapsed = computed(() => appStore.siderCollapsed)
const currentChatHistory = computed(() => chatStore.getChatByGroupInfo())

const { isMobile } = useBasicLayout()
const theme = computed(() => appStore.theme)

function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value)
}

function onScrollToTop() {
  const scrollRef = document.querySelector('#scrollRef')
  if (scrollRef)
    nextTick(() => (scrollRef.scrollTop = 0))
}

function handleExport() {
  emit('export')
}

function handleClear() {
  emit('clear')
}

function handleScrollBtm() {
  emit('scrollBtn')
}

function handleOpenModelDialog() {
  if (useGlobalStore.isChatIn)
    return ms.warning('请等待聊天结束后修改模型信息！')

  useGlobalStore.updateModelDialog(true)
}
const isLogin = computed(() => authStore.isLogin)

function handleSignIn() {
  if (!isLogin.value) {
    authStore.setLoginDialog(true)
    return
  }
  useGlobalStore.updateSignInDialog(true)
}
</script>

<template>
  <header
    class="sticky top-0 left-0 right-0 z-30 border-b dark:border-neutral-800 bg-white/80 dark:bg-black/20 backdrop-blur"
  >
    <div
      class="relative flex items-center justify-center min-w-0 overflow-hidden h-14"
    >
      <div class="max-w-screen-4xl flex w-full h-full items-center px-4">
        <div v-if="isMobile" class="flex items-center">
          <button
            class="flex items-center justify-center w-11 h-11"
            @click="handleUpdateCollapsed"
          >
            <SvgIcon
              v-if="collapsed"
              class="text-2xl"
              icon="ri:align-justify"
            />
            <SvgIcon v-else class="text-2xl" icon="ri:align-right" />
          </button>
        </div>

        <!-- pc -->
        <div class="flex justify-between items-center h-full w-full">
          <div class="flex-1 flex ele-drag items-center h-full">
            <h1
              class="flex-1 px-4 font-bold pr-6 overflow-hidden cursor-pointer select-none text-ellipsis whitespace-nowrap"
              @dblclick="onScrollToTop"
            >
              {{ currentChatHistory?.title ?? '' }}
            </h1>
          </div>
          <div class="flex items-center space-x-2">
            <!-- <NPopover v-if="isMobile" trigger="click">
              <template #trigger>
                <button
                  class="flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
                >
                  <span class="text-base text-slate-500 dark:text-slate-400">
                    <SvgIcon icon="fluent:dark-theme-24-regular" />
                  </span>
                </button>
              </template>
              <div>
                <div class="flex items-center gap-4">
                  <template v-for="item of themeOptions" :key="item.key">
                    <NButton
                      size="small"
                      :type="item.key === theme ? 'info' : undefined"
                      @click="appStore.setTheme(item.key)"
                    >
                      <template #icon>
                        <SvgIcon
                          :icon="item.icon"
                          :style="{ color: item.color }"
                        />
                      </template>
                    </NButton>
                  </template>
                </div>
              </div>
            </NPopover> -->
            
            <NTooltip v-if="isMobile" trigger="hover" :disabled="isMobile">
              <template #trigger>
                <button
                  class="flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
                  @click="handleSignIn"
                >
                  <span class="text-base text-slate-500 dark:text-slate-400">
                    <SvgIcon icon="streamline-emojis:wrapped-gift-1" />
                  </span>
                </button>
              </template>
              签到领福利
            </NTooltip>
            <NTooltip trigger="hover" :disabled="isMobile">
              <template #trigger>
                <button
                  class="flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
                  @click="handleExport"
                   v-show="!isMobile"
                >
                  <span class="text-base text-slate-500 dark:text-slate-400">
                    <SvgIcon
                      icon="material-symbols:sim-card-download-outline-rounded"
                    />
                  </span>
                </button>
              </template>
              导出本页为图片
            </NTooltip>
            <NTooltip trigger="hover" :disabled="isMobile">
              <template #trigger>
                <button
                  class="flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
                  @click="handleClear"
                >
                  <span class="text-base text-slate-500 dark:text-slate-400"><SvgIcon icon="material-symbols:delete-outline"/></span>
                </button>
              </template>
              删除本页内容
            </NTooltip>
            <NTooltip trigger="hover" :disabled="isMobile">
              <template #trigger>
                <button
                  class="flex h-8 w-8 items-center justify-center rounded border transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]"
                  @click="handleScrollBtm"
                >
                  <span class="text-base text-slate-500 dark:text-slate-400"><SvgIcon icon="material-symbols:keyboard-arrow-down" /></span>
                </button>
              </template>
              滚动到底部
            </NTooltip>
          </div>
        </div>
      </div>
    </div>
    <!-- <NPopover :show="showModelPopover">
      <template #trigger> -->
    <!-- <div
      class="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap cursor-pointer select-none rounded-b-md border bg-white px-4 dark:border-neutral-700 dark:bg-[#111114] flex items-center hover:text-[#5a91fc] transition"
      @click="handleOpenModelDialog"
    > -->
    <!-- <SvgIcon class="text-base mr-2" icon="fluent:flash-sparkle-20-regular" /> -->
    <!-- <img :src="modelSvg" class="text-base mr-2 w-4" alt=""> -->

    <!-- {{ modelName }}
      <SvgIcon
        class="text-2xl"
        :icon="
          useGlobalStore.modelDialog
            ? 'ri:arrow-down-s-line'
            : 'ri:arrow-right-s-line'
        "
      />
    </div> -->
    <!-- </template>
      <template #header>
        <span class="cursor-pointer  hover:text-[#3076fd]" @click="handleChangeMode(3)">
          GPT-3.5
        </span>
      </template>
      <span class="cursor-pointer  hover:text-[#3076fd]" @click="handleChangeMode(4)">
        GPT-4.0
      </span>
    </NPopover> -->
  </header>
</template>
