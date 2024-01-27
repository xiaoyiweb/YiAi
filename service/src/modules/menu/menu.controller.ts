import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SuperAuthGuard } from '@/common/auth/superAuth.guard';
import { QueryMenuDto } from './dto/queryMenu.dto';
import { SetMenuDto } from './dto/setMenu.dto';
import { AdminAuthGuard } from '@/common/auth/adminAuth.guard';

@Controller('menu')
export class MenuController {
  constructor(
    private readonly menuService:MenuService
  ){}

  @Get('query')
  @ApiOperation({ summary: '管理端查询菜单列表' })
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  queryMenu(@Query() query: QueryMenuDto){
    return this.menuService.queryMenu(query)
  }

  @Get('list')
  @ApiOperation({ summary: '用户端查询菜单列表' })
  menuListFront(@Query() query: QueryMenuDto){
    return this.menuService.menuListFront(query)
  }

  @Post('visible')
  @ApiOperation({ summary: '显示或者隐藏菜单' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  visibleMenu(@Body() params: { id: number }){
    return this.menuService.visibleMenu(params)
  }

  @Post('setMenu')
  @ApiOperation({ summary: '设置修改菜单' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  setMenu(@Body() params: SetMenuDto){
    return this.menuService.setMenu(params)
  }

  @Post('delete')
  @ApiOperation({ summary: '删除菜单' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  delMenu(@Body() params: {id: number}){
    return this.menuService.delMenu(params)
  }

  @Post('updateIcon')
  @ApiOperation({ summary: '修改菜单ICON' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  updateIcon(@Body() params){
    return this.menuService.updateIcon(params)
  }
}
