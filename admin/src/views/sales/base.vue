<route lang="yaml">
meta:
  title: 分销系统基础设置
      </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  salesBaseRatio: 10,
  salesSeniorRatio: 30,
  salesAllowDrawMoney: 10,
  salesBaseTitle: '新秀分销商',
})

const rules = ref<FormRules>({
  salesBaseRatio: [{ required: true, trigger: 'blur', message: '请填写默认佣金比例' }],
  salesSeniorRatio: [{ required: true, trigger: 'blur', message: '请填写高级代理默认比例' }],
  salesBaseTitle: [{ required: true, trigger: 'blur', message: '请填写默认用户推介等级名称' }],
})
const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['salesBaseRatio', 'salesSeniorRatio', 'salesAllowDrawMoney', 'salesBaseTitle'] })
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
      <el-alert :closable="false" show-icon title="分销系统基础配置" description="填写默认佣金比例和高级分销佣金比例会对应显示到客户端的分销页面、同时新用户将使用默认分销比例、允许提现额度限制用户最低提现金额、分销名称同样对应分销页面、高级代理可自定义名称！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>分销系统基础设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :model="formInline" label-width="140px" :rules="rules">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="默认分销佣金比例" prop="salesBaseRatio">
              <el-input-number v-model="formInline.salesBaseRatio" :max="100" :min="0" :step="5" step-strictly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="高级分销佣金比例" prop="salesSeniorRatio">
              <el-input-number v-model="formInline.salesSeniorRatio" :max="100" :min="0" :step="5" step-strictly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="允许最低提现金额" prop="salesAllowDrawMoney">
              <el-input v-model="formInline.salesAllowDrawMoney" type="number" step-strictly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="默认等级分销名称" prop="salesBaseTitle">
              <el-input v-model="formInline.salesBaseTitle" placeholder="请填写SecretKey" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
