import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TextPromptDto {
  @IsString()
  readonly text: string;

  @IsNumber()
  readonly weight: number;
}

export class StableDrawDto {
  @ApiProperty({ example: 'stable-diffusion-512-v2-1', default: 512, description: '模型id', required: true })
  @IsDefined({ message: '模型id是必传参数' })
  engineId: string;

  @ApiProperty({
    example: [
      {
        text: 'Draw a cute little dog',
        weight: 0.5,
      },
    ],
    description: '绘画描述信息',
  })
  @Type(() => TextPromptDto)
  @ValidateNested({ each: true })
  text_prompts: TextPromptDto[];

  @ApiProperty({ example: 1, description: '绘画张数', required: true })
  samples = 1;

  @ApiProperty({ example: 512, default: 512, description: '图片尺寸宽度' })
  @Max(1024, { message: '图片尺寸最大宽度1024' })
  @Min(512, { message: '图片尺寸最小宽度512' })
  width = 512;

  @ApiProperty({ example: 512, default: 512, description: '图片尺寸高度' })
  @Max(1024, { message: '图片高度尺寸最大宽度1024' })
  @Min(512, { message: '图片高度尺寸最小宽度512' })
  height = 512;

  @ApiProperty({ example: 15, default: 7, description: '图片绘制扩散思维[值越高，图像越接近提示]', required: true })
  @Max(35, { message: '扩散思维值最大为35' })
  @Min(0, { message: '扩散思维值最小为0' })
  cfg_scale = 7;

  @ApiProperty({ example: 50, description: '绘制步骤', required: true })
  @Max(150, { message: '最大步骤不大于150' })
  @Min(10, { message: '步骤不小于10' })
  steps = 30;

  @ApiProperty({ example: 'anime', description: '样式预设', required: true })
  @IsIn([
    '3d-model',
    'analog-film',
    'anime',
    'cinematic',
    'comic-book',
    'digital-art',
    'enhance',
    'fantasy-art',
    'isometric',
    'line-art',
    'low-poly',
    'modeling-compound',
    'neon-punk',
    'origami',
    'photographic',
    'pixel-art',
    'tile-texture',
  ])
  style_preset: string;

  @ApiProperty({ example: 'NONE', description: '裁剪指南预设', required: true })
  @IsIn(['NONE', 'FAST_BLUE', 'FAST_GREEN', 'SIMPLE', 'SLOW', 'SLOWER', 'SLOWEST'])
  clip_guidance_preset = 'NONE';
}
