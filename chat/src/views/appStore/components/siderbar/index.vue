<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { fetchQueryAppCatsAPI } from '@/api/appStore'
import { useAppCatStore, useAuthStore } from '@/store'
import type { ResData } from '@/api/types'

const authStore = useAuthStore()
const appCatStore = useAppCatStore()
const { isMobile } = useBasicLayout()
interface AppCat {
  id: number
  name: string
  coverImg: string
  des: string
}

const isShowAppCatIcon = computed(() => Number(authStore.globalConfig?.isShowAppCatIcon) === 1)

const catList = ref<AppCat[]>([])

const catId = ref(0)

async function queryCats() {
  const res: ResData = await fetchQueryAppCatsAPI()
  const defaultCat = {
    id: 0,
    name: '全部分类',
  }
  catList.value = [defaultCat, ...res?.data?.rows]
}

function handleSelectCat(id: number) {
  catId.value = id
  appCatStore.setCatId(id)
}

onMounted(() => {
  queryCats()
})

const getMobileClass = computed<CSSProperties>(() => {
  if (isMobile.value)
    return ['w-full flex ']

  return ['w-[230px]']
})
</script>

<template>
  <div
    class="h-full"
    :class="getMobileClass"
  >
    <div class="app-sidebar bg-[#f8f8f8] w-full h-full overflow-x-scroll  dark:bg-[#18181c]" :class="[isMobile ? ' py-2 p-2 flex scrollbar-w-1' : 'p-4 overflow-y-scroll']">
      <div v-for="(item, index) in catList" :key="item.id" class="dark:bg-[#101014]  dark:border-neutral-800 relative flex flex-row  items-center gap-3 border rounded-md cursor-pointer  break-all text-ellipsis whitespace-nowrap select-none" :class="[catId === item.id ? 'bg-[#5a91fc] dark:bg-[#34373c] text-[#fff] font-bold' : 'bg-[#fff] hover:bg-neutral-100 dark:hover:bg-[#24272e]', isMobile ? 'px-4 py-1 mr-2' : ' px-3 py-2 mb-2 ', (!isMobile && isShowAppCatIcon) ? 'pl-14' : 'justify-center']" @click="handleSelectCat(item.id)">
        <img v-if="!isMobile && isShowAppCatIcon" :class="[index > 0 ? 'w-7 rounded-md mr-3' : '']" :src="item.coverImg" alt="">
        <span>
          {{ item.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.app-sidebar{
	&::-webkit-scrollbar {
  width: 1px;
	height: 1px;
	background-color: #f5f5f5;
}
}
</style>
