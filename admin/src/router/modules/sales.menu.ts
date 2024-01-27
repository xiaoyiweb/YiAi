import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/sales',
  component: Layout,
  redirect: '/sales/config',
  name: 'SalesMenu',
  meta: {
    title: '分销系统',
    icon: 'sidebar-share',
  },
  children: [
    {
      path: 'config',
      name: 'SalesBaseManage',
      component: () => import('@/views/sales/base.vue'),
      meta: {
        title: '基础分销配置',
        icon: 'menu-distribution',
      },
    },
    {
      path: 'salesUser',
      name: 'SalesUserManage',
      component: () => import('@/views/sales/salesUser.vue'),
      meta: {
        title: '佣金账户列表',
        icon: 'menu-commission',
      },
    },
    {
      path: 'records',
      name: 'SalesRecoredManage',
      component: () => import('@/views/sales/records.vue'),
      meta: {
        title: '佣金分销明细',
        icon: 'menu-records'
      },
    },
    {
      path: 'order',
      name: 'SalesOrderManage',
      component: () => import('@/views/sales/order.vue'),
      meta: {
        title: '提现工单管理',
        icon: 'menu-tiixan'
      },
    },
  ],
}

export default routes
