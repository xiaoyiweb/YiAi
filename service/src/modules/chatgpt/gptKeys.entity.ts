import { UserStatusEnum } from '../../common/constants/user.constant';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'gpt_keys' })
export class GptKeysEntity extends BaseEntity {
  @Column({ unique: true, comment: 'gpt key', length: 255 })
  key: string;

  @Column({ comment: '使用的状态: 0:禁用 1：启用', default: 0 })
  status: number;

  @Column({ comment: '绑定的模型是？', default: 'gpt-3.5-turbo' })
  model: string;

  @Column({ comment: 'key的余额', type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: string;

  @Column({ comment: 'key的余额类型', default: '', nullable: true })
  type: string;

  @Column({ comment: 'key的状态: 1:有效 2:余额耗尽 -1:被封号', default: 1 })
  keyStatus: number;

  @Column({ comment: 'key的到期时间', nullable: true })
  expireTime: Date;

  @Column({ comment: 'key权重', default: 1 })
  weight: number;

  @Column({ comment: 'key的使用次数', default: 0 })
  useCount: number;

  @Column({ comment: '模型支持的最大Token', nullable: true })
  maxModelTokens: number;

  @Column({ comment: '模型设置的最大回复Token', nullable: true })
  maxResponseTokens: number;

  @Column({ comment: '当前模型的代理地址', nullable: true })
  openaiProxyUrl: string;

  @Column({ comment: '当前模型的超时时间单位ms', nullable: true })
  openaiTimeoutMs: number;
}
