import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/user',
  component: Layout,
  redirect: '/user/list',
  name: 'userMenu',
  meta: {
    title: '用户管理',
    icon: 'sidebar-client',
  },
  children: [
    {
      path: 'list',
      name: 'userMenuList',
      component: () => import('@/views/users/index.vue'),
      meta: {
        title: '用户数据列表',
        icon: 'menu-userlist'
      },
    },
    {
      path: 'account-log',
      name: 'AccountLogMenu',
      component: () => import('@/views/users/accountLog.vue'),
      meta: {
        title: '用户账户明细',
        icon: 'menu-account'
      },
    },
    {
      path: 'register',
      name: 'systemMenuRegister',
      component: () => import('@/views/system/register.vue'),
      meta: {
        title: '用户注册设置',
        icon: 'menu-register'
      },
    },
  ],
}

export default routes
