<route lang="yaml">
meta:
  title: 动态菜单
    </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const menulist = [
  { label: 'ChatGpt聊天', path: 'Chat' },
  { label: 'Dall-E绘画', path: 'Draw' },
  { label: 'Midjourney绘画', path: 'Midjourney' },
  { label: 'Midjourney广场', path: 'Market' },
  { label: 'mind思维导图', path: 'Mind' },
  { label: '应用广场', path: 'AppStore' },
  { label: '会员中心', path: 'Pay' },
  { label: '推广计划', path: 'Share' },
]

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
  clientMenuList: [],
  clientHomePath: '',
  clientLogoPath: '',
  clientFavoIconPath: '',
})

const rules = ref<FormRules>({
  clientHomePath: [{ required: false, trigger: 'change', message: '请选择项目默认主页地址' }],
  clientMenuList: [{ required: false, trigger: 'change', message: '请选择客户端开放的菜单' }],
  clientLogoPath: [{ required: false, trigger: 'blur', message: '请填写您的网站LOGO图片链接' }],
  clientFavoIconPath: [{ required: false, trigger: 'blur', message: '请填写您的网站favorit.ico网站logo地址' }],
})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['clientHomePath', 'clientMenuList', 'clientLogoPath', 'clientFavoIconPath'] })
  const data = res.data
  data.clientMenuList = data.clientMenuList ? JSON.parse(data.clientMenuList) : []
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

function formatMenuListConfig(key: string, val: any) {
  if (['clientMenuList'].includes(key)) {
    if (!val) {
      return []
    }
    if (val) {
      return JSON.stringify(val)
    }
  }
  else {
    return val
  }
}

function fotmatSetting(settings: any) {
  return Object.keys(settings).map((key) => {
    return {
      configKey: key,
      configVal: formatMenuListConfig(key, settings[key]),
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
      <el-alert :closable="false" show-icon title="动态菜单配置说明" description="动态菜单继承到下方、用户端logo配置在客户端左上角、ico为网站图标请使用svg格式、可以在线转格式！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>客户端动态菜单设置参数设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="130px">
        <!-- <el-row>
          <el-col :xs="24" :md="24" :lg="24" :xl="24">
            <el-form-item label="侧边栏菜单" prop="clientMenuList">
              <el-checkbox-group v-model="formInline.clientMenuList" size="small">
                <el-checkbox v-for="item in menulist" :key="item.path" border :label="item.path">
                  {{ item.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row> -->

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
      </el-form>
    </el-card>
  </div>
</template>
