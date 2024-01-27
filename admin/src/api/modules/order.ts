import api from '../index'

export default {
  queryAllOrder: params => api.get('order/queryAll', { params }),
  deleteOrder: data => api.post('order/delete', data),
  deleteNotPay: () => api.post('order/deleteNotPay'),
}
