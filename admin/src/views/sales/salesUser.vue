<route lang="yaml">
meta:
  title: 分销佣金账户
  </route>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import ApiSales from '@/api/modules/sales'

const formRef = ref<FormInstance>()
const total = ref(0)
const loading = ref(false)
const visibleCrami = ref(false)
const cramiRef = ref<FormInstance>()

interface SalesUser {
  id: number
  userId: number
  performanceRatio: number
  salesOutletName: string
  totalAmount: number
  withdrawalAmount: number
  distributionBalance: number
  drawMoneyIn: number
  orderCount: number
}

const formSalesUser = reactive({
  performanceRatio: 0,
  salesOutletName: '',
  userId: 0,
})

const formInline = reactive({
  salesOutletName: '',
  performanceRatio: null,
  page: 1,
  size: 10,
})

const rules = reactive<FormRules>({
  performanceRatio: [{ required: true, message: '请填写佣金比例', trigger: 'blur' }],
  salesOutletName: [{ required: true, message: '请填写自定义分销名称', trigger: 'blur' }],
})

const tableData = ref<SalesUser[]>([])

async function querySalesUserList() {
  try {
    loading.value = true
    const res = await ApiSales.querySalesUserList(formInline)
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
  querySalesUserList()
}

/* 修改 */
async function handlerUpdate(formEl: FormInstance | undefined) {
  formEl?.validate(async (valid) => {
    if (!valid) {
      return
    }
    await ApiSales.updateSalesUser(formSalesUser)
    ElMessage.success('修改信息成功！')
    visibleCrami.value = false
    querySalesUserList()
  })
}

/* 审核 */
async function handleUpdateUser(row: SalesUser) {
  const { userId, performanceRatio, salesOutletName } = row
  formSalesUser.performanceRatio = performanceRatio
  formSalesUser.salesOutletName = salesOutletName
  visibleCrami.value = true
  formSalesUser.userId = userId
}

onMounted(() => {
  querySalesUserList()
})
</script>

<template>
  <div>
    <page-main>
      <el-form ref="formRef" :inline="true" :model="formInline">
        <el-form-item label="分销人代号" prop="salesOutletName">
          <el-input v-model="formInline.salesOutletName" placeholder="填写分销人代号搜索" />
        </el-form-item>
        <el-form-item label="返佣比例" prop="performanceRatio">
          <el-input v-model="formInline.performanceRatio" placeholder="填写分销人返佣比例" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="querySalesUserList">
            查询
          </el-button>
          <el-button @click="handlerReset(formRef)">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </page-main>
    <page-main>
      <el-alert show-icon title="佣金账户设置说明" description="佣金设置实时生效、佣金比例用户用户邀请的成员下单后的结算比例、分销人代号会在分销页面展示！" type="success" />
    </page-main>
    <page-main style="width: 100%;">
      <el-table v-loading="loading" border :data="tableData" style="width: 100%;" size="large">
        <el-table-column prop="userInfo.avatar" label="头像" width="120">
          <template #default="scope">
            <img :src="scope.row?.userInfo?.avatar" style="height: 50px;">
          </template>
        </el-table-column>
        <el-table-column prop="userInfo.email" label="邮箱" width="200" />
        <el-table-column prop="salesOutletName" label="分销人代号" width="120" />
        <el-table-column prop="performanceRatio" label="分销人佣金比例" align="center">
          <template #default="scope">
            <el-tag>
              {{ scope.row.performanceRatio }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="累计分销订单量" align="center">
          <template #default="scope">
            <el-tag type="success">
              {{ scope.row.orderCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="分销人账户总金额" align="center" width="150">
          <template #default="scope">
            <el-tag :type=" scope.row.totalAmount > 0 ? 'success' : 'danger'">
              ￥{{ scope.row.totalAmount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="withdrawalAmount" label="分销人已提现金额" align="center" width="150">
          <template #default="scope">
            <el-tag :type=" scope.row.withdrawalAmount > 0 ? 'success' : 'danger'">
              ￥{{ scope.row.withdrawalAmount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="distributionBalance" label="分销人可提现金额" align="center" width="150">
          <template #default="scope">
            <el-tag :type=" scope.row.distributionBalance > 0 ? 'success' : 'danger'">
              ￥{{ scope.row.distributionBalance }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="drawMoneyIn" label="分销人正在提现金额" align="center">
          <template #default="scope">
            <el-tag :type=" scope.row.drawMoneyIn > 0 ? 'success' : 'danger'">
              ￥{{ scope.row.drawMoneyIn }}
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

        <el-table-column fixed="right" label="操作" width="100" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleUpdateUser(scope.row)">
              变更用户
            </el-button>
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
          @size-change="querySalesUserList"
          @current-change="querySalesUserList"
        />
      </el-row>
    </page-main>

    <el-dialog v-model="visibleCrami" title="修改用户权限" width="450px">
      <el-form ref="cramiRef" :model="formSalesUser" :rules="rules" label-width="105px">
        <el-form-item label="佣金比例" prop="performanceRatio">
          <el-input v-model.number="formSalesUser.performanceRatio" type="number" placeholder="设置佣金比例" />
        </el-form-item>
        <el-form-item label="自定义名称" prop="salesOutletName">
          <el-input v-model="formSalesUser.salesOutletName" placeholder="设置自定义名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visibleCrami = false">
          我再想想
        </el-button>
        <el-button type="primary" @click="handlerUpdate(cramiRef)">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
