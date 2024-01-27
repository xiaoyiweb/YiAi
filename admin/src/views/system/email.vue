<route lang="yaml">
meta:
  title: 邮件设置
    </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  emailRegisterStatus: '',
  emailLoginStatus: '',
  registerBaseUrl: '',
  registerVerifyEmailTitle: '',
  registerVerifyEmailDesc: '',
  registerVerifyEmailFrom: '',
  registerVerifyExpir: '',
  registerSuccessEmailTitle: '',
  registerSuccessEmailTeamName: '',
  registerSuccessEmaileAppend: '',
  registerFailEmailTitle: '',
  registerFailEmailTeamName: '',
})

const rules = ref<FormRules>({
  registerBaseUrl: [{ required: true, trigger: 'blur', message: '请填写注册后端服务基础地址！' }],
  registerVerifyEmailTitle: [{ required: true, trigger: 'blur', message: '请填写注册验证码的邮箱标题' }],
  registerVerifyEmailFrom: [{ required: true, trigger: 'blur', message: '请填写注册验证码的邮箱来源团队' }],
  registerVerifyEmailDesc: [{ required: true, trigger: 'blur', message: '请填写注册验证码的邮箱正文内容' }],
  registerVerifyExpir: [{ required: true, trigger: 'blur', message: '请填写注册验证码的过期时间' }],
  registerSuccessEmailTitle: [{ required: true, trigger: 'blur', message: '请填写注册成功页的标题' }],
  registerSuccessEmailTeamName: [{ required: true, trigger: 'blur', message: '请填写注册成功页的团队名称' }],
  registerSuccessEmaileAppend: [{ required: true, trigger: 'blur', message: '请填写注册成功页的正文追加内容' }],
  registerFailEmailTitle: [{ required: true, trigger: 'blur', message: '请填写注册失败页的标题名称' }],
  registerFailEmailTeamName: [{ required: true, trigger: 'blur', message: '请填写注册失败页的团队名称' }],
})
const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['registerBaseUrl', 'registerVerifyEmailTitle', 'registerVerifyEmailFrom', 'registerVerifyEmailDesc', 'registerVerifyExpir', 'registerSuccessEmailTitle', 'registerSuccessEmailTeamName', 'registerSuccessEmaileAppend', 'registerFailEmailTitle', 'registerFailEmailTeamName', 'emailRegisterStatus','emailLoginStatus'] })
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
      <el-alert :closable="false" show-icon title="邮件设置说明" description="这里的邮件设置是作用于注册发送的激活邮件、您需要先在服务的env文件中配置邮件服务信息、后续将迁移至此。" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>邮件发送设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="190px">
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="是否开启邮箱登录" prop="emailLoginStatus">
              <el-tooltip
                class="box-item"
                effect="dark"
                content="如您启用当前邮箱登录、则用户端可以通过邮箱登录！"
                placement="right"
              >
                <el-switch
                  v-model="formInline.emailLoginStatus"
                  active-value="1"
                  inactive-value="0"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="是否开启邮箱注册" prop="emailRegisterStatus">
              <el-tooltip
                class="box-item"
                effect="dark"
                content="如您启用当前邮箱注册、则用户端可以通过邮箱注册！"
                placement="right"
              >
                <el-switch
                  v-model="formInline.emailRegisterStatus"
                  active-value="1"
                  inactive-value="0"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <b class="mb-5">注册邮件基础配置</b>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="后端服务BASE_URL" prop="registerBaseUrl">
              <el-input v-model="formInline.registerBaseUrl" placeholder="示例地址: http://ai.xxxx.com 后端服务地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="注册验证码下发邮件标题" prop="registerVerifyEmailTitle">
              <el-input v-model="formInline.registerVerifyEmailTitle" placeholder="默认标题: Nine Ai团队验证码" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="注册验证码下发邮件来源" prop="registerVerifyEmailFrom">
              <el-input v-model="formInline.registerVerifyEmailFrom" placeholder="邮件尾部来源 From: (默认： Nine_Ai_Team)" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="注册时下发邮件详细内容" prop="registerVerifyEmailDesc">
              <el-input v-model="formInline.registerVerifyEmailDesc" type="textarea" :rows="3" placeholder="默认内容(欢迎使用NineTeam团队AI团队的产品服务,请在三十分钟内完成你的账号激活,点击以下按钮激活您的账号) | 发送的邮件内容、会追加一个激活按钮、详细内容请查看文档。    " clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="注册账号验证码有效时间" prop="registerVerifyExpir">
              <el-input v-model.number="formInline.registerVerifyExpir" placeholder="注册验证码的有效时间（默认 30 * 60 = 30分钟）" clearable>
                <template #append>
                  s
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <b class="mb-5 mt-3">注册成功页面基础配置</b>
        </el-row>

        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="注册成功通知页标题内容" prop="registerSuccessEmailTitle">
              <el-input v-model="formInline.registerSuccessEmailTitle" placeholder="默认标题: NineTeam团队账户激活成功" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="注册成功通知页团队名称" prop="registerSuccessEmailTeamName">
              <el-input v-model="formInline.registerSuccessEmailTeamName" placeholder="邮件尾部来源 From: (默认： Nine_Ai_Team)" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="通知页邮件详情追加内容" prop="registerSuccessEmaileAppend">
              <el-input v-model="formInline.registerSuccessEmaileAppend" type="textarea" :rows="3" placeholder="默认内容(亲爱的{{ username }},欢迎加入{{ xx }}团队,您是尊贵的{{ 000x }}号用户，你的账号[username] | [email] 已经激活成功)、此处填写内容将追加至默认内容后方。" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <b class="mb-5 mt-3">注册失败页面基础配置</b>
        </el-row>

        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="注册失败通知页标题内容" prop="registerFailEmailTitle">
              <el-input v-model="formInline.registerFailEmailTitle" placeholder="默认标题: Nine Team团队账户激活失败" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="注册失败通知页团队名称" prop="registerFailEmailTeamName">
              <el-input v-model="formInline.registerFailEmailTeamName" placeholder="邮件尾部来源 From: (默认： Nine_Team_Ai)" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
