<route lang="yaml">
meta:
  title: 接口请求设置
    </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  openaiBaseUrl: '',
  openaiTimeoutMs: '',
  openaiaAtoDowngrade: 0,
  openaiModel3MaxTokens: '',
  openaiModel3MaxTokensRes: '',
  openaiModel3MaxTokens16k: '',
  openaiModel3MaxTokens16kRes: '',
  openaiModel4MaxTokens: '',
  openaiModel4MaxTokensRes: '',
  openaiModel4MaxTokens32k: '',
  openaiModel4MaxTokens32kRes: '',
})

const rules = ref<FormRules>({
  openaiBaseUrl: [
    { required: false, trigger: 'blur', message: '请填写openai的请求地址' },
  ],
  openaiTimeoutMs: [
    { required: false, trigger: 'blur', message: '请填写openai的超时时间（单位ms）' },
  ],
})
const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['openaiBaseUrl', 'openaiTimeoutMs', 'openaiModel3MaxTokens', 'openaiaAtoDowngrade', 'openaiModel3MaxTokensRes', 'openaiModel3MaxTokens16k', 'openaiModel3MaxTokens16kRes', 'openaiModel4MaxTokens', 'openaiModel4MaxTokensRes', 'openaiModel4MaxTokens32k', 'openaiModel4MaxTokens32kRes'] })
  const { openaiBaseUrl = '', openaiTimeoutMs = '', openaiaAtoDowngrade, openaiModel3MaxTokens, openaiModel3MaxTokensRes, openaiModel3MaxTokens16k, openaiModel3MaxTokens16kRes, openaiModel4MaxTokens, openaiModel4MaxTokensRes, openaiModel4MaxTokens32k, openaiModel4MaxTokens32kRes } = res.data
  Object.assign(formInline, { openaiBaseUrl, openaiTimeoutMs, openaiaAtoDowngrade: Number(openaiaAtoDowngrade), openaiModel3MaxTokens, openaiModel3MaxTokensRes, openaiModel3MaxTokens16k, openaiModel3MaxTokens16kRes, openaiModel4MaxTokens, openaiModel4MaxTokensRes, openaiModel4MaxTokens32k, openaiModel4MaxTokens32kRes })
}

function handlerUpdateConfig() {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        await apiConfig.setConfig({ settings: fotmatSetting(formInline) })
        ElMessage.success('变更配置信息成功')
      }
      catch (error) { }
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
      <el-alert :closable="false" show-icon title="openai全局配置说明" description="系统默认的地址是 https://api.openai.com 、如果你是国内的服务器可能无法访问、您可以使用自己的代理地址、或者免费的 https://open2.aiproxy.xyz 、此处的配置为全局配置、我们可以对单张key进行单独设置、当我们对key不进行设置的时候将会走此处的设置、如果此处也没有设置、系统将会走系统内置默认配置！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>接口请求设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="220px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="请求地址" prop="openaiBaseUrl" label-width="120px">
              <el-input v-model="formInline.openaiBaseUrl" placeholder="默认地址: https://api.openai.com" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="超时时间" prop="openaiTimeoutMs" label-width="120px">
              <el-input v-model="formInline.openaiTimeoutMs" placeholder="openai超时时间设置、默认100s 单位 ms" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider />
        <h4>自动降级</h4>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="是否自动降级" prop="openaiaAtoDowngrade" label-width="100">
              <el-tooltip
                class="box-item"
                effect="dark"
                content="开启自动降级后、如果用户没有4的权限、将会自动降级为基础模型、并扣除3的余额！"
                placement="right"
              >
                <el-switch
                  v-model="formInline.openaiaAtoDowngrade"
                  :active-value="1"
                  :inactive-value="0"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
        <h4>基础模型上下文配置</h4>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="普通基础模型允许最大上下文" prop="openaiModel3MaxTokens">
              <el-input v-model="formInline.openaiModel3MaxTokens" placeholder="普通基础模型最大支持4096、默认4096" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="普通基础模型允许最大回复上下文" prop="openaiModel3MaxTokensRes">
              <el-input v-model="formInline.openaiModel3MaxTokensRes" placeholder="最大回复设置、默认1000、建议不能设置太高！" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="16k基础模型允许最大上下文" prop="openaiModel3MaxTokens16k">
              <el-input v-model="formInline.openaiModel3MaxTokens16k" placeholder="16k基础模型最大支持16384、默认16384" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="16k基础模型允许最大回复上下文" prop="openaiModel3MaxTokens16kRes">
              <el-input v-model="formInline.openaiModel3MaxTokens16kRes" placeholder="16k模型最大回复设置、默认8192" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <h4>高级模型上下文配置</h4>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="普通高级模型允许最大上下文" prop="openaiModel4MaxTokens">
              <el-input v-model="formInline.openaiModel4MaxTokens" placeholder="高级模型上下文最大支持8192、默认8192" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="普通高级模型允许最大回复上下文" prop="openaiModel4MaxTokensRes">
              <el-input v-model="formInline.openaiModel4MaxTokensRes" placeholder="高级模型回复设置、默认4000" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="32k高级模型允许最大上下文" prop="openaiModel4MaxTokens32k">
              <el-input v-model="formInline.openaiModel4MaxTokens32k" placeholder="32k高级模型上下文最大支持32768、默认16384" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="32k高级模型允许最大回复上下文" prop="openaiModel4MaxTokens32kRes">
              <el-input v-model="formInline.openaiModel4MaxTokens32kRes" placeholder="32k高级模型上下文最大回复设置、默认16384" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
