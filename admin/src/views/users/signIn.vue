<route lang="yaml">
meta:
  title: 签到奖励
    </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  signInStatus: '',
  signInModel3Count: '',
  signInModel4Count: '',
  signInMjDrawToken: '',
})

const rules = ref<FormRules>({
  signInStatus: [
    { required: true, trigger: 'blur', message: '请选择是否开启签到奖励' },
  ],
  signInModel3Count: [
    { required: true, trigger: 'blur', message: '请填写赠送的基础模型额度' },
  ],
  signInModel4Count: [
    { required: true, trigger: 'blur', message: '请填写赠送的高级模型额度' },
  ],
  signInMjDrawToken: [
    { required: true, trigger: 'blur', message: '请填写赠送的绘画Token数量' },
  ],
})
const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['signInStatus', 'signInModel3Count', 'signInModel4Count', 'signInMjDrawToken'] })
  Object.assign(formInline, res.data)
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
      <el-alert :closable="false" show-icon title="签到奖励说明" description="开启签到奖励则会在用户端展示签到入口、用户每日可签到一次、获得对应下方设置的奖励、注意不能为负数不赠送模块可以填为0！" type="warning" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>签到奖励赠送配置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="170px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="开启签到奖励" prop="signInStatus">
              <el-tooltip
                class="box-item"
                effect="dark"
                content="如您启用签到奖励、则用户端则可以通过每日签到获取额度！"
                placement="right"
              >
                <el-switch
                  v-model="formInline.signInStatus"
                  active-value="1"
                  inactive-value="0"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="赠送基础模型额度" prop="signInModel3Count">
              <el-input v-model="formInline.signInModel3Count" type="number" placeholder="请填写签到赠送的基础模型额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="赠送高级模型额度" prop="signInModel4Count">
              <el-input v-model="formInline.signInModel4Count" type="number" placeholder="请填写签到赠送的高级模型额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="赠送绘画额度" prop="signInMjDrawToken">
              <el-input v-model="formInline.signInMjDrawToken" type="number" placeholder="请填写签到赠送绘画额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
