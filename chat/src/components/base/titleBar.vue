<script setup lang="ts">
import { PlayBack } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAppStore } from '@/store'

interface Props {
  title?: string
  des?: string
  padding?: number
}
const props = withDefaults(defineProps<Props>(), {
  title: '',
  des: '',
  padding: 4,
})
const appStore = useAppStore()
const darkMode = computed(() => appStore.theme === 'dark')

const router = useRouter()
</script>

<template>
  <div class="flex border-b border-[#ebebeb] dark:border-[#ffffff17] py-4 w-full" :class="[`px-${props.padding}`]">
    <div class="pt-1 mr-2 cursor-pointer">
      <NIcon size="16" class="text-primary" @click="router.push('/')">
        <PlayBack />
      </NIcon>
    </div>
    <div>
      <b :class="[darkMode ? 'text-[#fff]' : 'text-[#555]']" class="text-lg ">{{ props.title }}</b>
      <div :class="[darkMode ? 'text-[#fff]' : 'text-[#626569]']" class="text-truncate text-[#626569] mt-1">
        {{ props.des }}
      </div>
    </div>
  </div>
</template>
