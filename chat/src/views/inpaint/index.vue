<script lang='ts' setup>
import { ref, computed, watch } from 'vue'
import  CanvasMask from '@/components/common/CanvasMask/index.vue'
import ImageEditorCanvas from '@/components/common/ImageEditorCanvas/index.vue'
import { fetchProxyImgAPI } from '@/api/mjDraw'
import { NButton } from 'naive-ui'

const proxyImgBase = ref('')

const mode1Url = 'https://chevereto.jiangly.com/images/2023/11/21/61888bd4ede4.png'
const mode2Url = 'https://chevereto.jiangly.com/images/2023/11/19/shoes.jpg'


const canvasRef = ref<any>(null)
const drawImg = ref('')
const mode = ref(1) // 1 局部绘制  2：点击选取

const isEraserEnabled = ref(false)
const fileInfo =ref<any>({})
const  testBtn = computed(() => mode.value === 1 ? '模块选区' : '自由绘制')
const  testModeTip = computed(() => mode.value === 2 ? '模块选区模式' : '自由绘制模式')


async function getBase(){
	const base =  await canvasRef.value?.getBase()
	proxyImgBase.value = base
}

async function getProxyData(){
	const url = mode.value === 1 ? mode1Url : mode2Url
	const response: any = await fetchProxyImgAPI({ url: url });
	const data =  'data:image/png;base64,' + response.data
	drawImg.value = data
}

const eraserTip = computed(() => isEraserEnabled.value ? '橡皮擦模式' : '画笔模式')

function checkMode(){
	drawImg.value = null
	mode.value = mode.value === 1 ? 2 : 1
}

watch(mode, () => {
	getProxyData()
}, { immediate: true } )

function undo(){
	 canvasRef.value?.undo()
}

function clear (){
	canvasRef.value?.clear()
}

function updateFileInfo(data){
	fileInfo.value = data
}

function toggleEraser(){
	canvasRef.value?.toggleEraser()
	isEraserEnabled.value = !isEraserEnabled.value
}

</script>

<template>
	<div class="w-full h-full bg-gray-100">
		<div class="h-[80px] w-full flex justify-center items-center space-x-5">
			<span class="text-2xl font-bold">
				当前测试模式：{{ testModeTip }}
			</span>
			<NButton type="primary" @click="checkMode">切换至{{ testBtn }}模式</NButton>
		</div>
		<div class="bg-gray-100 flex-1 h-full w-full flex" v-if="mode === 1">
			<div class="w-[50%] flex flex-col border-r">
				<span class="text-2xl w-full text-center">操作区域</span>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<NButton type="primary" @click="undo">返回上一步</NButton>
					<NButton type="primary" @click="clear">清空画布</NButton>
					<NButton type="primary" @click="toggleEraser">切换橡皮擦模式</NButton>
					当前模式: {{ eraserTip }}
				</div>
				<div class="mt-10 ml-10">
					<div>
						<CanvasMask ref="canvasRef" :updateFileInfo="updateFileInfo" :max="700" v-if="drawImg && mode === 1" :src="drawImg"/>
					</div>
				</div>
			</div>
			<div class="w-[50%] flex flex-col">
				<span class="text-2xl w-full text-center">预览区域</span>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<NButton type="primary" @click="getBase">获取蒙层</NButton>
				</div>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<span>图片原始信息：</span>
					<span>宽度： {{ fileInfo.width }}</span>
					<span>高度： {{ fileInfo.height }}</span>
					<span>缩放比： {{ fileInfo.scaleRatio }}</span>
				</div>
				<div>
					<img v-if="proxyImgBase" :src="proxyImgBase" alt="">
				</div>
			</div>
		</div>

		<div class="bg-gray-100 flex-1 h-full w-full flex" v-if="mode === 2">
			<div class="w-[50%] flex flex-col border-r">
				<span class="text-2xl w-full text-center">操作区域</span>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<NButton type="primary" @click="undo">返回上一步</NButton>
					<NButton type="primary" @click="clear">清空画布</NButton>
					当前模式: {{ eraserTip }}
				</div>
				<div class="mt-10 ml-10">
					<div>
						<ImageEditorCanvas selectColor="#fff" ref="canvasRef" :updateFileInfo="updateFileInfo" :max="500" v-if="drawImg && mode === 2" :src="drawImg"/>
					</div>
				</div>
			</div>
			<div class="w-[50%] flex flex-col">
				<span class="text-2xl w-full text-center">预览区域</span>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<NButton type="primary" @click="getBase">获取蒙层</NButton>
				</div>
				<div class="border-b border-t h-[50px] flex justify-center items-center space-x-5">
					<span>图片原始信息：</span>
					<span>宽度： {{ fileInfo.width }}</span>
					<span>高度： {{ fileInfo.height }}</span>
					<span>缩放比： {{ fileInfo.scaleRatio }}</span>
				</div>
				<div>
					<img v-if="proxyImgBase" :src="proxyImgBase" alt="">
				</div>
			</div>
		</div>

	</div>
</template>

