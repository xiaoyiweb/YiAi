<script setup lang='ts'>
import { NAlert, NButton, NIcon, NModal, NResult, NTabPane, NTabs, TabsInst } from 'naive-ui'
import { computed, ref, nextTick } from 'vue'
import { CloseOutline } from '@vicons/ionicons5'
import Phone from './Login/Phone.vue'
import Email from './Login/Email.vue'
import Wechat from './Login/Wechat.vue'
import { useAuthStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import bannerImg from '@/assets/login-banner.png'

defineProps<Props>()
let timer: any
const authStore = useAuthStore()
const activeCount = ref(false)
const wxLoginUrl = ref('')
const sceneStr = ref('')
const tabsRef = ref<TabsInst | null>(null)
const showWxLogin = ref(true)
const tabName = ref('email')
const { isMobile } = useBasicLayout()


const emailLoginStatus = computed(() => Number(authStore.globalConfig.emailLoginStatus) === 1)
const wechatRegisterStatus = computed(() => Number(authStore.globalConfig.wechatRegisterStatus) === 1)
const phoneLoginStatus = computed(() => Number(authStore.globalConfig.phoneLoginStatus) === 1)

/* 没有打开任何登录 */
const disabledReg = computed(() => {
  return !wechatRegisterStatus.value && !phoneLoginStatus.value && !emailLoginStatus.value
})

interface Props {
  visible: boolean
}


function openDialog() {
	/* 没打开微信的话使用邮箱或者手机号 */
	if(!wechatRegisterStatus.value){
		showWxLogin.value = false
		if(phoneLoginStatus.value){
			changeLoginType('phone')
		}
		if(emailLoginStatus.value){
			changeLoginType('email')
		}
	}
}

function handleCloseDialog() {
  clearInterval(timer)
  wxLoginUrl.value = ''
  sceneStr.value = ''
  activeCount.value = false
}

/* 切换登录类型 */
function changeLoginType(type: string){
	if(type === 'wechat'){
		showWxLogin.value = true
	}else{
		showWxLogin.value = false
		tabName.value = type
		nextTick(() => {
			tabsRef.value?.syncBarPosition()
		})
	}
}
</script>

<template>
  <NModal :show="visible"  :on-after-enter="openDialog" :on-after-leave="handleCloseDialog">
    <div class="w-[1100px] h-[600px] bg-transparent rounded-md overflow-hidden dark:bg-slate-800">
      <div class="absolute top-3 right-3 cursor-pointer z-30" @click="authStore.setLoginDialog(false)">
        <NIcon size="20" color="#0e7a0d">
          <CloseOutline />
        </NIcon>
      </div>
			<div class="bg-transparent m-0 flex">
				<div class="w-[521px] h-[600px]" :style="{background: `url(${bannerImg})`, backgroundSize: 'cover'}" v-if="!isMobile"></div>
				<div v-if="disabledReg" class="flex-1 bg-white flex justify-center items-center dark:bg-[#34373c] h-[600px]">
						<NResult
							size="small"
							status="403"
							title="网站已经关闭注册通道"
							description="请联系管理员开通吧"
						>
							<template #footer>
								<NButton size="small" @click="authStore.setLoginDialog(false)">
									知道了
								</NButton>
							</template>
						</NResult>
				</div>
				<div v-if="!disabledReg" class="flex-1 bg-white dark:bg-[#34373c] h-[600px]">
					<Wechat v-if="wechatRegisterStatus && showWxLogin" @changeLoginType="changeLoginType" />
					<div class="mt-[50px]" >
						<NTabs v-if="!showWxLogin" ref="tabsRef" v-model:value="tabName" animated  justify-content="space-evenly" >
							<NTabPane v-if="emailLoginStatus" name="email" tab="邮箱号登录">
								<Email  @changeLoginType="changeLoginType"  />
							</NTabPane>
							<NTabPane v-if="phoneLoginStatus" name="phone" tab="手机号登录">
								<Phone  @changeLoginType="changeLoginType" />
							</NTabPane>
						</NTabs>
					</div>
				</div>

			</div>
      <!-- register -->




    </div>
  </NModal>
</template>

