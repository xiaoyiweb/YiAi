import { UserStatusEnum } from '../../common/constants/user.constant';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'models' })
export class ModelsEntity extends BaseEntity {
  @Column({ comment: 'key模型类型 1: openai 2: 文心一言  3:清华智谱' })
  keyType: number;

  @Column({ comment: '模型名称' })
  modelName: string;

  @Column({ comment: '模型的key' })
  key: string;

  @Column({ comment: '模型的secret', default: null })
  secret: string;

  @Column({ comment: '部分模型的调用token', default: null })
  accessToken: string;

  @Column({ comment: '使用的状态: 0:禁用 1：启用', default: 1 })
  status: boolean;

  @Column({ comment: '绑定的模型是？' })
  model: string;

  @Column({ comment: 'key的状态: 1:有效   -1:被封号 -2: 错误的秘钥 -3: 余额使用完了', default: 1 })
  keyStatus: number;

  @Column({ comment: 'key权重', default: 1 })
  keyWeight: number;

  @Column({ comment: 'key的使用次数', default: 0 })
  useCount: number;

  @Column({ comment: 'key的已经使用的token数量', default: 0 })
  useToken: number;

  @Column({ comment: '模型支持的最大Token', default: 1000 })
  maxModelTokens: number;

  @Column({ comment: '模型设置的最大回复Token', default: 4096 })
  maxResponseTokens: number;

  @Column({ comment: '当前模型的代理地址', nullable: true })
  proxyUrl: string;

  @Column({ comment: '当前模型的超时时间单位s', default: 200 })
  timeout: number;

  @Column({ comment: '单次调用扣除的次数', default: 1 })
  deduct: number;

  @Column({ comment: '扣除余额类型 1： 普通模型 2：高级模型', default: 1 })
  deductType: number;

  @Column({ comment: '备注信息', nullable: true })
  remark: string;

  @Column({ comment: '限制用户上下文最大次数', nullable: true })
  maxRounds: number;

  @Column({ comment: '是否是绘画key: 0:不是 1：是', default: 0 })
  isDraw: boolean;

  @Column({ comment: '是否使用token计费: 0:不是 1：是', default: 0 })
  isTokenBased: boolean;

  @Column({ comment: 'token计费比例', default: 0 })
  tokenFeeRatio: number;

  @Column({ comment: 'key权重', default: 1 })
  modelOrder: number;

}
