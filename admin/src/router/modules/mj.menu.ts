import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/mj',
  component: Layout,
  redirect: '/mj/config',
  name: 'MjMenu',
  meta: {
    title: 'MJ绘画管理',
    icon: 'sidebar-mj',
  },
  children: [
    {
      path: 'draw',
      name: 'mjDrawManage',
      component: () => import('@/views/mjDraw/draw.vue'),
      meta: {
        title: '绘图历史',
        icon: 'menu-history',
      },
    },
    {
      path: 'config',
      name: 'mjManage',
      component: () => import('@/views/mjDraw/index.vue'),
      meta: {
        title: '参数配置',
        icon: 'menu-params',
      },
    },
    {
      path: 'proxy',
      name: 'mjProxyManage',
      component: () => import('@/views/mjDraw/proxy.vue'),
      meta: {
        title: '更多设置',
        icon: 'menu-proxy',
      },
    },
    {
      path: 'prompt',
      name: 'mjPromptManage',
      component: () => import('@/views/mjDraw/prompt.vue'),
      meta: {
        title: '功能预设',
        icon: 'menu-preset',
      },
    },
    {
      path: 'prompts',
      name: 'mjPromptsManage',
      component: () => import('@/views/mjDraw/prompts.vue'),
      meta: {
        title: '提示词预设',
        icon: 'menu-prompt',
      },
    },
    {
      path: 'fanyi',
      name: 'BaiduFanyi',
      component: () => import('@/views/system/baidufanyi.vue'),
      meta: {
        title: '百度翻译配置',
        icon: 'menu-baidufanyi',
      },
    },
  ],
}

export default routes
