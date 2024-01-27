<script setup lang="ts">
import {ref} from 'vue'
import { SvgIcon } from '@/components/common'
import { NButton } from 'naive-ui'
import { useChatStore } from '@/store'

const chatStore = useChatStore()

const loading = ref(false)

async function handleAddNewGroup(){
	loading.value = true
	try {
		await chatStore.addNewChatGroup()
		await chatStore.queryMyGroup()
		loading.value = false
	} catch (error) {
		loading.value = false
	}
}


</script>

<template>
	<div class=" w-full h-full flex justify-center items-center flex-col">
			<SvgIcon icon="tabler:message" class="mb-4 inline-block text-6xl text-[#2080f0]" />
			<h1 class="mb-4 text-2xl font-bold mt-1">对话聊天</h1>
			<p class="mb-6 text-base text-slate-500">点击下方按钮，开始一个新的对话吧</p>
		 <NButton type="primary" :loading="loading" @click="handleAddNewGroup">新对话</NButton>
	</div>
</template>
