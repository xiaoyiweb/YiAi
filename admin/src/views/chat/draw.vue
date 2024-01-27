<route lang="yaml">
meta:
  title: Dall-E绘画管理
</route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import ApiChat from '@/api/modules/chat'
import ApiUsre from '@/api/modules/user'
import { DRAW_MODEL_LIST, RECOMMEND_STATUS_OPTIONS } from '@/constants/index'

const loading = ref(false)
const formRef = ref<FormInstance>()
const total = ref(0)
const userList = ref([])

const formInline = reactive({
  userId: '',
  rec: '',
  model: 'DALL-E2',
  page: 1,
  size: 14,
})

interface Logitem {
  id: number
  userId: number
  answer: string
  thumbImg: string
  rec: number
  model: number
  createdAt: string
  updatedAt: string
}

const tableData = ref<Logitem[]>([])

async function queryAllDrawLog() {
  loading.value = true
  try {
    const res = await ApiChat.queryDrawAll(formInline)
    const { rows, count } = res.data
    loading.value = false

    total.value = count
    tableData.value = rows
  }
  catch (error) {
    loading.value = false
  }
}

async function recommendDrawImg(id) {
  const res = await ApiChat.recDrawImg({ id })
  ElMessage.success(res.data)
  queryAllDrawLog()
}

async function handlerSearchUser(val: string) {
  const res = await ApiUsre.queryAllUser({ size: 30, username: val })
  userList.value = res.data.rows
}

function handlerReset(formEl: FormInstance | undefined) {
  formEl?.resetFields()
  queryAllDrawLog()
}
onMounted(() => {
  queryAllDrawLog()
})
</script>

<template>
  <div>
    <page-main>
      <el-alert :closable="false" show-icon title="DALL-E绘画说明" description="此处的midjourney模型选择是老版本的历史数据、新版迁移至新菜单分开！" type="success" />
    </page-main>
    <page-main>
      <el-form ref="formRef" :inline="true" :model="formInline">
        <el-form-item label="用户名称" prop="userId">
          <el-select
            v-model="formInline.userId"
            filterable
            clearable
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
        <el-form-item label="图片状态" prop="rec">
          <el-select v-model="formInline.rec" placeholder="请选择图片状态" clearable>
            <el-option v-for="item in RECOMMEND_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="绘画模型" prop="model">
          <el-select v-model="formInline.model" placeholder="请选择绘画模型" clearable>
            <el-option v-for="item in DRAW_MODEL_LIST" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryAllDrawLog">
            查询
          </el-button>
          <el-button @click="handlerReset(formRef)">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </page-main>

    <page-main v-loading="loading" style="width: 100%;">
      <div class="flex draw_container">
        <div v-for="item in tableData" :key="item.id" style="height: 280px;" class="draw_img_container flex border">
          <div class="draw_head">
            <el-image fit="contain" :preview-src-list="[item.answer]" :src="item.thumbImg" lazy class="draw_img" hide-on-click-modal />
          </div>
          <div class="draw_footer flex mt-3 justify-between items-center">
            <el-tag class="ml-2" :type="item.rec ? 'success' : 'info'">
              {{ item.rec ? '已推荐' : '未推荐' }}
            </el-tag>
            <el-button type="warning" plain size="small" @click="recommendDrawImg(item.id)">
              {{ item.rec ? '取消推荐' : '加入推荐' }}
              <el-icon v-if="!item.rec">
                <Plus />
              </el-icon>
              <el-icon v-if="item.rec">
                <Minus />
              </el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <el-row class="flex justify-end mt-5">
        <el-pagination
          v-model:current-page="formInline.page"
          v-model:page-size="formInline.size"
          class="mr-5"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="queryAllDrawLog"
          @current-change="queryAllDrawLog"
        />
      </el-row>
    </page-main>
  </div>
</template>

<style lang="less">
.draw_container {
  flex-wrap: wrap;
  min-height: 400px;
}

.draw_img_container {
  max-width: 18%;
  flex-direction: column;
  margin: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 5px;
  .draw_head{
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
  .draw_img {
    width: 100%;
  }

  .draw_footer {
    height: 25px;
  }
}
</style>
