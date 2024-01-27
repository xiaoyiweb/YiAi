<route lang="yaml">
meta:
  title: 官方微信支付设置
    </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  payWechatStatus: '',
  payWeChatMchId: '',
  payWeChatAppId: '',
  payWeChatSecret: '',
  payWeChatNotifyUrl: '',
  payWeChatH5Url: '',
  payWeChatPublicKey: '',
  payWeChatPrivateKey: '',
})

const rules = ref<FormRules>({
  payWechatStatus: [{ required: true, trigger: 'change', message: '请选择当前支付开启状态' }],
  payWeChatSecret: [{ required: true, trigger: 'blur', message: '请填写支付Secret秘钥' }],
  payWeChatMchId: [{ required: true, trigger: 'blur', message: '请填写商户号' }],
  payWeChatAppId: [{ required: true, trigger: 'blur', message: '请填写AppId' }],
  payWeChatNotifyUrl: [{ required: true, trigger: 'blur', message: '请填写支付通知地址' }],
  payWeChatH5Url: [{ required: true, trigger: 'blur', message: '请填写H5支付通知地址' }],
  payWeChatPublicKey: [{ required: true, trigger: 'blur', message: '请填写支付公钥信息（cert.pem文件）' }],
  payWeChatPrivateKey: [{ required: true, trigger: 'blur', message: '请填写支付私钥地址（key.pem文件）' }],
})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['payWeChatSecret', 'payWeChatNotifyUrl', 'payWeChatH5Url', 'payWeChatAppId', 'payWechatStatus', 'payWeChatMchId', 'payWeChatPublicKey', 'payWeChatPrivateKey'] })
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
      <el-alert :closable="false" show-icon title="官方微信支付参数说明" description="官方微信支付设置、同时开启多个支付、我们以微信支付优先级为最高、在pc端我们会调用native支付、在微信环境内、我们将调用Jsapi支付、请确认您的微信支付已经申请了支付权限、所有的支付通知地址统一为 https://域名/api/pay/notify 将域名修改为您的域名即可！" type="warning" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>官方微信支付参数设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="140px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="启用当前支付" prop="payWechatStatus">
              <el-switch
                v-model="formInline.payWechatStatus"
                active-value="1"
                inactive-value="0"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="商户ID" prop="payWeChatMchId">
              <el-input v-model="formInline.payWeChatMchId" placeholder="请填写商户ID" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="AppId" prop="payWeChatAppId">
              <el-input v-model="formInline.payWeChatAppId" placeholder="请填写AppId" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="商户秘钥" prop="payWeChatSecret">
              <el-input v-model="formInline.payWeChatSecret" placeholder="请填写Secret秘钥" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="支付通知地址" prop="payWeChatNotifyUrl">
              <el-input v-model="formInline.payWeChatNotifyUrl" placeholder="请填写支付通知地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="H5支付通知地址" prop="payWeChatH5Url">
              <el-input v-model="formInline.payWeChatH5Url" placeholder="请填写H5支付通知地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="公钥地址" prop="payWeChatPublicKey">
              <el-input v-model="formInline.payWeChatPublicKey" type="textarea" :rows="6" placeholder="请填写支付公钥信息（cert.pem文件）" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="私钥地址" prop="payWeChatPrivateKey">
              <el-input v-model="formInline.payWeChatPrivateKey" type="textarea" :rows="6" placeholder="请填写支付私钥地址（key.pem文件）" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
