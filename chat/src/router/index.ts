import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { setupPageGuard } from './permission'
import { Layout } from '@/layout'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    redirect: '/chat',
    children: [
      {
        path: '/market',
        name: 'Market',
        component: () => import('@/views/market/index.vue'),
      },
      {
        path: '/draw',
        name: 'Draw',
        component: () => import('@/views/draw/index.vue'),
      },
      {
        path: '/midjourney',
        name: 'Midjourney',
        component: () => import('@/views/midjourney/index.vue'),
      },
      {
        path: '/chat',
        name: 'Chat',
        component: () => import('@/views/chat/chat.vue'),
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/chat/role.vue'),
      },
      {
        path: 'user-center',
        name: 'UserCenter',
        component: () => import('@/views/userCenter/index.vue'),
      },
      {
        path: 'app-store',
        name: 'AppStore',
        component: () => import('@/views/appStore/index.vue'),
      },
      {
        path: 'pay',
        name: 'Pay',
        component: () => import('@/views/pay/index.vue'),
      },
      {
        path: 'mind',
        name: 'Mind',
        component: () => import('@/views/mind/index.vue'),
      },
      {
        path: 'share',
        name: 'Share',
        component: () => import('@/views/share/index.vue'),
      },
			{
        path: 'extend',
        name: 'Extend',
        component: () => import('@/views/extend/index.vue'),
      },
			{
        path: 'inpaint',
        name: 'Inpaint',
        component: () => import('@/views/inpaint/index.vue'),
      },
    ],
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/views/welcome/index.vue'),
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/exception/404/index.vue'),
  },
  {
    path: '/500',
    name: '500',
    component: () => import('@/views/exception/500/index.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    redirect: '/404',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  // history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

setupPageGuard(router)

export async function setupRouter(app: App) {
  app.use(router)
  await router.isReady()
}
