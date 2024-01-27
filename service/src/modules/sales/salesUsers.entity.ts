import { UserStatusEnum } from '../../common/constants/user.constant';
import { Check, Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'sales_users' })
export class SalesUsersEntity extends BaseEntity {
  @Column({ comment: '分销人用户Id' })
  userId: number;

  @Column({ comment: '分销人的提成比例' })
  performanceRatio: number;

  @Column({ comment: '分销人的自定义称号等级', nullable: true })
  salesOutletName: string;

  @Column({ comment: '分销人账户总金额', type: 'decimal', scale: 2, precision: 10, default: 0 })
  totalAmount: number;

  @Column({ comment: '分销人账户已经提现金额', type: 'decimal', scale: 2, precision: 10, default: 0 })
  withdrawalAmount: number;

  @Column({ comment: '分销人账户可提现金额', type: 'decimal', scale: 2, precision: 10, default: 0 })
  distributionBalance: number;

  @Column({ comment: '分销人账户正在提现的金额', type: 'decimal', scale: 2, precision: 10, default: 0 })
  drawMoneyIn: number;

  @Column({ comment: '累计成功提成的订单量', default: 0 })
  orderCount: number;
}
