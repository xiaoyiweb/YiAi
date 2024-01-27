import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/order',
  component: Layout,
  redirect: '/order/list',
  name: 'OrderMenu',
  meta: {
    title: '订单管理',
    icon: 'sidebar-order',
  },
  children: [
    {
      path: 'list',
      name: 'OrderMenuList',
      component: () => import('@/views/order/index.vue'),
      meta: {
        title: '订单列表',
        icon: 'menu-order',
      },
    },
  ],
}

export default routes
