import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/login',
  component: Layout,
  redirect: '/login/email',
  name: 'RegisterMenu',
  meta: {
    title: '注册管理',
    icon: 'sidebar-register',
  },
  children: [
    {
      path: 'email',
      name: 'systemMenuEmail',
      component: () => import('@/views/system/email.vue'),
      meta: {
        title: '邮件注册登录',
        icon: 'menu-email',
      },
    },
    {
      path: 'wechat',
      name: 'systemMenuWechat',
      component: () => import('@/views/system/wechat.vue'),
      meta: {
        title: '微信登录配置',
        icon: 'menu-vx',
      },
    },
    {
      path: 'ali-phone',
      name: 'AliPhoneMenu',
      component: () => import('@/views/users/phone.vue'),
      meta: {
        title: '短信验证登录',
        icon: 'menu-message',
      },
    }
  ],
}

export default routes
