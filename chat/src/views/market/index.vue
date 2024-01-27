<script lang="ts" setup>
	import { onMounted, ref, computed } from 'vue'
	import { fetchMidjourneyGetList } from '@/api'
	import type { ResData } from '@/api/types'
	import { NSlider, NInput, NIcon } from 'naive-ui'
	import GridManager from '@/components/common/GridManager/index.vue'
	import { FlashOutline } from '@vicons/ionicons5'

	const imageList = ref<any>([])
	const wapperRef = ref<HTMLDivElement | null>(null)
	const scaleWidth = ref(50)
	const keyword = ref('')
	const page = ref(1)
	const size = ref(20)
	const loading = ref(false)
	const isMore = ref(true)


	const dataList = computed(() => {
		if(!keyword.value){
			return imageList.value
		}else{
			return imageList.value.filter((item: any) => {
				const { prompt } = item
				return prompt.includes(keyword.value)
			})
		}
	})

	async function queryDrawImg() {
		loading.value = true
		const res: ResData = await fetchMidjourneyGetList({ page: page.value ,size: size.value, rec: 1 })
		loading.value = false
		isMore.value = size.value === res.data.rows.length
		imageList.value = [...imageList.value, ...res.data.rows]
	}

	onMounted(async () => {
		await queryDrawImg()
	})

	function loadMore(){
		page.value = page.value + 1
		queryDrawImg()
	}
	</script>

	<template>
		<div class="bg-[#fff] h-[100vh] overflow-hidden p-4 pr-0 dark:bg-[#18181c] flex flex-col">
			<div class="p-4 flex pr-6 justify-between items-center">
				<div class="font-bold text-xl">AI绘画广场</div>
				<div class="w-[200px] sm:w-[300px] flex justify-between">
					<span class="hidden sm:block"  >尺寸调整</span>
					<div class="flex-1 ml-5">
						<n-slider v-model:value="scaleWidth" :step="10" />
					</div>
				</div>
			</div>
			<div class="px-4 mb-1 pr-5">
				<n-input v-model:value="keyword" placeholder="prompt关键词搜索">
				<template #prefix>
					<n-icon :component="FlashOutline" />
				</template>
			</n-input>
			</div>
			<div class="market  overflow-y-scroll flex-1 min-h-screen  p-4 dark:bg-[#18181c] relative ">
				<div id="wapper" ref="wapperRef" class="wapper">
					<GridManager @loadMore="loadMore" copyPropmpt isDrawLike :dataList="dataList" :scaleWidth="scaleWidth" />
				</div>
			</div>
		</div>

	</template>

	<style lang="less">
	.market{
		padding: 15px;
	}

	.wapper{
		width: 100%;
		position: relative;
		height: 100%;
		padding-bottom: 20px;


		&-item{
			z-index: 10;
			overflow: hidden;
			position: absolute;
			transition: all 0.5s;
			cursor: pointer;

			&:hover{
				.menu{
					transition: transform 0.3s ease-in-out;
					transform: translateY(-10px);
				}
				img{
					transform: scale(1.1);
				}
			}

			.menu{
				position: absolute;
				bottom: 0;
				width: 94%;
				left: 3%;
				max-height: 70%;
				height: 100px;
				transform: translateY(100%);
				background-color: #090b15;
				opacity: 0.8;
				transition: all .1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
				border-radius: 10px;
				overflow: hidden;
				display: flex;
				flex-direction: column;
				justify-content: space-between;

				.prompt{
					height: 50px;
					overflow: hidden;
				}

			}

			img{
				user-select: none;
				cursor: pointer;
				transition: all .6s cubic-bezier(0.19, 1, 0.22, 1);
				border-radius: 6px;
			}

			.item-loading{
				background: url(../../assets/img-bg.png) no-repeat center center;
				filter: blur(20px);
				position: absolute;
				top: 0;
			}
		}
	}

	.img-enter-active, .img-leave-active {
		transition: transform .3s;
	}
	.img-enter, .img-leave-to{
		transform: scale(.6);
		opacity: 0;
	}


	</style>
