<route lang="yaml">
meta:
  title: 模型列表
</route>

<script lang="ts" setup>
import { computed, onMounted, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import ApiModels from '@/api/modules/models'
import { utcToShanghaiTime } from '@/utils/utcformatTime'

import {
  MODEL_LIST,
  ModelTypeLabelMap,
  QUESTION_STATUS_OPTIONS,
  MODELTYPELIST,
  MODELSMAP,
  DEDUCTTYPELIST,
  MODELSMAPLIST,
} from '@/constants/index'

const formBlukRef = ref<FormInstance>()
const formRef = ref<FormInstance>()
const total = ref(0)
const visible = ref(false)
const loading = ref(false)
const modelLoading = ref(false)
const bulkVisible = ref(false)

const formInline = reactive({
  keyType: '',
  model: '',
  status: null,
  page: 1,
  size: 10,
})

const formPackageRef = ref<FormInstance>()
const activeModelKeyId = ref(0)
const formPackage = reactive({
  keyType: 1,
  modelName: '',
  key: '',
  secret: null,
  status: true,
  model: '',
  isDraw: false,
  isTokenBased: false,
  tokenFeeRatio: 1000,
  keyWeight: 1,
  modelOrder: 1,
  maxModelTokens: 4000,
  maxResponseTokens: 2000,
  proxyUrl: '',
  timeout: 300,
  deduct: 1,
  deductType: 1,
  maxRounds: 12,
})

const rules = reactive<FormRules>({
  keyType: [
    { required: true, message: '请填写您的调用模型类型', trigger: 'blur' },
  ],
  modelName: [
    { required: true, message: '请填写您的模型名称', trigger: 'blur' },
  ],
  key: [{ required: true, message: '请填写您的调用模型key', trigger: 'blur' }],
  secret: [
    { required: true, message: '请填写您的调用模型的secret', trigger: 'blur' },
  ],
  status: [
    { required: true, message: '请选择key的启用状态', trigger: 'change' },
  ],
  isDraw: [
    {
      required: true,
      message: '请选择当前key是否作为基础绘画key',
      trigger: 'change',
    },
  ],
  isTokenBased: [
    {
      required: true,
      message: '请选择当前key是否基于token计费',
      trigger: 'change',
    },
  ],
  tokenFeeRatio: [
    { required: true, message: 'token计费比例', trigger: 'change' },
  ],
  model: [
    {
      required: true,
      message: '请选择当前key需要绑定的模型',
      trigger: 'change',
    },
  ],
  keyWeight: [
    { required: true, message: '请填写key的权重值', trigger: 'blur' },
  ],
  maxModelTokens: [
    { required: true, message: '请填写模型最大token数', trigger: 'blur' },
  ],
  maxResponseTokens: [
    {
      required: true,
      message: '请填写允许用户使用的最大回复token数',
      trigger: 'blur',
    },
  ],
  proxyUrl: [
    { required: false, message: '请填写指定代理地址', trigger: 'blur' },
  ],
  timeout: [
    {
      required: true,
      message: '请填写超时时间 默认 60 单位（秒）',
      trigger: 'blur',
    },
  ],
  deductType: [
    { required: true, message: '请选择当前模型扣费类型', trigger: 'change' },
  ],
  deduct: [
    {
      required: true,
      message: '请填写当前模型扣费金额（需要是正整数）',
      trigger: 'blur',
    },
  ],
  maxRounds: [
    {
      required: true,
      message: '请填写允许用户选择的最大上下文轮次',
      trigger: 'blur',
    },
  ],
})

function handlerCloseDialog(formEl: FormInstance | undefined) {
  activeModelKeyId.value = 0
  formEl?.resetFields()
}

const modelList = computed(() => MODELSMAPLIST[formPackage.keyType])

const dialogTitle = computed(() => {
  return activeModelKeyId.value ? '更新秘钥' : '新增秘钥'
})

const labelKeyName = computed(() => ModelTypeLabelMap[formPackage.keyType])

const dialogButton = computed(() => {
  return activeModelKeyId.value ? '确认更新' : '确认新增'
})

const tableData = ref([])

async function queryModelsList() {
  try {
    loading.value = true
    const res = await ApiModels.queryModels(formInline)
    loading.value = false
    const { rows, count } = res.data
    total.value = count
    tableData.value = rows
  } catch (error) {
    loading.value = false
  }
}

async function handleDeleteKey(row: any) {
  const { id } = row
  await ApiModels.delModels({ id })
  ElMessage({ type: 'success', message: '操作完成！' })
  queryModelsList()
}

function handleEditKey(row: any) {
  activeModelKeyId.value = row.id
  const {
    keyType,
    modelName,
    key,
    secret,
    status,
    model,
    keyWeight,
    modelOrder,
    maxModelTokens,
    maxResponseTokens,
    proxyUrl,
    timeout,
    deductType,
    deduct,
    maxRounds,
    isDraw,
    isTokenBased,
    tokenFeeRatio,
  } = row
  nextTick(() => {
    Object.assign(formPackage, {
      keyType,
      modelName,
      key,
      secret,
      status,
      model,
      keyWeight,
      maxModelTokens,
      maxResponseTokens,
      proxyUrl,
      timeout,
      deductType,
      deduct,
      maxRounds,
      isDraw,
      isTokenBased,
      tokenFeeRatio,
      modelOrder,
    })
  })
  visible.value = true
}

function handlerReset(formEl: FormInstance | undefined) {
  formEl?.resetFields()
  queryModelsList()
}

async function handlerSubmit(formEl: FormInstance | undefined) {
  formEl?.validate(async (valid) => {
    if (valid) {
      const params: any = JSON.parse(JSON.stringify(formPackage))
      delete params.id
      activeModelKeyId.value && (params.id = activeModelKeyId.value)
      if (Number(formPackage.keyType) === 1) {
        const key = JSON.parse(JSON.stringify(formPackage.key))
        const formatKeyArr = key.split('\n')
        params.key = formatKeyArr
      }
      await ApiModels.setModels(params)
      ElMessage({ type: 'success', message: '操作成功！' })
      activeModelKeyId.value = 0
      visible.value = false
      queryModelsList()
    }
  })
}

onMounted(() => {
  queryModelsList()
})
</script>

<template>
  <div>
    <page-main style="padding-bottom:0">
      <el-form ref="formRef" :inline="true" :model="formInline">
        <el-form-item label="模型类型" prop="model">
          <el-select
            v-model="formInline.keyType"
            filterable
            allow-create
            placeholder="请选择或填写绑定的模型"
            clearable
          >
            <el-option
              v-for="item in MODELTYPELIST"
              :key="item"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="使用模型" prop="model">
          <el-select
            v-model="formInline.model"
            filterable
            allow-create
            placeholder="请选择或填写绑定的模型"
            clearable
          >
            <el-option
              v-for="item in MODEL_LIST"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态" prop="status">
          <el-select
            v-model="formInline.status"
            placeholder="请选择key启用状态"
            clearable
          >
            <el-option
              v-for="item in QUESTION_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryModelsList"> 查询 </el-button>
          <el-button @click="handlerReset(formRef)"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </page-main>
    <page-main>
      <el-alert
        show-icon
        title="KEY池说明"
        description="所有key会根据你所选的模型自动分类、会以第一个加入的key为标准、建议所有同模型的key参数配置相同、否则可能特殊场景会有迷惑性。不同模型可以设置不同的扣费类型以及单次调用扣除的额度、额度不再以次为单位、改为(积分)概念！你可以设置模型最大上限和回复上限、以及最大轮次用以限制用户的最大上下文、当限制token后、用户端可选范围受其影响、轮次同理、到达轮次之后会移除掉更靠前的上下文！"
        type="success"
      />
    </page-main>
    <page-main style="width: 100%">
      <el-button type="success" @click="visible = true" style="margin-bottom:20px">
        添加模型Key
        <el-icon class="ml-3">
          <Plus />
        </el-icon>
      </el-button>
      <el-table
        v-loading="loading"
        border
        :data="tableData"
        style="width: 100%"
        size="large"
      >
        <!-- <el-table-column prop="keyType" label="模型类型" width="120">
          <template #default="scope">
            <el-tag type="success">
              {{ MODELSMAP[scope.row.keyType] }}
            </el-tag>
          </template>
        </el-table-column> -->
        <el-table-column
          prop="modelOrder"
          label="模型排序"
          width="90"
          align="center"
        />
        <el-table-column prop="modelName" label="模型名称" width="180" />
        <el-table-column
          prop="status"
          align="center"
          label="启用状态"
          width="90"
        >
          <template #default="scope">
            <el-tag :type="scope.row.status ? 'success' : 'danger'">
              {{ scope.row.status ? '使用中' : '已暂停' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="key" label="模型KEY" width="460">
          <template #default="scope">
            <div class="overflow-y-scroll w-full whitespace-nowrap">
              {{ scope.row.key }}
            </div>
          </template>
        </el-table-column>
        <!-- <el-table-column prop="secret" label="模型Secret"  width="340">
          <template #default="scope">
            <div class="overflow-y-scroll w-full whitespace-nowrap">{{ scope.row.secret || '---' }}</div>
          </template>
        </el-table-column> -->
        <el-table-column
          prop="keyWeight"
          label="模型权重"
          width="90"
          align="center"
        />
        <el-table-column
          prop="model"
          align="center"
          label="绑定模型"
          width="180"
        >
          <template #default="scope">
            <el-tag :type="scope.row.model.includes('gpt-4') ? 'success' : ''">
              {{ scope.row.model }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="isDraw"
          align="center"
          label="绘画KEY"
          width="120"
        >
          <template #default="scope">
            <el-tag :type="scope.row.isDraw ? 'success' : 'danger'">
              {{ scope.row.isDraw ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="isTokenBased"
          align="center"
          label="Token计费"
          width="120"
        >
          <template #default="scope">
            <el-tag :type="scope.row.isTokenBased ? 'success' : 'danger'">
              {{ scope.row.isTokenBased ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="deductType"
          align="center"
          label="扣费类型"
          width="90"
        >
          <template #default="scope">
            <el-tag :type="scope.row.deductType === 1 ? 'success' : 'warning'">
              {{ scope.row.deductType === 1 ? '普通积分' : '高级积分' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="deduct"
          align="center"
          label="单次扣除"
          width="90"
        >
          <template #default="scope">
            <el-tag :type="scope.row.deductType === 1 ? 'success' : 'warning'">
              {{ `${scope.row.deduct} 积分` }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="useCount"
          align="center"
          label="调用次数"
          width="90"
        />
        <el-table-column
          prop="useToken"
          align="center"
          label="已使用Token"
          width="120"
        />
        <el-table-column
          prop="keyStatus"
          align="center"
          label="key状态"
          width="110"
        >
          <template #default="scope">
            <el-tag :type="scope.row.keyStatus === 1 ? 'success' : 'danger'">
              {{
                scope.row.keyStatus === 1
                  ? '正常工作'
                  : scope.row.keyStatus === -1
                  ? '已被封禁'
                  : '余额耗尽 '
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="maxModelTokens"
          align="center"
          label="模型最大上下文"
          width="140"
        >
          <template #default="scope">
            <el-button type="info" text>
              {{ scope.row.maxModelTokens || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          prop="maxResponseTokens"
          align="center"
          label="最大回复Token"
          width="160"
        >
          <template #default="scope">
            <el-button type="info" text>
              {{ scope.row.maxResponseTokens || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          prop="proxyUrl"
          align="center"
          label="绑定的代理地址"
          width="140"
        >
          <template #default="scope">
            <el-button type="info" text>
              {{ scope.row.proxyUrl || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          prop="proxyUrl"
          align="center"
          label="变更提示信息"
          width="180"
        >
          <template #default="scope">
            {{ scope.row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          align="center"
          label="添加时间"
          width="120"
        >
          <template #default="scope">
            {{ utcToShanghaiTime(scope.row.createdAt, 'YYYY-MM-DD') }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="200">
          <template #default="scope">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleEditKey(scope.row)"
            >
              变更
            </el-button>
            <el-popconfirm
              title="确认删除此秘钥么?"
              width="180"
              icon-color="red"
              @confirm="handleDeleteKey(scope.row)"
            >
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
          @size-change="queryModelsList"
          @current-change="queryModelsList"
        />
      </el-row>
    </page-main>

    <el-dialog
      v-model="visible"
      :close-on-click-modal="false"
      :title="dialogTitle"
      width="770"
      @close="handlerCloseDialog(formPackageRef)"
    >
      <el-form
        ref="formPackageRef"
        v-loading="modelLoading"
        label-position="right"
        label-width="120px"
        :model="formPackage"
        :rules="rules"
      >
        <!-- <el-form-item label="模型类型选择" prop="keyType">
          <el-select
            v-model="formPackage.keyType"
            placeholder="请选择模型类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in MODELTYPELIST"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item> -->
        <el-form-item label="模型中文名称" prop="modelName">
          <el-input
            v-model="formPackage.modelName"
            placeholder="请填写模型中文名称（用户选择的）"
          />
        </el-form-item>
        <el-form-item label="模型排序" prop="modelOrder">
          <el-input
            v-model.number="formPackage.modelOrder"
            placeholder="模型排序，越大越靠前。"
          />
          <!-- <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                填写此配置可以限制用户在选择模型时候的高级配置中的最大上下文轮次、可以通过限制此数量减少token的损耗、减低上下文的损耗量、
                如果设置了模型的最大token和返回量、那么两个限制会同时生效！
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip> -->
        </el-form-item>
        <el-form-item label="模型启用状态" prop="status">
          <el-switch v-model="formPackage.status" />
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                账号启用状态、一旦锁定当前key将停止工作！
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>

        <el-form-item :label="labelKeyName" prop="key">
          <el-input
            v-model="formPackage.key"
            :type="Number(formPackage.keyType) === 1 ? 'textarea' : 'text'"
            :rows="5"
            placeholder="请填写模型Key"
            style="width: 95%"
          />
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                不同模型的设置不同、例如openai仅设置key即可、如果是百度大模型、则填写clientId以及同时需要填写secret。对于OPENAI模型、我们支持批量导入、如果您需要批量导入key、则一行一个key即可、多个key使用换行隔离、其余配置将共享、多个key可以重复选用默认模型。
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item
          label="SecretKey"
          prop="secret"
          v-if="[2].includes(Number(formPackage.keyType))"
        >
          <el-input
            v-model="formPackage.secret"
            placeholder="请填写模型调用所需的Secret[部分类型模型需要]"
            style="width: 80%"
          />
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                不同账号填写的内容不同、但是都代表的是Secret秘钥
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="账号关联模型" prop="model">
          <el-select
            v-model="formPackage.model"
            filterable
            clearable
            placeholder="请选用或填写绑定的模型"
            :allow-create="Number(formPackage.keyType) === 1"
            style="width: 80%"
          >
            <el-option
              v-for="item in modelList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                给定了部分可选的模型列表、你可以可以手动填写您需要调用的模型、请确保填写的模型是当前key支持的类型、否则可能会在调用中出现不可预知错误！
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="模型扣费类型" prop="deductType">
          <el-select
            v-model="formPackage.deductType"
            filterable
            allow-create
            clearable
            placeholder="请选用模型扣费类型"
            style="width: 80%"
          >
            <el-option
              v-for="item in DEDUCTTYPELIST"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                设置当前key的扣费类型、扣除普通积分或是高级积分。
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="单次扣除金额" prop="deduct">
          <el-input
            v-model.number="formPackage.deduct"
            placeholder="请填写单次调用此key的扣费金额！"
            style="width: 80%"
          />
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                设置当前key的单次调用扣除积分、建议同模型或名称key设置相同的金额、避免扣费发生异常！
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="上下文限制" prop="maxRounds">
          <el-input
            v-model.number="formPackage.maxRounds"
            placeholder="请填写允许用户选择的最高上下文轮次！"
            style="width: 80%"
          />
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                填写此配置可以限制用户在选择模型时候的高级配置中的最大上下文轮次、可以通过限制此数量减少token的损耗、减低上下文的损耗量、
                如果设置了模型的最大token和返回量、那么两个限制会同时生效！
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="调用轮询权重" prop="keyWeight">
          <el-input
            v-model.number="formPackage.keyWeight"
            placeholder="请填写key的权重、数字越大使用评率越高！"
            style="width: 80%"
          />
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                当前轮询是根据模型下的列表按顺序调用、如果权重为2则表示轮到此key的时候会调用两次之后再轮询下一个key
                保证每个key的调用顺序以及限制每次调用的准确次数
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="模型最大Token" prop="maxModelTokens">
          <el-input
            v-model.number="formPackage.maxModelTokens"
            placeholder="请填写模型最大Token、不填写默认使用默认！"
          />
        </el-form-item>
        <el-form-item label="最大回复Token" prop="maxResponseTokens">
          <el-input
            v-model.number="formPackage.maxResponseTokens"
            placeholder="请填写最大回复Token、不填写使用默认！"
          />
        </el-form-item>
        <el-form-item
          label="调用超时时间"
          prop="timeout"
          v-if="[1].includes(Number(formPackage.keyType))"
        >
          <el-input
            v-model.number="formPackage.timeout"
            placeholder="请填写key的超时时间单位（秒）！"
          />
        </el-form-item>
        <el-form-item
          label="设为特殊key"
          prop="isDraw"
          v-if="[1].includes(Number(formPackage.keyType))"
        >
          <el-switch v-model="formPackage.isDraw" />
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                基础绘画来自于OPENAI的DALL-E模型、所以需要为官方的apiKey、请确定至少设置一张key为基础绘画key即可使用绘画功能！同时当前版本的mind思维导图和mj联想绘图等功能都会走当前设置的key，会后后续版本解除此限制！
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item
          label="设为token计费"
          prop="isTokenBased"
          v-if="[1].includes(Number(formPackage.keyType))"
        >
          <el-switch v-model="formPackage.isTokenBased" />
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                基于 token 计费，计费方式为（基础消费 * token消耗）
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="token计费比例" prop="tokenFeeRatio">
          <el-input
            v-model.number="formPackage.tokenFeeRatio"
            placeholder="请填写token计费比例"
            style="width: 80%"
          />
          <el-tooltip class="box-item" effect="dark" placement="right">
            <template #content>
              <div style="width: 250px">
                开启 Token 计费后生效，每积分等价于多少 Token
              </div>
            </template>
            <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item
          label="指定代理地址"
          prop="proxyUrl"
          v-if="[1].includes(Number(formPackage.keyType))"
        >
          <el-input
            v-model.number="formPackage.proxyUrl"
            placeholder="如需使用代理请填写、不填写默认使用全局配置！"
          />
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
