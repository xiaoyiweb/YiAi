<route lang="yaml">
meta:
  title: 基础设置
</route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'
const homePagePath = [
  { label: 'ChatGpt聊天', path: '/chat' },
  { label: 'Dall-E绘画', path: '/draw' },
  { label: 'Midjourney绘画', path: '/midjourney' },
  { label: 'mj公共预览页', path: '/market' },
  { label: 'mind思维导图', path: '/mind' },
  { label: '应用广场', path: '/app-store' },
  { label: '不指定首页', path: '' },
]
const formInline = reactive({
  siteName: '',
  qqNumber: '',
  vxNumber: '',
  robotAvatar: '',
  userDefautlAvatar: '',
  filingNumber: '',
  companyName: '',
  buyCramiAddress: '',
  siteRobotName: '',
  isShowAppCatIcon: '',
  clientFavoIconPath: '',
  clientLogoPath: '',
  clientHomePath: ''
})
const rules = ref<FormRules>({
  siteName: [
    { required: true, trigger: 'blur', message: '请填写网站名称' },
  ],
})
const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['siteName', 'qqNumber', 'vxNumber', 'robotAvatar', 'userDefautlAvatar', 'buyCramiAddress', 'filingNumber', 'companyName', 'siteRobotName', 'isShowAppCatIcon', 'clientLogoPath','clientFavoIconPath','clientHomePath'] })
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
      <el-alert :closable="false" show-icon title="用户端基础配置说明" description="网站类型设置是实时生效的、这里可以配置网站的logo名称等、购卡地址对应卡密购买、思维导图默认展示属于、机器人名称为对话页的默认AI Robot位置！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>系统基础设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="150px">
        <h5>网站基础信息配置</h5>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="网站名称" prop="siteName">
              <el-input v-model="formInline.siteName" placeholder="网站名称【Nine Ai】" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="网站QQ客服" prop="qqNumber">
              <el-input v-model="formInline.qqNumber" placeholder="网站客服QQ号" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="网站VX客服" prop="vxNumber">
              <el-input v-model="formInline.vxNumber" placeholder="网站客服VX号" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="机器人头像" prop="robotAvatar">
              <el-input v-model="formInline.robotAvatar" placeholder="填写机器人默认头像地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="用户默认头像" prop="userDefautlAvatar">
              <el-input v-model="formInline.userDefautlAvatar" placeholder="填写用户注册时默认头像头像地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="网站公司信息" prop="companyName">
              <el-input v-model="formInline.companyName" placeholder="填写网站备案信息的公司名称" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="网站备案号" prop="filingNumber">
              <el-input v-model="formInline.filingNumber" placeholder="填写网站备案信息的备案号" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="网站购卡地址" prop="buyCramiAddress">
              <el-input v-model="formInline.buyCramiAddress" placeholder="您的网站发卡地址、用于配合卡密使用，用户点击购买卡密的跳转地址、不填写不展示购卡按钮！" clearable />
            </el-form-item>
          </el-col>
        </el-row> -->
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="机器人名称" prop="siteRobotName">
              <el-input v-model="formInline.siteRobotName" placeholder="默认[Ai Robot]、首页默认展示状态下的名称" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="应用分类侧边栏图标" prop="isShowAppCatIcon">
              <el-tooltip content="是否展示应用中心的分类侧边栏图标、配置仅在pc端有效！" placement="top" :show-after="500">
                <el-switch
                  v-model="formInline.isShowAppCatIcon"
                  active-value="1"
                  inactive-value="0"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row> -->
        <el-divider />
        <el-row>
          <el-col :xs="24" :md="24" :lg="24" :xl="24">
            <el-form-item label="用户端LOGO" prop="clientLogoPath">
              <el-input v-model="formInline.clientLogoPath" placeholder="请填写您要设置的网站LOGO图片链接" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :xs="24" :md="24" :lg="24" :xl="24">
            <el-form-item label="用户端ico" prop="clientFavoIconPath">
              <el-input v-model="formInline.clientFavoIconPath" placeholder="请填写您要设置的网站ico地址、格式为svg" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :xs="24" :md="24" :lg="24" :xl="24">
            <el-form-item label="设置指定首页" prop="clientHomePath">
              <el-radio-group v-model="formInline.clientHomePath">
                <el-radio v-for="item in homePagePath" :key="item.path" size="small" border :label="item.path">
                  {{ item.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
