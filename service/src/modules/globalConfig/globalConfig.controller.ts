import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SetConfigDto } from './dto/setConfig.dto';
import { GlobalConfigService } from './globalConfig.service';
import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { QueryConfigDto } from './dto/queryConfig.dto';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { AdminAuthGuard } from '@/common/auth/adminAuth.guard';
import { SuperAuthGuard } from '@/common/auth/superAuth.guard';
import { Request } from 'express';
import { SetConfigCustomDto } from './dto/setConfigCustom.dto';

@ApiTags('config')
@Controller('config')
export class GlobalConfigController {
  constructor(private readonly globalConfigService: GlobalConfigService) {}

  @ApiOperation({ summary: '查询所有配置' })
  @Get('queryAll')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  queryAllConfig(@Req() req: Request) {
    return this.globalConfigService.queryAllConfig(req);
  }

  @ApiOperation({ summary: '查询前端网站的所有配置' })
  @Get('queryFronet')
  queryFrontConfig(@Query() query: any, @Req() req: Request) {
    return this.globalConfigService.queryFrontConfig(query, req);
  }

  @ApiOperation({ summary: '查询所有gpt的key' })
  @Get('queryGptKeys')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  queryGptKeys(@Req() req: Request) {
    return this.globalConfigService.queryGptKeys(req);
  }

  @ApiOperation({ summary: '设置gpt的key' })
  @Post('setGptKeys')
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  setGptKeys(@Body() body) {
    return this.globalConfigService.setGptKeys(body);
  }

  @ApiOperation({ summary: '查询所有配置' })
  @Post('query')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  queryConfig(@Body() body: QueryConfigDto, @Req() req: Request) {
    return this.globalConfigService.queryConfig(body, req);
  }

  @ApiOperation({ summary: '设置配置信息' })
  @Post('set')
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  setConfig(@Body() body: SetConfigDto) {
    return this.globalConfigService.setConfig(body);
  }

  @ApiOperation({ summary: '用户端查询公告信息' })
  @Get('notice')
  queryNotice() {
    return this.globalConfigService.queryNotice();
  }

  @ApiOperation({ summary: '管理端查询版权信息' })
  @Get('copyright')
  getCopyright() {
    return this.globalConfigService.getCopyright();
  }
}
