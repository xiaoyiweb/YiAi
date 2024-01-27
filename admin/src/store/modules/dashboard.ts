import apiDashboard from '@/api/modules/dashboard'

const useDashboardStore = defineStore(
  'dashboard',
  () => {
    const baseData = ref([])

    async function getBaseData() {
      const res = await apiDashboard.getBaseInfo()
      console.log('res: ', res)
    }

    return {
      baseData,
      getBaseData,
    }
  },
)

export default useDashboardStore
