import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetQrSceneStrDto {
  @ApiProperty({ example: 'SNINE', description: '用户邀请码', required: true })
  @IsOptional()
  invitedBy?: string;
}
