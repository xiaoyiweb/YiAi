import api from '../index'

export default {
  querySalesOrder: params => api.get('sales/salesOrder', { params }),
  salesAuditOrder: data => api.post('sales/auditOrder', data),
  updateSalesUser: data => api.post('sales/updateUserSales', data),
  queryRecords: params => api.get('sales/inviteRecords', { params }),
  querySalesUserList: params => api.get('sales/salesUserList', { params }),
}
