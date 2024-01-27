<route lang="yaml">
meta:
  title: 注册设置
      </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  isVerifyEmail: '',
  emailRegisterStatus: '',
  registerSendStatus: '',
  registerSendModel3Count: '',
  registerSendModel4Count: '',
  registerSendDrawMjCount: '',
  firstRegisterSendStatus: 0,
  firstRegisterSendRank: '',
  firstRregisterSendModel3Count: '',
  firstRregisterSendModel4Count: '',
  firstRregisterSendDrawMjCount: '',
  inviteSendStatus: 1,
  inviteGiveSendModel3Count: '',
  inviteGiveSendModel4Count: '',
  inviteGiveSendDrawMjCount: '',
  invitedGuestSendModel3Count: '',
  invitedGuestSendModel4Count: '',
  invitedGuestSendDrawMjCount: '',
})

const rules = ref<FormRules>({
  isVerifyEmail: [{ required: true, trigger: 'change', message: '请确认是否开启邮箱验证' }],
  registerSendStatus: [{ required: true, trigger: 'change', message: '请确认是否开启注册赠送' }],
  firstRegisterSendStatus: [{ required: true, trigger: 'change', message: '请确认是否开启优先注册赠送' }],
  inviteSendStatus: [{ required: true, trigger: 'change', message: '请确认是否开启邀请注册赠送' }],
})
const formRef = ref<FormInstance>()
async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['isVerifyEmail', 'registerSendStatus', 'registerSendModel3Count', 'registerSendModel4Count', 'registerSendDrawMjCount', 'firstRegisterSendStatus', 'firstRegisterSendRank', 'firstRregisterSendModel3Count', 'firstRregisterSendModel4Count', 'firstRregisterSendDrawMjCount', 'inviteSendStatus', 'inviteGiveSendModel3Count', 'inviteGiveSendModel4Count', 'inviteGiveSendDrawMjCount', 'invitedGuestSendModel3Count', 'invitedGuestSendModel4Count', 'invitedGuestSendDrawMjCount'] })
  res.data.firstRegisterSendStatus && (res.data.firstRegisterSendStatus = Number(res.data.firstRegisterSendStatus))
  res.data.registerSendStatus && (res.data.registerSendStatus = Number(res.data.registerSendStatus))
  res.data.isVerifyEmail && (res.data.isVerifyEmail = Number(res.data.isVerifyEmail))
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

const firstSendRules = computed(() => {
  return [
    {
      required: formInline.firstRegisterSendStatus,
      message: '开启优先注册赠送选项后需填写此项',
      trigger: 'change',
    },
  ]
})
const inviteRules = computed(() => {
  return [
    {
      required: Number(formInline.inviteSendStatus) === 1,
      message: '开启邀请赠送选项后需填写此项',
      trigger: 'change',
    },
  ]
})
const registerSendRules = computed(() => {
  return [
    {
      required: formInline.registerSendStatus,
      message: '开启注册赠送选项后需填写此项',
      trigger: 'change',
    },
  ]
})

onMounted(() => {
  queryAllconfig()
})
</script>

<template>
  <div>
    <page-main>
      <el-alert :closable="false" show-icon title="注册设置说明" description="可以设置注册赠送的默认额度、包含对话次数、普通绘画额度、绘画额度、并且可以设置前x名用户获得更多额度、包含设置邀请和被邀请次数等！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>注册设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="220px">
        <h5>邮件校验状态</h5>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="是否关闭邮箱验证" prop="isVerifyEmail">
              <el-tooltip
                class="box-item"
                effect="dark"
                content="打开即为关闭邮箱校验、后续注册将直接成功、请谨慎打开此功能！"
                placement="right"
              >
                <el-switch
                  v-model="formInline.isVerifyEmail"
                  :active-value="0"
                  :inactive-value="1"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider />

        <h5>注册赠送</h5>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="是否开启注册赠送" prop="registerSendStatus">
              <el-switch
                v-model="formInline.registerSendStatus"
                :active-value="1"
                :inactive-value="0"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="注册赠送基础模型对话额度" prop="registerSendModel3Count" :rules="registerSendRules">
              <el-input v-model="formInline.registerSendModel3Count" placeholder="首次注册赠基础模型对话额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="注册赠送高级模型对话额度" prop="registerSendModel4Count" :rules="registerSendRules">
              <el-input v-model="formInline.registerSendModel4Count" placeholder="首次注册赠高级模型对话额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="注册赠送绘画额度" prop="registerSendDrawMjCount" :rules="registerSendRules">
              <el-input v-model="formInline.registerSendDrawMjCount" placeholder="首次注册赠送MJ额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider />
        <h5>限定注册赠送</h5>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="开启优先注册赠送" prop="firstRegisterSendStatus">
              <el-switch
                v-model="formInline.firstRegisterSendStatus"
                :active-value="1"
                :inactive-value="0"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="前多少名获得奖励" prop="firstRegisterSendRank" :rules="firstSendRules">
              <el-input v-model="formInline.firstRegisterSendRank" placeholder="设置优先注册前N名可以获得奖励" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="优先赠基础模型送对话额度" prop="firstRregisterSendModel3Count" :rules="firstSendRules">
              <el-input v-model="formInline.firstRregisterSendModel3Count" placeholder="优先注册用户额外赠送基础模型对话额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="优先赠高级模型送对话额度" prop="firstRregisterSendModel4Count" :rules="firstSendRules">
              <el-input v-model="formInline.firstRregisterSendModel4Count" placeholder="优先注册用户额外赠送高级模型对话额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="优先赠送绘画额度" prop="firstRregisterSendDrawMjCount" :rules="firstSendRules">
              <el-input v-model="formInline.firstRregisterSendDrawMjCount" placeholder="优先注册用户额外赠送MJ额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider />
        <h5>邀请注册赠送</h5>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="开启邀请注册赠送" prop="inviteSendStatus">
              <el-switch
                v-model="formInline.inviteSendStatus"
                active-value="1"
                inactive-value="0"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="邀请赠送基础模型对话额度" prop="inviteGiveSendModel3Count" :rules="inviteRules">
              <el-input v-model="formInline.inviteGiveSendModel3Count" placeholder="邀请注册用户赠送基础模型对话额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="邀请赠送高级模型对话额度" prop="inviteGiveSendModel4Count" :rules="inviteRules">
              <el-input v-model="formInline.inviteGiveSendModel4Count" placeholder="邀请注册用户赠送高级模型对话额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="邀请赠送绘画积分额度" prop="inviteGiveSendDrawMjCount" :rules="inviteRules">
              <el-input v-model="formInline.inviteGiveSendDrawMjCount" placeholder="邀请注册用户赠送MJ额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="被邀请赠送基础模型对话额度" prop="invitedGuestSendModel3Count" :rules="inviteRules">
              <el-input v-model="formInline.invitedGuestSendModel3Count" placeholder="被邀请注册用户赠送基础模型对话额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="被邀请赠送高级模型对话额度" prop="invitedGuestSendModel4Count" :rules="inviteRules">
              <el-input v-model="formInline.invitedGuestSendModel4Count" placeholder="被邀请注册用户赠送高级模型对话额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="被邀请赠送绘画额度" prop="invitedGuestSendDrawMjCount" :rules="inviteRules">
              <el-input v-model="formInline.invitedGuestSendDrawMjCount" placeholder="被邀请注册用户赠送额度" clearable />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<style>
.tips {
  font-size: 12px;
  color: #7a7474;
  margin-left: 14px;
}
</style>
