<route lang="yaml">
meta:
  title: MJ设置
  </route>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiConfig from '@/api/modules/config'

const formInline = reactive({
  mjTimeoutMs: '', // 接口超时时间
  mjProxy: '0',
  mjProxyUrl: '',
  mjLimitCount: null,
  mjProxyImgUrl: '',
  mjNotSaveImg: '0',
  mjUseBaiduFy: '0',
  mjHideNotBlock: '0',
  mjHideWorkIn: '0'
})

const rules = ref<FormRules>({})

const formRef = ref<FormInstance>()

async function queryAllconfig() {
  const res = await apiConfig.queryConfig({ keys: ['mjTimeoutMs', 'mjProxy', 'mjProxyUrl','mjLimitCount','mjNotSaveImg','mjProxyImgUrl','mjUseBaiduFy','mjHideNotBlock','mjHideWorkIn'] })
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
      <el-alert :closable="false" show-icon title="MJ参数说明" description="如果您是海外服务器则不强制开启代理、反之则需要开启代理、代理为系统配套项目、非常规代理、如果您想自己搭建代理请查看教程、如果您想使用系统提供的默认代理、那么选择开启代理并且不填写代理地址即可使用默认地址、如果想获取默认地址请在售后群获取地址！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>MJ参数设置</b>
          <el-button class="button" text @click="handlerUpdateConfig">
            保存设置
          </el-button>
        </div>
      </template>
      <el-form ref="formRef" :rules="rules" :model="formInline" label-width="150px">
        <h4>绘图代理设置</h4>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="是否开启代理" prop="mjProxy">
              <el-switch
                v-model="formInline.mjProxy"
                active-value="1"
                inactive-value="0"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="请填写代理地址" prop="mjProxyUrl" label-width="150">
              <el-input v-model="formInline.mjProxyUrl" placeholder="请填写代理地址、详细使用请访问教程！" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="绘画超时时间设置ms" prop="mjTimeoutMs" label-width="150">
              <el-input v-model="formInline.mjTimeoutMs" placeholder="请设置绘画超时时间、单位为ms、根据慢速快速定义（后续优化逻辑）" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider />
        <h4>绘图并发设置</h4>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="单人绘图并发限制" prop="mjLimitCount" label-width="150">
              <el-input v-model="formInline.mjLimitCount" placeholder="单人同时绘制限制数量、同一时间最多可以绘制几张！" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider />
        <h4>绘图可选设置</h4>

        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="描述词使用百度翻译" prop="mjUseBaiduFy" label-width="150" >
                <el-switch
                v-model="formInline.mjUseBaiduFy"
                active-value="1"
                inactive-value="0"
              />
              <el-tooltip
                class="box-item"
                effect="dark"
                placement="right"
              >
                <template #content>
                  <div style="width: 250px;">
                    mj描述词的翻译默认设置为AI翻译、如果您想使用百度翻译请打开此选项并且在下面的百度翻译中配置上所需参数。
                  </div>
                </template>
                <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>

          <el-row>
            <el-col :xs="24" :md="20" :lg="15" :xl="12">
              <el-form-item label="隐藏不需要元素模块" prop="mjHideNotBlock" label-width="150" >
                  <el-switch
                  v-model="formInline.mjHideNotBlock"
                  active-value="1"
                  inactive-value="0"
                />
                <el-tooltip
                  class="box-item"
                  effect="dark"
                  placement="right"
                >
                  <template #content>
                    <div style="width: 250px;">
                      隐藏客户端绘图页面的不需要的元素模块、隐藏后用户不可选择无法选中模块
                    </div>
                  </template>
                  <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
                </el-tooltip>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>

          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="隐藏工作中内容模块" prop="mjHideWorkIn" label-width="150" >
                <el-switch
                v-model="formInline.mjHideWorkIn"
                active-value="1"
                inactive-value="0"
              />
              <el-tooltip
                class="box-item"
                effect="dark"
                placement="right"
              >
                <template #content>
                  <div style="width: 250px;">
                    客户端绘图页面隐藏掉工作中模块、将不再展示给用户此模块。
                  </div>
                </template>
                <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />
        <h4>图片存储设置</h4>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="不存储图片" prop="mjNotSaveImg">
              <el-switch
                v-model="formInline.mjNotSaveImg"
                active-value="1"
                inactive-value="0"
              />
              <el-tooltip
                class="box-item"
                effect="dark"
                placement="right"
              >
                <template #content>
                  <div style="width: 250px;">
                    默认会存储图片到配置的存储中、如果开启此选择则表示不保存原图到我们配置的存储上、那么则必须配置一个图片反代地址、直接反代访问原始图片、这样可以进一步节省空间、需要您部署mj-proxy项目并填写基础地址即可！
                  </div>
                </template>
                <el-icon class="ml-3 cursor-pointer"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :md="20" :lg="15" :xl="12">
            <el-form-item label="图片反代地址" prop="mjProxyImgUrl" label-width="150">
              <el-input v-model="formInline.mjProxyImgUrl" placeholder="图片反代地址、用于代理访问图片、此项目请自行部署mj-proxy项目配置其中的地址即可！" clearable  style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>
