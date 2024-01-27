import { SuperAuthGuard } from '@/common/auth/superAuth.guard';
import { MidjourneyService } from './midjourney.service';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import axios from 'axios';
import { Request, Response } from 'express';
import { GetListDto } from './dto/getList.dto';
import { AdminAuthGuard } from '@/common/auth/adminAuth.guard';

@Controller('midjourney')
export class MidjourneyController {
  constructor(private readonly midjourneyService: MidjourneyService) {}

  @Get('drawList')
  @ApiOperation({ summary: '获取我的绘画列表' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getDrawList(@Req() req: Request, @Query() params: any) {
    return await this.midjourneyService.getDrawList(req, params);
  }

  @Get('getList')
  @ApiOperation({ summary: '获取绘画列表' })
  async getList(@Query() params: GetListDto) {
    return await this.midjourneyService.getList(params);
  }

  @Get('getFullPrompt')
  @ApiOperation({ summary: '获取绘画列表' })
  async getFullPrompt(@Query('id') id: number) {
    return await this.midjourneyService.getFullPrompt(id);
  }

  @Get('adminDrawList')
  @ApiOperation({ summary: '管理端获取绘画列表' })
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  async getAdminDrawList(@Req() req: Request, @Query() params: GetListDto) {
    return await this.midjourneyService.getAdminDrawList(req, params);
  }

  @Post('rec')
  @ApiOperation({ summary: '推荐图片' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  async recDraw(@Body() params: any) {
    return await this.midjourneyService.recDraw(params);
  }

  @Post('download')
  @ApiOperation({ summary: '下载绘画' })
  async download(@Body('url') url: string, @Res() res: Response) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    res.set({ 'Content-Type': 'image/png' });
    res.send(buffer);
  }

  @Post('delete')
  @ApiOperation({ summary: '删除绘画' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteDraw(@Body('id') id: number, @Req() req: Request) {
    return await this.midjourneyService.deleteDraw(id, req);
  }

  @Post('del')
  @ApiOperation({ summary: '删除log' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  async delLog(@Req() req: Request, @Body() body: any) {
    return await this.midjourneyService.delLog(req, body);
  }

  @Post('setPrompt')
  @ApiOperation({ summary: '添加修改prompt提示词' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  async setPrompt(@Req() req: Request, @Body() body: any) {
    return await this.midjourneyService.setPrompt(req, body);
  }

  @Post('delPrompt')
  @ApiOperation({ summary: '添加修改prompt提示词' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  async delPrompt(@Req() req: Request, @Body() body: any) {
    return await this.midjourneyService.delPrompt(req, body);
  }

  @Get('queryPrompts')
  @ApiOperation({ summary: '查询prompt列表' })
  async queryPrompt() {
    return await this.midjourneyService.queryPrompt();
  }

  @Get('proxy')
  @ApiOperation({ summary: '代理图片' })
  @ApiBearerAuth()
  async proxyImg(@Query() params: { url: String}) {
    return await this.midjourneyService.proxyImg(params);
  }
}
