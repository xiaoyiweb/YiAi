<script lang="ts" setup name="Copyright">
import { onMounted } from 'vue'
import useSettingsStore from '@/store/modules/settings'
import apiConfig from '@/api/modules/config'

const copyright = ref({
  copyrightTitle: 'NineAi Admin',
  copyrightUrl: '/',
})

async function getCopyright() {
  const res: any = await apiConfig.copyright()
  if (!res.success) {
    return
  }
  copyright.value = res.data
}

const route = useRoute()
const settingsStore = useSettingsStore()

onMounted(() => {
  getCopyright()
})
</script>

<template>
  <footer class="copyright">
    <span>Copyright</span>
    <span class="icon">©</span>
    <a
      v-if="settingsStore.settings.copyright.beian"
      :href="copyright.copyrightUrl"
      target="_blank"
      rel="noopener"
    >{{ copyright.copyrightTitle }}</a>
  </footer>
</template>

<style lang="scss" scoped>
footer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 40px 0 20px;
  color: var(--el-text-color-secondary);
  font-size: 14px;

  span,
  a {
    padding: 0 5px;
  }

  a {
    text-decoration: none;
    color: var(--el-text-color-secondary);
    transition: var(--el-transition-color);

    &:hover {
      color: var(--el-text-color-primary);
    }
  }

  .icon {
    padding: 0;
    font-size: 18px;
  }
}
</style>
