import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/secure',
  component: Layout,
  redirect: '/secure/sensitive-baidu',
  name: 'SecureMenu',
  meta: {
    title: '风控管理',
    icon: 'sidebar-secure',
  },
  children: [
    {
      path: 'sensitive-violation',
      name: 'SensitiveViolationLog',
      component: () => import('@/views/sensitive/violation.vue'),
      meta: {
        title: '违规检测记录',
        icon: 'menu-weigui',
      },
    },
    {
      path: 'sensitive-baidu',
      name: 'SensitiveBaiduyun',
      component: () => import('@/views/sensitive/baiduSensitive.vue'),
      meta: {
        title: '百度云敏感词',
        icon: 'menu-baiduyunminganci',
      },
    },
    {
      path: 'sensitive-builtIn',
      name: 'SensitiveBuiltIn',
      component: () => import('@/views/sensitive/builtIn.vue'),
      meta: {
        title: 'NineAi敏感词',
        icon: 'menu-minganci',
      },
    },
    {
      path: 'sensitive-custom',
      name: 'SensitiveCuston',
      component: () => import('@/views/sensitive/custom.vue'),
      meta: {
        title: '自定义敏感词',
        icon: 'menu-zidingyi',
      },
    },
    {
      path: 'auto-reply',
      name: 'ReplyMenuList',
      component: () => import('@/views/sensitive/autpReply.vue'),
      meta: {
        title: '自定义回复预设',
        icon: 'menu-huifuyushe',
      },
    },
  ],
}

export default routes
