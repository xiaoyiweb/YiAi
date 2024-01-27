import api from '../index'

export default {
  queryAllPackage: params => api.get('crami/queryAllPackage', { params }),
  updatePackage: data => api.post('crami/updatePackage', data),
  createPackage: data => api.post('crami/createPackage', data),
  delPackage: data => api.post('crami/delPackage', data),
  queryAllCrami: params => api.get('crami/queryAllCrami', { params }),
  delCrami: data => api.post('crami/delCrami', data),
  createCrami: data => api.post('crami/createCrami', data),
  batchDelCrami: data => api.post('crami/batchDelCrami', data),
}
