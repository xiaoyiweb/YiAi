import { IsNotEmpty, MinLength, MaxLength, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class Options {
  @IsString()
  parentMessageId: string;
  model?: string;
  temperature?: number;
  top_p?: number;
  groupId?: number;
}

export class ChatProcessDto {
  @ApiProperty({ example: 'hello, Who are you', description: '对话信息' })
  @IsNotEmpty({ message: '提问信息不能为空！' })
  prompt: string;

  @ApiProperty({ example: '{ parentMessageId: 0 }', description: '上次对话信息', required: false })
  @Type(() => Options)
  options: Options;

  @ApiProperty({
    example: "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using markdown.",
    description: '系统预设信息',
  })
  @IsOptional()
  systemMessage?: string;

  @ApiProperty({ example: 1, description: '应用id', required: false })
  @IsOptional()
  appId: number;
}
