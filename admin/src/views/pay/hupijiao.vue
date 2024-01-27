<route lang="yaml">
meta:
  title: 虎皮椒支付设置
    </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  payHupiStatus: '',
  payHupiAppId: '',
  payHupiSecret: '',
  payHupiGatewayUrl: '',
  payHupiNotifyUrl: '',
  payHupiReturnUrl: '',
})

const rules = ref<FormRules>({
  payHupiStatus: [{ required: true, trigger: 'change', message: '请选择当前支付开启状态' }],
  payHupiSecret: [{ required: true, trigger: 'blur', message: '请填写支付秘钥' }],
  payHupiGatewayUrl: [{ required: true, trigger: 'blur', message: '请填写网关' }],
  payHupiAppId: [{ required: true, trigger: 'blur', message: '请填写Appid' }],
  payHupiNotifyUrl: [{ required: true, trigger: 'blur', message: '请填写支付通知地址' }],

})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['payHupiSecret', 'payHupiNotifyUrl','payHupiGatewayUrl', 'payHupiReturnUrl', 'payHupiAppId', 'payHupiStatus'] })
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
      <el-alert :closable="false" show-icon title="虎皮椒支付参数说明" description="虎皮椒支付为三方支付、接入请购买微信渠道、详细参数参照 https://www.xunhupay.com/ 目前优先开通微信支付渠道、同时开启开启多种支付、我们将优先按照菜单顺序调用、所有的支付通知地址统一为 https://域名/api/pay/notify 将域名修改为您的域名即可！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>虎皮椒支付参数设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="120px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="启用当前支付" prop="payHupiAppId">
              <el-switch
                v-model="formInline.payHupiStatus"
                active-value="1"
                inactive-value="0"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="支付AppId" prop="payHupiAppId">
              <el-input v-model="formInline.payHupiAppId" placeholder="请填写AppId" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="支付网关地址" prop="payHupiGatewayUrl">
              <el-input v-model="formInline.payHupiGatewayUrl" placeholder="请填写支付网关地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="Secret秘钥" prop="payHupiSecret">
              <el-input v-model="formInline.payHupiSecret" placeholder="请填写支付秘钥" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="支付通知地址" prop="payHupiSecret">
              <el-input v-model="formInline.payHupiNotifyUrl" placeholder="请填写支付通知地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="支付回调地址" prop="payHupiSecret">
              <el-input v-model="formInline.payHupiReturnUrl" placeholder="请填写支付成功后的回跳地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
