<route lang="yaml">
meta:
  title: cos设置
    </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  cosSecretId: '',
  cosSecretKey: '',
  cosBucket: '',
  cosRegion: '',
})

const rules = ref<FormRules>({
  cosSecretKey: [{ required: true, trigger: 'blur', message: '请填写SecretKey' }],
  cosBucket: [{ required: true, trigger: 'blur', message: '请填写存储桶名称' }],
  cosRegion: [{ required: true, trigger: 'blur', message: '请填写存储桶所属地域' }],
  cosSecretId: [{ required: true, trigger: 'blur', message: '请填写SecretId' }],
})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['cosSecretKey', 'cosBucket', 'cosRegion', 'cosSecretId'] })
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
      <el-alert :closable="false" show-icon title="COS参数说明" description="当前默认使用腾讯云COS对象存储、如果您有特殊的对接通道、将为您开放API对接！！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>COS参数设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="120px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="SecretId" prop="cosSecretId">
              <el-input v-model="formInline.cosSecretId" placeholder="请填写SecretId" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="SecretKey" prop="cosSecretKey">
              <el-input v-model="formInline.cosSecretKey" placeholder="请填写SecretKey" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="存储桶名称" prop="cosBucket">
              <el-input v-model="formInline.cosBucket" placeholder="请填写存储桶名称" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="所属地域" prop="cosRegion">
              <el-input v-model="formInline.cosRegion" placeholder="请填写所属地域(ap-guangzhou)" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
