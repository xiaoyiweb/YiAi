<route lang="yaml">
meta:
  title: Chevereto图床设置
        </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  cheveretoStatus: '',
  cheveretoUploadPath: '',
  cheveretoKey: '',
})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['cheveretoKey', 'cheveretoUploadPath', 'cheveretoStatus'] })
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
      required: Number(formInline.cheveretoStatus) === 1,
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
      <el-alert :closable="false" show-icon title="chevereto图床配置说明" description="chevereto图床官方文档 https://v4-docs.chevereto.com/developer/api/api-v1.html 同时开启多个存储会以菜单排序优先级开启使用" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>chevereto图床参数设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :model="formInline" label-width="100px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="服务启用状态" prop="cheveretoStatus">
              <el-switch
                v-model="formInline.cheveretoStatus"
                active-value="1"
                inactive-value="0"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="上传地址" prop="cheveretoUploadPath" :rules="customRules">
              <el-input v-model="formInline.cheveretoUploadPath" placeholder="请填写您的图床上传地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="ApiKey" prop="cheveretoKey" :rules="customRules">
              <el-input v-model="formInline.cheveretoKey" placeholder="请填写ApiKey" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
