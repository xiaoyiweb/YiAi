import { QueueService } from './queue.service';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MjDrawDto } from './dto/mjDraw.dto';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { Request } from 'express';

@ApiTags('Queue')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('addMjDrawQueue')
  @ApiOperation({ summary: '提交绘制图片任务' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async mjDraw(@Body() body: MjDrawDto, @Req() req: Request) {
    return await this.queueService.addMjDrawQueue(body, req);
  }

  // 查询任务队列
  @Get('getQueue')
  @ApiOperation({ summary: '查询任务队列' })
  async getQueue() {
    return await this.queueService.getQueue();
  }
}
