interface RechargeType {
  [key: number]: string
}

export const RechargeTypeMap: RechargeType = {
  1: '注册赠送',
  2: '受邀请赠送',
  3: '邀请他人赠送',
  4: '购买卡密充值',
  5: '管理员赠送',
  6: '扫码购买充值',
  7: 'MJ绘画失败退款',
  8: '签到奖励',
}

// 0：未支付、1：已支付、2、支付失败、3：支付超时）
export const OrderMap = {
  0: '未支付',
  1: '已支付',
  2: '支付失败',
  3: '支付超时',
}
