import { UserStatusEnum } from '../../common/constants/user.constant';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'chat_box_type' })
export class ChatBoxTypeEntity extends BaseEntity {
  @Column({ comment: '分类名称' })
  name: string;

  @Column({ comment: 'icon图标' })
  icon: string;

  @Column({ comment: '排序ID', default: 10 })
  order: number;

  @Column({ comment: '是否打开', default: true })
  status: boolean
}
