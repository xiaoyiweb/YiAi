<route lang="yaml">
meta:
  title: key列表
  </route>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import ApiMj from '@/api/modules/mj'
import ApiChat from '@/api/modules/chat'
import { utcToShanghaiTime } from '@/utils/utcformatTime'

import { DRAW_STATUS_MAP, RECOMMEND_STATUS, WITHDRAW_STATUS_OPTIONS } from '@/constants/index'

const formRef = ref<FormInstance>()
const total = ref(0)
const loading = ref(false)

const formInline = reactive({
  rec: null,
  status: null,
  page: 1,
  size: 10,
})

interface OrderInfo {
  id: number
  status: number
  withdrawalAmount: number
  userId: number
  remark: string
  contactInformation: string
  auditStatus: number
  auditUserId: number
  createdAt: Date
  updatedAt: Date
  userInfo: {
    avatar: string
    username: string
    email: string
  }
}

const tableData = ref<OrderInfo[]>([])

async function queryDrawList() {
  try {
    loading.value = true
    const res = await ApiMj.queryAdminDrawList(formInline)
    loading.value = false
    const { rows, count } = res.data
    total.value = count
    tableData.value = rows
  }
  catch (error) {
    loading.value = false
  }
}

function handlerReset(formEl: FormInstance | undefined) {
  formEl?.resetFields()
  queryDrawList()
}

async function recommendDrawImg(id: number) {
  const res = await ApiChat.recMjDrawImg({ id })
  ElMessage.success(res.data)
  queryDrawList()
}

async function handleDelChatLog(id) {
  const res = await ApiChat.delChatLog({ id })
  ElMessage.success(res.data)
  queryDrawList()
}

onMounted(() => {
  queryDrawList()
})
</script>

<template>
  <div>
    <page-main>
      <el-form ref="formRef" :inline="true" :model="formInline">
        <el-form-item label="推荐状态" prop="rec">
          <el-select v-model="formInline.rec" placeholder="请选择推荐状态" clearable>
            <el-option v-for="item in RECOMMEND_STATUS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="绘制状态" prop="status">
          <el-select v-model="formInline.status" placeholder="请选择绘制状态" clearable>
            <el-option v-for="item in WITHDRAW_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryDrawList">
            查询
          </el-button>
          <el-button @click="handlerReset(formRef)">
            重置
          </el-button>
        </el-form-item>
        <span style="float: right;">
          <el-button type="success" @click="queryDrawList">
            刷新列表
          </el-button>
        </span>
      </el-form>
    </page-main>
    <page-main>
      <el-alert show-icon title="MJ绘图历史说明" description="点击推荐的图片将会出现在画廊当中！" type="success" />
    </page-main>
    <page-main style="width: 100%;">
      <el-table v-loading="loading" border :data="tableData" style="width: 100%;" size="large">
        <el-table-column prop="id" align="center" label="ID" width="70" />
        <el-table-column prop="fileInfo.thumbImg" align="center" label="绘图结果">
          <template #default="scope">
            <el-image style="height: 120px;" preview-teleported fit="contain" :preview-src-list="[scope.row?.fileInfo?.cosUrl]" :src="scope.row?.fileInfo?.thumbImg" lazy hide-on-click-modal />
          </template>
        </el-table-column>
        <el-table-column prop="userInfo.username" align="center" label="用户名" width="120" />
        <el-table-column prop="fileInfo.thumbImg" align="center" label="推荐状态" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.rec === 1 ? 'success' : ''">
              {{ scope.row.rec === 1 ? '已推荐' : '未推荐' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userInfo.email" label="邮箱" width="180" align="center" />
        <el-table-column prop="status" align="center" label="绘图状态" width="105">
          <template #default="scope">
            <el-tag :type="scope.row.status === 100 ? 'success' : ''">
              {{ DRAW_STATUS_MAP[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fullPrompt" label="绘图指令" align="center" width="200">
          <template #default="scope">
            <el-popover placement="top" :width="400" trigger="click">
              <template #reference>
                <div class="answer">
                  {{ scope.row.fullPrompt }}
                </div>
              </template>
              <div class="answer_container">
                {{ scope.row.fullPrompt }}
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column prop="progress" align="center" label="绘图进度" width="90" />

        <el-table-column prop="fileInfo.thumbImg" align="center" label="绘图尺寸" width="120">
          <template #default="scope">
            {{ scope.row?.fileInfo ? `${scope.row?.fileInfo?.width}*${scope.row?.fileInfo?.height}` : '---' }}
          </template>
        </el-table-column>
        <el-table-column prop="userInfo.avatar" label="用户头像" width="90">
          <template #default="scope">
            <img :src="scope.row?.userInfo?.avatar" style="height: 50px;">
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提问时间" align="center" width="200">
          <template #default="scope">
            {{ utcToShanghaiTime(scope.row.createdAt, 'YYYY-MM-DD hh:mm:ss') }}
          </template>
        </el-table-column>

        <el-table-column fixed="right" label="操作" width="200" align="center">
          <template #default="scope">
            <el-popconfirm :title="`确认${scope.row.rec === 1 ? '取消推荐' : '推荐'}图片吗！`" width="260" icon-color="red" @confirm="recommendDrawImg(scope.row.id)">
              <template #reference>
                <el-button link :type="scope.row.rec === 1 ? 'success' : '' " size="small">
                  推荐图片
                </el-button>
              </template>
            </el-popconfirm>
            <el-popconfirm title="`确认删除此条记录么！" width="260" icon-color="red" @confirm="handleDelChatLog(scope.row.id)">
              <template #reference>
                <el-button type="warning" size="small">
                  删除记录
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
          @size-change="queryDrawList"
          @current-change="queryDrawList"
        />
      </el-row>
    </page-main>
  </div>
</template>

<style>
.prompt,
.answer {
  width: 100%;
  max-height: 40px;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.answer_container {
  max-height: 500px;
  overflow: overlay;
}
</style>
