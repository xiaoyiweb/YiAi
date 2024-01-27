import api from '../index'

export default {
  queryAdminDrawList: params => api.get('midjourney/adminDrawList', { params }),
  salesAuditOrder: data => api.post('sales/auditOrder', data),
  updateSalesUser: data => api.post('sales/updateUserSales', data),
  queryRecords: params => api.get('sales/inviteRecords', { params }),
  querySalesUserList: params => api.get('sales/salesUserList', { params }),
  queryPrompts: () => api.get('midjourney/queryPrompts'),
  setPrompt: data => api.post('midjourney/setPrompt', data),
  delPrompt: data => api.post('midjourney/delPrompt', data),
}
