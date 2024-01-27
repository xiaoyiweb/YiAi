import type { Router } from 'vue-router'
import { useAuthStoreWithout } from '@/store/modules/auth'
import { ss } from '@/utils/storage'
import { fetchInviteCodeAPI } from '@/api/user'

export function setupPageGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const { inVitecode } = to.query
    inVitecode && ss.set('invitedBy', inVitecode as string)
    if (inVitecode) {
      await fetchInviteCodeAPI({ code: inVitecode })
      router.replace({ path: to.path, query: {} })
    }

    window.$loadingBar?.start()
    const authStore = useAuthStoreWithout()
    if (!authStore.userInfo.username) {
      try {
        authStore.token && await authStore.getUserInfo()
        if (authStore.globalConfigLoading) {
          let domain = `${window.location.protocol}//${window.location.hostname}`
          if (window.location.port)
            domain += `:${window.location.port}`
          await authStore.getglobalConfig(domain)
          if (authStore.globalConfig.clientHomePath)
            next({ path: authStore.globalConfig.clientHomePath })

          else
            next()
        }
        if (to.path === '/500')
          next({ path: '/' })
        else
          next()
      }
      catch (error) {
        if (to.path === '/500')
          next({ path: '/' })
        else
          next()
      }
    }
    else {
      const clientMenuList = authStore.globalConfig?.clientMenuList
      const openMenuList = clientMenuList ? JSON.parse(clientMenuList) : []
      if (openMenuList.length && !openMenuList.includes(to.name) && ['Chat', 'Draw', 'Midjourney'].includes(to.name)) {
        if (authStore.globalConfig.clientHomePath && authStore.globalConfig.clientHomePath !== '')
          next({ path: authStore.globalConfig.clientHomePath })

        else next()
      }

      next()
    }
  })

  router.afterEach((to: any) => {
    window.$loadingBar?.finish()
  })
}
