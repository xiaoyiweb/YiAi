<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import mdKatex from '@traptitech/markdown-it-katex'
import mila from 'markdown-it-link-attributes'
import hljs from 'highlight.js'
import { NButton, NIcon, NImage } from 'naive-ui'
import { Copy, Delete } from '@icon-park/vue-next'
import { useAppStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { t } from '@/locales'
import { SvgIcon } from '@/components/common'

interface Props {
  inversion?: boolean
  error?: boolean
  text?: string
  loading?: boolean
  asRawText?: boolean
  imageUrl?: string
}

interface Emit {
  (ev: 'regenerate'): void
  (ev: 'delete'): void
  (ev: 'copy'): void
  (ev: 'video'): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const { isMobile } = useBasicLayout()

const textRef = ref<HTMLElement>()

const mdi = new MarkdownIt({
  linkify: true,
  highlight(code, language) {
    const validLang = !!(language && hljs.getLanguage(language))
    if (validLang) {
      const lang = language ?? ''
      return highlightBlock(
        hljs.highlight(code, { language: lang }).value,
        lang
      )
    }
    return highlightBlock(hljs.highlightAuto(code).value, '')
  },
})

mdi.use(mila, { attrs: { target: '_blank', rel: 'noopener' } })
mdi.use(mdKatex, {
  blockClass: 'katexmath-block rounded-md p-[10px]',
  errorColor: ' #cc0000',
})

const wrapClass = computed(() => {
  return [
    'text-wrap',
    'min-w-[20px]',
    'rounded-md',
    isMobile.value ? 'p-2' : 'px-3 py-2',
    props.inversion ? 'bg-[#5A91fc]' : 'bg-[#f4f6f8]',
    props.inversion ? 'text-[#fff]' : 'text-[#000]',
    props.inversion ? 'dark:bg-[#69af6b]' : 'dark:bg-[#1e1e20]',
    props.inversion ? 'message-request' : 'message-reply',
    { 'text-red-500': props.error },
  ]
})

const appStore = useAppStore()

const theme = computed(() => appStore.theme)

const headerStyle = computed(() =>
  appStore.theme === 'dark' ? 'header-2' : 'header-1'
)

const codeStyle = computed(() =>
  appStore.theme === 'dark' ? 'code-2' : 'code-1'
)

const text = computed(() => {
  const value = props.text ?? ''
  if (!props.asRawText) return mdi.render(value)
  return value
})
const imageUrl = computed(() => props.imageUrl)

const isImageUrl = computed(() => {
  if (!imageUrl.value) return false
  return /\.(jpg|jpeg|png|gif)$/i.test(imageUrl.value)
})

function highlightBlock(str: string, lang?: string) {
  return `<pre class="code-block-wrapper ${
    codeStyle.value
  }"><div class="code-block-header ${headerStyle.value}">
      <span class="dot dot-red"></span>
      <span class="dot dot-yellow"></span>
      <span class="dot dot-green"></span>
    <span class="code-block-header__lang">${lang}</span><span class="code-block-header__copy">${t(
    'chat.copyCode'
  )}</span></div><code class="hljs code-block-body ${lang}">${str}</code></pre>`
}
function handleRegenerate() {
  emit('regenerate')
}

function hendleVideo() {
  emit('video')
}

function handleCopy() {
  emit('copy')
}

function handleDelete() {
  emit('delete')
}

defineExpose({ textRef })
</script>

<template>
  <div class="flex flex-col group max-w-full" style="width: auto">
    <div :class="wrapClass" class="w-full" style="width: auto">
      <div ref="textRef" class="leading-relaxed break-words">
        <div v-if="!inversion" class="flex flex-col items-start">
          <div class="w-full">
            <div
              v-if="!asRawText"
              class="w-full markdown-body"
              :class="[{ 'markdown-body-generate': loading }]"
              v-html="text"
            />
            <div v-else class="w-full whitespace-pre-wrap" v-text="text" />
            <!-- <span
            v-if="loading"
            class="dark:text-white w-[4px] h-[10px] block animate-blink"
          /> -->
            <NImage
              v-if="imageUrl && isImageUrl"
              :src="imageUrl"
              :preview-src="imageUrl"
              alt="图片"
              class="h-md rounded-md m-1"
              :style="{ 'max-width': isMobile ? '100%' : '20vw' }"
              style="margin-top: 0.5rem"
            />
          </div>
          <!-- 小易改动：注册掉底部的内容 -->
        </div>
        <div v-else>
          <div class="whitespace-pre-wrap" v-text="text" />
          <NImage
            :src="imageUrl"
            :preview-src="imageUrl"
            alt="图片"
            class="h-md rounded-md m-1"
            :style="{ 'max-width': isMobile ? '100%' : '20vw' }"
            style="margin-top: 0.5rem"
            v-if="imageUrl && isImageUrl"
          />
          <a
            :href="imageUrl"
            target="_blank"
            :class="{ 'file-2': isMobile, 'file-1': !isMobile }"
          >
            <img
              src="@/assets/file.jpeg"
              alt="文件"
              class="h-auto rounded-md mb-1"
              :class="{ 'file-2': isMobile, 'file-1': !isMobile }"
              v-if="imageUrl && !isImageUrl"
            />
          </a>
        </div>
      </div>
    </div>
    <div
      class="flex opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-gray-700"
    >
      <div v-if="!inversion">
        <div class="mt-1 flex">
          <button
            class="flex ml-0 items-center text-gray-400 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-400 mx-1"
            text
            type="primary"
            @click="handleCopy"
          >
            <SvgIcon class="flex h-3 w-3 mx-1" icon="tabler:copy" />
            <span class="flex text-xs">复制</span>
          </button>

          <button
            class="flex ml-0 items-center text-gray-400 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-400 mx-1"
            text
            type="primary"
            @click="handleRegenerate"
          >
            <SvgIcon class="flex h-3 w-3 mx-1" icon="clarity:refresh-line" />
            <span class="flex text-xs">重新生成</span>
          </button>

          <button
            class="flex ml-0 items-center text-gray-400 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-400 mx-1"
            text
            type="primary"
            @click="handleDelete"
          >
            <SvgIcon
              class="flex h-3 w-3 mx-1"
              icon="fluent:delete-48-regular"
            />
            <span class="flex text-xs">删除</span>
          </button>

          <button
            class="flex ml-0 items-center text-gray-400 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-400 mx-1"
            text
            type="primary"
            @click="asRawText = !asRawText"
          >
            <SvgIcon
              class="flex h-3 w-3 mx-1"
              :icon="asRawText ? 'ic:outline-code-off' : 'ic:outline-code'"
            />
            <span class="flex text-xs">{{
              asRawText ? t('chat.preview') : t('chat.showRawText')
            }}</span>
          </button>

          <!-- <button
            class="flex ml-0 items-center text-gray-400 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-400 mx-1"
            text
            type="primary"
            @click="hendleVideo"
          >
            <img src="@/assets/voice.gif" class="flex h-3 w-3 mx-1" />
            <SvgIcon class="flex h-3 w-3 mx-1" icon="ep:video-play" />
            <span class="flex text-xs">播放</span>
          </button> -->
        </div>
      </div>

      <div v-else>
        <div class="mt-1 flex">
          <button
            class="flex ml-0 items-center text-gray-400 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-400 mx-1"
            text
            type="primary"
            @click="handleCopy"
          >
            <SvgIcon class="flex h-3 w-3 mx-1" icon="tabler:copy" />
            <span class="flex text-xs">复制</span>
          </button>
          <button
            class="flex ml-0 items-center text-gray-400 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-400 mx-1"
            text
            type="primary"
            @click="handleDelete"
          >
            <SvgIcon
              class="flex h-3 w-3 mx-1"
              icon="fluent:delete-48-regular"
            />
            <span class="flex text-xs">删除</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less">
@import url(./style.less);
.dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-red {
  position: absolute;
  left: 1rem;
  background-color: #ff5f56;
}

.dot-yellow {
  position: absolute;
  left: 2rem;
  background-color: #ffbd2e;
}

.dot-green {
  position: absolute;
  left: 3rem;
  background-color: #27c93f;
}

.code-block-wrapper {
  padding-top: 30px !important;
}

.header-1 {
  background-color: #fff !important;
  border-bottom: 1px solid #e3e8f7 !important;
  height: 30px !important;
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
}

.header-2 {
  background-color: #30343f !important;
  border-bottom: 1px solid #3d3d3f !important;
  height: 30px !important;
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
}

.code-1 {
  border: 1px solid #e3e8f7 !important;
}

.code-2 {
  border: 1px solid #3d3d3f !important;
}

html.dark pre code.hljs {
  padding: 0 !important;
}

.file-1 {
  display: inline;
  margin-top: 0.5rem;
  width: 120px;
  height: 150px;
}
.file-2 {
  display: inline;
  margin-top: 0.5rem;
  width: 90px;
  height: 120px;
}
</style>
