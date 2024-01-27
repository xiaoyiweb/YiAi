<script setup lang='ts'>
import type { CSSProperties } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'
import type { NumberAnimationInst } from 'naive-ui'
import { NButton, NInput, NLayoutSider, NNumberAnimation, useDialog, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import List from './List.vue'
import { SvgIcon } from '@/components/common'

import { useAppStore, useAuthStore, useChatStore, useGlobalStoreWithOut } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
const useGlobalStore = useGlobalStoreWithOut()

const router = useRouter()
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()
const ms = useMessage()
const model3AnimationInstRef = ref<NumberAnimationInst | null>(null)
const model4AnimationInstRef = ref<NumberAnimationInst | null>(null)
const userBalance = computed(() => authStore.userBalance)
const dialog = useDialog()

/* 当前选用的模型的扣费类型 1: 普通 2： 高级  */
const activeModelKeyDeductType = computed(() => chatStore?.activeModelKeyDeductType)
const activeModelKeyPrice = computed(() => chatStore?.activeModelKeyPrice)

const oldUse3Token = ref(0)
const newUse3Token = ref(0)
const oldUse4Token = ref(0)
const newUse4Token = ref(0)

const isSearch = ref(false)
const searchRef = ref(null)
watch(() => authStore.userBalance.useModel3Token, (newVal, oldVal) => {
  oldUse3Token.value = oldVal || 0
  newUse3Token.value = newVal || 0
  model3AnimationInstRef.value?.play()
}, {
  immediate: true,
  flush: 'post',
})
watch(() => authStore.userBalance.useModel4Token, (newVal, oldVal) => {
  oldUse4Token.value = oldVal || 0
  newUse4Token.value = newVal || 0
  model4AnimationInstRef.value?.play()
}, {
  immediate: true,
  flush: 'post',
})

const { isMobile } = useBasicLayout()
const addLoading = ref(false)

const collapsed = computed(() => appStore.siderCollapsed)
const groupKeyWord = ref('')

function handleInputGroupSearch(val: string) {
  groupKeyWord.value = val
  chatStore.setGroupKeyWord(val)
}

function handleBlurInput() {
  isSearch.value = false
}

function handleOpenRole() {
  router.push('/role')
}

/* 新增一个对话 */
async function handleAdd() {
  try {
    addLoading.value = true
    await chatStore.addNewChatGroup()
    await chatStore.queryMyGroup()
    addLoading.value = false

    if (isMobile.value)
      appStore.setSiderCollapsed(true)
  }
  catch (error) {
    addLoading.value = false
  }
}

/* 删除全部非置顶聊天 */
async function handleDelGroup() {
  dialog.warning({
    title: '清空分组',
    content: '是否删除所有非置顶的对话组？',
    positiveText: '确认删除',
    negativeText: '再想想',
    onPositiveClick: async () => {
      await chatStore.delAllGroup()
    },
  })
}

function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value)
}

function handleOpenSearch() {
  isSearch.value = true
  nextTick(() => {
    searchRef.value?.focus()
  })
}

const getMobileClass = computed<CSSProperties>(() => {
  if (isMobile.value) {
    return {
      position: 'fixed',
      zIndex: 50,
    }
  }
  return {}
})

const mobileSafeArea = computed(() => {
  if (isMobile.value) {
    return {
      paddingBottom: 'env(safe-area-inset-bottom)',
    }
  }
  return {}
})

watch(
  isMobile,
  (val) => {
    appStore.setSiderCollapsed(val)
  },
  {
    immediate: true,
    flush: 'post',
  },
)
</script>

<template>
  <div>
    <NLayoutSider
      :collapsed="collapsed"
      :collapsed-width="0"
      :width="260"
      :show-trigger="isMobile ? false : 'arrow-circle'"
      collapse-mode="transform"
      position="absolute"
      bordered
      :style="getMobileClass"
      @update-collapsed="handleUpdateCollapsed"
    >
      <div class="flex flex-col h-full bg-[#fafbfc] dark:bg-[#18181c]" :style="mobileSafeArea">
        <main class="flex flex-col h-full flex-1 min-h-0">
          <div v-if="isSearch" class="flex h-14 items-center space-x-2 bg-[#fafbfc] dark:bg-[#18181c]">
            <NButton type="primary" :loading="addLoading" @click="handleAdd">
              <SvgIcon icon="ion:add-outline" class="text-xl" />
            </NButton>
            <div class="flex-1">
              <NInput ref="searchRef" v-model="groupKeyWord" type="text" placeholder="对话历史查找" clearable @blur="handleBlurInput" @input="handleInputGroupSearch" />
            </div>
          </div>
          <div v-if="!isSearch" class="flex h-14 items-center space-x-2 px-2 bg-[#fafbfc] dark:bg-[#18181c]">
            <div class="flex-1">
              <NButton type="primary" style="width: 100%" :loading="addLoading" @click="handleAdd">
                新对话
                <SvgIcon icon="ion:add-outline" class="text-xl" />
              </NButton>
            </div>
            <NButton @click="handleOpenSearch">
              <SvgIcon icon="icon-park-outline:search" class="text-xl" />
            </NButton>
          </div>
          <div class="flex-1 min-h-0 pb-4 overflow-hidden">
            <List />
          </div>
          <div v-if="!isMobile" class="px-6 py-2 flex items-center   border-t dark:border-t-neutral-800">
            <div class="flex items-center w-full p-1 mb-1 text-[#3076fd] rounded cursor-pointer transition hover:bg-[#eef0f3] dark:border-neutral-700 dark:hover:bg-[#33373c]" @click="useGlobalStore.updateGoodsDialog(true)">
              <SvgIcon icon="material-symbols:shopping-bag-outline" class="mr-1 text-base" />
              进入市场选购您的商品
            </div>
          </div>
          <div class="p-4  border-t dark:border-t-neutral-800 flex flex-col">
            <div v-if="activeModelKeyDeductType === 1" class="my-1 flex items-center select-none">
              <SvgIcon icon="material-symbols:account-balance-wallet-outline" class="ml-2 mr-2 text-base" />普通额度： {{ `${userBalance.sumModel3Count || 0} 积分` }}
            </div>
            <div v-if="activeModelKeyDeductType === 1" class="my-1 flex items-center select-none">
              <SvgIcon icon="ic:twotone-hourglass-top" class="ml-2 mr-2 text-base" /> 我已使用：  <NNumberAnimation ref="model3AnimationInstRef" :from="oldUse3Token" :to="newUse3Token" /> Token
            </div>
            <div v-if="activeModelKeyDeductType === 1" class="my-1 flex items-center select-none">
              <SvgIcon icon="mingcute:bill-line" class="ml-2 mr-2 text-base" /> 模型费用： {{ `${activeModelKeyPrice || 0}积分 / 次对话` }}
            </div>

            <div v-if="activeModelKeyDeductType === 2" class="my-1 flex items-center select-none">
              <SvgIcon icon="ic:twotone-hourglass-top" class="ml-2 mr-2 text-base" />我已使用：  <NNumberAnimation ref="model4AnimationInstRef" :from="oldUse4Token" :to="newUse4Token" /> Token
            </div>
            <div v-if="activeModelKeyDeductType === 2" class="my-1 flex items-center select-none">
              <SvgIcon icon="material-symbols:account-balance-wallet-outline" class="ml-2 mr-2 text-base " />高级额度： {{ `${userBalance.sumModel4Count || 0} 积分` }}
            </div>
            <div v-if="activeModelKeyDeductType === 2" class="my-1 flex items-center select-none">
              <SvgIcon icon="mingcute:bill-line" class="ml-2 mr-2 text-base " />模型费用： {{ `${activeModelKeyPrice || 0}积分 / 次对话` }}
            </div>

            <div class="flex justify-between my-3">
              <NButton type="tertiary" size="small" @click="useGlobalStore.updateNoticeDialog(true)">
                <SvgIcon icon="mdi:notice-board" class="ml-2 mr-2 text-sm" />
                <span class="mr-2">公告栏</span>
              </NButton>
              <NButton type="tertiary" size="small" @click="handleOpenRole">
                <SvgIcon icon="ri:emoji-sticker-line" class="ml-2 mr-2 text-sm" />
                <span class="mr-3">工作台</span>
              </NButton>
            </div>
            <div class="flex justify-betweenx">
              <NButton type="tertiary" size="small" style="width: 100%" @click="handleDelGroup">
                <SvgIcon icon="ant-design:delete-outlined" class="ml-2 mr-2 text-sm" />
                <span class="mr-3">清空全部非置顶会话</span>
              </NButton>
            </div>
          <!-- <NButton block @click="show = true">
            {{ $t('store.siderButton') }}
          </NButton> -->
          </div>
        </main>
      <!-- <Footer /> -->
      </div>
    </NLayoutSider>
    <template v-if="isMobile">
      <div v-show="!collapsed" class="fixed inset-0 z-40 bg-black/40" @click="handleUpdateCollapsed" />
    </template>
  </div>
</template>
