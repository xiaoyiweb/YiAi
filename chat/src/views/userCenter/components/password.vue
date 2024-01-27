<script setup lang="ts">
import type { FormInst, FormItemInst, FormItemRule, FormRules } from 'naive-ui'
import { NButton, NCard, NForm, NFormItem, NGrid, NGridItem, NInput, useMessage } from 'naive-ui'
import { ref } from 'vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAuthStore } from '@/store'
import { fetchUpdatePasswordAPI } from '@/api'
import type { ResData } from '@/api/types'

interface ModelType {
  oldPassword: string
  password: string
  reenteredPassword: string
}

const modelRef = ref<ModelType>({
  oldPassword: '',
  password: '',
  reenteredPassword: '',
})
const model = modelRef

const formRef = ref<FormInst | null>(null)

const rPasswordFormItemRef = ref<FormItemInst | null>(null)

const rules: FormRules = {
  oldPassword: [
    {
      required: true,
      min: 6,
      message: '密码最短长度为6位数',
      trigger: ['blur'],
    },
    {
      required: true,
      max: 30,
      message: '密码最长长度为30位数',
      trigger: ['blur'],
    },
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
    },
  ],
  reenteredPassword: [
    {
      required: true,
      message: '请再次输入密码',
      trigger: ['input', 'blur'],
    },
    {
      validator: validatePasswordStartWith,
      message: '两次密码输入不一致',
      trigger: 'input',
    },
    {
      validator: validatePasswordSame,
      message: '两次密码输入不一致',
      trigger: ['blur', 'password-input'],
    },
  ],
}
function validatePasswordStartWith(
  rule: FormItemRule,
  value: string,
): boolean {
  return (
    !!modelRef.value.password
        && modelRef.value.password.startsWith(value)
        && modelRef.value.password.length >= value.length
  )
}
function validatePasswordSame(rule: FormItemRule, value: string): boolean {
  return value === modelRef.value.password
}
function handlePasswordInput() {
  if (modelRef.value.reenteredPassword)
    rPasswordFormItemRef.value?.validate({ trigger: 'password-input' })
}

const { isSmallXl } = useBasicLayout()
const authStore = useAuthStore()
const ms = useMessage()

async function updatePassword(options: { oldPassword: string; password: string }) {
  const res: ResData = await fetchUpdatePasswordAPI(options)
  if (res.success)
    ms.success('密码更新成功、请重新登录系统！')
  resetForm()
  authStore.updatePasswordSuccess()
}

function resetForm() {
  modelRef.value = {
    oldPassword: '',
    password: '',
    reenteredPassword: '',
  }
}

function handleValidate(e: MouseEvent) {
  e.preventDefault()
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      const { oldPassword, password } = modelRef.value
      updatePassword({ oldPassword, password })
    }
  })
}
</script>

<template>
  <NCard>
    <template #header>
      <div>变更您的密码</div>
    </template>
    <NGrid :x-gap="24" :y-gap="24" :cols=" isSmallXl ? 1 : 3" class="mt-3">
      <NGridItem class="border rounded-sm p-3  dark:border-[#ffffff17]" span="2">
        <NForm ref="formRef" :model="model" :rules="rules">
          <NFormItem path="oldPassword" label="旧密码">
            <NInput v-model:value="model.oldPassword" @keydown.enter.prevent />
          </NFormItem>
          <NFormItem path="password" label="新密码">
            <NInput
              v-model:value="model.password"
              type="password"
              @input="handlePasswordInput"
              @keydown.enter.prevent
            />
          </NFormItem>
          <NFormItem
            ref="rPasswordFormItemRef"
            first
            path="reenteredPassword"
            label="确认密码"
          >
            <NInput
              v-model:value="model.reenteredPassword"
              :disabled="!model.password"
              type="password"
              tabindex="0"
              @keyup.enter="handleValidate"
            />
          </NFormItem>

          <div class="flex justify-between">
            <span class="text-[#95AAC9]">更新密码完成后将重新登录！</span>
            <NButton
              :disabled="model.oldPassword === null"
              type="primary"
              @click="handleValidate"
            >
              更新您的密码
            </NButton>
          </div>
        </NForm>
      </NGridItem>
      <NGridItem class="border rounded-sm p-3  bg-[#f8f9fa] h-48 dark:bg-[#18181c]  dark:border-[#ffffff17]">
        <b class="text-base ">密码要求</b>
        <p class="text-[#95AAC9] mt-3">
          要创建一个新的密码，你必须满足以下所有要求。
        </p>
        <div class="ml-3 text-[#95AAC9] mt-2">
          最少6个字符
        </div>
        <div class="ml-3 text-[#95AAC9] mt-2">
          最多30个字符
        </div>
        <div class="ml-3 text-[#95AAC9] mt-2">
          至少带有一个数字
        </div>
      </NGridItem>
    </NGrid>
  </NCard>
</template>
