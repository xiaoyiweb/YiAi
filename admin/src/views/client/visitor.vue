<route lang="yaml">
meta:
  title: 访客模式设置
      </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  visitorModel3Num: null,
  visitorModel4Num: null,
  visitorMJNum: null,
})

const rules = ref<FormRules>({
  visitorModel3Num: [{ required: true, trigger: 'blur', message: '请填写每日限制的基础模型积分' }],
  visitorModel4Num: [{ required: true, trigger: 'blur', message: '请填写每日限制的高级模型积分' }],
  visitorMJNum: [{ required: true, trigger: 'blur', message: '请填写每日限制的绘画额度积分' }],
})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['visitorModel4Num', 'visitorModel3Num', 'visitorMJNum'] })
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
      <el-alert :closable="false" show-icon title="访客模式设置" description="设置为每日访客限制的访问积分额度、每日凌晨0点刷新新的额度！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>访客模式设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="130px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="基础模型额度" prop="visitorModel3Num">
              <el-input v-model="formInline.visitorModel3Num" type="number" placeholder="请填写每日限制基础模型积分" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="高级模型额度" prop="visitorModel4Num">
              <el-input v-model="formInline.visitorModel4Num" type="number" placeholder="请填写每日限制的高级模型积分" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="绘画积分额度" prop="visitorMJNum">
              <el-input v-model="formInline.visitorMJNum" type="number" placeholder="请填写每日限制的绘画额度积分" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
