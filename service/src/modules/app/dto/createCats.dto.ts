import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCatsDto {
  @ApiProperty({ example: '编程助手', description: 'app分类名称', required: true })
  @IsDefined({ message: 'app分类名称是必传参数' })
  name: string;

  @ApiProperty({
    example: '适用于编程编码、期望成为您的编程助手',
    description: 'app分类名称详情描述',
    required: false,
  })
  @IsDefined({ message: 'app分类名称描述是必传参数' })
  des: string;

  @ApiProperty({ example: 'https://xxxx.png', description: '套餐封面图片' })
  @IsOptional()
  coverImg: string;

  @ApiProperty({ example: 100, description: '套餐排序、数字越大越靠前', required: false })
  @IsOptional()
  order: number;

  @ApiProperty({ example: 1, description: '套餐状态 0：禁用 1：启用', required: true })
  @IsNumber({}, { message: '套餐状态必须是Number' })
  @IsIn([0, 1, 3, 4, 5], { message: '套餐状态错误' })
  status: number;
}
