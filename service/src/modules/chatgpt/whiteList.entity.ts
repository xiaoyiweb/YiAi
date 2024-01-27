import { UserStatusEnum } from '../../common/constants/user.constant';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'white_list' })
export class WhiteListEntity extends BaseEntity {
  @Column({ unique: true, comment: '用户ID' })
  userId: number;

  @Column({ comment: '使用次数限制', default: 0 })
  count: number;

  @Column({ comment: '当前用户状态', default: 1 })
  status: number;

  @Column({ comment: '已经使用的次数', default: 0 })
  useCount: number;
}
