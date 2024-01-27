<route lang="yaml">
meta:
  title: key列表
</route>

<script lang="ts" setup>
import { computed, onMounted, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import ApiChatgpt from '@/api/modules/chatgpt'
import { utcToShanghaiTime } from '@/utils/utcformatTime'

import { ENABLE_STATUS_TYPE_MAP, MODEL_LIST, QUESTION_STATUS_MAP, QUESTION_STATUS_OPTIONS } from '@/constants/index'

const formBlukRef = ref<FormInstance>()
const formRef = ref<FormInstance>()
const total = ref(0)
const visible = ref(false)
const loading = ref(false)
const modelLoading = ref(false)
const bulkVisible = ref(false)

const dynamicModelList = ref([
  'gpt-4',
  'gpt-4-0613',
  'gpt-4-32k',
  'gpt-4-32k-0613',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-0613',
  'gpt-3.5-turbo-16k-0613',
  'gpt-3.5-turbo-16k',
  'code-davinci-002',
  'ada',
  'davinci',
])

const formBlukCreate = reactive({
  keyList: '',
})

const formInline = reactive({
  key: '',
  model: '',
  status: '',
  page: 1,
  size: 10,
})

const formPackageRef = ref<FormInstance>()
const activeAppCatId = ref(0)
const formPackage = reactive({
  key: '',
  model: '',
  maxModelTokens: null,
  maxResponseTokens: null,
  openaiProxyUrl: '',
  openaiTimeoutMs: null,
  weight: 1,
  status: 1,
})

const rules = reactive<FormRules>({
  key: [{ required: true, message: '请填写您的chatgpt key', trigger: 'blur' }],
  model: [{ required: true, message: '请选择当前key需要绑定的模型', trigger: 'change' }],
  weight: [{ required: false, message: '请填写key的权重值', trigger: 'blur' }],
  status: [{ required: true, message: '请选择key的启用状态', trigger: 'change' }],
  maxModelTokens: [{ required: false, message: '请填写模型最大token数', trigger: 'blur' }],
  maxResponseTokens: [{ required: false, message: '请填写最大回复token数', trigger: 'blur' }],
  openaiProxyUrl: [{ required: false, message: '请填写指定代理地址', trigger: 'blur' }],
})

function handlerCloseDialog(formEl: FormInstance | undefined) {
  activeAppCatId.value = 0
  formEl?.resetFields()
}

const dialogTitle = computed(() => {
  return activeAppCatId.value ? '更新秘钥' : '新增秘钥'
})

const dialogButton = computed(() => {
  return activeAppCatId.value ? '确认更新' : '确认新增'
})

const tableData = ref([])

async function queryKeyModelList() {

  // if (!formPackage.key) {
  //   return ElMessage.error('请先填写您的key再查询')
  // }
  // formPackage.model = ''
  // try {
  //   modelLoading.value = true
  //   const res = await ApiChatgpt.queryKeyModelList({ key: formPackage.key })
  //   modelLoading.value = false
  //   dynamicModelList.value = res.data
  // }
  // catch (error) {
  //   modelLoading.value = false
  // }
}

async function queryAllUserList() {
  try {
    loading.value = true
    const res = await ApiChatgpt.queryKeyList(formInline)
    loading.value = false

    const { rows, count } = res.data
    total.value = count
    tableData.value = rows
  }
  catch (error) {
    loading.value = false
  }
}

async function handleDeleteKey(row: any) {
  const { id } = row
  await ApiChatgpt.deleteGptKey({ id })
  ElMessage({ type: 'success', message: '删除秘钥成功！' })
  queryAllUserList()
}

function handleEditKey(row: any) {
  activeAppCatId.value = row.id
  const { key, model, weight, status, type, maxModelTokens, maxResponseTokens, openaiProxyUrl, openaiTimeoutMs } = row
  nextTick(() => {
    Object.assign(formPackage, { key, model, weight, status, type, maxModelTokens, maxResponseTokens, openaiProxyUrl, openaiTimeoutMs })
  })
  visible.value = true
}

function handlerReset(formEl: FormInstance | undefined) {
  formEl?.resetFields()
  queryAllUserList()
}

async function handlerSubmit(formEl: FormInstance | undefined) {
  formEl?.validate(async (valid) => {
    if (valid) {
      if (activeAppCatId.value) {
        await ApiChatgpt.updateGptKey({ id: activeAppCatId.value, ...formPackage })
        ElMessage({ type: 'success', message: '更新秘钥成功！' })
      }
      else {
        await ApiChatgpt.addGptKey(formPackage)
        ElMessage({ type: 'success', message: '添加秘钥成功！' })
      }
      visible.value = false
      queryAllUserList()
    }
  })
}

/* 批量添加 */
function handlerBlukCraete(formEl: FormInstance | undefined) {
  formEl?.validate(async (valid) => {
    if (valid) {
      const { keyList } = formBlukCreate
      const keyListArr = keyList.split('\n')
      if (keyListArr.length > 100) {
        return ElMessage.error('批量添加key不能超过100个')
      }
      if (!keyListArr.length) {
        return ElMessage.error('请按要求填写您的key秘钥')
      }
      const res = await ApiChatgpt.builCreateGptKey({ keyList: keyListArr })
      formBlukCreate.keyList = ''
      ElMessage({ type: 'success', message: res.data })
      bulkVisible.value = false
      queryAllUserList()
    }
  })
}

onMounted(() => {
  queryAllUserList()
})
</script>

<template>
  <div>
    <page-main>
      <el-form ref="formRef" :inline="true" :model="formInline">
        <el-form-item label="key" prop="key">
          <el-input v-model="formInline.key" placeholder="sk-*** [模糊搜索]" />
        </el-form-item>
        <el-form-item label="使用模型" prop="model">
          <el-select v-model="formInline.model" placeholder="请选择绑定的模型" clearable>
            <el-option v-for="item in MODEL_LIST" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态" prop="status">
          <el-select v-model="formInline.status" placeholder="请选择key启用状态" clearable>
            <el-option v-for="item in QUESTION_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryAllUserList">
            查询
          </el-button>
          <el-button @click="handlerReset(formRef)">
            重置
          </el-button>
        </el-form-item>
        <span style="float: right;">
          <el-button type="success" @click="bulkVisible = true">
            批量添加Key
            <el-icon class="ml-3">
              <Plus />
            </el-icon>
          </el-button>
          <el-button type="success" @click="visible = true">
            添加Key
            <el-icon class="ml-3">
              <Plus />
            </el-icon>
          </el-button>
        </span>
      </el-form>
    </page-main>
    <page-main>
      <el-alert show-icon title="模块已废弃" description="当前版本会在2.0之后废弃、本次保留是为了让你查询历史key、后续此模块会直接移除、新的key池在下方『模型池设置』中、详细配置可以查看提示或参考官方文档！" type="error" />
    </page-main>
    <page-main style="width: 100%;">
      <el-table v-loading="loading" border :data="tableData" style="width: 100%;" size="large">
        <el-table-column prop="key" label="key秘钥" width="470" />
        <el-table-column prop="model" align="center" label="绑定模型" width="160">
          <template #default="scope">
            <el-tag :type="scope.row.model.includes('gpt-4') ? 'success' : ''">
              {{ scope.row.model }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" align="center" label="启用状态" width="90">
          <template #default="scope">
            <el-tag :type="ENABLE_STATUS_TYPE_MAP[scope.row.status]">
              {{ QUESTION_STATUS_MAP[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="keyDetail.totalAmount" align="center" label="账户总额" width="90">
          <template #default="scope">
            <el-button type="info" text>
              {{ scope.row.keyDetail.totalAmount || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="keyDetail.useAmount" align="center" label="已用额度" width="90">
          <template #default="scope">
            <el-button type="danger" text>
              {{ scope.row.keyDetail.useAmount || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="keyDetail.balance" align="center" label="剩余额度" width="90">
          <template #default="scope">
            <el-button type="success" text>
              {{ scope.row.keyDetail.balance || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="keyDetail.expirDate" align="center" label="过期时间" width="130">
          <template #default="scope">
            <el-button type="danger" text>
              {{ scope.row.keyDetail.expirDate || '-' }}
            </el-button>
          </template>
        </el-table-column>

        <el-table-column prop="weight" align="center" label="秘钥权重" width="90" />
        <el-table-column prop="useCount" align="center" label="调用次数" width="90" />
        <el-table-column prop="keyStatus" align="center" label="key状态" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.keyDetail.status === 1 ? 'success' : 'danger'">
              {{ scope.row.keyDetail.status === 1 ? '正常工作' : scope.row.keyDetail.status === -1 ? '查询失败' : '已被封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maxModelTokens" align="center" label="模型最大上下文" width="140">
          <template #default="scope">
            <el-button type="info" text>
              {{ scope.row.maxModelTokens || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="maxResponseTokens" align="center" label="最大回复支持Token" width="160">
          <template #default="scope">
            <el-button type="info" text>
              {{ scope.row.maxResponseTokens || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="openaiProxyUrl" align="center" label="绑定的代理地址" width="230">
          <template #default="scope">
            <el-button type="info" text>
              {{ scope.row.openaiProxyUrl || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" align="center" label="添加时间" width="120">
          <template #default="scope">
            {{ utcToShanghaiTime(scope.row.createdAt, 'YYYY-MM-DD') }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="200">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEditKey(scope.row)">
              变更
            </el-button>
            <el-popconfirm title="确认删除此秘钥么?" width="180" icon-color="red" @confirm="handleDeleteKey(scope.row)">
              <template #reference>
                <el-button link type="danger" size="small">
                  删除秘钥
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
          @size-change="queryAllUserList"
          @current-change="queryAllUserList"
        />
      </el-row>
    </page-main>

    <el-dialog v-model="visible" :close-on-click-modal="false" title="批量添加秘钥" width="670" @close="handlerCloseDialog(formPackageRef)">
      <el-form
        ref="formPackageRef"
        v-loading="modelLoading"
        label-position="right"
        label-width="120px"
        :model="formPackage"
        :rules="rules"
      >
        <el-form-item label="key卡账号" prop="key">
          <el-input v-model="formPackage.key" placeholder="请填写chatgpt key" @blur="queryKeyModelList" />
        </el-form-item>
        <el-form-item label="启用状态" prop="status">
          <el-switch
            v-model="formPackage.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="绑定模型" prop="model">
          <el-select v-model="formPackage.model" filterable clearable placeholder="请选用当前key绑定的模型">
            <el-option
              v-for="item in dynamicModelList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <el-button type="primary" class="ml-5" @click="queryKeyModelList">
            <!-- 查询当前key支持的模型 -->
            请指定当前key调用的模型
          </el-button>
        </el-form-item>
        <el-form-item label="轮询权重" prop="weight">
          <el-input v-model.number="formPackage.weight" placeholder="请填写key的权重、数字越大使用评率越高！" />
        </el-form-item>
        <el-form-item label="模型最大Token" prop="maxModelTokens">
          <el-input v-model.number="formPackage.maxModelTokens" placeholder="请填写模型最大Token、不填写默认使用默认！" />
        </el-form-item>
        <el-form-item label="最大回复Token" prop="maxResponseTokens">
          <el-input v-model.number="formPackage.maxResponseTokens" placeholder="请填写最大回复Token、不填写使用默认！" />
        </el-form-item>
        <el-form-item label="指定代理" prop="openaiProxyUrl">
          <el-input v-model.number="formPackage.openaiProxyUrl" placeholder="请填写key的指定代理、不填写默认使用全局配置！" />
        </el-form-item>
        <el-form-item label="超时时间" prop="openaiTimeoutMs">
          <el-input v-model.number="formPackage.openaiTimeoutMs" placeholder="请填写key的超时时间单位（ms）、不填写默认使用全局配置！" />
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

    <el-dialog v-model="bulkVisible" :close-on-click-modal="false" :title="dialogTitle" width="670" @close="handlerCloseDialog(formPackageRef)">
      <el-form
        ref="formBlukRef"
        v-loading="modelLoading"
        label-position="right"
        label-width="120px"
        :model="formPackage"
      >
        <el-form-item label="key卡账号列表" prop="keyList">
          <el-input v-model="formBlukCreate.keyList" type="textarea" :rows="8" placeholder="请粘贴您的key秘钥列表、一行一个、批量添加的情况下我们将默认为您使用gpt-3.5-turbo模型、并且不会检测秘钥的有效期、请您自行校验！" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="flex justify-end mr-5">
          <el-button @click="bulkVisible = false">取消</el-button>
          <el-button type="primary" @click="handlerBlukCraete(formBlukRef)">
            {{ dialogButton }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
