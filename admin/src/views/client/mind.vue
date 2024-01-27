<route lang="yaml">
meta:
  title: 思维导图
</route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  mindDefaultData: '',
  mindCustomPrompt: '',
})
const rules = ref<FormRules>({

})
const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['mindDefaultData', 'mindCustomPrompt'] })
  Object.assign(formInline, res.data)
}

function handlerUpdateConfig() {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        await apiConfig.setConfig({ settings: fotmatSetting(formInline) })
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

function fotmatSetting(settings: any) {
  return Object.keys(settings).map((key) => {
    return {
      configKey: key,
      configVal: settings[key],
    }
  })
}

onMounted(() => {
  queryAllconfig()
})
</script>

<template>
  <div>
    <page-main>
      <el-alert :closable="false" show-icon title="系统基础设置配置说明" description="默认配置数据会在页面加载后初次展示给用户、预设信息系统有内置提示词、如果您想覆盖掉他、则在此处设置您的专属提示词！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>思维导图设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="150px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="思维导图默认数据" prop="mindDefaultData">
              <el-input v-model="formInline.mindDefaultData" type="textarea" :rows="10" placeholder="思维导图的默认展示数据Markdown格式" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="导图自定义提示词" prop="mindCustomPrompt">
              <el-input v-model="formInline.mindCustomPrompt" type="textarea" :rows="10" placeholder="自定义提示词、系统有默认提示词、如果您想覆盖 、请在此处自定义" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
