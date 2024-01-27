import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/app',
  component: Layout,
  redirect: '/app/classify',
  name: 'AppMenu',
  meta: {
    title: '应用管理',
    icon: 'sidebar-app',
  },
  children: [
    {
      path: 'classify',
      name: 'AppMenuClassify',
      component: () => import('@/views/app/classify.vue'),
      meta: {
        title: '分类列表',
        icon: 'menu-type',
      },
    },
    {
      path: 'application',
      name: 'Application',
      component: () => import('@/views/app/application.vue'),
      meta: {
        title: '应用列表',
        icon: 'menu-list',
      },
    },
  ],
}

export default routes
