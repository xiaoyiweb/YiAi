<script setup lang="ts">
import type { Ref } from 'vue'
import { onMounted, onUpdated, ref } from 'vue'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'
import { NButton, NButtonGroup, NInput, useMessage } from 'naive-ui'
import { saveAs } from 'file-saver'
import * as htmlToImage from 'html-to-image'
import domtoimage from 'dom-to-image'
import { SvgIcon } from '@/components/common'
import { useAuthStore, useGlobalStoreWithOut } from '@/store'

import { fetchGetchatMindApi } from '@/api/index'

const authStore = useAuthStore()
const useGlobalStore = useGlobalStoreWithOut()
const ms = useMessage()

const mindDefaultData = authStore.globalConfig?.mindDefaultData

const inputRef = ref<Ref | null>(null)
const transformer = new Transformer()

const loading = ref(false)

const demoData = `
# 会议流程

## 开场白
- 欢迎词
- 自我介绍

## 议程安排
- 介绍会议议程
- 确认议程是否被所有人接受

## 上一次会议的总结
- 回顾上次会议的议题及结果
- 确认上次会议的行动项是否已经完成

## 主题讨论
- 提出本次会议的主题
- 介绍主题相关背景信息
- 提出问题并进行讨论
- 形成共识或决策

## 行动项
- 确定行动项及责任人
- 确定完成时间和目标

## 公告和其他事项
- 公告即将到来的活动或项目
- 公告公司的其他事项

## 结束语
- 感谢所有人的参与
- 总结会议内容
- 确认下一次会议的时间和议题
`

const prompt = ref('')
const initValue = `# NineAi
## 基础功能
- 支持AI聊天
- 支持GPT4
- 支持DLLAE2
- 支持Midjourney
- 更多功能等你探索......

## 更多内容
-  在上面输入您想要生成的内容
- 点击生成即可

`
const svgRef = ref()
const value = ref('')
function init() {
  value.value = mindDefaultData || initValue
}

onMounted(() => {
  setTimeout(() => {
    init()
  }, 1000)
})

let mm: Markmap

function exportSVG() {
  const svgData = new XMLSerializer().serializeToString(svgRef.value)
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  saveAs(blob, 'nineai-mind.svg')
}
async function exportHTML() {
  const dataUrl = await domtoimage.toSvg(svgRef.value)
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Markmap Export</title>
</head>
<body>
  ${dataUrl}
</body>
</html>`
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  saveAs(blob, 'nineai-mind.html')
}

async function chatmind() {
  loading.value = true
  value.value = ''
  try {
    const lastText = ''
    let cacheText = ''

    const syncData = () => {
      value.value = cacheText
      if (!loading.value) {
        value.value = cacheText
        return false
      }
      else {
        return true
      }
    }

    const timerId = setInterval(() => {
      if (!syncData())
        clearInterval(timerId)
    }, 1000)

    const fetchChatAPIOnce = async () => {
      await fetchGetchatMindApi<Chat.ConversationResponse>({
        prompt: prompt.value,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target
          const { responseText } = xhr
          const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
          let chunk = responseText
          if (lastIndex !== -1)
            chunk = responseText.substring(lastIndex)
          try {
            const data = JSON.parse(chunk)
            cacheText = lastText + (data.text ?? '')
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
  catch (error: any) {
    loading.value = false
    const { code = 500, message = '好像出错了，请稍后再试！' } = error
    if (code === 429 && message.includes('balance has been exhausted'))
      return ms.error('当前系统Key余额耗尽、请联系管理员补充！')

    if (code === 500) {
      let errorMessage = error?.message ?? '好像出错了，请稍后再试！'
      if (errorMessage === 'Request failed with status code 401')
        errorMessage = '非法操作、请先登录后再进行问答使用！'
      ms.error(errorMessage)
      return
    }
    if (error.code === 402) {
      ms.error(error.message, { duration: 5000 })
      useGlobalStore.updateGoodsDialog(true)
      return
    }
    ms.error('出了点小错误、请稍后试试吧！')
  }
  finally {
    loading.value = false
  }
}

async function exportPNG() {
  const dataUrl = await htmlToImage.toPng(svgRef.value)
  saveAs(dataUrl, 'markmap.png')
}

function handleUseDemo() {
  value.value = demoData
}

const update = () => {
  const { root } = transformer.transform(value.value)
  mm.setData(root)
  mm.fit()
}

onMounted(() => {
  mm = Markmap.create(svgRef.value)
  update()
  // if (inputRef.value)
  //   inputRef.value?.focus()
})

onUpdated(update)
</script>

<template>
  <div class="flex grow flex-col sm:flex-row h-full">
    <div class="sm:pt-4 box-border bg-[#fafbfc]  dark:bg-[#18181c] overflow-y-auto w-full sm:w-[20rem] shrink-0 border-r-2 border-[#ffffff17] flex flex-col ">
      <div class="flex-1 px-4 pb-2 ">
        <!-- <h2 class="text-2xl font-bold mb-5">
          思维导图
        </h2> -->
        <h4 class=" mb-2">
          您的需求？
        </h4>
        <NInput
          ref="inputRef"
          v-model:value="prompt"
          type="textarea"
          :disabled="loading"
          :autosize="{
            minRows: 3,
          }"
          placeholder="请输入您想要生成内容的简单描述、AI将为您输出一份完整的markdown内容及其思维导图!"
        />
        <div class="flex my-4">
          <NButton type="primary" size="small" style="width: 100%" :loading="loading" @click="chatmind">
            智能生成生成思维导图
          </NButton>
        </div>
        <div class="flex justify-between mb-2">
          <h4 class="font-bold">
            内容需求
          </h4>
          <NButton text @click="handleUseDemo">
            试试示例
          </NButton>
        </div>
        <NInput
          v-model:value="value"
          type="textarea"
          :disabled="loading"
          :autosize="{
            minRows: 8,
            maxRows: 24,
          }"
          placeholder="请用markdown语法输入您想要生成思维导图的内容或在上方使用描述让AI帮您完善！"
        />
      </div>
      <div class="py-3 bottom-0 border-t-2 border-[#00000014] w-full flex flex-col justify-center items-center">
        <div class="items-start mb-2">
          每次使用消耗基础积分： 1
        </div>
        <div>
          <NButtonGroup size="small">
            <NButton type="primary" @click="exportHTML">
              <SvgIcon icon="ri:error-warning-line" class="text-base" />
              导出HTML
            </NButton>
            <NButton type="primary" @click="exportPNG">
              <SvgIcon icon="ri:error-warning-line" class="text-base" />
              导出PNG
            </NButton>
            <NButton type="warning" @click="exportSVG">
              <SvgIcon icon="ri:error-warning-line" class="text-base" />
              导出SVG
            </NButton>
          </NButtonGroup>
        </div>
      </div>
    </div>
    <div class="h-full flex-1 overflow-y-auto overflow-hidden min-h-[80vh] flex flex-col">
			<header class="flex items-center p-5">
				<h2 class="font-bold text-2xl">思维导图</h2>
			</header>
			<div class="flex-1 w-full p-4 ">
				<svg ref="svgRef" class="box-border  w-full h-full border rounded-md " />
			</div>
    </div>
  </div>
</template>
