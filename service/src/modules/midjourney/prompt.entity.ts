import { UserStatusEnum } from '../../common/constants/user.constant';
import { Check, Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'mj_prompt' })
export class mjPromptEntity extends BaseEntity {
  @Column({ comment: '绘画描述词', type: 'text' })
  prompt: string;

  @Column({ comment: '开启状态', default: true })
  status: boolean;

  @Column({ comment: '是否携带左边的参数', default: true })
  isCarryParams: boolean;

  @Column({ comment: '提示词名称', type: 'text' })
  title: string;

  @Column({ comment: '排序id', default: 100 })
  order: number;

  @Column({ comment: '图片比例' })
  aspect: string

  @Column({ comment: '描述', nullable: true })
  desc: string;
}
