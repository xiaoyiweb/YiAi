import { Controller, Get, Query } from '@nestjs/common';
import { FanyiService } from './fanyi.service';

@Controller('fanyi')
export class FanyiController {
  constructor(private readonly fanyiService: FanyiService) {}

  @Get('translate')
  convertToEnglish(@Query('text') text: string) {
    return this.fanyiService.convertToEnglish(text);
  }
}
