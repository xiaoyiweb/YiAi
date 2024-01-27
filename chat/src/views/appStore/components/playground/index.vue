<script lang="ts" setup>
import type { Ref } from 'vue'
import { computed, defineEmits, ref, watch } from 'vue'
import { NButton, NSpace, useMessage } from 'naive-ui'
import type { Answer, App } from '../helpter'
import { useScroll } from '../../../chat/hooks/useScroll'
import { SvgIcon } from '@/components/common'
import { fetchChatAPIProcess } from '@/api'
import { fetchQueryChatLogByAppIdAPI } from '@/api/chatLog'
import type { ResData } from '@/api/types'
import { useAuthStore } from '@/store'
import emptyImg from '@/assets/images/empty.png'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { copyText } from '@/utils/format'

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom } = useScroll()

const { isMobile } = useBasicLayout()

const authStore = useAuthStore()

const userAvatar = computed(() => authStore.userInfo.avatar)

const sumModel3Count = computed(() => authStore.userBalance.sumModel3Count)

const ms = useMessage()
const customId = ref(10000000)

interface Emit {
  (ev: 'close'): void
}

interface Props {
  app?: App
}
const inputRef = ref<Ref | null>(null)
const firstAnswerRef = ref<Ref | null>(null)
const playgroundTopRef = ref<Ref | null>(null)
const loading = ref(false)
const prompt = ref('')
const answerList = ref<Answer []>([])
const cacheAppAvatar = ref('')

const app = computed(() => props.app as App)
const demoData = computed(() => {
  const data = app.value?.demoData
  if (data)
    return data.split('\n')

  else
    return []
})
const isLoading = computed(() => answerList.value.some(item => item.loading))
const conversationOptions = computed(() => answerList.value.filter(item => item.conversationOptions).map(t => t.conversationOptions ? JSON.parse(t.conversationOptions) : {}))

watch(app, (val) => {
  if (!val || isLoading.value)
    return
  inputRef.value?.focus()

  val.coverImg && (cacheAppAvatar.value = val.coverImg)
  queryAnswerByAppId()
})

async function queryAnswerByAppId() {
  if (!app.value?.id)
    return
  const res: ResData = await fetchQueryChatLogByAppIdAPI({
    appId: app.value?.id,
  })
  answerList.value = res.data.rows.map((t) => {
    t.loading = false
    return t
  }).sort((a, b) => a.id - b.id)
  scrollToBottom()
}

/* 添加一条虚拟对话记录 */
function addMockAnswer() {
  const curId = customId.value
  // answerList.value.unshift({
  answerList.value.push({
    id: curId,
    loading: true,
    appId: app.value?.id ?? 0,
    prompt: prompt.value,
    answer: '思考中...',
  })
  customId.value = customId.value + 1
  return curId
}

/* 实时修改回复内容 */
function updateMockAnswer(id: number, params: { answer?: string; loading?: boolean }) {
  const index = answerList.value.findIndex(item => item.id === id)
  index !== -1 && (answerList.value[index] = {
    ...answerList.value[index],
    ...params,
  })
}

/* 复制文字 */
function coptAnswer(answer: string | undefined) {
  if (!answer)
    return
  copyText({ text: answer as string })
  ms.success('复制成功')
}

/* 续写 */
function handleNext(item: Answer) {
  ms.warning('即将开放、请稍作等待！')
}

function handleReset(item: Answer) {
  const { prompt: curPrompt } = item
  if (!curPrompt)
    return
  prompt.value = curPrompt
  handleRun()
}

/* 生成 */
async function handleRun() {
  inputRef.value?.focus()
  if (!prompt.value || isLoading.value)
    return

  // playgroundTopRef.value?.scrollIntoView({
  //   behavior: 'smooth',
  //   block: 'start',
  // })
  let options: any = { model: 3 }
  if (conversationOptions.value.length > 0) {
    const lastContext = conversationOptions.value[conversationOptions.value.length - 1]
    options = { ...lastContext, ...options }
  }

  const curId = addMockAnswer()
  scrollToBottom()

  const message = prompt.value
  prompt.value = ''
  try {
    const lastText = ''
    const fetchChatAPIOnce = async () => {
      await fetchChatAPIProcess<Chat.ConversationResponse>({
        prompt: message,
        appId: app.value.id,
        options,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target
          const { responseText } = xhr
          const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
          let chunk = responseText
          if (lastIndex !== -1)
            chunk = responseText.substring(lastIndex)
          try {
            const data = JSON.parse(chunk)
            /* 拿到剩余次数额度 */
            const userBanance = data?.detail?.userBanance
            if (userBanance)
              authStore.updateUserBanance(userBanance)
            const t = lastText + (data.text ?? '')
            updateMockAnswer(curId, { answer: t })
            scrollToBottomIfAtBottom()
          }
          catch (error) {
            // TODO 有时候会出现JSON.parse错误
          }
        },
      })

      loading.value = false
    }

    await fetchChatAPIOnce()
  }
  catch (error) {
    if (error?.message)
      updateMockAnswer(curId, { answer: error?.message })
  }

  /* 关闭loading */
  updateMockAnswer(curId, { loading: false })
}

function handleClose() {
  emit('close')
}

function useDemo(demo: string) {
  prompt.value = demo
  handleRun()
}
</script>

<template>
  <div class="w-full h-full ground flex justify-between" :class="[isMobile ? 'flex-col' : '']">
    <div class="ground-left flex flex-col h-full" :class="[isMobile ? 'w-full' : 'w-6/12 border-[#0000000a] border-r dark:border-[#ffffff17]']">
      <div class="ground-left-input select-none">
        <textarea ref="inputRef" v-model="prompt" class="textarea dark:bg-[#18181c]" type="textarea" placeholder="请输入关键词和需求" />
        <div class="ground-left-tips flex justify-between px-3 py-2">
          <div class="text-[#999] text-xs flex items-center">
            <SvgIcon icon="ph:info" class="mr-1" />
            {{ isMobile ? '请合规使用！' : '请您合法合规使用A功能，并自行核查生成内容，相关责任由您自行承拒。' }}
          </div>
          <NButton ghost text size="tiny" @click="prompt = ''">
            <template #icon>
              <SvgIcon icon="carbon:delete" />
            </template>
            清空内容
          </NButton>
        </div>
        <div class="flex py-4 px-4 bg-[#10b9810a]" :class="[isMobile ? 'flex-col' : 'flex-row justify-between']">
          <div class="flex flex-col" :class="[isMobile ? 'mb-3' : 'justify-between']">
            <div class="text-base">
              <b class="font-bold">剩余额度:</b>
              <span class="ml-2 font-bold text-[#5a91fc] cursor-pointer" style=" text-decoration: underline;">{{ sumModel3Count }}积分</span>
            </div>
            <div class="text-[#999] text-sm whitespace-nowrap">
              每次创作消耗1积分额度、每次创作会产生新的内容！
            </div>
          </div>
          <div class="run-btn flex flex-col justify-center items-center rounded-md px-16 py-1 select-none " :class="[isLoading ? 'cursor-not-allowed disabled' : 'cursor-pointer']" @click="handleRun">
            <span class="text-base whitespace-nowrap">立即创作</span>
            <span class="text-xs whitespace-nowrap">消耗1普通积分额度</span>
          </div>
        </div>
      </div>

      <div class="flex-1 mt-4flex flex-col mt-6">
        <span class="font-bold text-[#5a91fc] mb-3">示例需求</span>
        <div class="flex-1 overflow-y-scroll pl-2 pr-5 py-4 " :class="[isMobile ? '' : 'h-[150px]']">
          <div v-for="(item, index) in demoData" :key="index" class="border dark:border-[#ffffff17] px-3 py-1 rounded-md mb-2 flex justify-between items-center cursor-pointer transition hover:border-[#5a91fc] hover:text-[#5a91fc]" @click="useDemo(item)">
            <span class="circle mr-4" />
            <div class="flex-1  select-none text-left">
              {{ item }}
            </div>
            <SvgIcon class="w-6 text-xl" icon="material-symbols:tips-and-updates-outline" />
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-col" :class="[isMobile ? 'w-full' : 'w-6/12']">
      <div class="ground-right-header p-2 flex justify-between items-center">
        <div class="flex items-center px-3 pt-2">
          <span class="w-10 h-10 flex justify-center items-center rounded-md shadow-md mr-5 border border-[#00000014]">
            <img :src="cacheAppAvatar" class="w-6 h-6 mb-1" alt="">
          </span>
          <span class="text-base font-bold">{{ app?.name }} </span>
        </div>
        <span class="w-6 h-6 hover:bg-neutral-100 cursor-pointer flex justify-center items-center " @click="handleClose">
          <SvgIcon class="text-xl" icon="iconamoon:close-bold" />
        </span>
      </div>
      <div v-if="answerList.length" id="scrollRef" ref="scrollRef" class="flex-1 px-5 py-4 overflow-y-scroll">
        <div ref="playgroundTopRef" />
        <div v-for="(item, index) in answerList" :key="item.id" class="mb-8 border rounded-md dark:border-[#ffffff17]" :class="[item.loading ? 'border-[#5a91fc]' : '']">
          <div class="flex p-4 bg-[#f6fcfa] rounded-md dark:bg-[#18181c] max-h-[120px] overflow-hidden">
            <img :src="userAvatar" class="w-6 h-6 mr-3 rounded-full" alt="">
            <div>
              {{ item.prompt }}
            </div>
          </div>
          <div class="flex p-4 border-b-2 border-dotted border-gray-200 dark:border-[#ffffff17] min-h-[80px]">
            <img :src="app.coverImg" class="w-6 h-6 mr-3 rounded-full" alt="">
            <div style="white-space: pre-wrap;">
              {{ item.answer }}
            </div>
          </div>
          <div class="px-4 py-2 flex justify-end">
            <NSpace>
              <NButton size="small" :disabled="item.loading" @click="handleNext(item)">
                智能续写
              </NButton>
              <NButton size="small" :loading="item.loading" @click="handleReset(item)">
                重新创作
              </NButton>
              <NButton size="small" @click="coptAnswer(item.answer)">
                复制文案
              </NButton>
            </NSpace>
          </div>
        </div>
      </div>
      <div v-if="!answerList.length" class="flex-1 px-5 py-4 overflow-y-scroll flex flex-col justify-center items-center">
        <img :src="emptyImg" class="w-24 h-24" alt="">
        <span class="mt-5 text-[#999]">您还没有使用过这个应用呢、快来试试吧！</span>
      </div>
      <div />
    </div>
  </div>
</template>

<style lang="less">
.ground{
	box-sizing: border-box;
 &-left{
	padding: 15px;
	&-input{
		border: 1px solid rgba(0,0,0,.04);
    border-radius: 12px;
		textarea{
			width: 100%;
			height: 180px;
			padding: 10px;
			border: none;
			outline: none;
			overflow: auto;
  		scrollbar-width: thin;
			resize: none;
		}
	}
 }

 .run-btn{
	background: linear-gradient(270deg, #5a91fc 0%, #798db4 100%);
	color: #fff;
	&:hover{
		filter: brightness(1.05);
	}
	&:active{
		filter: brightness(0.95);
	}
 }
}

.disabled{
	filter: brightness(.8) !important;
	&:hover{
		filter: brightness(.8) !important;
	}
}

.circle{
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: #5a91fc;
	flex-shrink: 0;
}
</style>
