import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseEntity } from 'typeorm';

export class QuerAppDto {
  @ApiProperty({ example: 1, description: '查询页数', required: false })
  @IsOptional()
  page: number;

  @ApiProperty({ example: 10, description: '每页数量', required: false })
  @IsOptional()
  size: number;

  @ApiProperty({ example: 'name', description: 'app名称', required: false })
  @IsOptional()
  name: string;

  @ApiProperty({ example: 1, description: 'app状态 0：禁用 1：启用 3:审核加入广场中 4：已拒绝加入广场', required: false })
  @IsOptional()
  status: number;

  @ApiProperty({ example: 2, description: 'app分类Id', required: false })
  @IsOptional()
  catId: number;

  @ApiProperty({ example: 'role', description: 'app角色', required: false })
  @IsOptional()
  role: string;
}
