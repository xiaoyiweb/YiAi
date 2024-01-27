<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { computed } from 'vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAuthStore } from '@/store'
const authStore = useAuthStore()

const logoPath = computed(() => authStore.globalConfig.clientLogoPath)
const homePage = computed(() => authStore.globalConfig.clientHomePath || '/')

const { isMobile } = useBasicLayout()

const getMobileClass = computed(() => {
  if (isMobile.value)
    return ['py-2', 'w-8', 'ml-3']
  return ['py-4', 'px-2', 'w-full', 'border-b']
})
</script>

<template>
  <RouterLink :to="homePage">
    <img v-if="!logoPath" src="/logo.png" :class="getMobileClass" class="cursor-pointer px-0 dark:border-[#ffffff17]  border-#ebebeb-400" alt="">
    <img v-if="logoPath" :src="logoPath" :class="getMobileClass" class="cursor-pointer px-0 dark:border-[#ffffff17]  border-#ebebeb-400" alt="">
  </RouterLink>
</template>
