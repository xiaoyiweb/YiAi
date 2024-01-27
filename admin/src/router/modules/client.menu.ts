import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/client',
  component: Layout,
  redirect: '/client/classify',
  name: 'ClientMenu',
  meta: {
    title: '用户端设置',
    icon: 'sidebar-client',
  },
  children: [
    {
      path: 'base',
      name: 'ClientBaseConfig',
      component: () => import('@/views/client/base.vue'),
      meta: {
        title: '基础配置',
        icon: 'menu-baseconfig',
      },
    },
    {
      path: 'chatBox',
      name: 'ClientChatBoxConfig',
      component: () => import('@/views/client/chatBox.vue'),
      meta: {
        title: '九宫格预设',
        icon: 'menu-baseconfig',
      },
    },
    {
      path: 'chatPre',
      name: 'ClientChatPreConfig',
      component: () => import('@/views/client/chatPre.vue'),
      meta: {
        title: '快问预设',
        icon: 'menu-book',
      },
    },
    // {
    //   path: 'copyRight',
    //   name: 'ClientCopyRightConfig',
    //   component: () => import('@/views/client/logo.vue'),
    //   meta: {
    //     title: '用户端logo',
    //     icon: 'menu-logo',
    //   },
    // },
    {
      path: 'menu',
      name: 'ClientMenuConfig',
      component: () => import('@/views/client/menu.vue'),
      meta: {
        title: '动态菜单',
        icon: 'menu-menu',
      },
    },
    {
      path: 'notice',
      name: 'systemMenuNotice',
      component: () => import('@/views/client/notice.vue'),
      meta: {
        title: '公告设置',
        icon: 'menu-notice',
      },
    },
    {
      path: 'mind',
      name: 'systemMenuMind',
      component: () => import('@/views/client/mind.vue'),
      meta: {
        title: '思维导图',
        icon: 'menu-mind',
      },
    },
    {
      path: 'visitor',
      name: 'systemMenuVisitor',
      component: () => import('@/views/client/visitor.vue'),
      meta: {
        title: '访客设置',
        icon: 'menu-visitor',
      },
    },
    {
      path: 'signIn',
      name: 'SignInMenu',
      component: () => import('@/views/users/signIn.vue'),
      meta: {
        title: '签到奖励赠送',
        icon: 'menu-signIn',
      },
    },
    {
      path: 'visible',
      name: 'VisibleMenu',
      component: () => import('@/views/client/visible.vue'),
      meta: {
        title: 'UI显示设置',
        icon: 'menu-visible',
      },
    },
  ],
}

export default routes
