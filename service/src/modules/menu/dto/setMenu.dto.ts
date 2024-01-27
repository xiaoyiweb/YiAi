import { AddBadWordDto } from '../../badwords/dto/addBadWords.dto';
import { IsNotEmpty, MinLength, MaxLength, IsEmail, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetMenuDto {
  @ApiProperty({ example: 1, description: '菜单id', required: false })
  id: number;

  @ApiProperty({ example: '测试菜单', description: '菜单文字提示', required: true })
  @IsOptional()
  menuTipText: string;

  @ApiProperty({ example: 'https:baidu.com', description: '三方网页地址', required: false })
  @IsOptional()
  menuIframeUrl: string;

  @ApiProperty({ example: false, description: '是否跳转', required: true })
  isJump: boolean;

  @ApiProperty({ example: true, description: '是否打开菜单', required: true })
  isShow: boolean;

  @ApiProperty({ example: 'eos-icons:typing', description: '菜单ICON图标代码', required: true })
  menuIcon: string;

  @ApiProperty({ example: '/chat', description: '站内系统路径', required: true })
  menuPath: string;

  @ApiProperty({ example: 1000, description: '菜单排序id  数字越小越靠前', required: true })
  order: number;

  @ApiProperty({ example: true, description: '是否系统预设', required: true })
  isSystem: boolean;

  @ApiProperty({ example: true, description: '是否需要登录才可访问', required: true })
  isNeedAuth: boolean;
}
