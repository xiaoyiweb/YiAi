<route lang="yaml">
meta:
  title: 显示设置
      </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  appMenuHeaderTips: null,
  appMenuHeaderBgUrl: null,
})

const rules = ref<FormRules>({
  appMenuHeaderTips: [{ required: true, trigger: 'blur', message: '填写应用市场的提示语' }],
  appMenuHeaderBgUrl: [{ required: true, trigger: 'blur', message: '请填写应用市场头部背景图地址' }],
})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['appMenuHeaderTips', 'appMenuHeaderBgUrl'] })
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
      <el-alert :closable="false" show-icon title="客户端UI设置" description="对于用户端各个模块的显隐控制、具体显示部分参考提示！app" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>客户端显示设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="150px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="应用菜单顶部提示语" prop="maxRounds">
              <el-input v-model="formInline.appMenuHeaderTips" placeholder="请填写应用菜单顶部提示语" clearable style="width: 80%;" />
                <el-tooltip
                  class="box-item"
                  effect="dark"
                  placement="right"
                >
                  <template #content>
                    <div style="width: 250px;">
                      用于应用菜单顶部的自定义语句、修改后将生效、不设置则使用默认的！
                    </div>
                  </template>
                  <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
                </el-tooltip>
              </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="应用菜单顶部背景图" prop="maxRounds">
              <el-input v-model="formInline.appMenuHeaderBgUrl" placeholder="请填写应用菜单顶部背景图地址" clearable style="width: 80%;" />
                <el-tooltip
                  class="box-item"
                  effect="dark"
                  placement="right"
                >
                  <template #content>
                    <div style="width: 250px;">
                      用于应用菜单顶部的自定义背景图片地址、修改后将生效、不设置则使用默认的！
                    </div>
                  </template>
                  <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
                </el-tooltip>
              </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
