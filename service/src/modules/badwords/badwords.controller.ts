import { BadwordsService } from './badwords.service';
import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QueryBadWordsDto } from './dto/queryBadWords.dto';
import { QueryViolationDto } from './dto/queryViolation.dto';
import { UpdateBadWordsDto } from './dto/updateBadWords.dto';
import { DelBadWordsDto } from './dto/delBadWords.dto';
import { AddBadWordDto } from './dto/addBadWords.dto';
import { SuperAuthGuard } from '@/common/auth/superAuth.guard';
import { Admin } from 'typeorm';
import { AdminAuthGuard } from '@/common/auth/adminAuth.guard';
import { Request } from 'express';

@ApiTags('badWords')
@Controller('badwords')
export class BadwordsController {
  constructor(private readonly badwordsService: BadwordsService) {}

  @Get('query')
  @ApiOperation({ summary: '查询所有敏感词' })
  queryBadWords(@Query() query: QueryBadWordsDto) {
    return this.badwordsService.queryBadWords(query);
  }

  @Post('del')
  @ApiOperation({ summary: '删除敏感词' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  delBadWords(@Body() body: DelBadWordsDto) {
    return this.badwordsService.delBadWords(body);
  }

  @Post('update')
  @ApiOperation({ summary: '更新敏感词' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  updateBadWords(@Body() body: UpdateBadWordsDto) {
    return this.badwordsService.updateBadWords(body);
  }

  @Post('add')
  @ApiOperation({ summary: '新增敏感词' })
  @UseGuards(SuperAuthGuard)
  @ApiBearerAuth()
  addBadWord(@Body() body: AddBadWordDto) {
    return this.badwordsService.addBadWord(body);
  }

  @Get('violation')
  @ApiOperation({ summary: '查询违规记录' })
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  violation(@Req() req: Request, @Query() query: QueryViolationDto) {
    return this.badwordsService.violation(req, query);
  }
}
