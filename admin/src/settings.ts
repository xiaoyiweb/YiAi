import type { Settings } from '#/global'
import { atob, copyRight } from '@/constants/copyright'

// 这是基础版演示源码里的自定义配置示例
const globalSettings: Settings.all = {
  app: {
    enablePermission: false,
    enableDynamicTitle: true,
    enableAppSetting: false,
    // colorScheme: 'dark',
    colorScheme: 'light',
    elementSize: 'default',
    iconifyOfflineUse: false,
    enableProgress: true,
    routeBaseOn: 'frontend',
  },
  layout: {
    enableMobileAdaptation: true,
  },
  menu: {
    enableSubMenuCollapseButton: true,
    enableHotkeys: true,
    baseOn: 'frontend',
    menuMode: 'single',
    switchMainMenuAndPageJump: false,
    subMenuUniqueOpened: true,
    subMenuCollapse: false,
  },
  topbar: {
    mode: 'fixed',
  },
  toolbar: {
    enableFullscreen: true,
    enablePageReload: true,
    enableColorScheme: true,
  },
  home: {
    enable: true,
    title: '首页',
  },
  breadcrumb: {
    enable: true,
  },
  navSearch: {
    enable: true,
    enableHotkeys: true,
  },
  copyright: {
    enable: true,
    dates: atob(copyRight.name),
    company: atob(copyRight.qnum),
    website: atob(copyRight.website),
    beian: atob(copyRight.wex),
  },
}

export default globalSettings
