<route lang="yaml">
meta:
  title: 内置敏感词设置
  </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  nineaiBuiltInSensitiveStatus: '',
  nineaiBuiltInSensitiveApiBase: '',
  nineaiBuiltInSensitiveAuthKey: '',
})

const rules = ref<FormRules>({
  nineaiBuiltInSensitiveStatus: [{ required: true, trigger: 'blur', message: '请选择是否启用官方敏感词审核' }],
  nineaiBuiltInSensitiveApiBase: [{ required: true, trigger: 'blur', message: '请填写官方敏感词审核Api地址' }],
  nineaiBuiltInSensitiveAuthKey: [{ required: true, trigger: 'blur', message: '请填写官方敏感词审核授权Key' }],
})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['nineaiBuiltInSensitiveStatus', 'nineaiBuiltInSensitiveAuthKey', 'nineaiBuiltInSensitiveApiBase'] })
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
      <el-alert :closable="false" show-icon title="NineAi敏感词说明" description="官方提供的敏感词检测Api、价格相对实惠、如需使用请联系管理员购买、后续开通专有的通道！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>百度文本审核参数设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="150px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="开启此敏感词设置" prop="nineaiBuiltInSensitiveStatus">
              <el-tooltip content="开启将打开敏感词检测、如果同时开启其他敏感词将会通过菜单顺序仅同时开启一个！" placement="top" :show-after="500">
                <el-switch
                  v-model="formInline.nineaiBuiltInSensitiveStatus"
                  active-value="1"
                  inactive-value="0"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="文本审核ApiKey" prop="nineaiBuiltInSensitiveApiBase">
              <el-input v-model="formInline.nineaiBuiltInSensitiveApiBase" placeholder="请填写官方敏感词审核Api地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="文本审核SecretKey" prop="nineaiBuiltInSensitiveAuthKey">
              <el-input v-model="formInline.nineaiBuiltInSensitiveAuthKey" placeholder="请填写官方敏感词审核授权Key" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
