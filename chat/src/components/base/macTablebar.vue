<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useIpcRenderer } from '@vueuse/electron'
defineProps<{ title?: string }>()
import {  useGlobalStore } from '@/store'


const ipcRenderer = useIpcRenderer()
const isFullScreen = ref(false)
const globalStore = useGlobalStore()

const checkIfWindowIsMaximized = () => {
      ipcRenderer.send('check-window-maximized');
    };

const handleMaximizedStatus: any = (_: Event, isMaximized: any) => {
	isFullScreen.value = isMaximized
};


onMounted(() => {
	ipcRenderer.on('window-maximized-status', handleMaximizedStatus);
	ipcRenderer.on('clipboard-content', clipboardHandle);
	checkIfWindowIsMaximized();
});

onUnmounted(() => {
	ipcRenderer.removeListener('window-maximized-status', handleMaximizedStatus);
});

/* 关闭窗口 */
const closeWindow = () => {
  ipcRenderer.invoke('closeWindow')
}

/* 最大化最小化窗口 */
const maxmizeMainWin = () => {
	ipcRenderer.invoke( isFullScreen.value ? 'unmaximizeWindow' : 'maxmizeWindow')
  isFullScreen.value = !isFullScreen.value
}

/* 最小化窗口 */
const minimizeMainWindow = () => {
  ipcRenderer.invoke('minimizeWindow')
}

/* 处理粘贴内容 */
const clipboardHandle = (event: any, content: any) => {
	globalStore.updateClipboardText(content)
}
</script>

<template>
  <div class="wrapper">
    <div class="btn close-btn" @click="closeWindow" />
    <div v-if="isFullScreen" class="btn disabled" />
    <div v-if="!isFullScreen" class="btn min-btn" @click="minimizeMainWindow" />
    <div class="btn max-btn" @click="maxmizeMainWin" />
  </div>
</template>

<style scoped>
body {
   margin: 0;
}

.wrapper {
	margin-top: 8px;
   height: 30px;
   display: flex;
   justify-content: center;
   align-items: center;
}

.btn {
   width: 14px;
   height: 14px;
   border-radius: 50%;
   margin-right: 6px;
   position: relative;
   overflow: hidden;
   cursor: pointer;
}

.btn:last-child {
   margin-right: 0;
}

.btn:before,
.btn:after {
   content: "";
   position: absolute;
   top: 100%;
   left: 50%;
   transform: translate(-50%, -50%);
   border-radius: 1px;
   opacity: 0;
   transition: all 300ms ease-in-out;
}

.close-btn {
   background: #FF5D5B;
   border: 1px solid #CF544D;
}

.min-btn {
   background: #FFBB39;
   border: 1px solid #CFA64E;
}

.disabled{
	background: #cccccc;
}

.max-btn {
   background: #00CD4E;
   border: 1px solid #0EA642;
}

/* Close btn */
.close-btn:before,
.close-btn:after {
   width: 1px;
   height: 70%;
   background: #460100;
}

.close-btn:before {
   transform: translate(-50%, -50%) rotate(45deg);
}

.close-btn:after {
   transform: translate(-50%, -50%) rotate(-45deg);
}

/* min btn */
.min-btn:before {
   width: 70%;
   height: 1px;
   background: #460100;
}

/* max btn */
.max-btn:before {
   width: 50%;
   height: 50%;
   background: #024D0F;
}

.max-btn:after {
   width: 1px;
   height: 90%;
   transform: translate(-50%, -50%) rotate(-135deg);
   background: #00CD4E;
}

/* Hover function */
.wrapper:hover .btn:before,
.wrapper:hover .btn:after {
   top: 50%;
   opacity: 1;
	 cursor: pointer;
}
</style>
