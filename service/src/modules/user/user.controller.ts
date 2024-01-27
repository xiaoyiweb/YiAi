import { UserService } from './user.service';
import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/updateUser.dto';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { Request } from 'express';
import { AdminAuthGuard } from '@/common/auth/adminAuth.guard';
import { UserRechargeDto } from './dto/userRecharge.dto';
import { QueryAllUserDto } from './dto/queryAllUser.dto';
import { QueryOneUserDto } from './dto/queryOne.dto';
import { UpdateUserStatusDto } from './dto/updateUserStatus.dto';
import { ResetUserPassDto } from './dto/resetUserPass.dto';
import { SuperAuthGuard } from '@/common/auth/superAuth.guard';
import { queryInviteRecordDto } from './dto/queryInviteRecord.dto';
import { RetrieveUserDto } from './dto/retrieve.dto';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('update')
  @ApiOperation({ summary: '更新用户信息' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Body() body: UpdateUserDto, @Req() req: Request) {
    return await this.userService.updateInfo(body, req);
  }

  @Post('genInviteCode')
  @ApiOperation({ summary: '生成邀请码' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async genInviteCode(@Req() req: Request) {
    return await this.userService.genInviteCode(req);
  }

  @Get('inviteRecord')
  @ApiOperation({ summary: '获取我的邀请记录' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getInviteRecord(@Req() req: Request, @Query() query: queryInviteRecordDto) {
    return await this.userService.getInviteRecord(req, query);
  }

  @Get('inviteLink')
  @ApiOperation({ summary: '邀请链接被点击' })
  async inviteLink(@Query('code') code: string) {
    return await this.userService.inviteLink(code);
  }

  @Post('recharge')
  @ApiOperation({ summary: '用户充值' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  async userRecharge(@Body() body: UserRechargeDto) {
    return await this.userService.userRecharge(body);
  }

  @Get('queryAll')
  @ApiOperation({ summary: '查询所有用户' })
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  async queryAll(@Query() query: QueryAllUserDto, @Req() req: Request) {
    return await this.userService.queryAll(query, req);
  }

  @Get('queryOne')
  @ApiOperation({ summary: '查询单个用户' })
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  async queryOne(@Query() params: QueryOneUserDto) {
    return await this.userService.queryOne(params);
  }

  @Post('updateStatus')
  @ApiOperation({ summary: '更新用户状态' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  async updateStatus(@Body() body: UpdateUserStatusDto) {
    return await this.userService.updateStatus(body);
  }

  @Post('resetUserPass')
  @ApiOperation({ summary: '重置用户密码' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  async resetUserPass(@Body() body: ResetUserPassDto) {
    return await this.userService.resetUserPass(body);
  }
}
