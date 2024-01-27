<route lang="yaml">
meta:
  title: 开放白名单
</route>

<script setup lang="ts">
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ref } from 'vue'
import ApiUsre from '@/api/modules/user'
import ApiChatgpt from '@/api/modules/chatgpt'
import { ENABLE_STATUS_TYPE_MAP, QUESTION_STATUS_MAP } from '@/constants/index'
import { utcToShanghaiTime } from '@/utils/utcformatTime'

const formPackageRef = ref<FormInstance>()
const activeId = ref(0)

const loading = ref(false)
const visible = ref(false)
const tableData = ref([])
const total = ref(0)

const formUser = reactive({
  page: 1,
  size: 10,
})

const dialogTitle = computed(() => {
  return activeId.value ? '更新用户' : '新增用户'
})

const dialogButton = computed(() => {
  return activeId.value ? '确认更新' : '确认新增'
})

const userList = ref([])

const formWhiteList = reactive({
  userId: '',
  status: 1,
  count: 10,
})

const rules = reactive<FormRules>({
  userId: [{ required: true, message: '请选择白名单用户', trigger: 'change' }],
  status: [{ required: true, message: '请选择当前用户状态', trigger: 'change' }],
  count: [{ required: true, message: '请填写限制使用次数', trigger: 'blur' }],
})

async function handlerSearchUser(val: string) {
  const res = await ApiUsre.queryAllUser({ size: 30, username: val })
  userList.value = res.data.rows
}

async function queryWhiteUserList() {
  try {
    loading.value = true
    const res = await ApiChatgpt.queryWhiteUserList(formUser)
    loading.value = false
    const { rows, count } = res.data
    tableData.value = rows
    total.value = count
  }
  catch (error) {
    loading.value = false
  }
}

function handlerCloseDialog(formEl: FormInstance | undefined) {
  activeId.value = 0
  formEl?.resetFields()
}

function handleEditUser(row: any) {
  activeId.value = row.id
  const { userId, count, status } = row
  nextTick(() => {
    Object.assign(formWhiteList, { userId, count, status })
  })
  visible.value = true
}

function handlerSubmit(formEl: FormInstance | undefined) {
  formEl?.validate(async (valid) => {
    if (valid) {
      if (activeId.value) {
        await ApiChatgpt.updateWhiteUser({ id: activeId.value, ...formWhiteList })
        ElMessage.success('修改白名单用户成功')
      }
      else {
        await ApiChatgpt.addWhiteUser(formWhiteList)
        ElMessage.success('添加白名单用户成功')
      }
      visible.value = false
      queryWhiteUserList()
    }
  })
}

onMounted(() => {
  queryWhiteUserList()
})
</script>

<template>
  <div>
    <page-main>
      <el-alert :closable="false" show-icon title="KEY池说明" description="所有key会按key绑定的模型自动划分为卡池3模型与卡池4模型、key余额耗尽将会自动锁定、每张key支持单独绑定模型与代理、已经上下文长度设置、如果不设置默认以全局配置为准！" type="success" />
      <el-button class="mt-5" type="primary" @click="visible = true">
        添加白名单用户[添加用户可以使用GPT4模型]
      </el-button>
    </page-main>
    <page-main>
      <el-table v-loading="loading" border :data="tableData" style="width: 100%;" size="large">
        <el-table-column prop="username" label="用户昵称" />
        <el-table-column prop="email" label="用户邮箱" />
        <el-table-column prop="useCount" label="调用次数" />
        <el-table-column prop="count" label="剩余额度" />
        <el-table-column prop="status" align="center" label="启用状态">
          <template #default="scope">
            <el-tag :type="ENABLE_STATUS_TYPE_MAP[scope.row.status]">
              {{ QUESTION_STATUS_MAP[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" align="center" label="添加时间">
          <template #default="scope">
            {{ utcToShanghaiTime(scope.row.createdAt, 'YYYY-MM-DD') }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEditUser(scope.row)">
              变更
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-row class="flex justify-end mt-5">
        <el-pagination
          v-model:current-page="formUser.page"
          v-model:page-size="formUser.size"
          class="mr-5"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="queryWhiteUserList"
          @current-change="queryWhiteUserList"
        />
      </el-row>
    </page-main>
    <el-dialog v-model="visible" :close-on-click-modal="false" :title="dialogTitle" width="400" @close="handlerCloseDialog(formPackageRef)">
      <el-form
        ref="formPackageRef"
        label-position="right"
        label-width="100px"
        :model="formWhiteList"
        :rules="rules"
      >
        <el-form-item v-if="!activeId" label="用户昵称" prop="userId">
          <el-select
            v-model="formWhiteList.userId"
            filterable
            clearable
            style="width: 100%;"
            remote
            reserve-keyword
            placeholder="用户姓名[模糊搜索]"
            remote-show-suffix
            :remote-method="handlerSearchUser"
          >
            <el-option
              v-for="item in userList"
              :key="item.id"
              :label="item.username"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="限制次数" prop="count">
          <el-input v-model.number="formWhiteList.count" placeholder="请填写限制用户的访问次数！" @keydown.enter.prevent="handlerSubmit(formPackageRef)" />
        </el-form-item>
        <el-form-item label="启用状态" prop="status">
          <el-switch
            v-model="formWhiteList.status"
            :active-value="1"
            :inactive-value="0"
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
