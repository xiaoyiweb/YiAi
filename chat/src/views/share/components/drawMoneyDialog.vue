<script setup lang='ts'>
import type { FormInst, FormRules } from 'naive-ui'
import { NButton, NForm, NFormItem, NIcon, NInput, NInputNumber, NModal, NSelect, useMessage } from 'naive-ui'
import { ref } from 'vue'
import { CloseOutline } from '@vicons/ionicons5'
import { fetchAppforMoneyAPI } from '../../../api/sales'
import type { ResData } from '@/api/types'
defineProps<Props>()
const emit = defineEmits<Emit>()
interface Emit {
  (e: 'close'): void
  (e: 'submit'): void
}
interface Props {
  visible: boolean
}
const formRef = ref<FormInst | null>(null)
const message = useMessage()
const options = [
  {
    label: '支付宝',
    value: 1,
  },
  {
    label: '微信',
    value: 2,
  }]

const getDefaultForm = () => {
  return {
    withdrawalAmount: null,
    withdrawalChannels: null,
    contactInformation: '',
    remark: '',
  }
}

const orderForm = ref(getDefaultForm())

const loading = ref(false)

const rules: FormRules = {
  withdrawalAmount: [
    { required: true, message: '请填写你的提款金额！' },
  ],
  withdrawalChannels: [
    { required: true, message: '请选择你的提款渠道！' },
  ],
  contactInformation: [
    { required: true, message: '请填写您的联系方式并备注！', trigger: 'blur' },
  ],
  remark: [
    { required: false, message: '如有特殊情况、请备注说明！', trigger: 'blur' },
  ],
}

/* 重置表单 */
function resetForm() {
  orderForm.value = getDefaultForm()
}

function handlerSubmit() {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        loading.value = true
        const { withdrawalAmount, withdrawalChannels, contactInformation, remark } = orderForm.value
        const res: ResData = await fetchAppforMoneyAPI({ withdrawalAmount, withdrawalChannels, contactInformation, remark })
        if (res.success) {
          message.success('申请提现成功、请耐心等待审核！')
          resetForm()
          emit('submit')
          emit('close')
        }

        loading.value = false
      }
      catch (error) {
        loading.value = false
      }
    }
  })
}

function openDialog() {
}

function handleCloseDialog() {

}

function handleClose() {
  emit('close')
}
</script>

<template>
  <NModal :show="visible" style="width: 90%; max-width: 500px" :on-after-enter="openDialog" :on-after-leave="handleCloseDialog">
    <div class="p-5 bg-white rounded dark:bg-slate-800">
      <span class=" text-lg">
        提款申请表
      </span>
      <div class="absolute top-3 right-3 cursor-pointer z-30" @click="handleClose">
        <NIcon size="20" color="#0e7a0d">
          <CloseOutline />
        </NIcon>
      </div>
      <div class="pt-5">
        <NForm
          ref="formRef"
          :model="orderForm"
          :rules="rules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
          :style="{
            maxWidth: '640px',
          }"
        >
          <NFormItem path="withdrawalAmount" label="提款金额">
            <NInputNumber v-model:value="orderForm.withdrawalAmount" class="w-full" clearable :precision="2" placeholder="请填写提款金额" />
          </NFormItem>
          <NFormItem path="withdrawalChannels" label="提款渠道">
            <NSelect v-model:value="orderForm.withdrawalChannels" placeholder="请选择您的提款渠道！" :options="options" />
          </NFormItem>
          <NFormItem path="contactInformation" label="联系方式">
            <NInput v-model:value="orderForm.contactInformation" type="textarea" :rows="3" placeholder="请填写你的联系方式" />
          </NFormItem>
          <NFormItem path="remark" label="提款备注">
            <NInput v-model:value="orderForm.remark" type="textarea" :rows="3" placeholder="请填写你的提款备注！" />
          </NFormItem>

          <NFormItem class="mt-3">
            <NButton
              block
              type="primary"
              :disabled="loading"
              :loading="loading"
              @click="handlerSubmit"
            >
              申 请 提 现
            </NButton>
          </NFormItem>
        </NForm>
      </div>
    </div>
  </NModal>
</template>
