import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/storage',
  component: Layout,
  redirect: '/storage/config',
  name: 'StorageMenu',
  meta: {
    title: '存储配置',
    icon: 'sidebar-storage',
  },
  children: [
    {
      path: 'tencent',
      name: 'StorageTencent',
      component: () => import('@/views/storage/tencent.vue'),
      meta: {
        title: '腾讯云COS',
        icon: 'menu-tengxuncos',
      },
    },
    {
      path: 'ali',
      name: 'StorageAli',
      component: () => import('@/views/storage/ali.vue'),
      meta: {
        title: '阿里云OSS',
        icon: 'menu-alioss',
      },
    },
    {
      path: 'chevereto',
      name: 'StorageChevereto',
      component: () => import('@/views/storage/chevereto.vue'),
      meta: {
        title: 'chevereto图床',
        icon: 'menu-chevereto'
      },
    },
    // {
    //   path: 'other',
    //   name: 'OtherCos',
    //   component: () => import('@/views/storage/other.vue'),
    //   meta: {
    //     title: '三方开发API',
    //   },
    // },
  ],
}

export default routes
