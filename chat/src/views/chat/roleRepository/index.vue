<script lang="ts" setup>
import Header from './header.vue'
import Main from './main.vue'
</script>

<template>
  <div class="flex h-full w-full flex-col bg-white dark:bg-[#111114]">
    <header class="sticky left-0 right-0 top-0 z-40 border-b bg-white dark:border-b-neutral-800 dark:bg-[#111114]">
      <Header />
    </header>
    <Main />
  </div>
</template>
