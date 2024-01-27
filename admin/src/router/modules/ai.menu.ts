import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/ai',
  component: Layout,
  redirect: '/ai/chat-key-list',
  name: 'AiMenu',
  meta: {
    title: '模型管理',
    icon: 'sidebar-ai',
  },
  children: [
    // {
    //   path: 'models',
    //   name: 'AiMenuModels',
    //   component: () => import('@/views/models/index.vue'),
    //   meta: { title: '模型设置', icon: 'menu-model', },
    // },
    {
      path: 'keys',
      name: 'AiMenuKeys',
      component: () => import('@/views/models/key.vue'),
      meta: { title: '卡池设置', icon: 'menu-key', },
    },
    {
      path: 'model',
      name: 'AiMenuInterface',
      component: () => import('@/views/system/interface.vue'),
      meta: {
        title: '模型全局配置',
        icon: 'menu-model',
      },
    },
    // {
    //   path: 'chat-key-list',
    //   name: 'AiMenuChatKeyList',
    //   component: () => import('@/views/keys/list.vue'),
    //   meta: {
    //     title: 'key列表[废弃]',
    //     icon: 'menu-key',
    //   },
    // },
    {
      path: 'model-pre',
      name: 'AiMenuModelPre',
      component: () => import('@/views/ai/globalPre.vue'),
      meta: { title: '头部预设', icon: 'menu-header', },
    },
  ],
}

export default routes
