import { HttpException, HttpStatus, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import axios from 'axios';
import * as uuid from 'uuid';
import { UploadService } from '../upload/upload.service';
import { StableDrawDto } from './dto/chatDraw.dto';

@Injectable()
export class DrawService implements OnModuleInit {
  constructor(private readonly uploadService: UploadService) {}
  private apiHost;
  private apiKey;
  private Authorization;

  async onModuleInit() {
    this.apiHost = process.env.API_HOST ?? 'https://api.stability.ai';
    this.apiKey = process.env.STABILITY_API_KEY;
    if (!this.apiKey) {
      this.apiKey = '*********';
      // Logger.error(`Missing Stability API key. | 缺少Stability API key.`, 'DrawModule');
    }
    this.Authorization = `Bearer ${this.apiKey}`;
  }

  /* 获取模型列表 */
  async getEngines() {
    const url = `${this.apiHost}/v1/engines/list`;
    const res = await axios(url, {
      method: 'GET',
      headers: { Authorization: this.Authorization },
    });
    if (res.status === 401) {
      console.log(`stability api key is invalid, ${res?.data?.message}`);
    }
    if (res.status !== 200) {
      console.log(`${res.status} ${res?.data?.message}}`);
      throw new HttpException('获取列表失败', HttpStatus.BAD_REQUEST);
    }
    return res.data;
  }

  /* 绘制图片 文字 => 图片 */
  async drawTextToImage(body: StableDrawDto) {
    const { engineId = 'stable-diffusion-768-v2-1' } = body;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: this.Authorization,
    };
    const url = `${this.apiHost}/v1/generation/${engineId}/text-to-image`;
    try {
      const response = await axios.post(url, body, { headers });
      if (response.status !== 200) {
        throw new HttpException('绘制失败', HttpStatus.BAD_REQUEST);
      }
      const resImageBasetask = [];
      for (const item of response.data.artifacts) {
        const filename = uuid.v4().slice(0, 10) + '.png';
        const buffer = Buffer.from(item.base64, 'base64');
        resImageBasetask.push(this.uploadService.uploadFile({ filename, buffer }));
      }
      const urls = await Promise.all(resImageBasetask);
      return urls;
    } catch (error) {
      if (!error?.response) {
        throw new HttpException('绘制失败', HttpStatus.BAD_REQUEST);
      }
      const { status, data } = error.response;
      throw new HttpException(data.message, status);
    }
  }
}
