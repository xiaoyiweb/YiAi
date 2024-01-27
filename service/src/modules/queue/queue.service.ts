import { HttpException, HttpStatus, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Process, Processor, InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { MjDrawDto } from './dto/mjDraw.dto';
import { createRandomUid } from '@/common/utils';
import { MidjourneyService } from '../midjourney/midjourney.service';
import { MidjourneyActionEnum } from '@/common/constants/midjourney.constant';
import { Request } from 'express';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';

export class QueueService implements OnApplicationBootstrap {
  constructor(
    @InjectQueue('MJDRAW') private readonly mjDrawQueue: Queue,
    private readonly midjourneyService: MidjourneyService,
    private readonly userBalanceService: UserBalanceService,
    private readonly globalConfigService: GlobalConfigService,
  ) {}
  private readonly jobIds: any[] = [];

  async onApplicationBootstrap() {
    // Logger.debug('服务启动时清除所有之前未执行完毕的队列任务！', 'QueueService');
    await this.mjDrawQueue.clean(0, 'active');
    /* 改变所有数据库状态不对的值 */
    await this.midjourneyService.cleanQueue();
  }

  /* 提交绘画任务 */
  async addMjDrawQueue(body: MjDrawDto, req: Request) {
    const { prompt, imgUrl, extraParam, orderId, action = 1, drawId } = body;
    /* 限制普通用户队列最多可以有两个任务在排队或者等待中 */
    await this.midjourneyService.checkLimit(req);
    /* 检测余额 */
    await this.userBalanceService.validateBalance(req, 'mjDraw', action === 2 ? 1 : 4);

    /* 绘图或者图生图 */
    if (action === MidjourneyActionEnum.DRAW || action === MidjourneyActionEnum.GENERATE) {
      /* 绘图或者图生图是相同的 区分一个action即可 */
      const randomDrawId = `${createRandomUid()}`;
      const params = { ...body, userId: req.user.id, randomDrawId };
      /* 添加绘制任务进入到db */
      const res = await this.midjourneyService.addDrawQueue(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      /* 添加任务到队列 通过imgUrl判断是不是图生图 */
      const job = await this.mjDrawQueue.add(
        'mjDraw',
        { id: res.id, action: imgUrl ? 4 : 1, userId: req.user.id },
        { delay: 1000, timeout: +timeout },
      );
      /* 绘图和图生图扣除余额4 */
      this.jobIds.push(job.id);
      /* 扣费 */
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
      return true;
    }

    if (!drawId || !orderId) {
      throw new HttpException('缺少必要参数！', HttpStatus.BAD_REQUEST);
    }

    /* 图片放大 */
    if (action === MidjourneyActionEnum.UPSCALE) {
      const actionDetail: any = await this.midjourneyService.getDrawActionDetail(action, drawId, orderId);
      const { custom_id } = actionDetail;
      /* 检测当前图片是不是已经放大过了 */
      await this.midjourneyService.checkIsUpscale(custom_id);
      const params = { ...body, userId: req.user.id, ...actionDetail };
      const res = await this.midjourneyService.addDrawQueue(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
      /* 扣费 */
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 1, 1);
      this.jobIds.push(job.id);
      return;
    }

    /* 图片变体 */
    if (action === MidjourneyActionEnum.VARIATION) {
      const actionDetail: any = await this.midjourneyService.getDrawActionDetail(action, drawId, orderId);
      const params = { ...body, userId: req.user.id, ...actionDetail };
      const res = await this.midjourneyService.addDrawQueue(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
      this.jobIds.push(job.id);
      /* 扣费 */
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
      return;
    }

    /* 重新生成 */
    if (action === MidjourneyActionEnum.REGENERATE) {
      const actionDetail: any = await this.midjourneyService.getDrawActionDetail(action, drawId, orderId);
      const params = { ...body, userId: req.user.id, ...actionDetail };
      const res = await this.midjourneyService.addDrawQueue(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
      this.jobIds.push(job.id);
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
      return;
    }

    /* 对图片增强 Vary */
    if (action === MidjourneyActionEnum.VARY) {
      const actionDetail: any = await this.midjourneyService.getDrawActionDetail(action, drawId, orderId);
      const params = { ...body, userId: req.user.id, ...actionDetail };
      const res = await this.midjourneyService.addDrawQueue(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
      this.jobIds.push(job.id);
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
      return;
    }

    /* 对图片缩放 Zoom */
    if (action === MidjourneyActionEnum.ZOOM) {
      const actionDetail: any = await this.midjourneyService.getDrawActionDetail(action, drawId, orderId);
      const params = { ...body, userId: req.user.id, ...actionDetail };
      const res = await this.midjourneyService.addDrawQueue(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
      this.jobIds.push(job.id);
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
      return;
    }
  }

  /* 查询队列 */
  async getQueue() {
    return { jobIds: this.jobIds };
  }
}
