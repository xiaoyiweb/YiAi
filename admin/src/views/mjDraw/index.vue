<route lang="yaml">
meta:
  title: MJ设置
  </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  mjId: '',
  mjApplicationId: '',
  mjGuildId: '',
  mjChannelId: '',
  mjSessionId: '',
  mjVersion: '',
  mjAuthorization: '',
  mjRateLimit: '', // 接口限制速率时间
})

const rules = ref<FormRules>({
  mjApplicationId: [{ required: true, trigger: 'blur', message: '请填写应用ID' }],
  mjGuildId: [{ required: true, trigger: 'blur', message: '请填写工会ID' }],
  mjChannelId: [{ required: true, trigger: 'blur', message: '请填写通道ID' }],
  mjSessionId: [{ required: true, trigger: 'blur', message: '请填写绘画ID' }],
  mjVersion: [{ required: true, trigger: 'blur', message: '请填写版本ID' }],
  mjId: [{ required: true, trigger: 'blur', message: '请填写基础ID' }],
  mjAuthorization: [{ required: true, trigger: 'blur', message: '请填写授权令牌' }],
})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['mjApplicationId', 'mjGuildId', 'mjChannelId', 'mjId', 'mjSessionId', 'mjVersion', 'mjAuthorization', 'mjRateLimit'] })
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
      <el-alert :closable="false" show-icon title="MJ参数说明" description="详细配置请参考说明文档、当前暂未开放卡池、单个账号并发默认为三、如果您是更高的等级账号请在.env文件下添加 CONCURRENCY=3 此环境变量修改并发数、我们会为您默认开启队列、人数超过限制将需要进行排队！" type="success" />
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
            <el-form-item label="id" prop="mjId">
              <el-input v-model="formInline.mjId" placeholder="请填写ID信息" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="guildId" prop="mjGuildId">
              <el-input v-model="formInline.mjGuildId" placeholder="请填写工会ID" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="channelId" prop="mjChannelId">
              <el-input v-model="formInline.mjChannelId" placeholder="请填写通道ID" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="sessionId" prop="mjSessionId">
              <el-input v-model="formInline.mjSessionId" placeholder="请填写会话ID" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="version" prop="mjVersion">
              <el-input v-model="formInline.mjVersion" placeholder="请填写版本信息" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="authorization" prop="mjAuthorization">
              <el-input v-model="formInline.mjAuthorization" placeholder="请填写授权令牌" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="applicationId" prop="mjApplicationId">
              <el-input v-model="formInline.mjApplicationId" placeholder="请填写应用程序ID" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
