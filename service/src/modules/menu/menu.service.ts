import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuEntity } from './menu.entity';
import { QueryMenuDto } from './dto/queryMenu.dto';
import { SetMenuDto } from './dto/setMenu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menuEntity: Repository<MenuEntity>,
  ) {}

  async onModuleInit() {
    await this.initMenu();
  }

  /* 初始化菜单 */
  async initMenu() {
    const menuCount = await this.menuEntity.count();
    if (menuCount > 0) return;
    const pcMenuData = [
      { menuTipText: '对话聊天', menuIcon: 'eos-icons:typing', menuName: 'Chat', menuPath: '/chat', menuType: 0, menuPlatform: 1, order: 100 },
      {
        menuTipText: '应用广场',
        menuIcon: 'ant-design:appstore-outlined',
        menuName: 'AppStore',
        menuPath: '/app-store',
        menuType: 0,
        menuPlatform: 1,
        order: 200,
      },
      {
        menuTipText: '专业绘画',
        menuIcon: 'ri:landscape-line',
        menuName: 'Midjourney',
        menuPath: '/midjourney',
        menuType: 0,
        menuPlatform: 1,
        order: 300,
      },
      {
        menuTipText: '绘画广场',
        menuIcon: 'solar:album-line-duotone',
        menuName: 'Market',
        menuPath: '/market',
        menuType: 0,
        menuPlatform: 1,
        order: 400,
      },
      {
        menuTipText: '基础绘画',
        menuIcon: 'fluent:draw-image-24-regular',
        menuName: 'Draw',
        menuPath: '/draw',
        menuType: 0,
        menuPlatform: 1,
        order: 500,
      },
      {
        menuTipText: '思维导图',
        menuIcon: 'icon-park-outline:mindmap-map',
        menuName: 'Mind',
        menuPath: '/mind',
        menuType: 0,
        menuPlatform: 1,
        order: 600,
      },
      {
        menuTipText: '会员中心',
        menuIcon: 'icon-park-outline:shopping',
        menuName: 'Pay',
        menuPath: '/pay',
        menuType: 0,
        menuPlatform: 1,
        order: 700,
      },
      { menuTipText: '推广计划', menuIcon: 'uiw:share', menuName: 'Share', menuPath: '/share', menuType: 0, menuPlatform: 1, order: 800 },
    ];
    const mobileMenuData = [
      { menuTipText: '对话聊天', menuIcon: 'eos-icons:typing', menuName: 'Chat', menuPath: '/chat', menuType: 0, menuPlatform: 0, order: 100 },
      {
        menuTipText: '应用广场',
        menuIcon: 'ant-design:appstore-outlined',
        menuName: 'AppStore',
        menuPath: '/app-store',
        menuType: 0,
        menuPlatform: 0,
        order: 200,
      },
      {
        menuTipText: '专业绘画',
        menuIcon: 'ri:landscape-line',
        menuName: 'Midjourney',
        menuPath: '/midjourney',
        menuType: 0,
        menuPlatform: 0,
        order: 300,
      },
      {
        menuTipText: '思维导图',
        menuIcon: 'icon-park-outline:mindmap-map',
        menuName: 'Mind',
        menuPath: '/mind',
        menuType: 0,
        menuPlatform: 0,
        order: 400,
      },
      {
        menuTipText: '个人中心',
        menuIcon: 'ri:account-pin-box-line',
        menuName: 'UserCenter',
        menuPath: '/user-center',
        menuType: 0,
        menuPlatform: 0,
        order: 500,
      },
    ];

    const initMenuData = [...pcMenuData, ...mobileMenuData];

    await this.menuEntity.save(initMenuData);
  }

  async queryMenu(query: QueryMenuDto) {
    const { menuPlatform } = query;
    const where: any = {};
    menuPlatform && (where.menuPlatform = menuPlatform);
    return await this.menuEntity.find({ where, order: { order: 'ASC' } });
  }

  async menuListFront(query: QueryMenuDto) {
    const { menuPlatform } = query;
    const where: any = {
      isShow: true,
    };
    menuPlatform && (where.menuPlatform = menuPlatform);
    return await this.menuEntity.find({ where, order: { order: 'ASC' } });
  }

  async visibleMenu(params) {
    const { id } = params;
    if (!id) return;
    const m = await this.menuEntity.findOne({ where: { id } });
    if (!m) return;
    const { isShow } = m;
    const res = await this.menuEntity.update({ id }, { isShow: !isShow });
    return res.affected > 0;
  }

  async setMenu(params: SetMenuDto) {
    const { id } = params;
    if (params.isSystem) {
      params.menuPath = '';
    } else {
      params.menuIframeUrl = '';
    }
    delete params.isSystem;
    try {
      if (id) {
        const res = await this.menuEntity.update({ id }, params);
        return res.affected > 0;
      } else {
        const res = await this.menuEntity.save(params);
        return res;
      }
    } catch (error) {
      throw new HttpException('操作菜单失败!', HttpStatus.BAD_REQUEST);
    }
  }

  async delMenu(params) {
    const { id } = params;
    if (!id) {
      throw new HttpException('缺失必要参数!', HttpStatus.BAD_REQUEST);
    }
    const res = await this.menuEntity.delete({ id });
    return res;
  }

  async updateIcon(params) {
    const { id, menuIcon, menuTipText, order } = params;
    if (!id || !menuIcon || !menuTipText || !order) {
      throw new HttpException('缺失必要参数!', HttpStatus.BAD_REQUEST);
    }
    const res = await this.menuEntity.update({ id }, { menuIcon, menuTipText, order });
    return res.affected > 0;
  }
}
