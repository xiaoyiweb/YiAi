<route lang="yaml">
meta:
  title: 阿里云oss设置
        </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  aliOssStatus: '',
  aliOssAccessKeyId: '',
  aliOssAccessKeySecret: '',
  aliOssRegion: '',
  aliOssBucket: '',
})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['aliOssAccessKeySecret', 'aliOssRegion', 'aliOssBucket', 'aliOssAccessKeyId', 'aliOssStatus'] })
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

const customRules = computed(() => {
  return [
    {
      required: Number(formInline.aliOssStatus) === 1,
      message: '开启配置后请填写此项',
      trigger: 'change',
    },
  ]
})

onMounted(() => {
  queryAllconfig()
})
</script>

<template>
  <div>
    <page-main>
      <el-alert :closable="false" show-icon title="阿里云COS参数说明" description="阿里云的对象存储oss服务、前往阿里云申请oss服务 https://oss.console.aliyun.com/ 、如果同时开启多个存储服务、腾讯云高于阿里云优先级！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>阿里云OSS参数设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :model="formInline" label-width="120px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="服务启用状态" prop="aliOssStatus">
              <el-switch
                v-model="formInline.aliOssStatus"
                active-value="1"
                inactive-value="0"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="accessKeyId" prop="aliOssAccessKeyId" :rules="customRules">
              <el-input v-model="formInline.aliOssAccessKeyId" placeholder="请填写SecretId" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="keySecret" prop="aliOssAccessKeySecret" :rules="customRules">
              <el-input v-model="formInline.aliOssAccessKeySecret" placeholder="请填写SecretKey" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="存储桶名称" prop="aliOssBucket" :rules="customRules">
              <el-input v-model="formInline.aliOssBucket" placeholder="请填写存储桶名称" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="所属地域" prop="aliOssRegion" :rules="customRules">
              <el-input v-model="formInline.aliOssRegion" placeholder="请填写所属地域(oss-cn-shanghai)" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
