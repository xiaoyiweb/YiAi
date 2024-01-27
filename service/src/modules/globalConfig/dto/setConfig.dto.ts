import { IsArray, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

interface KeyValue {
	configKey: string;
	configVal: any;
}

export class SetConfigDto {
	@ApiProperty({ example: [{ configKey: 'siteName', configVal: 'NineAI' }], description: '设置配置信息' })
	@IsArray()
	@ArrayNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => Object)
	settings: KeyValue[];
}
