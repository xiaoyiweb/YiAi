import { UserStatusEnum } from '../../common/constants/user.constant';
import { Check, Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'chat_group' })
export class ChatGroupEntity extends BaseEntity {
  @Column({ comment: '用户ID' })
  userId: number;

  @Column({ comment: '是否置顶聊天', type: 'boolean', default: false })
  isSticky: boolean;

  @Column({ comment: '分组名称', nullable: true })
  title: string;

  @Column({ comment: '应用ID', nullable: true })
  appId: number;

  @Column({ comment: '是否删除了', default: false })
  isDelete: boolean;

  @Column({ comment: '配置', nullable: true, default: null, type: 'text' })
  config: string;
}
