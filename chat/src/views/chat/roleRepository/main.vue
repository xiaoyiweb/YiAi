<script lang="ts" setup>
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui'
import { NButton, NForm, NFormItem, NIcon, NInput, NModal, NPopconfirm, NSelect, NSpace, NSwitch, NTooltip, NUpload, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { CloseOutline } from '@vicons/ionicons5'
import { SvgIcon } from '@/components/common'
import { useAppCatStore } from '@/store'
import type { MineApp } from '@/store/modules/appStore/helper'
import { fetchCollectAppAPI, fetchCustomAppAPI, fetchDelMineAppAPI, fetchQueryAppCatsAPI } from '@/api/appStore'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import type { ResData } from '@/api/types'
import { fetchQueryModelsListAPI } from '@/api/models'

const appCatStore = useAppCatStore()
const keywords = ref('')
const loading = ref(false)
const visible = ref(false)
const fileList = ref([])
const formRef = ref<FormInst | null>(null)
const activeAppId = ref(0)
const isAllowEditAppPublic = ref(false)

const btnMsg = computed(() => activeAppId.value === 0 ? '创建我的个人应用' : '更新我的个人应用')
const title = computed(() => activeAppId.value === 0 ? '创建专属应用' : '更新个人应用')

const mineApps = computed(() => {
  if (!keywords.value)
    return appCatStore.mineApps

  else
    return appCatStore.mineApps.filter(item => item.appName.includes(keywords.value))
})
const uploadUrl = ref(`${import.meta.env.VITE_GLOB_API_URL}/upload/file`)

const defaultForm = () => {
  return {
    catId: null,
    name: null,
    preset: null,
    des: null,
    demoData: '',
    coverImg: '',
    public: false,
  }
}

const appForm = ref(defaultForm())
const rules: FormRules = {
  catId: [
    { required: true, message: '请选择分类' },
  ],
  name: [
    { required: true, message: '请输入应用名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度应为2到10个字符之间', trigger: 'blur' },
  ],
  preset: [
    { required: true, message: '请输入预设prompt', trigger: 'blur' },
    { min: 6, max: 1200, message: '长度应为6到1200个字符之间', trigger: 'blur' },
  ],
  des: [
    { required: true, message: '请输入简短的应用描述', trigger: 'blur' },
    { max: 50, message: '长度应为0到50个字符之间', trigger: 'blur' },
  ],
  demoData: [
    { required: true, message: '请输入示例数据、按回车换行表示新增一条', trigger: 'blur' },
    { max: 100, message: '长度应为0到100个字符之间', trigger: 'blur' },
  ],
  coverImg: [
    { required: true, message: '请上传应用Logo', trigger: 'change' },
  ],
  public: [
    { required: true, message: '请选择是否公开' },
  ],
}

const { isMobile } = useBasicLayout()
const ms = useMessage()
const router = useRouter()
const catList = ref([])
const coverImgFile: any = ref(null)
function handleInput(val: string) {
  keywords.value = val
}

async function handleRunApp(app: MineApp) {
  const res: any = await fetchQueryModelsListAPI()
  const { modelMaps } = res.data
  if (!modelMaps[1])
    return ms.warning('管理员未配置特定应用模型、请联系管理员配置~')

  router.push({ path: '/chat', query: { appId: app.appId } })
}

/* 加入取消收藏 */
async function handleCollect(app: MineApp) {
  app.loading = true
  try {
    const res: ResData = await fetchCollectAppAPI({ appId: app.appId })
    ms.success(res.data)
    await appCatStore.queryMineApps()
    app.loading = false
  }
  catch (error) {
    app.loading = false
  }
}

async function queryCats() {
  const res: ResData = await fetchQueryAppCatsAPI()
  catList.value = res.data.rows
}

/* del app */
async function handleDelApp(app: MineApp) {
  const res = await fetchDelMineAppAPI({ id: app.appId })
  ms.success(res.data)
  appCatStore.queryMineApps()
}

/* 文件列表改变 */
async function handleUpdateFileList(val: UploadFileInfo[]) {
  if (!val.length) {
    coverImgFile.value = null
  }
  else {
    const file = val[0].file
    coverImgFile.value = file
    const form = new FormData()
    form.append('file', file)
    const res = await axios.post(uploadUrl.value, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (res.data.data)
      appForm.value.coverImg = res.data.data

    else
      ms.error('上传图片失败、请检查后再试试吧！')
  }
}

function handleBeforeUpload({ file, fileList }) {
  return new Promise((resolve, reject) => {
    const { size, type } = file.file
    /* 如果类型不是png或者jpg jpeg告诉不能上传 */
    if (type !== 'image/png' && type !== 'image/jpg' && type !== 'image/jpeg') {
      ms.error('只能上传png/jpg/jpeg格式的图片')
      return resolve(false)
    }
    /* 如果图片大于300k 提示太大 */
    if (size > 300 * 1024) {
      ms.error('图片大小不能超过300k')
      return resolve(false)
    }
    resolve(true)
  })
}

onMounted(() => {
  !mineApps.value.length && appCatStore.queryMineApps()
})

function handleCreateApp() {
  visible.value = true
  queryCats()
}

function openDialog() {}

function handleCloseDialog() {
  handleResetState()
}

function handleResetState() {
  activeAppId.value = 0
  isAllowEditAppPublic.value = false
  appForm.value = defaultForm()
}

async function handlerEditApp(app: MineApp) {
  await queryCats()
  const { catId, appName, preset, appDes, demoData, coverImg, public: isPublic } = app
  Object.assign(appForm.value, { catId, name: appName, preset, des: appDes, demoData, coverImg, public: isPublic })
  activeAppId.value = app.appId
  visible.value = true
  isAllowEditAppPublic.value = app.public
}

function handlerSubmit() {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      const params: any = appForm.value
      activeAppId.value && (params.appId = activeAppId.value)
      const res: ResData = await fetchCustomAppAPI(params)
      const msg = activeAppId.value ? '个人应用修改完成！' : '个人应用创建完成！'
      res.success && ms.success(msg)
      appCatStore.queryMineApps()
      handleResetState()
      visible.value = false
    }
  })
}
</script>

<template>
  <div class="w-full flex justify-center">
    <div class="p-6 max-w-screen-4xl  px-4 w-full">
      <div class="flex flex-col space-y-3  justify-between sm:flex-row sm:space-y-0">
        <div class="sm:w-full md:w-[300px] sm:mb-3 2xl:w-[380px]">
          <NInput v-model="keywords" type="text" :placeholder="`您一共收录了${mineApps.length}个应用(关键词过滤)`" @input="handleInput" />
        </div>

        <NSpace>
          <NButton @click="handleCreateApp">
            <template #icon>
              <SvgIcon icon="gridicons:create" />
            </template>
            创建自定义应用
          </NButton>
          <NButton type="primary" @click="router.push('/app-store')">
            <template #icon>
              <SvgIcon icon="ri:add-line" />
            </template>
            前往广场添加应用
          </NButton>
        </NSpace>
      </div>
      <div class="mt-10 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        <div v-for="item in mineApps" :key="item.id" class="card relative custom-card cursor-pointer border border-[#e0e0e0] dark:border-neutral-800 p-4 pt-2 border rounded-md flex flex-col justify-center items-center hover:bg-neutral-100 dark:hover:bg-[#24272e] select-none" @click="handleRunApp(item)">
          <div class="w-full h-16 flex items-center mb-3">
            <span class="w-14 h-14 flex justify-center items-center rounded-md shadow-md mr-5 border border-[#00000014]">
              <img :src="item.coverImg" class="w-8 h-8 mb-1" alt="">
            </span>
            <span class="text-base font-bold mb-1 text-base text-[#333] dark:text-[#ffffff85]">{{ item.appName }}</span>
          </div>

          <p class="w-full  text-[#999999] text-xs  min-h-[40px]">
            {{ item.appDes }}
          </p>
          <div class="w-full flex justify-between mt-3">
            <NPopconfirm v-if="item.appRole === 'system' || item.public" placement="bottom" @positive-click.stop="handleCollect(item)">
              <template #trigger>
                <NButton size="tiny" ghost :loading="item.loading" @click.stop>
                  <template #icon>
                    <SvgIcon icon="clarity:favorite-line" class="text-base" />
                  </template>
                  取消收藏
                </NButton>
              </template>
              确认取消收藏该应用吗？
            </NPopconfirm>
            <NSpace>
              <NPopconfirm v-if="item.appRole === 'user' && !item.public" placement="bottom" @positive-click.stop="handleDelApp(item)">
                <template #trigger>
                  <NButton size="tiny" ghost :loading="item.loading" @click.stop>
                    <template #icon>
                      <SvgIcon icon="mdi-light:delete" class="text-base" />
                    </template>
                    删除应用
                  </NButton>
                </template>
                确认移除创建的应用吗？
              </NPopconfirm>
              <NButton v-if="item.appRole === 'user' && !item.public " size="tiny" ghost :loading="item.loading" @click.stop="handlerEditApp(item)">
                <template #icon>
                  <SvgIcon icon="mdi-light:delete" class="text-base" />
                </template>
                编辑应用
              </NButton>
            </NSpace>
          </div>
          <SvgIcon icon="codicon:run-all" class="run-icon text-xl text-[#5A91FC] absolute right-3 bottom-3" />
          <SvgIcon v-if="item.status === 3" icon="icon-park-twotone:mark" class=" text-xl text-[#5A91FC] absolute right-3 top-3" />
        </div>
      </div>
    </div>
  </div>

  <!-- modal -->
  <NModal :show="visible" title="创建" style="width: 90%; max-width: 640px" :mask-closable="false" :on-after-enter="openDialog" :on-after-leave="handleCloseDialog">
    <div class="p-5 bg-white rounded dark:bg-slate-800">
      <div class="absolute top-4 left-5 cursor-pointer z-30" @click="visible = false">
        <span class="font-bold text-base">{{ title }}</span>
      </div>
      <div class="absolute top-3 right-3 cursor-pointer z-30" @click="visible = false">
        <NIcon size="20" color="#0e7a0d">
          <CloseOutline />
        </NIcon>
      </div>
      <div class="pt-5 mt-6">
        <NForm
          ref="formRef"
          :model="appForm"
          :rules="rules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
          :style="{ maxWidth: '640px' }"
        >
          <NFormItem label="应用分类" path="catId">
            <NSelect
              v-model:value="appForm.catId"
              clearable
              size="small"
              label-field="name"
              placeholder="请输入您的应用分类"
              value-field="id" :options="catList"
            />
          </NFormItem>
          <NFormItem label="应用名称" path="name">
            <NInput v-model:value="appForm.name" placeholder="请输入您的应用名称" type="name" :maxlength="30" show-name-on="click" tabindex="0" />
          </NFormItem>
          <NFormItem label="预设指令" path="preset">
            <NInput
              v-model:value="appForm.preset"
              :max="255"
              :autosize="{
                minRows: 3,
                maxRows: 10,
              }"
              type="textarea"
              placeholder="请填写prompt预设指令（核心）"
            />
          </NFormItem>
          <NFormItem label="应用描述" path="des">
            <NInput
              v-model:value="appForm.des" :autosize="{
                minRows: 3,
                maxRows: 10,
              }" type="textarea" placeholder="请对你的应用做以简要的描述以便于大家认识它！"
            />
          </NFormItem>
          <NFormItem label="示例内容" path="demoData">
            <NInput
              v-model:value="appForm.demoData" :autosize="{
                minRows: 3,
                maxRows: 10,
              }" type="textarea" placeholder="请填写一个示例、方便快速告诉别人如何使用、每点击回车换行一次则是新增一条示例！"
            />
          </NFormItem>
          <NFormItem label="应用Logo" path="coverImg">
            <NUpload
              :on-update:file-list="handleUpdateFileList"
              :on-before-upload="handleBeforeUpload"
              :max="1"
              :default-upload="false"
              :action="uploadUrl"
              :default-file-list="fileList"
              list-type="image-card"
            >
              点击上传
            </NUpload>
          </NFormItem>
          <NFormItem label="是否共享" path="public">
            <NSwitch v-model:value="appForm.public" :disabled="isAllowEditAppPublic" />
            <NTooltip placement="top-start" trigger="hover">
              <template #trigger>
                <SvgIcon icon="ri:error-warning-line" class="text-base ml-3 cursor-pointer" />
              </template>
              <p>Tips: 请知悉  </p>
              <p>选择共享提交之后审核状态将无法编辑应用</p>
              <p>审核通过的应用将会在应用广场公开展示</p>
              <p>管理审核通过后将会赠送一定的站内额度奖励用户</p>
              <p>一旦提交处于审核中、您将不能再编辑此应用</p>
            </NTooltip>
          </NFormItem>

          <NFormItem class="mt-3">
            <NButton
              block
              type="primary"
              :disabled="loading"
              :loading="loading"
              @click="handlerSubmit"
            >
              {{ btnMsg }}
            </NButton>
          </NFormItem>
        </NForm>
      </div>
    </div>
  </NModal>
</template>

<style lang="less">
.card{
	transition: all .35s cubic-bezier(0.075, 0.82, 0.165, 1);
	.run-icon{
		display: none;
	}
	&:hover{
		border: 1px solid #5A91FC;
		transform: translateY(-8px) translateX(6px);
		.run-icon{
			display: block;
			}
	}
}
</style>
