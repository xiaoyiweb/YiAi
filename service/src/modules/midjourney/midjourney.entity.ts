import { UserStatusEnum } from '../../common/constants/user.constant';
import { Check, Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'midjourney' })
export class MidjourneyEntity extends BaseEntity {
  @Column({ comment: '用户ID' })
  userId: number;

  @Column({ comment: '任务ID', nullable: true })
  jobId: number;

  @Column({ comment: '额外参数', nullable: true })
  extraParam: string;

  @Column({ comment: '绘画描述词', type: 'text' })
  prompt: string;

  @Column({ comment: '垫图图片基础地址', nullable: true })
  imgUrl: string;

  @Column({ comment: '垫图图片 + 绘画描述词 + 额外参数 = 完整的prompt', type: 'text' })
  fullPrompt: string;

  @Column({ comment: '随机产生的绘画ID用于拿取比对结果' })
  randomDrawId: string;

  @Column({ comment: '当前绘制任务的进度', nullable: true })
  progress: number;

  @Column({ comment: '当前绘制任务的耗时', nullable: true })
  durationSpent: number;

  @Column({ comment: '当前绘制任务的状态' })
  status: number;

  @Column({ comment: 'mj绘画的动作、绘图、放大、变换、图生图' })
  action: number;

  @Column({ comment: '一组图片的第几张、放大或者变换的时候需要使用', nullable: true })
  orderId: number;

  @Column({ comment: '是否推荐0: 默认不推荐 1: 推荐', nullable: true, default: 0 })
  rec: number;

  @Column({ comment: '绘画的ID每条不一样', nullable: true })
  message_id: string;

  @Column({ comment: '对图片放大或者变体的ID', nullable: true })
  custom_id: string;

  @Column({ comment: '图片信息尺寸', nullable: true, type: 'text' })
  fileInfo: string;

  @Column({ comment: '扩展参数', nullable: true, type: 'text' })
  extend: string;

  @Column({ comment: '是否删除 0: 未删除 1: 已删除', nullable: true, default: 0 })
  isDelete: number;

  @Column({ comment: '是否存入了图片到配置的储存项 配置了则存储 不配置地址则是源地址', default: true })
  isSaveImg: boolean;
}
