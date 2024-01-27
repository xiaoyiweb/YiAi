import { UserStatusEnum } from '../../common/constants/user.constant';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'app_cats' })
export class AppCatsEntity extends BaseEntity {
  @Column({ unique: true, comment: 'App分类名称' })
  name: string;

  @Column({ comment: 'App分类描述信息' })
  des: string;

  @Column({ comment: 'App分类封面图片', nullable: true })
  coverImg: string;

  @Column({ comment: 'App分类排序、数字越大越靠前', default: 100 })
  order: number;

  @Column({ comment: 'App分类是否启用中 0：禁用 1：启用', default: 1 })
  status: number;
}
