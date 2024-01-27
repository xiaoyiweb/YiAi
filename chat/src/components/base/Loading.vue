<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAppStore } from '@/store'

const props = withDefaults(defineProps<Props>(), {
  gap: 10,
  progress: 0,
  tips: '',
	words: ['L', 'O', 'A', 'D', 'I', 'N', 'G']
})

const appStore = useAppStore()

const theme = computed(() => appStore.theme)
const loadingTextColor = computed(() => theme.value === 'dark' ? '#fff' : '#000')

interface Props {
  gap?: number
  progress?: number
  tips?: string
  bgColor?: string
	words?: any
}
// const words = ref<string[]>(['L', 'O', 'A', 'D', 'I', 'N', 'G'])
</script>

<template>
  <div class="loading" :style="{ background: props.bgColor }">
    <div class="loading-text">
      <span v-for="item in props.words" :key="item" :style="{ margin: `0 ${props.gap}px`, color: loadingTextColor }" class="loading-text-words">{{ item }}</span>
    </div>
    <div v-if="!tips && props.progress" class="progress">
      绘制进度： {{ props.progress }}%
    </div>
    <div v-if="tips" class="progress">
      {{ props.tips }}
    </div>
  </div>
</template>

<style scoped>
.loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
	user-select: none;
}

.progress{
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
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
  height: 110px;
  line-height: 100px;
}
.loading-text span {
  display: inline-block;
  margin: 0 5px;
  color: #fff;
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
</style>
