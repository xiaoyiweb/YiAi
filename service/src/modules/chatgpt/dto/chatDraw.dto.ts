import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatDrawDto {
  @ApiProperty({ example: 'Draw a cute little dog', description: '绘画描述信息' })
  prompt: string;

  @ApiProperty({ example: 1, description: '绘画张数', required: true })
  n: number;

  @ApiProperty({ example: '1024x1024', description: '图片尺寸', required: true })
  size: string;

  @ApiProperty({ example: 'standard', description: '图片质量', required: true })
  quality: string;
}
