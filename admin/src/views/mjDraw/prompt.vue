<route lang="yaml">
meta:
  title: 自定义预设
  </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  mjCustomFanyiPrompt: '',
  mjCustomLianxiangPrompt: '',
})

const rules = ref<FormRules>({})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['mjCustomFanyiPrompt', 'mjCustomLianxiangPrompt'] })
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
      <el-alert :closable="false" show-icon title="MJ参数说明" description="如果您是海外服务器则不强制开启代理、反之则需要开启代理、代理为系统配套项目、非常规代理、如果您想自己搭建代理请查看教程、如果您想使用系统提供的默认代理、那么选择开启代理并且不填写代理地址即可使用默认地址、如果想获取默认地址请在售后群获取地址！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>MJ参数设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="130px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="自定义翻译提示词" prop="mindCustomPrompt">
              <el-input v-model="formInline.mjCustomFanyiPrompt" type="textarea" :rows="10" placeholder="自定义提示词、系统有默认提示词、如果您想覆盖 、请在此处自定义" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-col :xs="24" :md="20" :lg="15" :xl="12">
          <el-form-item label="自定义联想提示词" prop="mindCustomPrompt">
            <el-input v-model="formInline.mjCustomLianxiangPrompt" type="textarea" :rows="10" placeholder="自定义提示词、系统有默认提示词、如果您想覆盖 、请在此处自定义" clearable />
          </el-form-item>
        </el-col>
      </el-form>
    </el-card>
  </div>
</template>
