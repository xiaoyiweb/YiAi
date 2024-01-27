<route lang="yaml">
meta:
  title: 佣金分销明细
  </route>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue'
import { type FormInstance } from 'element-plus'
import ApiSales from '@/api/modules/sales'

const formRef = ref<FormInstance>()
const total = ref(0)
const loading = ref(false)

const formInline = reactive({
  orderPrice: null,
  orderId: null,
  page: 1,
  size: 10,
})

interface OrderInfo {
  id: number
  orderId: number
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

async function querySalesRecords() {
  try {
    loading.value = true
    const res = await ApiSales.queryRecords(formInline)
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
  querySalesRecords()
}

onMounted(() => {
  querySalesRecords()
})
</script>

<template>
  <div>
    <page-main>
      <el-form ref="formRef" :inline="true" :model="formInline">
        <el-form-item label="工单状态" prop="orderPrice">
          <el-input v-model="formInline.orderPrice" placeholder="订单金额" />
        </el-form-item>
        <el-form-item label="订单ID" prop="orderId">
          <el-input v-model="formInline.orderId" placeholder="订单ID、模糊搜索" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="querySalesRecords">
            查询
          </el-button>
          <el-button @click="handlerReset(formRef)">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </page-main>
    <page-main>
      <el-alert show-icon title="分销佣金记录流水" description="每单的佣金会和此用户当前的返佣比例确定、用户返佣比例是可以手动变更的、所以佣金非固定！" type="success" />
    </page-main>
    <page-main style="width: 100%;">
      <el-table v-loading="loading" border :data="tableData" style="width: 100%;" size="large">
        <el-table-column prop="id" label="ID" width="50" />
        <el-table-column prop="inviterAvatar" label="邀请人头像" width="120">
          <template #default="scope">
            <img :src="scope.row?.inviterAvatar" style="height: 50px;">
          </template>
        </el-table-column>
        <el-table-column prop="inviterEmail" label="邀请人邮箱" width="200" />
        <el-table-column prop="inviterUsername" label="邀请人昵称" width="200" />
        <el-table-column prop="inviteeEmail" label="被邀人邮箱" width="200" />
        <el-table-column prop="inviteeUsername" label="邀请人昵称" width="200" />
        <el-table-column prop="orderPrice" align="center" label="订单金额" />
        <el-table-column prop="commissionAmount" align="center" label="佣金金额">
          <template #default="scope">
            <el-tag type="success">
              ￥{{ scope.row?.commissionAmount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="commissionPercentage" align="center" label="佣金比例">
          <template #default="scope">
            {{ `${scope.row.commissionPercentage}%` }}
          </template>
        </el-table-column>

        <!-- <el-table-column fixed="right" label="审核" width="200" align="center">
          <template #default="scope">
            <el-popconfirm title="确认通过审核吗、请您先手动打款后通过！" width="260" icon-color="red" @confirm="handleAudit(scope.row, 1)">
              <template #reference>
                <el-button link type="primary" size="small" :disabled="scope.row.orderPrice !== 0">
                  通过审核
                </el-button>
              </template>
            </el-popconfirm>

            <el-popconfirm title="确认拒绝审核么、拒绝后此次提交将作废！" width="260" icon-color="red" @confirm="handleAudit(scope.row, -1)">
              <template #reference>
                <el-button link type="danger" size="small" :disabled="scope.row.orderPrice !== 0">
                  拒绝审核
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column> -->
      </el-table>
      <el-row class="flex justify-end mt-5">
        <el-pagination
          v-model:current-page="formInline.page"
          v-model:page-size="formInline.size"
          class="mr-5"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="querySalesRecords"
          @current-change="querySalesRecords"
        />
      </el-row>
    </page-main>
  </div>
</template>
