import { UserStatusEnum } from '../../common/constants/user.constant';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'chat_box' })
export class ChatBoxEntity extends BaseEntity {
  @Column({ comment: '分类ID' })
  typeId: number;

  @Column({ comment: '应用ID', nullable: true })
  appId: number;

  @Column({ comment: '快速描述词', nullable: true, type: 'text' })
  prompt: string;

  @Column({ comment: '标题名称' })
  title: string;

  @Column({ comment: '排序ID', default: 100 })
  order: number;

  @Column({ comment: '开启状态', default: true })
  status: boolean;

  @Column({ comment: '跳转地址' })
  url: string;
}
