<route lang="yaml">
meta:
  title: key列表
  </route>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue'
import { type FormInstance } from 'element-plus'
import ApiSales from '@/api/modules/sales'

import { ORDER_STATUS_OPTIONS, WITHDRAW_CHANNEL_OPTIONS } from '@/constants/index'

const formRef = ref<FormInstance>()
const total = ref(0)
const loading = ref(false)

const formInline = reactive({
  orderStatus: 0,
  withdrawalChannels: null,
  page: 1,
  size: 10,
})

interface OrderInfo {
  id: number
  withdrawalChannels: number
  withdrawalAmount: number
  userId: number
  remark: string
  contactInformation: string
  auditStatus: number
  auditUserId: number
  createdAt: Date
  updatedAt: Date
  userInfo: {
    avatar: string
    username: string
    email: string
  }
}

const tableData = ref<OrderInfo[]>([])

async function querySalesOrders() {
  try {
    loading.value = true
    const res = await ApiSales.querySalesOrder(formInline)
    loading.value = false
    const { rows, count } = res.data
    total.value = count
    tableData.value = rows
  }
  catch (error) {
    loading.value = false
  }
}

function handlerReset(formEl: FormInstance | undefined) {
  formEl?.resetFields()
  querySalesOrders()
}

/* 审核 */
async function handleAudit(row: OrderInfo, status: number) {
  const { id } = row
  const params = {
    id,
    status,
  }
  await ApiSales.salesAuditOrder(params)
  querySalesOrders()
}

onMounted(() => {
  querySalesOrders()
})
</script>

<template>
  <div>
    <page-main>
      <el-form ref="formRef" :inline="true" :model="formInline">
        <el-form-item label="工单状态" prop="orderStatus">
          <el-select v-model="formInline.orderStatus" placeholder="请选择工单状态" clearable>
            <el-option v-for="item in ORDER_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="提现渠道" prop="withdrawalChannels">
          <el-select v-model="formInline.withdrawalChannels" placeholder="请选择提现渠道" clearable>
            <el-option v-for="item in WITHDRAW_CHANNEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="querySalesOrders">
            查询
          </el-button>
          <el-button @click="handlerReset(formRef)">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </page-main>
    <page-main>
      <el-alert show-icon title="提现审核说明" description="所有工单只可审核一次、请准确操作、打款请人工打款、确定打款后点击审核通过即可！" type="success" />
    </page-main>
    <page-main style="width: 100%;">
      <el-table v-loading="loading" border :data="tableData" style="width: 100%;" size="large">
        <el-table-column prop="userInfo.avatar" label="头像" width="120">
          <template #default="scope">
            <img :src="scope.row?.userInfo?.avatar" style="height: 50px;">
          </template>
        </el-table-column>
        <el-table-column prop="withdrawalChannels" align="center" label="提现渠道">
          <template #default="scope">
            <el-tag :type="scope.row?.withdrawalChannels === 1 ? '' : 'success'">
              {{ scope.row?.withdrawalChannels === 1 ? '支付宝' : '微信' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userInfo.email" label="邮箱" width="200" />
        <el-table-column prop="withdrawalAmount" align="center" label="提现金额" />

        <el-table-column prop="contactInformation" align="center" label="提现备注" width="340" />
        <el-table-column prop="remark" align="center" label="提现留言" width="340" />
        <el-table-column prop="orderStatus" align="center" label="工单状态" width="140">
          <template #default="scope">
            <el-tag :type="scope.row?.orderStatus === 0 ? '' : scope.row?.orderStatus === 1 ? 'success' : 'danger'">
              {{ scope.row?.orderStatus === 0 ? '待审核' : scope.row?.orderStatus === 1 ? '已通过' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column prop="paymentStatus" align="center" label="打款状态" width="140">
            <template #default="scope">
              <el-tag :type="scope.row?.paymentStatus === 0 ? '' : scope.row?.paymentStatus === 1 ? 'success' : 'danger'">
                {{ scope.row?.paymentStatus === 0 ? '待打款' : scope.row?.paymentStatus === 1 ? '已打款' : '拒绝打款' }}
              </el-tag>
            </template>
          </el-table-column> -->

        <el-table-column fixed="right" label="审核" width="200" align="center">
          <template #default="scope">
            <el-popconfirm title="确认通过审核吗、请您先手动打款后通过！" width="260" icon-color="red" @confirm="handleAudit(scope.row, 1)">
              <template #reference>
                <el-button link type="primary" size="small" :disabled="scope.row.orderStatus !== 0">
                  通过审核
                </el-button>
              </template>
            </el-popconfirm>

            <el-popconfirm title="确认拒绝审核么、拒绝后此次提交将作废！" width="260" icon-color="red" @confirm="handleAudit(scope.row, -1)">
              <template #reference>
                <el-button link type="danger" size="small" :disabled="scope.row.orderStatus !== 0">
                  拒绝审核
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <el-row class="flex justify-end mt-5">
        <el-pagination
          v-model:current-page="formInline.page"
          v-model:page-size="formInline.size"
          class="mr-5"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="querySalesOrders"
          @current-change="querySalesOrders"
        />
      </el-row>
    </page-main>
  </div>
</template>
