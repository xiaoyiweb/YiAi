<route lang="yaml">
meta:
  title: 后台版权设置
    </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  copyrightTitle: '',
  copyrightUrl: '',
})

const rules = ref<FormRules>({
  copyrightUrl: [{ required: true, trigger: 'blur', message: '请填写底部版权文字内容' }],
  copyrightTitle: [{ required: true, trigger: 'blur', message: '请填写点击底部版本跳转的地址' }],
})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['copyrightUrl', 'copyrightTitle'] })
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
      <el-alert :closable="false" show-icon title="底部版本参数说明" description="当前版本的后台版权信息、文字用于展示、地址用于点击文字的跳转地址" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>底部版权设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="130px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="底部版权文字" prop="copyrightTitle">
              <el-input v-model="formInline.copyrightTitle" placeholder="请填写底部版权文字内容" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="底部跳转地址" prop="copyrightUrl">
              <el-input v-model="formInline.copyrightUrl" placeholder="请填写点击底部版本跳转的地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
