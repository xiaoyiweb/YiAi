import api from '../index'

export default {
  upgradeBalance: data => api.post('balance/upgradeBalance', data),
  queryUserAccountLog: params => api.get('balance/accountLog', { params }),
}
