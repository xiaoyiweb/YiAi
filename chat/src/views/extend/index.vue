<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref,watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore, useAuthStore, useGlobalStoreWithOut } from '@/store'
import { getToken } from '@/store/modules/auth/helper'
import { fetchGetchatSyncApi } from '@/api'

const router = useRouter()
const globalStore = useGlobalStoreWithOut()
const loading = ref(false)
const iframeSrc = computed(() => globalStore.iframeUrl)
// const iframeSrc = computed(() => 'http://localhost:3000/')

const appStore = useAppStore()
const darkMode = computed(() => appStore.theme === 'dark')

function watchIframe() {
	const iframe = document.getElementById('iframe')
	if (!iframe?.addEventListener) {
		iframe?.attachEvent('onload', handleIframeLoad)
	}
	iframe?.addEventListener('load', handleIframeLoad, true)
}

const theme = computed(() => appStore.theme)

watch(theme, (data) => {
	sendMessageToIframe({type: 'theme', data})
})

onMounted(() => {
	if (!iframeSrc.value) {
		return router.push('/')
	}
	loading.value = true
	watchIframe()
	window.addEventListener('message', messageChange)
})

async function messageChange(event: any){
	const { type, data } = event.data
	if(type === 'theme'){
  	appStore.setTheme(data === 'dark' ? 'dark' : 'light' )
	}
	if(type === 'chat'){
		replyAiChat(data)
	}
}

function replyAiChat(question: any){
	fetchGetchatSyncApi({prompt: question}).then( (res: any) => {
		const { code, data: resData } = res
		if(code !== 200) return;
		sendMessageToIframe({ type:'chat', data: removeEmojis(resData) })
	})
}

function removeEmojis(str: any) {
    const regex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    return str.replace(regex, '');
  }




function sendMessageToIframe(message: any){
	const iframe: any = document.getElementById('iframe')
	const childWindow = iframe.contentWindow
	childWindow.postMessage(message, '*');
}

function handleIframeLoad() {
	sendMessageToIframe({
		type: 'theme',
		data: theme.value
	})
	const token = getToken()
	if(token){
		sendMessageToIframe({
			type: 'token',
			data: token
		})
	}
	loading.value = false
}

onBeforeUnmount(() => {
	globalStore.updateIframeUrl('')
	const iframe = document.getElementById('iframe')
	iframe?.removeEventListener('load', handleIframeLoad)
	window.removeEventListener('message', messageChange)
})
</script>

<template>
	<div class="w-full h-full relative">
		<div v-if="loading" class="main-container absolute left-0 right-0 bottom-0 top-0 backdrop-blur" :class="[ darkMode ?  'dark:bg-black/20' : 'bg-white/80' ]">
			<div class="loading">
				<div :class="['loading-text ', darkMode ? 'text-[#fff]' : 'text-[#000]']" id="loading-text">
					<span class="loading-text-words">内</span>
					<span class="loading-text-words">容</span>
					<span class="loading-text-words">正</span>
					<span class="loading-text-words">在</span>
					<span class="loading-text-words">加</span>
					<span class="loading-text-words">载</span>
					<span class="loading-text-words">中</span>
				</div>
			</div>
		</div>
		<iframe id="iframe" :src="iframeSrc" style="width: 100%; height: 100%; border: none;"></iframe>
	</div>
</template>

<style>
* {
	box-sizing: border-box;
}

.main-container {
	width: 100vw;
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
}

body {
	background: #fff;
}

.loading {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 9999;
}

.loading-text {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	margin: auto;
	text-align: center;
	width: 100%;
	height: 100px;
	line-height: 100px;
}

.loading-text span {
	display: inline-block;
	margin: 0 5px;
	font-family: "Quattrocento Sans", sans-serif;
}

.loading-text span:nth-child(1) {
	filter: blur(0px);
	-webkit-animation: blur-text 1.5s 0s infinite linear alternate;
	animation: blur-text 1.5s 0s infinite linear alternate;
}

.loading-text span:nth-child(2) {
	filter: blur(0px);
	-webkit-animation: blur-text 1.5s 0.2s infinite linear alternate;
	animation: blur-text 1.5s 0.2s infinite linear alternate;
}

.loading-text span:nth-child(3) {
	filter: blur(0px);
	-webkit-animation: blur-text 1.5s 0.4s infinite linear alternate;
	animation: blur-text 1.5s 0.4s infinite linear alternate;
}

.loading-text span:nth-child(4) {
	filter: blur(0px);
	-webkit-animation: blur-text 1.5s 0.6s infinite linear alternate;
	animation: blur-text 1.5s 0.6s infinite linear alternate;
}

.loading-text span:nth-child(5) {
	filter: blur(0px);
	-webkit-animation: blur-text 1.5s 0.8s infinite linear alternate;
	animation: blur-text 1.5s 0.8s infinite linear alternate;
}

.loading-text span:nth-child(6) {
	filter: blur(0px);
	-webkit-animation: blur-text 1.5s 1s infinite linear alternate;
	animation: blur-text 1.5s 1s infinite linear alternate;
}

.loading-text span:nth-child(7) {
	filter: blur(0px);
	-webkit-animation: blur-text 1.5s 1.2s infinite linear alternate;
	animation: blur-text 1.5s 1.2s infinite linear alternate;
}

@-webkit-keyframes blur-text {
	0% {
		filter: blur(0px);
	}

	100% {
		filter: blur(4px);
	}
}

@keyframes blur-text {
	0% {
		filter: blur(0px);
	}

	100% {
		filter: blur(4px);
	}
}

@media (prefers-color-scheme: dark) {
	body {
		background: #121212;
	}
}
</style>
