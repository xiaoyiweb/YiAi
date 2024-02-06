<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  NButton,
  NInput,
  NInputNumber,
  NScrollbar,
  NSelect,
  NSpace,
  NSwitch,
  NTooltip,
  useDialog,
  useMessage,
} from 'naive-ui';
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';
import cardItem from './components/cardItem.vue';
import { useBasicLayout } from '@/hooks/useBasicLayout';
import { SvgIcon } from '@/components/common';
import nijiImg from '@/assets/images/niji.png';
import mjImg from '@/assets/images/mj.png';
import {
  fetchMidjourneyDrawList,
  fetchMidjourneyFullPrompt,
  fetchMidjourneyPromptList,
} from '@/api';
import { fetchDrawTaskAPI, fetchTranslateAPI } from '@/api/mjDraw';
import type { ResData } from '@/api/types';
import {
  fetchGetMjPromptAssociateApi,
  fetchGetMjPromptFanyiApi,
} from '@/api/index';
import Loading from '@/components/base/Loading.vue';
import { useAppStore, useAuthStore } from '@/store';
import marketImg from '@/assets/market.png';

interface PromptItem {
  status: boolean;
  title: string;
  isCarryParams: boolean;
}

const containerRef = ref<HTMLElement | null>(null);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const isLogin = computed(() => authStore.isLogin);
const userBalance = computed(() => authStore.userBalance);
const sumDrawMjCount = computed(() => {
  return userBalance.value.sumDrawMjCount || 0;
});
const appStore = useAppStore();

const theme = computed(() => appStore.theme);
const loadingTextColor = computed(() =>
  theme.value === 'dark' ? '#fff' : '#000'
);
const ms = useMessage();
const dialog = useDialog();
const { isMobile } = useBasicLayout();
const uploadUrl = ref(`${import.meta.env.VITE_GLOB_API_URL}/upload/file`);
let isLoopIn = false;
let timer: any = null;
const aspect = ref('9:16');
const model = ref('MJ');
const version = ref('6.0');
const style = ref(0);
const quality = ref('1');
const stylize = ref(100);
const chaos = ref(0);
const prompt = ref('');
const noPrompt = ref('');
const drawList: any = ref([]);
const countQueue = ref(0);
const refreshLoading = ref(false);
const associateLoading = ref(false);
const translateLoading = ref(false);
const promptList = ref<PromptItem[]>([]);
const size = ref(12);
const nextOpenCarryOptions = ref(true); // 下次打开自动携带参数
const totalCount = ref(0);
const carryOptions = ref(1);
const submitDisabled = computed(() => {
  return (
    !prompt.value ||
    associateLoading.value ||
    translateLoading.value ||
    translateNoLoading.value
  );
});

const dataBase64 = ref('');
let curFile: File | null;

watch(isLogin, async (newVal, oldVal) => {
  if (newVal && !oldVal) await queryDrawResult();
});

const isMore = computed(() => totalCount.value > size.value);

const sizeList = [
  { aspect: '1:1', width: '100%', height: '100%' },
  { aspect: '4:3', width: '100%', height: '75%' },
  { aspect: '3:4', width: '75%', height: '100%' },
  { aspect: '16:9', width: '100%', height: '57%' },
  { aspect: '9:16', width: '57%', height: '100%' },
];

const styleOptions = [
  { label: '默认风格', value: 0 },
  { label: '表现力风格', value: 'expressive' },
  { label: '可爱风格', value: 'cute' },
  { label: '景观风格', value: 'scenic' },
];

const qualityOptions = [
  { label: '普通', value: '.25' },
  { label: '一般', value: '.5' },
  { label: '高清', value: '1' },
  { label: '超高清', value: '2' },
];

const versionOptions = computed(() => {
  if (model.value === 'MJ') {
    return [
      { label: '6.0', value: '6.0' },
      { label: '5.2', value: '5.2' },
      { label: '5.1', value: '5.1' },
      { label: '5', value: '5' },
      { label: '4', value: '4' },
    ];
  }
  if (model.value === 'NIJI') {
    return [
      { label: '6', value: '6' },
      { label: '5', value: '5' },
      { label: '4', value: '4' },
    ];
  }
  return [];
});

const modelList = [
  { name: 'MJ', img: mjImg, val: 'mj' },
  { name: 'NIJI', img: nijiImg, val: 'niji' },
];

const activeAspect = computed(() => (item: string) => {
  return aspect.value === item;
});

const activeModel = computed(() => (item: string) => {
  return model.value === item;
});

function handleFileSelect(event: any) {
  const file = event?.target?.files[0];
  handleSetFile(file);
}

function handleDrop(event: any) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  handleSetFile(file);
}

async function handleSetFile(file: File) {
  curFile = file;
  const reader = new FileReader();
  reader.onload = (event: any) => {
    dataBase64.value = event.target?.result as string;
  };
  reader.readAsDataURL(file);
}

async function hanleQueryPrompts() {
  const res: any = await fetchMidjourneyPromptList();
  promptList.value = res.data.filter((item: any) => item.status);
}

async function queryAllDrawList() {
  const res: ResData = await fetchMidjourneyDrawList({
    page: 1,
    size: size.value,
  });
  const { rows, countQueue: queueCount, count } = res.data;
  drawList.value = rows || [];
  totalCount.value = count;
  countQueue.value = queueCount || 0;
}

async function drawLike() {
  const id = route.query.mjId;
  if (!id) return;
  const res: ResData = await fetchMidjourneyFullPrompt({ id });
  if (!res.success) return;
  prompt.value = res.data;
  carryOptions.value = 0;
  nextOpenCarryOptions.value = true;
}

/* 翻译prompt */
async function handleFanyiPrompt() {
  if (!prompt.value) return ms.warning('请输入描述词！');
  translateLoading.value = true;
  try {
    const Interface =
      Number(authStore.globalConfig.mjUseBaiduFy) === 1
        ? fetchTranslateAPI
        : fetchGetMjPromptFanyiApi;
    const params: any =
      Number(authStore.globalConfig.mjUseBaiduFy) === 1
        ? { text: prompt.value }
        : { prompt: prompt.value };
    const res: ResData = await Interface(params);
    if (!res.success) return ms.error('翻译失败了！');
    prompt.value = res.data;
    translateLoading.value = false;
  } catch (error) {
    translateLoading.value = false;
  }
}
const translateNoLoading = ref(false);
/* 翻译不需要的元素 */
async function handleFanyiNoPrompt() {
  if (!noPrompt.value) return ms.warning('请输入描述词！');
  translateNoLoading.value = true;
  try {
    const Interface =
      Number(authStore.globalConfig.mjUseBaiduFy) === 1
        ? fetchTranslateAPI
        : fetchGetMjPromptFanyiApi;
    const params: any =
      Number(authStore.globalConfig.mjUseBaiduFy) === 1
        ? { text: noPrompt.value }
        : { prompt: noPrompt.value };
    const res: ResData = await Interface(params);
    if (!res.success) return ms.error('翻译失败了！');
    noPrompt.value = res.data;
    translateNoLoading.value = false;
  } catch (error) {
    translateNoLoading.value = false;
  }
}

/* 联想描述词 */
async function handleAssociatePrompt() {
  if (!prompt.value) return ms.warning('请输入描述词！');
  associateLoading.value = true;
  try {
    const res: ResData = await fetchGetMjPromptAssociateApi({
      prompt: prompt.value,
    });
    if (!res.success) return ms.error('联想失败了');
    prompt.value = res.data;
    associateLoading.value = false;
  } catch (error) {
    associateLoading.value = false;
  }
}

/* 检测是否需要翻译 */
function hasChinese(str: string) {
  const reg = /[\u4E00-\u9FA5]/g;
  return reg.test(str);
}

/* 移除用户自己的指令 */
function removeParameters(str: string) {
  const regex = /--\w+\s\S+/g;
  return str.replace(regex, '');
}

/* 格式化绘画参数 */
function formatParams() {
  if (!carryOptions.value) return '';
  let formatPropmpt = '';
  /* 不需要的内容 */
  noPrompt.value && (formatPropmpt += ` --no ${noPrompt.value}`);
  /* 模型+版本 */
  if (model.value === 'MJ' && version.value) {
    formatPropmpt += ` --v ${version.value}`;
    formatPropmpt += ` --s ${stylize.value}`;
  }
  if (model.value === 'NIJI' && version.value) {
    formatPropmpt += ` --niji ${version.value}`;
    /* niji5 拥有的风格 */
    style.value && (formatPropmpt += ` --style ${style.value}`);
  }
  /* 尺寸 */
  formatPropmpt += ` --ar ${aspect.value}`;
  /* chaos (混乱) */
  formatPropmpt += ` --c ${chaos.value}`;
  /* quality */
  formatPropmpt += ` --q ${quality.value}`;
  return formatPropmpt;
}

/* 上传图片 */
async function uploadImg() {
  const form = new FormData();
  curFile && form.append('file', curFile);
  const res = await axios.post(uploadUrl.value, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.data?.data;
}

/* 修改提示词 */
function handleSelectPrompt(item: any) {
  const { prompt: text, aspect: size, isCarryParams } = item;
  prompt.value = text;
  size && (aspect.value = size);
  carryOptions.value = isCarryParams ? 1 : 0;
}

function checkHasChinese() {
  const isHasPromptChinese = hasChinese(prompt.value);
  const isHasNoPromptChinese = hasChinese(noPrompt.value);
  if (isHasPromptChinese || isHasNoPromptChinese) {
    const d = dialog.warning({
      title: '温馨提示',
      content:
        '您的提示词中包含中文、绘画AI可能无法识别您的中文、我们建议您翻译后进行绘画得到更准确的结果、请问需要翻译后提交么？',
      positiveText: '翻译提示词',
      negativeText: '不需要',
      onPositiveClick: async () => {
        d.loading = true;
        const task = [];
        isHasPromptChinese && task.push(handleFanyiPrompt());
        isHasNoPromptChinese && task.push(handleFanyiNoPrompt());
        await Promise.all(task);
        handleSubmit();
      },
      onNegativeClick: () => {
        handleSubmit();
      },
    });
  } else {
    handleSubmit();
  }
}

/* 提交绘制任务|图生图 */
async function handleSubmit() {
  let imgUrl = '';
  if (dataBase64.value || curFile) imgUrl = await uploadImg();

  const extraParam = formatParams();

  /* 如果使用我们的参数 则去掉用户自己的 */
  if (carryOptions.value) prompt.value = removeParameters(prompt.value);

  await fetchDrawTaskAPI({
    prompt: prompt.value,
    imgUrl,
    extraParam,
    action: 'IMAGINE',
  });
  curFile && (curFile = null);
  dataBase64.value = '';
  if (nextOpenCarryOptions.value) {
    carryOptions.value = 1;
    nextOpenCarryOptions.value = false;
  }
  ms.success('提交绘制任务成功、请等待绘制结束！');
  if (authStore.token) await refreshUserInfo();

  !isLoopIn && queryDrawResult();
}

/* 轮询查询结果 */
async function queryDrawResult() {
  isLoopIn = true;
  const res: ResData = await fetchMidjourneyDrawList({
    page: 1,
    size: size.value,
  });
  const { rows, countQueue: queueCount, count } = res.data;
  drawList.value = rows || [];
  totalCount.value = count;
  countQueue.value = queueCount || 0;
  const curDrawTask = drawList.value.filter((item: any) =>
    [1, 2].includes(item.status)
  );
  if (curDrawTask.length) timer = setTimeout(() => queryDrawResult(), 3000);
  else isLoopIn = false;
}

onBeforeUnmount(() => {
  clearTimeout(timer);
});

/* 当前绘制中的任务 */
const curDrawTask = computed(() => {
  return drawList.value.filter((item: any) => [1, 2].includes(item.status));
});

/* 前往市场 */
function readMore() {
  router.push('/market');
}

// /* 复制 */
// function usePrompt(item: any) {
//   const { fullPrompt } = item;
//   carryOptions.value = 0;
//   prompt.value = fullPrompt;
//   nextOpenCarryOptions.value = true;
//   // copyText({ text: fullPrompt })
//   // ms.success('复制prompt完成！')
// }

function setModel(name: string) {
  model.value = name;
  if (name === 'MJ') version.value = '6.0';

  if (name === 'NIJI') version.value = '6';
}

async function refreshUserInfo() {
  refreshLoading.value = true;
  try {
    await authStore.getUserInfo();
    refreshLoading.value = false;
  } catch (error) {
    refreshLoading.value = false;
  }
}

onMounted(() => {
  queryDrawResult();
  drawLike();
  hanleQueryPrompts();
  const container: any = document.getElementById('footer');
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (isMore.value) {
          size.value = size.value + 12;
          queryAllDrawList();
        }
      }
    });
  });
  observer.observe(container);
});
</script>

<template>
  <div class="grow flex h-screen flex-col lg:pt-0">
    <div class="flex grow flex-col sm:flex-row h-full">
      <div
        class="p-4 sm:pt-6 bg-[#f8f8f8] p-4 dark:bg-[#18181c] overflow-y-auto w-full sm:w-[20rem] shrink-0 border-r-2 border-[#ffffff17]"
      >
        <div class="mt-4 text-sm flex items-center">
          <div class="text-sm mr-1">图片尺寸</div>

          <div data-tool-target="tooltip-default">
            <NTooltip placement="right-end" trigger="hover">
              <template #trigger>
                <SvgIcon icon="ri:error-warning-line" class="text-base" />
              </template>
              参数释义：生成图片尺寸比例
            </NTooltip>
          </div>
        </div>
        <div
          class="flex mt-2 py-1 pb-2 space-x-1 overflow-x-auto justify-between scrollbar-none"
        >
          <button
            v-for="(item, index) in sizeList"
            :key="index"
            class="flex-1 p-[2px] rounded-md"
            @click="aspect = item.aspect"
          >
            <div
              class="border-2 border-gray-300 box-borde rounded-md dark:bg-black flex flex-col items-center"
              :class="[
                activeAspect(item.aspect) ? 'aspect-active' : '',
                isMobile ? 'py-3' : 'py-2',
              ]"
            >
              <div class="flex items-center justify-center w-6 h-6">
                <div
                  class="border-gray-300 rounded border-2"
                  :class="[activeAspect(item.aspect) ? 'aspect-active' : '']"
                  :style="{ width: item.width, height: item.height }"
                />
              </div>
              <div class="mt-2 text-center text-xs leading-none text-current">
                {{ item.aspect }}
              </div>
            </div>
          </button>
        </div>

        <!-- 模型 -->
        <div class="mt-4 text-sm flex items-center">
          <div class="mr-1">模型选择</div>
          <div data-tool-target="tooltip-default">
            <NTooltip placement="right-end" trigger="hover">
              <template #trigger>
                <SvgIcon icon="ri:error-warning-line" class="text-base" />
              </template>
              <div style="width: 240px">
                <p>MJ: 偏真实通用模型</p>
                <p>NIJI: 偏动漫风格、适用于二次元模型</p>
              </div>
            </NTooltip>
          </div>
        </div>
        <ul class="mt-2 flex justify-between">
          <li
            v-for="(item, index) in modelList"
            :key="index"
            class="flex border-[3px] border-transparent justify-center items-center rounded-md m-1 m-bg-gradient"
            :class="[activeModel(item.name) ? 'model-active' : '']"
            @click="setModel(item.name)"
          >
            <button
              class="relative w-full h-full dark:bg-black rounded"
              type="button"
            >
              <div
                class="absolute w-full h-full flex justify-center items-center"
              >
                <div
                  class="text-2xl text-white font-bold absolute left-5 top-1"
                >
                  {{ item.name }}
                </div>
              </div>
              <img
                :src="item.img"
                class="rounded aspect-[3/1] w-full object-cover"
              />
            </button>
          </li>
        </ul>
        <div class="mt-4">
          <div class="mt-2 flex justify-between items-center space-x-2 text-xs">
            <span class="w-[65px] block text-sm">版本</span>
            <span class="flex-1">
              <NSelect
                v-model:value="version"
                size="small"
                :options="versionOptions"
              />
            </span>
          </div>
          <div
            v-if="model === 'NIJI'"
            class="mt-2 flex justify-between items-center space-x-2 text-xs"
          >
            <span class="w-[65px] block text-sm">风格</span>
            <span class="flex-1">
              <NSelect
                v-model:value="style"
                size="small"
                :options="styleOptions"
              />
            </span>
          </div>
          <!-- <div class="block text-sm mt-2 flex items-center">
            参数
            <NTooltip placement="right-end" trigger="hover">
              <template #trigger>
                <SvgIcon icon="ri:error-warning-line" class="text-base ml-2" />
              </template>
              <div style="width: 240px">
                <p>合理使用参数绘制更为理想的结果！</p>
              </div>
            </NTooltip>
          </div> -->
          <div class="mt-3 flex justify-between items-center space-x-2 text-xs">
            <span class="w-[65px] block text-sm">品质</span>
            <span class="flex-1">
              <NSelect
                v-model:value="quality"
                size="small"
                :options="qualityOptions"
              />
            </span>
          </div>
          <div class="mt-3 flex justify-between items-center space-x-2 text-xs">
            <span class="w-[65px] block text-sm">混乱</span>
            <span class="flex-1">
              <NInputNumber
                v-model:value="chaos"
                :min="0"
                :max="100"
                size="small"
              />
            </span>
            <NTooltip placement="right-end" trigger="hover">
              <template #trigger>
                <SvgIcon icon="ri:error-warning-line" class="text-base ml-2" />
              </template>
              <div style="width: 270px">
                <p>取值范围：0-100、 --chaos 或 --c</p>
                <p>混乱级别，可以理解为让AI天马行空的空间</p>
                <p>值越小越可靠、默认0最为精准</p>
              </div>
            </NTooltip>
          </div>

          <div
            v-if="model === 'MJ'"
            class="mt-3 flex justify-between items-center space-x-2 text-xs"
          >
            <span class="w-[65px] block text-sm">风格化</span>
            <span class="flex-1">
              <NInputNumber
                v-model:value="stylize"
                :min="0"
                :max="1000"
                size="small"
              />
            </span>
            <NTooltip placement="right-end" trigger="hover">
              <template #trigger>
                <SvgIcon icon="ri:error-warning-line" class="text-base ml-2" />
              </template>
              <div style="width: 270px">
                <p>风格化：--stylize 或 --s，范围 1-1000</p>
                <p>参数释义：数值越高，画面表现也会更具丰富性和艺术性</p>
              </div>
            </NTooltip>
          </div>

          <!-- <div class="block text-sm mt-2 flex items-center">设定</div> -->
          <div class="mt-3 flex justify-between items-center space-x-2 text-xs">
            <span class="w-[65px] block text-sm">携带参数</span>
            <span class="flex-1">
              <NSwitch
                v-model:value="carryOptions"
                size="small"
                :checked-value="1"
                :unchecked-value="0"
              />
            </span>
            <NTooltip placement="right-end" trigger="hover">
              <template #trigger>
                <SvgIcon icon="ri:error-warning-line" class="text-base ml-2" />
              </template>
              <div style="width: 240px">
                <p>是否自动携带参数</p>
                <p>打开：携带上述我们配置的参数</p>
                <p>关闭：使用指令中的我们自定义的参数</p>
              </div>
            </NTooltip>
          </div>
        </div>

        <div class="mt-5">
          <div class="block text-base">以图生图</div>
          <div class="ant-spin-nested-loading css-4fssqp mt-5">
            <div class="ant-spin-container">
              <div
                class="mt-2 flex justify-center items-center dark:bg-black p-5 rounded-md"
              >
                <label v-if="!dataBase64" for="upload-file">
                  <div
                    class="upload cursor-pointer"
                    @dragover.prevent
                    @dragenter.prevent
                    @dragleave.prevent
                    @drop="handleDrop"
                  >
                    <input
                      id="upload-file"
                      type="file"
                      accept=".png, .jpg, .jpeg"
                      style="display: none"
                      @change="handleFileSelect($event)"
                    />
                    <div class="upload-container">
                      <img
                        class="mx-auto py-2 w-11"
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAABkCAMAAACb6dMUAAAC91BMVEUAAACqbeO0bd6ubeG6bdubbOzMbdLTbc6sbeLJbdOxbeCQbPHUbc7ObdGMbPO7bdutbeKUbO+pbOS5bdyGbPaZbOyrbOPVbc2MbPOWbO6xbeCWbO7LbdKWbO7Tbc+jbOezbd+PbPKfbOnUbc3LbdKMbPOIbPW7bdvNbdGibOjHbdWFbPffbcixbeDDbdbhbce1bd6IbPWsbOKHbPbdbcmpbOSebOrdbcmLbPS9bdrZbcvAbdiSbPDWbc3ZbcuJbPXSbc7ZbcvfbciUbO+KbPTZbcuFbPeabOySbPCIbPWUbO+IbPXQbdCgbOmLbPPebciRbPHdbcnGbdXabcqlbOaKbPSXbO2mbOa2bd3KbdO7bdrUbc7MbdHebcmXbO3IbdTebcnVbc2dbOqYbO3QbdCKbPSkbOevbeHgbceIbPa8bdrEbdbMbdKrbOOXbO3QbdDebcjDbdeQbPG3bd2WbO7IbdTBbdiLbPOJbPXJbdOXbO2QbPHabcqobOSfbOmvbeGNbPPCbdfTbc7bbcqzbd+fbOmObPLNbdGobOSSbPC+bdm4bdzabcuVbO+dbOrZbcvUbc2ibOjdbcnSbc/ebcm8bdq3bdy1bd7PbdDWbc2bbOvgbceibOiGbPbSbc/NbdGQbPHZbcvObdGibOjdbcmKbPSzbd+qbOOubeGtbeKRbPGJbPWYbO2tbeG7bduubeGjbOekbOembObZbcutbeHDbdeqbOTEbda4bdyFbPekbOakbOa3bdyybd+wbeDgbciHbPWJbPTNbdG0bd7PbdDdbcmZbOyTbO+GbPeXbO2VbO6EbPezbd6vbeGnbOWMbPONbPKebOnbbcnXbcyPbPGRbPDVbc3LbdKlbOabbOvJbdPZbcqdbOqpbOSsbOK3bd27bdvHbdSqbOOtbeG1bd25bdy8bdrEbdXebcnDbdaWbO6hbOjSbc6+bdnObdDAbdjbbcrKbdOcbOutbeLGbdWjbOe9bdnBbdfZbcvYbcvRbdDTbc7hbcZvJBQJAAAAvXRSTlMACJW6BhofEApsDQsK2BpWFhJ0M+Z0aRTU0aueinZrYFFAKSIcFfj4+NfXz87LxcK+paCRg3x1aF1bPz05NychGPjz597c2NK6r62akIB8dlBKR0Q+Nfn29vLv6ufm3Nzb2NPLyMbDvLq5uLa2r6WlpKORiYSDdW5VT0kwMPv48/Ly8u7p5uHf2tjVzsrDw8C8tLKurqukm5uYlpCPgHRkY11bVk9JQPv7+PTx7+Xf0cy9oZyVjYR6cmNNQmxAszFGAAAHfklEQVRo3sXa9V8TYRzA8S96ujnnZICCoggICBISBgKCCCigImV3dxcCdnd3d3cnYSdidxdid/0g8Tx3t3Fs99xt4/MXvF8X3z33PAPhGZtaHypU1t3Vdaera9ey+0ysTYuAwfM9NH9qi8cvXpw8een48RMnLj9//vXRyJ29TWKNwGBRpgOntHjy8uVjNcejZ88eNp20LFYKhsioZI8fr149ycfx8MqVK11K6/8GUTXd3r/X4rhzx6mhDPQZVdLt40cejjvfnSroUWLa8+dPno7vmV2Ogn6SHxydQeDIHLGsOOgh/54ZGXkc46a6l82qd1fX7XkcmekzEnTPGNb2tZpjx4JjG2yNc19SqbFtbGnPSRtVHenjK+iaUezbaxXH1IG+Uo7BcqDLcLYj/UFD3TIGP1VxzC8py2+6HNnTlO14sESXjHJP2Y75pqAp2ywJ4/jSh9Id4x7LMaUmaCt2N8tx11JXPzkN7jGO0UPsQHvStU6M466ljq7GZ8bhZsp3UTCbcZxZootbs9KRcfTnP6ylyxjHmVLiGUWb36Ydg4Gk6oyjiY1oR9/btOMgkFVhBHacaSN2JbAmlXYMBiCF0I7zIp9VuxK0Yz+QV512nI8U98qmYkdPOQhoCe1oI2aK1HLEjrYSYYvIGdjxtrwIx9xU5GgeDcKyHY8dZYSvRnwcsaMcCK0UdjSJFP7OfkCOynIQXEfkuBAqdKr6O2LHMBBeLHZcaCz0h+UUcvQCMfXBDoEzRD4RORyjRTn8tiFHkL2wFekp5HATuYAIR44Lq4TNMOxYCeKKR46zfUBAkk7I0VwCImuDHJMVgmYpciwCsQ1CjrPxQJ7VKeSIFu3wa4Icg4QMMeSYWFG0w74jcoQCeSWQoxcForNEjiDy3xjzMchRDsRXCjnO2gJpFd8hxxoQX3wT5PADomr7rFn0J9fR3BfEZ7sNOcK9bRS8EVZz24959w45WlUE8SmDkOPmzS2Tw4fyofjsbXnr1q2/jMMOxEe1oR03b9y4McpjvZGW4TUn8Pp1VYc56KCOKo6rV692j9Q0yquO/X1d3SHRhWO6uiPNISwg34sx7f6vPI6JlC4c4XkcaWlm3sBZjbH3ORzlQBfFczhSUiK4HqWq1z5xOHpJQCcN4nKk1M87X5deU3O0LNGpU68VEtBRkX2md5wcpOZI8VC/61VPsx0t+65MtDOXyCnQYcVlSkWCt+UEtiO5vtqzcZrlmGlVG/SXclUoy5G8XGV41WEcIaslZDNqQ2lrGdmFibNgHA6RrEne7g12BC4mnFum7ln72q4bgEwyYBR2JJsxc6RfEnYErgOyrMfl7K+PJN04tpmAHee645cmKol2rCZlNEP7/JtIIY2DsePcYfS9VIV2NCJn4POGTaVJF61bsaOuErKLScKOfkBWyWasc4/NpBBv7LiYe0G6YUeIOSFD7fyFFOKFHc4UAPjXwY7VpFdDzUF6RWzNkCN5ffYkTUKOmYSMSnnOozYSQjyQ46IXgLwbdqwjZHCdi5mQvTPY4WwP/q2Rox1FyOByDCeDdEYOh8YQ9Q85qgJBNfM9JySCDEWOi97QCDuiSBiV8nUQXRE/B+TwgqXI0dqfhKHp3LQa8E5hgRxhMAc5XGoTPBuazm9JINLuyOEMVZCjG+/H1LcFc367YCFyFN7HOr/lD/FAjrrgghzzeP/Qt2DOkd2pashR1siTcfCH1EcOM2KH3RTmPNvdGAohR1eQeTKOpmuJHfi+zAF+DWHO1d1lQDsKS4HyZM7Vd0tJ70s35KgiAV71px09jIHlMAKQetKO8cbAqzD6Oe2H31ue3/X7sWOBDNQcYHQAO5yU/DasnJGjOzPHfHi+LcixkII8DoBqyMHzWD9hKz3H1mFHI74PSI6jkBS4HGCS45jN87Z447k+FBLrIMc04Fl0jx09agJwO+Bo70m7TKTArzDssAF5Ffy7nwjksR3kBTggR10FwFLs6Gdwhxdef3gAQAxeF9bxMbBDEYwc5+IAgHLB69OZlGEdEXidbFY85xub/m5oZFCHnwN25H5rS9phR2CUAR0Bwfj7xUyBNh3o77mxtQzmUHROwY7lgD8s6e/bkIp6d2BGGnY42wMqhnb8CokyiMPGIo12xLF2pWjH78AG5np3KCNGpWGHys6UfB5rX6q9lZ1eHfarLFj7Up3tgZW5C3ufrv3iGImeHDKbARbsfbrgALXjlnaq+5YtZy0avMLKqhjTsNqkjiIVqmdVKrvyOQ0aEBqkum9plgBq+btw7uOmMv/LqRxN5ljrlJ7O/B+Gcx+3LseRv2SvFsfr0b4kjiMj0rU5whTcG+ytNTsy+pM4umRqc3gZAXeJszQ73Agcxk5aHBZxkH81QjQ5ehI4iu/S6AiOUGo+plwxLX9HMQIHNNTgsIgIAG1JYha3H8Pp6E+ROIxmczu2TLBcrwReUbWsGsyd1akEqm3bylm5DZGTvbfShjM6ZFUvuzI5TQ8NHzDUhvBMW25uV5SdjHyeyoqopkQE3cd8Z0uhQBuIHL2hYLNGDhMo2KiFOY7CSijgZAO3jxznaQwi+w+ELPUHv67REwAAAABJRU5ErkJggg=="
                      />
                      <p class="mt-3">点击或拖拽一个图片到这里作为输入</p>
                      <p class="text-center dark:text-[#ffffff73]">
                        支持PNG和JPG格式
                      </p>
                    </div>
                  </div>
                </label>
                <div v-if="dataBase64" class="w-full h-full relative">
                  <img :src="dataBase64" alt="" />
                  <img
                    class="absolute bottom-1 right-1 cursor-pointer"
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAD0klEQVRIiY2WS2xWRRTHf/+ZryimPqLhocEAMbrQqBvYK4G2ArJxw0YxqLSo3bgQceFKo4mJywoYUBFZAilNRKVEN8ZoF2xYoiUhaSISExsVtJxj5n5z+917ez/xTk7uPM+Z8/qf0cnxWQxhru6/ToOOHja02dAGQ+sN3WNIjn4zdNHQjKNpQxcMzTsUPDzzKceaHP+5x7wnbJmhJw2NGtqWxzUGVXL0t6EvDQ5kodebgjqh6OZPgLMK2A+MAreSp0sy6l+eWwY8DYw4HALecZgjC0kyOrGrWG7hfokJwXZ5f+ZV4d01L0ZCAwavAA847AVmy9WQpGVaFbCJgG0PGEFG8a9QrFB9zYk9PolGAn4g4PeV6yF2N90S8X0R357HXVKlX2dUoz5rwwF/M+DLi3GWuCngr7ZstiC/0WTapECxx6p7un3bG/EtpUa3RWw0YgOxbh6P2LGIvR7lc6V2LZe5EvD9Af844jfqZvXkmpcDfnvqPBLwoRYGCwH/IeAfBGwsYL9U/ZYv82ssbm3vR+y7gFmLSZO1Hu9EfEiwXI0wFgwI3hBcEkwK/hIclVidItLgCrAbmAKGgLeAgaURWcwNJR9taEZXhdYE/EjW+OuAvxDw+Sj/M8r3RHwq4psi/mnE1/YLmohvTBqtb9GmQrZC6DOhF4VOCz1nqAM6hTSC6wiE1S2plnl4ytR1CRnubtvUSMyVguOCXYITeW5HNuWd8mrS95otXpfBJEil5AQWTY0qqBCBDm1j5fTvf1klCEoovKbHti4qt6tCe4ROCG1NUCN0UoSdgsOFxsonfKn5DeaTRj8BjzbBs7LpKvB8jq4twOdZk51gU6BnQcdAK7p3F/gSTrMpj2b+A2LmAovR9UTEP4n4XREfjPjhiA9H/KuI74745X7QFfGZhAwpbK/Xw7FIxoWIvRexEwF7KmDHA9YDyQKE/WjAdwR8KuNaj48W+f2TUiOZ7gJwFnxb6ZFutBCAx+jC/j7g3krIl75bKXRQaK3Qg0KdSskh++0bOed1cfz7dGyro0lDsVE5zbrUaSnzVVpI5b15Pp99xtCpsh6dC/hEE6EzKHZuht4RT4kfW+Y/Sq5J/YKJ4JrBu8BDguF6RfU+SdiPQnnwHPA28AeNCpsibCzgZ3ItySjdv9i1UxFI0xF7KWKXy7ITGgxmA747YB+mMtEU8j+qbSoThwK+K+Vnda0wXTJVqXB+vbwm+MJgLJeAzk0eKQuCacFBwZlcUmrGXXxulVDl3RfNNYfTwLcpxAWbDTYC68DvyP6aF7pk6EfQWdB50O+tvkP8C8uzPO7HeTXiAAAAAElFTkSuQmCC"
                    @click="dataBase64 = null"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-5">
          <div class="block flex justify-between">
            <span class="text-base py-1"
              >钱包余额(<b class="text-[#3076fd]">{{ sumDrawMjCount || 0 }}</b>
              积分)</span
            >
            <span class="flex items-center">
              <NButton
                text
                size="tiny"
                type="primary"
                :loading="refreshLoading"
                @click="refreshUserInfo"
                >刷新</NButton
              >
              <NTooltip placement="right-end" trigger="hover">
                <template #trigger>
                  <SvgIcon
                    icon="ri:error-warning-line"
                    class="text-base ml-2"
                  />
                </template>
                绘画账户信息
              </NTooltip>
            </span>
          </div>
          <div class="mt-3 space-y-1 items-center text-[#3076fd]">
            <div class="flex justify-between">
              <span class="w-[120px] block text-sm">绘画单次消耗：</span>
              <span class="text-sm pr-2"> 4积分 </span>
            </div>
            <div class="flex justify-between">
              <span class="w-[120px] block text-sm">图生图单次消耗：</span>
              <span class="text-sm pr-2"> 4积分 </span>
            </div>
            <div class="flex justify-between">
              <span class="w-[120px] block text-sm">放大单次消耗：</span>
              <span class="text-sm pr-2"> 1积分 </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右 -->
      <div
        class="h-full flex-1"
        :class="[isMobile ? '' : 'overflow-y-auto overflow-hidden']"
      >
        <div class="m-auto max-w-screen-4xl">
          <div class="space-y-6 p-4">
            <h3 class="text-lg sm:text-2xl font-bold leading-6">Midjourney</h3>
            <!-- <p>图生图：生成类似风格或类型图像；图生文：上传一张图片生成对应的提示词；融图：融合图片风格</p> -->
            <div>
              <div class="flex justify-between items-end">
                <b>你想生成什么图像?</b>
                <NSpace>
                  <NButton
                    type="primary"
                    :loading="translateLoading"
                    @click="handleFanyiPrompt"
                  >
                    <template #icon>
                      <SvgIcon icon="ri:translate" class="text-base" />
                    </template>
                    翻译
                  </NButton>
                  <NButton
                    type="primary"
                    :loading="associateLoading"
                    @click="handleAssociatePrompt"
                  >
                    <template #icon>
                      <SvgIcon
                        icon="material-symbols:mindfulness-outline-rounded"
                        class="text-base"
                      />
                    </template>
                    联想
                  </NButton>
                </NSpace>
              </div>
              <div class="mt-4">
                <NInput
                  v-model:value="prompt"
                  type="textarea"
                  :disabled="associateLoading || translateLoading"
                  :autosize="{
                    minRows: 4,
                    maxRows: 6,
                  }"
                  placeholder="例如: A cute little cat (Midjourney对中文描述词有一定限制、我们建议您点击右侧翻译将您的描述词转为英文再进行提交、联想则是会将您的描述词交由GPT让其发挥想象空间为您在此基础创建更为详细的描述！)"
                />
                <div
                  v-if="Number(authStore.globalConfig.mjHideNotBlock) !== 1"
                  class="mt-4"
                >
                  <div class="mb-3 flex justify-between items-end">
                    <b>不需要的元素</b>
                    <NButton
                      type="primary"
                      :loading="translateNoLoading"
                      @click="handleFanyiNoPrompt"
                    >
                      <template #icon>
                        <SvgIcon icon="ri:translate" class="text-base" />
                      </template>
                      翻译
                    </NButton>
                  </div>
                  <NInput
                    v-model:value="noPrompt"
                    type="textarea"
                    :rows="1"
                    placeholder="例：生成房间图片、但是不要床、你可以填bed！"
                  />
                </div>
              </div>
              <div
                v-if="promptList.length"
                class="w-full dark:bg-transparent"
                :class="isMobile ? 'py-3' : 'py-6'"
              >
                <NScrollbar x-scrollable>
                  <div
                    class="flex items-center space-x-3 whitespace-nowrap pb-[15px]"
                  >
                    <NButton
                      v-for="(item, index) in promptList"
                      :key="index"
                      size="small"
                      @click="handleSelectPrompt(item)"
                    >
                      {{ item.title }}
                    </NButton>
                  </div>
                </NScrollbar>
              </div>
              <div class="mt-3">
                <NButton
                  type="primary"
                  :loading="false"
                  :disabled="submitDisabled"
                  @click="handleSubmit()"
                >
                  <template #icon>
                    <SvgIcon icon="ri:ai-generate" class="text-base" />
                  </template>
                  提交绘画任务
                </NButton>
              </div>
            </div>
          </div>

          <div class="space-y-2 p-4">
            <div v-if="Number(authStore.globalConfig.mjHideWorkIn) !== 1">
              <div class="mt-6 mb-4 flex flex-col">
                <span class="text-xl font-bold flex items-end">
                  <b>工作中的内容</b>
                  <span v-if="countQueue" class="text-xs font-family ml-2"
                    >当前系统进行中任务[{{ countQueue }}]</span
                  >
                </span>
              </div>
              <div
                v-if="!curDrawTask.length"
                class="h-[10vh] flex flex-col justify-center items-center text-gray-500 relative"
              >
                <img class="w-18" :src="marketImg" />
                <span class="mt-4">
                  <NButton text size="small" @click="readMore"
                    >点击前往市场看看别人的作品吧！</NButton
                  >
                </span>
              </div>

              <div
                v-if="curDrawTask.length"
                class="h-[10vh] flex flex-col justify-center items-center text-gray-500 relative"
              >
                <div class="w-56 h-14 relative">
                  <Loading :text-color="loadingTextColor" />
                </div>
                <p class="mb-3">
                  当前{{
                    curDrawTask.length
                  }}个任务正在进行中、请耐心等候绘制完成、您可以前往其他页面稍后回来查看结果！
                </p>
              </div>
            </div>
            <!-- working -->
            <div class="min-h-[500px] mt-5">
              <div class="mt-6 mb-10 flex flex-col">
                <span class="text-xl font-bold"
                  >我的绘图
                  <span class="text-base text-[gray]"
                    >[{{ drawList.length }}]</span
                  ></span
                >
                <span class="mt-2 text-xs font-bold text-[#444]"
                  >点击下面的编号按钮以获取升级版（U:
                  放大图片更细节）或变化版（V:
                  在此基础上变体）。绘画失败不扣除积分，请重试直到绘画成功为止。</span
                >
              </div>
              <div v-if="!drawList || !drawList.length" class="w-full py-28">
                <img
                  class="mx-auto"
                  src="data:image/png;base64,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"
                  alt=""
                />
              </div>

              <div v-if="drawList && drawList.length">
                <div
                  class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 4xl:grid-cols-5 gap-4"
                >
                  <cardItem
                    v-for="item in drawList"
                    :key="item.id"
                    :draw-item-info="item"
                    @queryData="queryDrawResult"
                  />
                </div>
              </div>
            </div>

            <div id="footer" ref="containerRef" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.aspect-active {
  border: 2px solid #3074f8ff;
  color: #3074f8ff;
}

.model-active {
  border: 3px solid #3074f8ff;
}

.upload {
  border: 1px dashed #424242;
  font-size: 12px;
  border-radius: 8px;
  padding: 14px;
  &:hover {
    border: 1px dashed #3074f8ff;
  }
}
</style>
