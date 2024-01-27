import { Controller, Post, UseGuards, Body, Get, Query, Render, Res, Req } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { UserBalanceService } from './userBalance.service';
import { TestDto } from './dto/test.dto';
import { SuperAuthGuard } from '@/common/auth/superAuth.guard';
import { AdminAuthGuard } from '@/common/auth/adminAuth.guard';

@ApiTags('balance')
@Controller('balance')
export class UserBalanceController {
  constructor(private userBalanceService: UserBalanceService) {}

  @Get('rechargeLog')
  @ApiOperation({ summary: '获取个人充值记录' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRechargeLog(@Req() req: Request, @Query() params: any) {
    return this.userBalanceService.getRechargeLog(req, params);
  }

  @Get('accountLog')
  @ApiOperation({ summary: '获取所有人账户记录' })
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  async getAccountLog(@Req() req: Request, @Query() params: any) {
    return this.userBalanceService.getAccountLog(req, params);
  }

  @Get('query')
  @ApiOperation({ summary: '获取个人余额信息' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getBalance(@Req() req: Request) {
    return this.userBalanceService.queryUserBalance(req.user.id);
  }

  // @Post('test')
  // @ApiOperation({ summary: '升级V1.5 数据迁移job' })
  // async test(@Body() body: TestDto) {
  //   return this.userBalanceService.addBalanceToOrder(body);
  // }

  @Post('upgradeBalance')
  @ApiOperation({ summary: '升级V1.5 数据迁移job' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  async upgradeBalance() {
    return this.userBalanceService.upgradeBalance();
  }

  @Post('inheritVisitorData')
  @ApiOperation({ summary: '继承当前设备数据' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async inheritVisitorData(@Req() req: Request) {
    return this.userBalanceService.inheritVisitorData(req);
  }

  @Get('getVisitorCount')
  @ApiOperation({ summary: '获取本机指纹数据' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getVisitorCount(@Req() req: Request) {
    return this.userBalanceService.getVisitorCount(req);
  }
  
}
