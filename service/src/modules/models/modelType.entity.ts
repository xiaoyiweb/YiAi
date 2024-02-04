import { UserStatusEnum } from '../../common/constants/user.constant';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'models_type' })
export class ModelsTypeEntity extends BaseEntity {
  @Column({ comment: 'key模型类型 1: openai 2: 文心一言  3:清华智谱' })
  keyType: number;

  @Column({ comment: '模型名称[给用户看的]' })
  modelName: string;

  @Column({ comment: '是否开放模型: 0:禁用 1：启用', default: 1 })
  status: boolean;

  @Column({ comment: '绑定使用的模型是？最终调用的' })
  model: string;

  @Column({ comment: '模型温度0-2直接', default: 0.6 })
  temperature: number;

  @Column({ comment: '模型的使用次数', default: 0 })
  useCount: number;

  @Column({ comment: '模型总计使用的token数量', default: 0 })
  useToken: number;

  @Column({ comment: '单次调用扣除的次数', default: 1 })
  deduct: number;

  @Column({ comment: '扣除余额类型 1： 普通模型 2：高级模型', default: 1 })
  deductType: number;

  @Column({ comment: '模型设置允许用户使用的最大回复Token', default: 2048 })
  maxResponseTokens: number;

  @Column({ comment: '限制用户上下文可选最大轮次数', nullable: true })
  maxRounds: number;

  @Column({ comment: '是否为绘画模型Dall-E3', default: 0 })
  isDallE3: boolean;

  @Column({ comment: '是否为特殊模型、可以提供联想翻译、思维导图等特殊操作', default: 0 })
  isUseTool: boolean;

  @Column({ comment: '模型排序', default: 1 })
  modelOrder: number;
}
