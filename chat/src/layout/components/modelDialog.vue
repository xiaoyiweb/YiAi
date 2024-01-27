<script setup lang='ts'>
import { NCountdown, NIcon, NImage, NModal, NSkeleton, NSpin, useMessage, NInput, NSelect, NCascader, NCollapse, NCollapseItem, NButton, NSlider, NTooltip, NTag } from 'naive-ui'
import { ref, onMounted, computed, watch, h } from 'vue'
import { CloseOutline, SettingsOutline } from '@vicons/ionicons5'
import { fetchQueryModelsListAPI } from '@/api/models'
import { useAuthStore, useGlobalStoreWithOut, useChatStore } from '@/store'
import { fetchUpdateGroupAPI } from '@/api/group'

defineProps<Props>()
interface ModelType {
	label: string
	val: number
}

const useGlobalStore = useGlobalStoreWithOut()
const authStore = useAuthStore()
const chatStore = useChatStore()
const loading = ref(false)

/* 当前对话组的配置信息 */
const activeConfig = computed(() => {
	return chatStore.activeConfig
})

const activeGroupAppId = computed(() => chatStore.activeGroupAppId )

/* 不是openai的模型暂时不让设置预设 */
const disabled = computed(() => {
	return Number(activeConfig.value?.modelTypeInfo?.val) !== 1 || Number(activeGroupAppId.value) > 0
})

/* 温度 */
const maxTemperature = computed(() => {
	return Number(chatStore.activeModelKeyType) === 1 ? 1.2 : 1
})

/* 当前的对话组id */
const chatGroupId = computed(() => chatStore.active)

watch(activeConfig, (val) => {
	if (!val) return;
	compilerConfig(val)
})

const maxModelTokens = ref(0)
const maxResponseTokens = ref(0)
const topN = ref(0.8)
const modelTypes = ref<ModelType[]>([])
const model = ref('')
const systemMessage = ref('')
const maxRounds = ref()
const rounds = ref(8)

interface Props {
	visible: boolean
}

const message = useMessage()
const showResetBtn = ref(false)
let modelMapsCache: any = ref({})
let modelTypeListCache: any = ref([])

onMounted(() => {
	queryModelsList()
})

function compilerConfig(val: any){
	const { modelInfo, modelTypeInfo } = val
	if (!modelInfo || !modelTypeInfo) return;
	maxModelTokens.value = modelInfo.maxModelTokens
	maxResponseTokens.value = modelInfo.maxResponseTokens
	topN.value = modelInfo.topN
	systemMessage.value = modelInfo.systemMessage
	model.value = `${modelTypeInfo.val}----${modelInfo.model}`
	maxRounds.value = modelInfo.maxRounds
	rounds.value = modelInfo.rounds > modelInfo.maxRounds ? modelInfo.maxRounds :  modelInfo.rounds
}

/* 应用只可以使用openai模型 */
const options = computed(() => {
	const data = !activeGroupAppId.value ?  modelTypeListCache : modelTypeListCache.filter( (item: any) => Number(item.val) === 1 )
	return data.map((item: any) => {
			const { label, val } = item
			return {
				label,
				value: val,
				children: modelMapsCache[val].map((item: any) => {
					const { model, modelName } = item
					return {
						label: modelName,
						value: `${val}----${model}`
					}
				})
			}
		})
})


async function queryModelsList() {
	try {
		const res: any = await fetchQueryModelsListAPI()
		if (!res.success) return
		const { modelMaps, modelTypeList } = res.data
		modelMapsCache = modelMaps
		modelTypeListCache = modelTypeList
		// options.value = modelTypeList.map((item: any) => {
		// 	const { label, val } = item
		// 	return {
		// 		label,
		// 		value: val,
		// 		children: modelMaps[val].map((item: any) => {
		// 			const { model, modelName } = item
		// 			return {
		// 				label: modelName,
		// 				value: `${val}----${model}`
		// 			}
		// 		})
		// 	}
		// })
		modelTypes.value = modelTypeList;
		// const typeValue = modelTypes.value[0].val
		/* 设置默认为第一项 使用 ---- 分割  前面是 模型类型 后面是模型的名称  */
		// model.value = `${modelTypes.value[0].val}----${modelMaps[typeValue][0].model}`
	} catch (error) {
		console.log('error: ', error);
	}
}

function openDialog() {
	queryModelsList()
}

async function handleReset() {
	const config = chatStore.baseConfig
	compilerConfig(config)
}

function handleUpdate(val: any) {
	showResetBtn.value = val.includes('1')
}

/* 获取模型的单项信息 */
function getModelTypeInfo(type: any) {
	return modelTypeListCache.find((item: any) => item.val === type)
}

/* 获取模型名称 */
function getModelDetailInfo(type: any, model: any) {
	return modelMapsCache[type].find((item: any) => item.model === model);
}


/* 修改对话组模型配置 */
async function handleUpdateConfig() {
	const [type, m] = model.value.split('----')
	const { maxModelTokens } = activeConfig.value.modelInfo
	const selectModelInfo = getModelDetailInfo(type, m)
	const { modelName, deductType, deduct, maxRounds } = selectModelInfo
	const config = {
		modelInfo: {
			keyType: type,
			modelName,
			model: m,
			maxModelTokens: maxModelTokens,
			maxResponseTokens: maxResponseTokens.value,
			systemMessage: systemMessage?.value,
			topN: topN.value,
			deductType,
			deduct,
			maxRounds,
			rounds: rounds.value
		},
		modelTypeInfo: getModelTypeInfo(type)
	}

	const params = {
		groupId: chatGroupId.value,
		config: JSON.stringify(config)
	}

	try {
		loading.value = true
		await fetchUpdateGroupAPI(params)
		loading.value = false
		message.success('修改当前对话组自定义模型配置成功！')
		await chatStore.queryMyGroup()
		useGlobalStore.updateModelDialog(false)
	} catch (error) {
		loading.value = false
	}
}

function renderLabel(option: { value?: string | number; label?: string }) {
	return () => h(NTooltip, { placement: 'bottom', trigger: 'hover' },
		[
			h(
				'template',
				{ slot: 'trigger' },
				h('span', null, option.label)
			),
			h(
				'span',
				null,
				option.label
			)
		]
	);
	// return `prefix ${option.label}`
}

function handleCloseDialog() {
	showResetBtn.value = false
}
</script>

<template>
	<NModal :show="visible" style="width: 90%; max-width: 650px" :on-after-enter="openDialog"
		:on-after-leave="handleCloseDialog">
		<div class="py-3 px-5 bg-white rounded dark:bg-slate-800">
			<div class="absolute top-3 right-3 cursor-pointer" @click="useGlobalStore.updateModelDialog(false)">
				<NIcon size="20" color="#0e7a0d">
					<CloseOutline />
				</NIcon>
			</div>
			<div class="flex font-bold mb-[20px] bg-currentflex items-center ">
				<NIcon size="24" color="#0e7a0d">
					<SettingsOutline />
				</NIcon>

				<span class="ml-[8px] mt-1 text-lg">模型个性化</span>
			</div>

			<div class="flex justify-between items-center mt-6 pb-4">
				<span class="font-bold">模型选用</span>
				<div style="max-width:70%">
					<n-cascader class="w-full" v-model:value="model" placeholder="请选用当前聊天组所需的模型！" expand-trigger="click"
						:options="options" check-strategy="child" :show-path="true" :filterable="false" />
				</div>
			</div>

			<div>
				<div class="pb-1">自定义角色预设</div>
				<n-input v-model:value="systemMessage" type="textarea" :disabled="disabled" placeholder="自定义头部预设、给你的AI预设一个身份、更多有趣的角色请前往「应用广场」..." />
			</div>

			<div class="mt-5 bg-[#fafbfc] px-2 py-2 dark:bg-[#243147]">
				<n-collapse default-expanded-names="" accordion :on-update:expanded-names="handleUpdate">
					<n-collapse-item name="1">
						<template #header>
							<div>
								高级配置
								<span class="text-xs text-neutral-500">（不了解不需要修改）</span>
							</div>
						</template>
						<template #header-extra>
							<div @click.stop="handleReset">
								<NButton text type="error" v-if="showResetBtn">
									重置
								</NButton>
							</div>
						</template>
						<div class="mt-2">
							<div>
								<div class=" w-full flex justify-between">
									<span class="w-[150px]">话题随机性</span>
									<div class="flex w-[200px] items-center">
										<n-slider v-model:value="topN" :step="0.1" :max="maxTemperature" />
										<span class="w-[55px] text-right">
											{{ topN }}
										</span>
									</div>
								</div>
								<div class="mt-2 text-xs text-slate-500 dark:text-slate-400">较高的数值会使同问题每次输出的结果更随机</div>
							</div>
							<div class="mt-4">
								<div class=" w-full flex justify-between">
									<span class="w-[150px]">回复Token数</span>
									<div class="flex w-[200px] items-center">
										<n-slider v-model:value="maxResponseTokens" :step="100" :max="maxModelTokens" />
										<span class="w-[55px] text-right">
											{{ maxResponseTokens }}
										</span>
									</div>
								</div>
								<div class="mt-2 text-xs text-slate-500 dark:text-slate-400">单条回复数，但也会消耗更多的额度</div>
							</div>
							<div class="mt-4">
								<div class=" w-full flex justify-between">
									<span class="w-[150px]">关联上下文数量</span>
									<div class="flex w-[200px] items-center">
										<n-slider v-model:value="rounds" :step="1" :max="maxRounds" />
										<span class="w-[55px] text-right">
											{{ rounds }}
										</span>
									</div>
								</div>
								<div class="mt-2 text-xs text-slate-500 dark:text-slate-400">单条回复数，但也会消耗更多的额度</div>
							</div>
						</div>
					</n-collapse-item>
				</n-collapse>
			</div>
			<div class="mt-4 flex items-center justify-end space-x-4">
				<NButton @click="useGlobalStore.updateModelDialog(false)">
					取消
				</NButton>
				<NButton type="primary" @click="handleUpdateConfig" :loading="loading">
					保存
				</NButton>
			</div>
		</div>
	</NModal>
</template>
