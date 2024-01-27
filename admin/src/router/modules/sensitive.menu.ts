import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/sensitive',
  component: Layout,
  redirect: '/sensitive/list',
  name: 'SensitiveMenu',
  meta: {
    title: '敏感词设置',
    icon: 'sidebar-sensitive',
  },
  children: [
    {
      path: 'baidu',
      name: 'SensitiveBaiduyun',
      component: () => import('@/views/sensitive/baiduSensitive.vue'),
      meta: {
        title: '百度云敏感词',
      },
    },
    {
      path: 'list',
      name: 'SensitiveCuston',
      component: () => import('@/views/sensitive/index.vue'),
      meta: {
        title: '自定义敏感词',
      },
    },
  ],
}

export default routes
