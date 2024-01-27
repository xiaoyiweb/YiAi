import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { RecordsQueryDto } from './dto/recordsQuery.dto';
import { AppForMoneyDto } from './dto/appForMoney.dto';
import { Request } from 'express';
import { drawMoneyOrderDto } from './dto/drawMoneyOrder.dto';
import { salesOrderDto } from './dto/salesOrder.dto';
import { AdminAuthGuard } from '@/common/auth/adminAuth.guard';
import { SuperAuthGuard } from '@/common/auth/superAuth.guard';
import { AuditOrderDto } from './dto/auditOrder.dto';
import { SalesUserListDto } from './dto/salesUserList.dto';
import { UpdateUserSalesDto } from './dto/updateUserSales.dto';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('mineAccount')
  @ApiOperation({ summary: '获取个人分销账户' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMineAccount(@Req() req: Request) {
    return this.salesService.getMineAccount(req);
  }

  @Get('mineRecords')
  @ApiOperation({ summary: '获取个人推介记录' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMineRecords(@Req() req: Request, @Query() query: RecordsQueryDto) {
    return this.salesService.getMineRecords(req, query);
  }

  @Get('inviteRecords')
  @ApiOperation({ summary: '管理端获取个人推介记录' })
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  async inviteRecords(@Req() req: Request, @Query() query: RecordsQueryDto) {
    return this.salesService.inviteRecords(req, query);
  }

  @Post('appForMoney')
  @ApiOperation({ summary: '申请提现' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async appForMoney(@Req() req: Request, @Body() body: AppForMoneyDto) {
    return this.salesService.appForMoney(req, body);
  }

  @Get('drawMoneyOrder')
  @ApiOperation({ summary: '获取个人提款工单列表' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async drawMoneyOrder(@Req() req: Request, @Query() query: drawMoneyOrderDto) {
    return this.salesService.drawMoneyOrder(req, query);
  }

  @Get('salesOrder')
  @ApiOperation({ summary: '管理端获取工单列表' })
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  async salesOrder(@Req() req: Request, @Query() query: salesOrderDto) {
    return this.salesService.salesOrder(req, query);
  }

  @Post('auditOrder')
  @ApiOperation({ summary: '审核工单' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  async auditOrder(@Req() req: Request, @Body() body: AuditOrderDto) {
    return this.salesService.auditOrder(req, body);
  }

  /* 查询所有用户账户 */
  @Get('salesUserList')
  @ApiOperation({ summary: '查询用户佣金账户' })
  @UseGuards(AdminAuthGuard)
  async salesUserList(@Req() req: Request, @Query() query: SalesUserListDto) {
    return this.salesService.salesUserList(req, query);
  }

  /* 修改用户佣金账户 */
  @Post('updateUserSales')
  @ApiOperation({ summary: '修改用户佣金账户' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  async updateUserSales(@Req() req: Request, @Body() body: UpdateUserSalesDto) {
    return this.salesService.updateUserSales(req, body);
  }
}
