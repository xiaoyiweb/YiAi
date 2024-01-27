import { DrawService } from './draw.service';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { StableDrawDto } from './dto/chatDraw.dto';

@ApiTags('draw')
@Controller('draw')
export class DrawController {
  constructor(private readonly drawService: DrawService) {}

  @Get('engines')
  @ApiOperation({ summary: '获取stable Diffusion 模型' })
  getEngines() {
    return this.drawService.getEngines();
  }

  @Post('drawTextToImage')
  @ApiOperation({ summary: 'stable Diffusion绘画' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  textToImage(@Body() body: StableDrawDto) {
    return this.drawService.drawTextToImage(body);
  }
}
