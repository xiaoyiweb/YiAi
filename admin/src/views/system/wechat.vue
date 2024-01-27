<route lang="yaml">
meta:
  title: 微信设置
    </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  wechatRegisterStatus: '',
  wechatSilentLoginStatus: '',
  wechatOfficialName: '',
  wechatOfficialAppId: '',
  wechatOfficialToken: '',
  wechatOfficialAppSecret: '',
  officialSubscribeText: '',
  officialBindAccountText: '',
  officialScanLoginText: '',
  officialAutoReplyText: '',
})

const rules = ref<FormRules>({
  wechatOfficialName: [
    { required: false, trigger: 'blur', message: '请填写微信公众号名称' },
  ],
  wechatOfficialAppId: [
    { required: false, trigger: 'blur', message: '请填写微信公众号开发配置 AppId' },
  ],
  wechatOfficialToken: [
    { required: false, trigger: 'blur', message: '请填写微信公众号开发配置 Token' },
  ],
  wechatOfficialAppSecret: [
    { required: false, trigger: 'blur', message: '请填写微信公众号开发配置 AppSecret' },
  ],
})
const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['wechatOfficialName', 'wechatOfficialAppId', 'wechatOfficialToken', 'wechatOfficialAppSecret', 'officialSubscribeText', 'officialBindAccountText', 'officialScanLoginText', 'officialAutoReplyText', 'wechatRegisterStatus', 'wechatSilentLoginStatus'] })
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
      <el-alert :closable="false" show-icon title="微信设置说明[仔细阅读]" description="系统微信登录通过关联公众号实现[请务必注册为服务号、个人公众号没有二维码等此类权限]、以便于后期联动小程序、开发文档前往微信公众平台 https://mp.weixin.qq.com/ 、拿到开发者配置信息即可、如果用户对公众号发送消息、我们将会从自定义回复管理当中的内容进行匹配自动回复、如果没有匹配到结果则回复下面设置的自定义回复默认信息、同时别忘记在微信公众号平台将自己的ip加为ip白名单、配置位置为公众号后台->基本配置：服务复制参考 https://域名/api/official/notify 将域名修改为您的域名 下方Token对应自己后台设置的Token、加密秘钥随机即可、当设置不指定首页并且配置了微信登录即可默认打开静默登录！" type="warning" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>微信开发者配置设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="170px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="是否开启微信登录注册" prop="wechatRegisterStatus">
              <el-tooltip
                class="box-item"
                effect="dark"
                content="如您启用微信注册、则用户端则可以通过微信扫码方式注册或登录！"
                placement="right"
              >
                <el-switch
                  v-model="formInline.wechatRegisterStatus"
                  active-value="1"
                  inactive-value="0"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="是否开启微信静默" prop="wechatSilentLoginStatus">
              <el-tooltip
                class="box-item"
                effect="dark"
                content="如您启用静默登录、则用户在微信环境打开则直接自动登录！"
                placement="right"
              >
                <el-switch
                  v-model="formInline.wechatSilentLoginStatus"
                  active-value="1"
                  inactive-value="0"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="公众号名称" prop="wechatOfficialName">
              <el-input v-model="formInline.wechatOfficialName" placeholder="公众号名称" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="AppId" prop="wechatOfficialAppId">
              <el-input v-model="formInline.wechatOfficialAppId" placeholder="公众号开发信息 AppId" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="Token" prop="wechatOfficialToken">
              <el-input v-model="formInline.wechatOfficialToken" placeholder="公众号Token配置" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="AppSecret" prop="wechatOfficialAppSecret">
              <el-input v-model="formInline.wechatOfficialAppSecret" placeholder="公众号开发信息 AppSecret" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider />
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="订阅公众号欢迎消息" prop="officialSubscribeText">
              <el-input v-model="formInline.officialSubscribeText" type="textarea" :rows="3" placeholder="订阅你的公众号后对他的欢迎语！" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="绑定账号回复消息" prop="officialBindAccountText">
              <el-input v-model="formInline.officialBindAccountText" type="textarea" :rows="3" placeholder="非微信登录用户首次绑定微信的欢迎语" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="扫码登录回复消息" prop="officialScanLoginText">
              <el-input v-model="formInline.officialScanLoginText" type="textarea" :rows="3" placeholder="用户扫码登录成功时自动回复的内容" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="自定义回复的默认信息" prop="officialAutoReplyText">
              <el-input v-model="formInline.officialAutoReplyText" type="textarea" :rows="3" placeholder="当用户对公众号发了消息不在自动回复列表时回复的兜底内容" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
