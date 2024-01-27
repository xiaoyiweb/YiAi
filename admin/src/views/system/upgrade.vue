<route lang="yaml">
meta:
  title: 升级管理
  </route>

<script lang="ts" setup>
import { onMounted } from 'vue'
import apiConfig from '@/api/modules/config'
import apiUserBalance from '@/api/modules/userBalance'

const disabled = ref(true)
const loading = ref(false)

async function getUpgradeStatus() {
  const res = await apiConfig.queryConfig({ keys: ['upgradeStatus'] })
  disabled.value = res.data?.upgradeStatus === '1'
}

async function upgrade() {
  loading.value = true
  const res = await apiUserBalance.upgradeBalance()
  getUpgradeStatus()
  setTimeout(() => {
    getUpgradeStatus()
    loading.value = false
  }, 30000)
}

onMounted(() => {
  getUpgradeStatus()
})
</script>

<template>
  <div v-loading="loading">
    <page-main>
      <el-alert :closable="false" show-icon title="V1.5版本迁移助手" description="如果您是新部署的用户则无需点击、如果是你是老用户升级(1.6版本以下用户)、由于1.5的计费调整、造成了一定破坏性更新、需要在此进行数据迁移、请注意不要刷新网页、当前升级为危险操作、仅可点击一次、点击完成后请等待约一分钟后完成数据同步、我们将会对历史的用户余额、使用额度、基础模型、4、绘画等数据进行迁移、在迁移完成后即可正常工作了、在未迁移前您是无法查看用户管理下面的用户信息的详细余额的、迁移完毕前去访问您可以看到完整的用户信息包含其余额信息！" type="error" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>V1.5版本迁移助手</b>
          <!-- <el-button class="button" text>
            保存设置
          </el-button> -->
        </div>
      </template>
      <el-tooltip :content="` ${disabled ? '您已经升级过了、请勿重复操作' : '当前升级是危险操作、请勿刷新或重复点击、等待加载完成后再进行其他工作！'}`" placement="right" :show-after="100">
        <el-button :disabled="disabled" type="warning" @click="upgrade">
          点击升级
        </el-button>
      </el-tooltip>
    </el-card>
  </div>
</template>
