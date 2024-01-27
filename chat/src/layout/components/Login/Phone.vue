<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import type { FormInst, FormItemRule, FormRules } from 'naive-ui'
import { NButton, NForm, NFormItem, NInput, useMessage } from 'naive-ui'
import Send from './send.vue'
import { fetchCaptchaImg, fetchLoginByPhoneAPI, fetchRegisterByPhoneAPI, fetchSendSms } from '@/api'
import { useAppStore, useAuthStore } from '@/store'
import { ss } from '@/utils/storage'
import { SvgIcon } from '@/components/common'
import Motion from '@/utils/motion/index'
import { useBasicLayout } from '@/hooks/useBasicLayout'

interface Emit {
  (ev: 'changeLoginType', val: string): void
}
const emit = defineEmits<Emit>()

const appStore = useAppStore()
const formRef = ref<FormInst | null>(null)
const Nmessage = useMessage()
const isLogin = ref(true)
const loading = ref(false)
const authStore = useAuthStore()
const captchaSvg = ref('')
const theme = computed(() => appStore.theme)
const isSendCaptcha = ref(false)
const lastSendPhoneCodeTime = ref(0)

const captchaBgColor = computed(() => {
  return theme.value === 'dark' ? '#363f4f' : '#fff'
})

const registerForm = ref({
  username: '',
  password: '',
  phone: '',
  phoneCode: '',
  invitedBy: '',
  captchaCode: '',
  captchaId: null,
})

const loginForm = ref({
  password: '',
  phone: '',
})

const { isMobile } = useBasicLayout()

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 30, message: '用户名长度应为 2 到 30 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 30, message: '密码长度应为 6 到 30 个字符', trigger: 'blur' },
  ],
  phone: [
    {
      required: true,
      trigger: 'blur',
      validator(rule: FormItemRule, value: string) {
        if (!value)
          return new Error('请输入手机号')

        else if (!/^1[3,4,5,6,7,8,9][0-9]{9}$/.test(value))
          return new Error('请输入正确格式的手机号')

        return true
      },
    },
  ],
  captchaCode: [
    { required: true, message: '请填写图形验证码结果', trigger: 'blur' },
  ],
  phoneCode: [
    { required: true, message: '请填写手机验证码', trigger: 'blur' },
  ],
}
const logTips = computed(() => (isLogin.value ? '还没账号?去注册！' : '已有账号, 去登录！'))
const wechatRegisterStatus = computed(() => Number(authStore.globalConfig.wechatRegisterStatus) === 1)
const phoneRegisterStatus = computed(() => Number(authStore.globalConfig.phoneRegisterStatus) === 1)
const phoneLoginStatus = computed(() => Number(authStore.globalConfig.phoneLoginStatus) === 1)
const emailLoginStatus = computed(() => Number(authStore.globalConfig.emailLoginStatus) === 1)

//  定时器改变倒计时时间方法
function changeLastSendPhoneCodeTime() {
  if (lastSendPhoneCodeTime.value > 0) {
    setTimeout(() => {
      lastSendPhoneCodeTime.value--
      changeLastSendPhoneCodeTime()
    }, 1000)
  }
}

/* 发送验证码 */
async function handleSendCaptch() {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        const { phone, captchaCode, captchaId } = registerForm.value
        const params: any = { phone, captchaCode, captchaId }
        const res: any = await fetchSendSms(params)
        getCaptchaImg()
        const { success, message } = res
        if (success) {
          Nmessage.success(res.data)
          isSendCaptcha.value = true
          // 记录重新发送倒计时
          lastSendPhoneCodeTime.value = 60
          changeLastSendPhoneCodeTime()
        }
        else {
          isSendCaptcha.value = false
          Nmessage.error(message)
        }
      }
      catch (error) {
        getCaptchaImg()
      }
    }
  })
}

/* 注册登录 */
function handlerSubmit() {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        loading.value = true
        const Interface = isLogin.value ? fetchLoginByPhoneAPI : fetchRegisterByPhoneAPI
        const params: any = !isLogin.value ? registerForm.value : { phone: loginForm.value.phone, password: loginForm.value.password }
        const res: any = await Interface(params)
        loading.value = false
        getCaptchaImg()

        const { success, message } = res
        if (!success)
          return Nmessage.error(message)
        if (!isLogin.value) {
          Nmessage.success('账户注册成功、开始体验吧！')
          const { phone, password } = registerForm.value
          loginForm.value.phone = phone
          loginForm.value.password = password
          isLogin.value = !isLogin.value
        }
        else {
          Nmessage.success('账户登录成功、开始体验吧！')
          authStore.setToken(res.data)
          authStore.getUserInfo()
          authStore.setLoginDialog(false)
          if(isMobile.value){
            window.location.reload()
          }
          ss.remove('invitedBy')
        }
      }
      catch (error) {
        getCaptchaImg()
        loading.value = false
      }
    }
  })
}

async function getCaptchaImg() {
  const res: any = await fetchCaptchaImg({ color: captchaBgColor.value })
  captchaSvg.value = res.data.svgCode
  registerForm.value.captchaId = res.data.code
}

onMounted(() => {
  const code = ss.get('invitedBy')
  code && (registerForm.value.invitedBy = code)
  getCaptchaImg()
})
</script>

<template>
  <div class="px-[65px]" :class="isLogin ? 'pt-[40px]' : 'pt-5'">
    <NForm
      v-if="!isLogin"
      ref="formRef"
      :model="registerForm"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
      :style="{ maxWidth: '640px' }"
    >
      <Motion :delay="50">
        <NFormItem path="username">
          <NInput v-model:value="registerForm.username" placeholder="请输入您的用户名昵称" />
        </NFormItem>
      </Motion>
      <Motion :delay="120">
        <NFormItem path="password">
          <NInput v-model:value="registerForm.password" placeholder="请输入您的账户密码" type="password" :maxlength="30" show-password-on="click" tabindex="0" @keyup.enter="handlerSubmit" />
        </NFormItem>
      </Motion>
      <Motion :delay="190">
        <NFormItem path="phone">
          <NInput v-model:value="registerForm.phone" placeholder="请填写您的手机号" />
        </NFormItem>
      </Motion>
      <Motion :delay="260">
        <NFormItem v-if="!isSendCaptcha" path="captchaCode">
          <div class="flex items-center w-full space-x-4">
            <NInput v-model:value="registerForm.captchaCode" class="flex-1" placeholder="请填写图中验证码结果" />
            <div v-if="captchaSvg">
              <!-- <img :src="captchaSvg" alt=""> -->
              <span class="cursor-pointer rounded" @click="getCaptchaImg" v-html="captchaSvg" />
            </div>
          </div>
        </NFormItem>
      </Motion>
      <Motion :delay="330">
        <NFormItem v-if="isSendCaptcha" path="phoneCode">
          <NInput v-model:value="registerForm.phoneCode" class="flex-1" placeholder="请填写手机验证码" />
        </NFormItem>
      </Motion>

      <Motion :delay="400">
        <NFormItem path="invitedBy">
          <NInput v-model:value="registerForm.invitedBy" placeholder="邀请码[非必填]" />
        </NFormItem>
      </Motion>

      <NFormItem>
        <NButton
          v-if="!isSendCaptcha"
          block
          type="primary"
          :disabled="loading"
          :loading="loading"
          @click="handleSendCaptch"
        >
          发送验证码
        </NButton>

        <div v-else class="flex space-x-2 w-full">
          <NButton
            block
            type="primary"
            :disabled="loading"
            :loading="loading"
            class="flex-1"
            @click="handlerSubmit"
          >
            注册账户
          </NButton>
          <NButton
            block
            class="flex-1"
            :disabled="lastSendPhoneCodeTime > 0"
            @click="isSendCaptcha = false"
          >
            重新发送{{ lastSendPhoneCodeTime ? `(${lastSendPhoneCodeTime}S)` : '' }}
          </NButton>
        </div>
      </NFormItem>
    </NForm>

    <!-- login -->
    <NForm
      v-if="isLogin"
      ref="formRef"
      :model="loginForm"
      size="large"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
      :style="{
        maxWidth: '640px',
      }"
    >
      <Motion :delay="50">
        <NFormItem path="phone">
          <NInput v-model:value="loginForm.phone" placeholder="请输入手机号" />
        </NFormItem>
      </Motion>
      <Motion :delay="120">
        <NFormItem path="password">
          <NInput v-model:value="loginForm.password" placeholder="请输入您的账户密码" type="password" :maxlength="30" show-password-on="click" tabindex="0" @keyup.enter="handlerSubmit" />
        </NFormItem>
      </Motion>
      <NFormItem>
        <NButton
          block
          type="primary"
          :disabled="loading"
          :loading="loading"
          class="!mt-[50px]"
          @click="handlerSubmit"
        >
          登录账户
        </NButton>
      </NFormItem>
    </NForm>
  </div>
  <span v-if="phoneRegisterStatus" class="flex justify-center cursor-pointer">
    <NButton text @click="isLogin = !isLogin">{{ logTips }}</NButton>
  </span>

  <div class="flex items-center justify-center space-x-5 " :class="phoneRegisterStatus ? 'mt-[16px]' : 'mt-[36px]'">
    <NButton v-if="wechatRegisterStatus" ghost class="!px-10" @click="emit('changeLoginType', 'wechat')">
      <SvgIcon class="text-xl mr-2 text-[#3076fd]" icon="ph:wechat-logo" />
      微信登录
    </NButton>
    <NButton v-if="emailLoginStatus" ghost class="!px-10" @click="emit('changeLoginType', 'email')">
      <SvgIcon class="text-xl mr-2 text-[#3076fd]" icon="clarity:email-line" />
      邮箱号登录
    </NButton>
  </div>

  <Motion :delay="800">
    <div class="px-8">
      <Send v-if="isLogin" />
    </div>
  </Motion>
</template>
