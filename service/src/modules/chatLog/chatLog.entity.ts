import { UserStatusEnum } from '../../common/constants/user.constant';
import { Check, Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'chatlog' })
export class ChatLogEntity extends BaseEntity {
  @Column({ comment: '用户ID' })
  userId: number;

  @Column({ comment: '使用类型', nullable: true })
  type: string;

  @Column({ comment: '询问的问题', type: 'text', nullable: true })
  prompt: string;

  @Column({ comment: '回答的答案', type: 'text', nullable: true })
  answer: string;

  @Column({ comment: '本次问题的token', nullable: true })
  promptTokens: number;

  @Column({ comment: '本次回答的token', nullable: true })
  completionTokens: number;

  @Column({ comment: '本次总花费的token', nullable: true })
  totalTokens: number;

  @Column({ comment: '本次使用的模型', nullable: true })
  model: string;

  @Column({ comment: '本次访问的Ip地址', nullable: true })
  curIp: string;

  @Column({ comment: '是否推荐0: 默认 1: 推荐', nullable: true, default: 0 })
  rec: number;

  @Column({ comment: '扩展参数', nullable: true, type: 'text' })
  extend: string;

  @Column({ comment: 'mj绘画列表携带的一级id用于图片变换或者放大', nullable: true })
  message_id: string;

  @Column({ comment: '一组图片的第几张、放大或者变换的时候需要使用', nullable: true })
  orderId: number;

  @Column({ comment: 'mj绘画的动作、放大或者变换、或者全部重新绘制', nullable: true })
  action: string;

  @Column({ comment: '是否是组图，这种图才可以指定放大', default: 0 })
  group: number;

  @Column({ comment: '放大图片的Id记录', nullable: true })
  upscaleId: string;

  @Column({ comment: '变换图片的Id记录', nullable: true })
  variationId: string;

  @Column({ comment: '图片信息的string', nullable: true, type: 'text' })
  fileInfo: string;

  @Column({ comment: 'role system user assistant', nullable: true })
  role: string;

  @Column({ comment: '对话分组ID', nullable: true })
  groupId: number;

  @Column({ comment: '序列化的本次会话参数', nullable: true, type: 'text' })
  conversationOptions: string;

  @Column({ comment: '序列化的本次提交参数', nullable: true, type: 'text' })
  requestOptions: string;

  @Column({ comment: '是否删除', default: false })
  isDelete: boolean;

  @Column({ comment: '使用的应用id', nullable: true })
  appId: number;
}
