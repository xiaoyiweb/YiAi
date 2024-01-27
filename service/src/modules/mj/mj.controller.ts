import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { MjService } from './mj.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MjDrawDto } from './dto/mjDraw.dto';
import { Request } from 'express';
import { MjEnlargeImgDto } from './dto/mjEnlargeImg.dto';
import { AdminAuthGuard } from '@/common/auth/adminAuth.guard';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { MjTransformImgDto } from './dto/mjTransform.dto';

@ApiTags('mj')
@Controller('mj')
export class MjController {
  constructor(private readonly mjService: MjService) {}

  @Post('draw')
  @ApiOperation({ summary: '绘制mj图片' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  draw(@Body() body: MjDrawDto, @Req() req: Request) {
    return this.mjService.draw(body, req);
  }

  @Post('upscaleSingleImg')
  @ApiOperation({ summary: '放大单张图片' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  upscaleSingleImg(@Body() body: MjEnlargeImgDto, @Req() req: Request) {
    return this.mjService.upscaleSingleImg(body, req);
  }

  @Post('variationSingleImg')
  @ApiOperation({ summary: '变体单张图片' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  variationSingleImg(@Body() body: MjTransformImgDto, @Req() req: Request) {
    return this.mjService.variationSingleImg(body, req);
  }
}
