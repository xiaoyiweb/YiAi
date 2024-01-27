<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { SvgIcon } from '@/components/common'
const router = useRouter()
</script>

<template>
  <div class="m-auto flex h-14 max-w-screen-4xl items-center justify-between px-4">
    <div class="flex min-w-0 flex-1 items-center space-x-2 overflow-hidden pr-2">
      <button @click="router.go(-1)">
        <SvgIcon class="text-xl" icon="ri:arrow-left-s-line" />
      </button>
      <h2 class="text-base font-bold">
        我的自定义工作台
      </h2>
    </div>
    <div class="flex items-center space-x-2" />
  </div>
</template>
