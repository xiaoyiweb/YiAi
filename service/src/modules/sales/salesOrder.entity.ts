import { UserStatusEnum } from '../../common/constants/user.constant';
import { Check, Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'sales_order' })
export class SalesOrderEntity extends BaseEntity {
  @Column({ comment: '申请提现人用户Id' })
  userId: number;

  @Column({ comment: '申请提现的金额' })
  withdrawalAmount: number;

  @Column({ comment: '工单状态' })
  orderStatus: number;

  @Column({ comment: '审核状态' })
  auditStatus: number;

  @Column({ comment: '审核人', nullable: true })
  auditUserId: number;

  @Column({ comment: '打款状态', nullable: true })
  paymentStatus: number;

  @Column({ comment: '提现渠道 1: 支付宝 2： 微信', nullable: true })
  withdrawalChannels: number;

  @Column({ comment: '提现联系信息、备注即可', nullable: true })
  contactInformation: string;

  @Column({ comment: '提现备注留言', nullable: true })
  remark: string;
}
