import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'menu' })
export class MenuEntity extends BaseEntity {
  @Column({ comment: '菜单名称', length: 64, default: null })
  menuName: string;

  @Column({ comment: '菜单路径、跳转的系统路径', length: 64 })
  menuPath: string;

  @Column({ comment: '菜单图标 icon图标名称' })
  menuIcon: string;

  @Column({ comment: '菜单文字提示信息' })
  menuTipText: string;

  @Column({ comment: '菜单类型： 系统预设|自定义菜单', default: 1 })
  menuType: number;

  @Column({ comment: '菜单平台： 0：移动端 1：pc端', default: 1 })
  menuPlatform: number;

  @Column({ comment: '菜单加载地址： 系统菜单|自定义菜单', default: null })
  menuIframeUrl: string;

  @Column({ comment: '排序ID', default: 100 })
  order: number;

  @Column({ comment: '是否显示 1：是|0：不是', default: 1 })
  isShow: boolean;
  
  @Column({ comment: '是否跳转到新窗口 0不跳转 1跳转 仅设置为iframe窗口时候有效', default: 0 })
  isJump: boolean;

  @Column({ comment: '是否权限 登录才可以访问', default: 0 })
  isNeedAuth: boolean;
}
