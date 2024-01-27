import {
  InjectQueue,
  OnQueueActive,
  OnQueueCleaned,
  OnQueueCompleted,
  OnQueueDrained,
  OnQueueError,
  OnQueueFailed,
  OnQueuePaused,
  OnQueueProgress,
  OnQueueResumed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MidjourneyService } from '../midjourney/midjourney.service';

@Processor('MJDRAW')
export class QueueProcessor {
  constructor(private readonly midjourneyService: MidjourneyService) {}
  private readonly logger = new Logger(QueueProcessor.name);

  @Process({
    name: 'mjDraw',
    concurrency: process.env.CONCURRENCY ? +process.env.CONCURRENCY : 3,
  })
  async handleJob(job: Job) {
    const res = await this.midjourneyService.draw(job.data, job.id);
    return res;
  }

  /* 将在队列中的任务变为活动状态时被调用 */
  @OnQueueActive()
  onQueueActive(job: Job) {
    // console.log('将在队列中的任务变为活动状态时被调用', job.id);
  }

  /* 它在队列中发生错误时触发 */
  @OnQueueError()
  onQueueError(error: Error) {
    console.log('队列发生错误', error);
  }

  /* 队列任务的一个回调用于通知当前进度 */
  @OnQueueProgress()
  onQueueProgress(job: Job, progress: number) {
    console.log('队列任务的一个回调用于通知当前进度', job.id, progress);
  }

  /* 队列任务完成的时候调用 */
  @OnQueueCompleted()
  onQueueCompleted(job: Job, result: any) {
    // console.log('队列任务完成的时候调用', job.id, result);
  }

  /* 任务失败时调用 */
  @OnQueueFailed()
  onQueueFailed(job: Job, err: Error) {
    Logger.error(`Queue failed: ${err.message}: 绘画失败 ${job.id}`, 'QueueProcessor');
    this.midjourneyService.drawFailed(job.data);
  }

  /* 队列暂停的时候调用 */
  @OnQueuePaused()
  onQueuePaused() {
    console.log('队列暂停的时候调用');
  }

  /* 队列恢复工作时候调用 */
  @OnQueueResumed()
  onQueueResumed() {
    console.log('队列恢复的时候调用');
  }

  /* 队列被清空的时候调用的 */
  @OnQueueCleaned()
  onQueueCleaned(jobs: Job[], type: string) {
    Logger.log(`Queue cleaned: ${jobs.length} jobs of type ${type} were cleaned.`, 'QueueProcessor');
  }

  /* 队列为空的时候调用的 */
  @OnQueueDrained()
  onQueueDrained() {
    // console.log('OnQueueDrained 当前队列已经空了');
  }
}
