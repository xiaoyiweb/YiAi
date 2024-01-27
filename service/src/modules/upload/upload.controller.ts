import { UploadService } from './upload.service';
import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @ApiOperation({ summary: '上传文件' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file) {
    return this.uploadService.uploadFile(file);
  }

  @Get('test')
  @ApiOperation({ summary: '测试' })
  async test() {
    return this.uploadService.test();
  }
}
