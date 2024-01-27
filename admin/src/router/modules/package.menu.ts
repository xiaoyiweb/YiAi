import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/package',
  component: Layout,
  redirect: '/package/list',
  name: 'packageMenu',
  meta: {
    title: '套餐管理',
    icon: 'sidebar-package',
  },
  children: [
    {
      path: 'list',
      name: 'packageMenuList',
      component: () => import('@/views/package/package.vue'),
      meta: {
        title: '套餐设置',
        icon: 'menu-package',
      },
    },
    {
      path: 'crami',
      name: 'cramiMenuList',
      component: () => import('@/views/package/crami.vue'),
      meta: {
        title: '卡密管理',
        icon: 'menu-crami',
      },
    },
  ],
}

export default routes
