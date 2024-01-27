import MultilevelMenuExample from './modules/multilevel.menu.example'

import type { Menu } from '#/global'

const menu: Menu.recordMainRaw[] = [
  {
    meta: {
      title: 'NineAi',
      icon: 'sidebar-default',
    },
    children: [
      MultilevelMenuExample,
    ],
  },
]

export default menu
