<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { NButton, NForm, NFormItem, NInput, useMessage } from 'naive-ui'
import Send from './send.vue'
import { fetchCaptchaImg, fetchLoginAPI, fetchRegisterAPI } from '@/api'
import { useAppStore, useAuthStore } from '@/store'
import Motion from '@/utils/motion/index'
import { ss } from '@/utils/storage'
import { SvgIcon } from '@/components/common'
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

/* isVerifyEmail 为0或者 */
const isVerifyEmail = computed(() => {
  const v = authStore.globalConfig.isVerifyEmail ? Number(authStore.globalConfig.isVerifyEmail) : 1
  return v
})

const registerButtonMsg = computed(() => {
  return isVerifyEmail.value ? '发送激活账户邮件' : '立即注册'
})

const captchaBgColor = computed(() => {
  return theme.value === 'dark' ? '#363f4f' : '#fff'
})

const { isMobile } = useBasicLayout()

const registerForm = ref({
  username: '',
  password: '',
  email: '',
  invitedBy: '',
  captchaCode: '',
  captchaId: null,
})

const loginForm = ref({
  username: '',
  password: '',
  email: '',
  invitedBy: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 30, message: '用户名长度应为 2 到 30 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 30, message: '密码长度应为 6 到 30 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] },
  ],
  captchaCode: [
    { required: true, message: '请填写验证码', trigger: 'blur' },
  ],
}
const logTips = computed(() => (isLogin.value ? '还没账号? 去注册！' : '已有账号, 去登录！'))

const wechatRegisterStatus = computed(() => Number(authStore.globalConfig.wechatRegisterStatus) === 1)
const phoneLoginStatus = computed(() => Number(authStore.globalConfig.phoneLoginStatus) === 1)
const emailRegisterStatus = computed(() => Number(authStore.globalConfig.emailRegisterStatus) === 1)

function handlerSubmit() {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        loading.value = true
        const Interface = isLogin.value ? fetchLoginAPI : fetchRegisterAPI
        const params: any = !isLogin.value ? registerForm.value : { username: loginForm.value.username, password: loginForm.value.password }
        const res: any = await Interface(params)
        loading.value = false
        getCaptchaImg()
        const { success, message } = res
        if (!success)
          return Nmessage.error(message)
        if (!isLogin.value) {
          const msg = Number(isVerifyEmail) ? '您的账号激活邮件已经发送,请前往邮箱激活您的账户！' : '您的账号已成功注册、请登录使用吧！'
          Nmessage.success(msg)
          const { email, password } = registerForm.value
          loginForm.value.username = email
          loginForm.value.password = password
          isLogin.value = !isLogin.value
          /* 如果不校验 自动登录 */
          if (!isVerifyEmail.value)
            autoLogin()
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

async function autoLogin() {
  const params = { username: loginForm.value.username, password: loginForm.value.password }
  const res: any = await fetchLoginAPI(params)
  const { success, message } = res
  if (!success)
    return Nmessage.error(message)
  Nmessage.success('账户登录成功、开始体验吧！')
  authStore.setToken(res.data)
  authStore.getUserInfo()
  authStore.setLoginDialog(false)
  ss.remove('invitedBy')
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
        <NFormItem path="email">
          <NInput v-model:value="registerForm.email" placeholder="请填写您的邮箱账号" />
        </NFormItem>
      </Motion>
      <Motion :delay="260">
        <NFormItem path="captchaCode">
          <div class="flex items-center w-full space-x-4">
            <NInput v-model:value="registerForm.captchaCode" class="flex-1" placeholder="请填写图中验证码结果" />
            <div v-if="captchaSvg">
              <span class="cursor-pointer rounded" @click="getCaptchaImg" v-html="captchaSvg" />
            </div>
          </div>
        </NFormItem>
      </Motion>

      <Motion :delay="330">
        <NFormItem path="invitedBy">
          <NInput v-model:value="registerForm.invitedBy" placeholder="邀请码[非必填]" />
        </NFormItem>
      </Motion>

      <NFormItem>
        <NButton
          block
          type="primary"
          :disabled="loading"
          :loading="loading"
          @click="handlerSubmit"
        >
          {{ registerButtonMsg }}
        </NButton>
      </NFormItem>
    </NForm>

    <!-- login -->
    <NForm
      v-if="isLogin"
      ref="formRef"
      size="large"
      :model="loginForm"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
      :style="{
        maxWidth: '640px',
      }"
    >
      <Motion :delay="50">
        <NFormItem path="username">
          <NInput v-model:value="loginForm.username" placeholder="请输入用户名/邮箱号" />
        </NFormItem>
      </Motion>

      <Motion :delay="120">
        <NFormItem path="password">
          <NInput v-model:value="loginForm.password" placeholder="请输入您的账户密码" type="password" :maxlength="30" show-password-on="click" tabindex="0" @keyup.enter="handlerSubmit" />
        </NFormItem>
      </Motion>
      <div style="color:red">
        老用户密码统一重置为112233<br>
        登录后请自行修改密码
      </div>
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
  <span v-if="emailRegisterStatus" class="flex justify-center cursor-pointer">
    <NButton text @click="isLogin = !isLogin">{{ logTips }}</NButton>
  </span>
  <div class="flex items-center justify-center space-x-5" :class="emailRegisterStatus ? 'mt-[16px]' : 'mt-[36px]'">
    <NButton v-if="wechatRegisterStatus" ghost class="!px-10" @click="emit('changeLoginType', 'wechat')">
      <SvgIcon class="text-xl mr-2 text-[#3076fd]" icon="ph:wechat-logo" />
      微信登录
    </NButton>
    <NButton v-if="phoneLoginStatus" ghost class="!px-10" @click="emit('changeLoginType', 'phone')">
      <SvgIcon class="text-xl mr-2 text-[#3076fd]" icon="clarity:mobile-phone-solid" />
      手机号登录
    </NButton>
  </div>

  <Motion :delay="800">
    <div class="px-8">
      <Send v-if="isLogin" />
    </div>
  </Motion>
</template>
