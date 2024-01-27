import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entity/baseEntity';

@Entity({ name: 'chat_pre' })
export class ChatPreEntity extends BaseEntity {
  @Column({ comment: '分类ID' })
  typeId: number;

  @Column({ comment: '预设问题描述词', nullable: true, type: 'text' })
  prompt: string;

  @Column({ comment: '标题名称' })
  title: string;

  @Column({ comment: '排序ID', default: 100 })
  order: number;

  @Column({ comment: '开启状态', default: true })
  status: boolean;
}
