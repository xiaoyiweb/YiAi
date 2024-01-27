import { UserStatusEnum } from '../../common/constants/user.constant';
import { Check, Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'sales_records' })
export class SalesRecordsEntity extends BaseEntity {
  @Column({ comment: '邀请人ID' })
  inviterUserId: number;

  @Column({ comment: '被邀请人ID' })
  inviteeUserId: number;

  @Column({ comment: '订单ID' })
  orderId: string;

  @Column({ comment: '订单价格', type: 'decimal', scale: 2, precision: 10 })
  orderPrice: number;

  @Column({ comment: '佣金金额', type: 'decimal', scale: 2, precision: 10 })
  commissionAmount: number;

  @Column({ comment: '佣金比例', type: 'decimal', scale: 2, precision: 10 })
  commissionPercentage: number;
}
