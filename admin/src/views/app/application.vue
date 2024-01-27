<route lang="yaml">
meta:
  title: 应用管理
</route>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import ApiApp from '@/api/modules/app'
import { utcToShanghaiTime } from '@/utils/utcformatTime'

import { APP_ROLE_LIST, ENABLE_STATUS_OPTIONS, QUESTION_STATUS_MAP } from '@/constants/index'

const formRef = ref<FormInstance>()
const total = ref(0)
const visible = ref(false)
const loading = ref(false)

const formInline = reactive({
  catId: '',
  name: '',
  status: '',
  role: '',
  page: 1,
  size: 10,
})
const uploadUrl = ref(`${import.meta.env.VITE_APP_API_BASEURL}/upload/file`)

const formPackageRef = ref<FormInstance>()
const activeAppCatId = ref(0)
const isUserApp = ref(false)
const userAppStatus = ref(0)
const formPackage = reactive({
  catId: '',
  name: '',
  preset: '',
  des: '',
  coverImg: '',
  demoData: '',
  order: 100,
  status: 0,
})

const rules = reactive<FormRules>({
  catId: [{ required: true, message: '请选择App分类', trigger: 'change' }],
  name: [{ required: true, message: '请填写App名称', trigger: 'blur' }],
  preset: [{ required: true, message: '请填写App预设信息', trigger: 'blur' }],
  des: [{ required: true, message: '请填写App描述', trigger: 'blur' }],
  coverImg: [{ required: false, message: '请填写App封面图片地址', trigger: 'blur' }],
  demoData: [{ required: false, message: '请填写App演示数据', trigger: 'blur' }],
  order: [{ required: false, message: '请填写排序ID', trigger: 'blur' }],
  status: [{ required: true, message: '请选择App状态', trigger: 'change' }],
})

const tableData = ref([])

interface CatItem {
  id: number
  name: string
}
const catList: Ref<CatItem[]> = ref([])

const dialogTitle = computed(() => {
  return activeAppCatId.value ? '更新套餐' : '新增套餐'
})

const dialogButton = computed(() => {
  return activeAppCatId.value ? '确认更新' : '确认新增'
})

async function queryAppList() {
  try {
    loading.value = true
    const res = await ApiApp.queryApp(formInline)
    const { rows, count } = res.data
    loading.value = false
    total.value = count
    tableData.value = rows.sort((a, b) => b.order - a.order)
  }
  catch (error) {
    loading.value = false
  }
}

async function queryCatList() {
  const res = await ApiApp.queryCats({ size: 100 })
  const { rows } = res.data
  catList.value = rows
}

function handleUpdatePackage(row: any) {
  activeAppCatId.value = row.id
  isUserApp.value = row.role === 'user'
  userAppStatus.value = row.status
  const { name, status, des, order, coverImg, catId, preset, demoData } = row
  nextTick(() => {
    Object.assign(formPackage, { name, status, des, order, coverImg, catId, preset, demoData })
  })
  visible.value = true
}

function handlerCloseDialog(formEl: FormInstance | undefined) {
  activeAppCatId.value = 0
  formEl?.resetFields()
}

async function handleDeletePackage(row: any) {
  await ApiApp.deleteApp({ id: row.id })
  ElMessage.success('删除分类成功')
  queryAppList()
}

function handlerReset(formEl: FormInstance | undefined) {
  formEl?.resetFields()
  queryAppList()
}

const handleAvatarSuccess: UploadProps['onSuccess'] = (
  response,
  uploadFile,
) => {
  console.log('response: ', response.data)
  formPackage.coverImg = response.data
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('当前系统仅支持 PNG、JPEG、GIF、和 WebP 格式的图片!')
    return false
  }

  else if (rawFile.size / 1024 > 300) {
    ElMessage.error('当前限制文件最大不超过 300KB!')
    return false
  }
}

function handlerSubmit(formEl: FormInstance | undefined) {
  formEl?.validate(async (valid) => {
    if (valid) {
      if (activeAppCatId.value) {
        const params = { id: activeAppCatId.value, ...formPackage }
        /* 如果是用户的app 不能修改状态 保持原样返回 */
        isUserApp.value && Object.assign(params, { status: userAppStatus.value })
        await ApiApp.updateApp(params)
        ElMessage({ type: 'success', message: '更新套餐成功！' })
      }
      else {
        await ApiApp.createApp(formPackage)
        ElMessage({ type: 'success', message: '创建新的套餐成功！' })
      }
      visible.value = false
      queryAppList()
    }
  })
}

async function handleAuditAppPass(app: any) {
  const res = await ApiApp.auditPassApp({ id: app.id })
  ElMessage({ type: 'success', message: res.data })
  queryAppList()
}

async function handleAuditAppFail(app: any) {
  const res = await ApiApp.auditFailApp({ id: app.id })
  ElMessage({ type: 'success', message: res.data })
  queryAppList()
}

onMounted(() => {
  queryAppList()
  queryCatList()
})
</script>

<template>
  <div>
    <page-main>
      <el-alert :closable="false" show-icon title="应用说明" description="[由于各模型的使用不同、暂时关闭其他模型的应用使用、仅仅支持使用OpenAi的key使用、请配置了openAi的key之后再进行使用、如果没有配置将不能使用此功能、但用户可以自定义选择模型]  ====     应用一旦创建、可能会被多处使用后续将限制删除、请保持良好习惯、规范命名分类、后续尽量变更而不是删除。用户创建的应用我们不允许删除、但是可以做一定的变更和修改、审核通过的应用也将限制用户更改、一旦通过或者拒绝、将不允许再次对其状态进行变更、请知悉！" type="success" />
    </page-main>
    <page-main>
      <el-form ref="formRef" :inline="true" :model="formInline">
        <el-form-item label="App分类" prop="catId">
          <el-select v-model="formInline.catId" placeholder="请选择App分类" clearable>
            <el-option v-for="item in catList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="App状态" prop="status">
          <el-select v-model="formInline.status" placeholder="请选择App状态" clearable>
            <el-option v-for="item in ENABLE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="App名称" prop="name">
          <el-input v-model="formInline.name" placeholder="App名称[模糊搜索]" clearable @keydown.enter.prevent="queryAppList" />
        </el-form-item>
        <el-form-item label="App角色" prop="status">
          <el-select v-model="formInline.role" placeholder="请选择App角色" clearable>
            <el-option v-for="item in APP_ROLE_LIST" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryAppList">
            查询
          </el-button>
          <el-button @click="handlerReset(formRef)">
            重置
          </el-button>
        </el-form-item>
        <el-button type="success" style="float: right;" @click="visible = true">
          创建应用
          <el-icon class="ml-3">
            <Plus />
          </el-icon>
        </el-button>
      </el-form>
    </page-main>

    <page-main style="width: 100%;">
      <el-table v-loading="loading" border :data="tableData" style="width: 100%;" size="large">
        <el-table-column prop="coverImg" label="应用封面" width="100">
          <template #default="scope">
            <el-image style="height: 50px;" :src="scope.row.coverImg" fit="fill" />
          </template>
        </el-table-column>
        <el-table-column prop="catName" label="应用分类" width="100" />
        <el-table-column prop="name" label="应用名称" width="120" />
        <el-table-column prop="status" label="应用状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ QUESTION_STATUS_MAP[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="public" label="是否共享" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.public ? 'success' : ''">
              {{ scope.row.public ? '共享' : '私有' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="public" label="应用创建角色" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'system' ? 'success' : ''">
              {{ scope.row.role === 'system' ? '系统' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order" label="排序ID" /> />
        <el-table-column prop="preset" label="预设信息" width="400">
          <template #default="scope">
            <el-tooltip
              class="box-item"
              effect="dark"
              placement="top-start"
            >
              <template #content>
                <div :style="{ maxWidth: '350px' }">
                  {{ scope.row.preset }}
                </div>
              </template>
              <div :style="{ maxHeight: '50px', cursor: 'pointer' }">
                {{ scope.row.preset }}
              </div>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column prop="des" label="描述信息" width="300">
          <template #default="scope">
            <el-tooltip
              class="box-item"
              effect="dark"
              placement="top-start"
            >
              <template #content>
                <div :style="{ maxWidth: '350px' }">
                  {{ scope.row.des }}
                </div>
              </template>
              <div :style="{ maxHeight: '50px', cursor: 'pointer' }">
                {{ scope.row.des }}
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="120">
          <template #default="scope">
            {{ utcToShanghaiTime(scope.row.createdAt, 'YYYY-MM-DD') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button v-if="scope.row.role === 'system' || scope.row.public" link type="primary" size="small" @click="handleUpdatePackage(scope.row)">
              编辑
            </el-button>
            <el-popconfirm v-if="scope.row.role === 'system'" title="确认删除此应用么?" width="200" icon-color="red" @confirm="handleDeletePackage(scope.row)">
              <template #reference>
                <el-button link type="danger" size="small">
                  删除应用
                </el-button>
              </template>
            </el-popconfirm>

            <el-popconfirm v-if="scope.row.role === 'user' && scope.row.status === 3" title="确认通过审核此应用么?" width="200" icon-color="red" @confirm="handleAuditAppPass(scope.row)">
              <template #reference>
                <el-button link type="success" size="small">
                  通过审核
                </el-button>
              </template>
            </el-popconfirm>

            <el-popconfirm v-if="scope.row.role === 'user' && scope.row.status === 3" title="确认拒绝通过此应用共享请求么?" width="200" icon-color="red" @confirm="handleAuditAppFail(scope.row)">
              <template #reference>
                <el-button link type="danger" size="small">
                  拒绝审核
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <el-row class="flex justify-end mt-5">
        <el-pagination
          v-model:current-page="formInline.page"
          v-model:page-size="formInline.size"
          class="mr-5"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="queryAppList"
          @current-change="queryAppList"
        />
      </el-row>
    </page-main>
    <el-dialog v-model="visible" :close-on-click-modal="false" :title="dialogTitle" width="570" @close="handlerCloseDialog(formPackageRef)">
      <el-form
        ref="formPackageRef"
        label-position="right"
        label-width="100px"
        :model="formPackage"
        :rules="rules"
      >
        <el-form-item label="App分类" prop="catId">
          <el-select v-model="formPackage.catId" placeholder="请选择App分类" clearable style="width: 100%;">
            <el-option v-for="item in catList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="App名称" prop="name">
          <el-input v-model="formPackage.name" placeholder="请填写App名称" />
        </el-form-item>
        <el-form-item v-if="!isUserApp" label="App状态" prop="status">
          <el-switch
            v-model="formPackage.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>

        <el-form-item label="App预设" prop="preset">
          <el-input v-model="formPackage.preset" type="textarea" placeholder="请填写App预设信息、用于给AI预设身份..." :rows="4" />
        </el-form-item>
        <el-form-item label="App描述" prop="des">
          <el-input v-model="formPackage.des" type="textarea" placeholder="请填写App介绍信息、用于对外展示..." :rows="4" />
        </el-form-item>
        <el-form-item label="示例内容" prop="demoData">
          <el-input v-model="formPackage.demoData" type="textarea" placeholder="请填写App的demo示例数据、每换行一次表示一个新的示例..." :rows="4" />
        </el-form-item>
        <el-form-item label="应用Logo" prop="coverImg">
          <el-upload
            class="avatar-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="formPackage.coverImg" :src="formPackage.coverImg" style="width: 100px;" class="avatar">
            <el-icon v-else class="avatar-uploader-icon">
              <Plus />
            </el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="排序ID" prop="order">
          <el-input v-model.number="formPackage.order" placeholder="请填写排序ID[数字越大越靠前]" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="flex justify-end mr-5">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" @click="handlerSubmit(formPackageRef)">
            {{ dialogButton }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
