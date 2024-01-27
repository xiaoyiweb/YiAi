<route lang="yaml">
meta:
  title: 基础设置
</route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  baiduCode: '',
  baiduSiteId: '',
  baiduToken: '',
})
const rules = ref<FormRules>({})
const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['baiduCode', 'baiduSiteId', 'baiduToken'] })
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
      <el-alert :closable="false" show-icon title="基础设置说明" description="百度统计默认使用的是demo数据、用于demo展示、最终数据在首页程呈现、请查看部署文档或前往百度统计申请自己的专属key与token、这是免费的服务、如果您不想使用将下面设置留空就行。" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>系统基础设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="120px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="百度统计siteId" prop="baiduSiteId">
              <el-input v-model="formInline.baiduSiteId" placeholder="请填写百度site_id、不会请查看部署文档！" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="百度统计token" prop="baiduToken">
              <el-input v-model="formInline.baiduToken" placeholder="请填写百度access_token、不会请查看部署文档！" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="百度统计代码" prop="baiduCode">
              <el-input v-model="formInline.baiduCode" placeholder="填写百度统计代码可统计每日访问量详情，如果没有使用用请查看详细文档！" type="textarea" :rows="12" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
