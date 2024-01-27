<route lang="yaml">
meta:
  title: key设置
  </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

interface Keyitem {
  configKey: string
  configVal: string
  status: number
}

const keyList = ref<Keyitem[]>([])
const formInline: { chatGptKey: { configKey: string; configVal: string }[] } = reactive({
  chatGptKey: [],
})
const rules = ref<FormRules>({
  chatGptKey: [
    { required: true, trigger: 'blur', message: '请填写您的chatGpt的key' },
  ],
})
const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryGptKeys()
  keyList.value = res.data.map((t) => {
    return {
      configKey: t.configKey,
      configVal: t.configVal,
      status: t.status,
    }
  })
  res.data.length === 0 && handlerAddkey()
  formInline.chatGptKey = keyList.value
}

function handlerAddkey() {
  keyList.value.push({
    configKey: '',
    configVal: '',
    status: 1,
  })
}

function handlerDelkey(index: number) {
  keyList.value.splice(index, 1)
}

function handlerUpdateConfig() {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        await apiConfig.setGptKeys({ configs: keyList.value })
        ElMessage.success('变更配置信息成功')
      }
      catch (error) {}
      queryAllconfig()
    }
    else {
      ElMessage.error('请填写完整信息')
    }
  })
}

onMounted(() => {
  queryAllconfig()
})
</script>

<template>
  <div>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>key池管理</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :model="formInline" label-width="80px">
        <el-row>
          <el-col :xs="24" :md="21" :lg="16" :xl="13">
            <el-form-item v-for="(item, index) in keyList" :key="item.configKey" :label="`key-${index + 1}`" prop="chatGptKey">
              <div class="flex justify-between" style="width: 100%;">
                <el-input v-model="item.configVal" placeholder="请填写您的ChatGpt-Key" clearable class="flex-1" />
                <el-button v-if="keyList.length !== 1" type="danger" plain class="ml-1" @click="handlerDelkey(index)">
                  删除
                </el-button>
                <el-switch v-model="item.status" class="ml-5" :active-value="1" :inactive-value="0" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-button class="mt-5" style="margin-left: 80px;" @click="handlerAddkey">
          添加key
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>
