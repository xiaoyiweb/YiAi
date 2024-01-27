<route lang="yaml">
meta:
  title: 动态菜单
    </route>

<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import apiMenu from '@/api/modules/menu'
import IconifyIcon from '@/components/IconifyIcon/index.vue'
import api from '@/api'
const menuPlatform = ref(1)
const formRef = ref<FormInstance>()
const visible = ref(false)
const activeMenuId = ref(0)
const menuIcon = ref('')
const menuTipText = ref('')
const menuTipOrder = ref(0)
const visibleIcon = ref(false)

const formInline = ref({
  menuTipText: '',
  menuIframeUrl: '',
  isJump: false,
  isShow: true,
  menuIcon: '',
  menuPath: '',
  order: 1000,
  isNeedAuth: false,
  isSystem: true
})

const rules = {
  menuTipText: [{ required: true, trigger: 'blur', message: '请填写菜单名称' },],
  menuIframeUrl: [{ required: true, trigger: 'blur', message: '请填写三方网页地址' },],
  isJump: [{ required: true, trigger: 'blur', message: '请确认是否跳转' },],
  isShow: [{ required: true, trigger: 'blur', message: '请确认是否打开菜单' },],
  menuIcon: [{ required: true, trigger: 'blur', message: '请填写ICON图标' },],
  order: [{ required: true, trigger: 'blur', message: '请填写排序ID' },],
  menuPath: [{ required: true, trigger: 'blur', message: '请填写菜单路径' },],
  isSystem: [{ required: true, trigger: 'blur', message: '请确认是否是系统内地址' },],
  isNeedAuth: [{ required: true, trigger: 'blur', message: '请确认是否需要权限' },],
}
watch(menuPlatform, (val) => {
  queryMenu()
})

const dialogTitle = computed(() => {
  return activeMenuId.value > 0 ? '编辑菜单' : '添加菜单'
})

const confirmBtnMsg = computed(() => {
  return activeMenuId.value > 0 ? '确认修改' : '确认添加'
})



const menuList = ref([])

async function queryMenu(){
  const res = await apiMenu.quertMenu({ menuPlatform: menuPlatform.value})
  menuList.value = res.data;
}

function handlerCloseDialog(formEl: FormInstance | undefined) {
  formEl?.resetFields()
  activeMenuId.value = 0
}

async function handleShowMenu(row: any){
  const { id } = row
  await apiMenu.visibleMenu({id})
  ElMessage.success('操作成功！')
  queryMenu()
}

async function handleDelete(row: any){
  await apiMenu.delMenu({id: row.id})
  ElMessage.success('操作成功！')
  queryMenu()
}

async function handleAddMenu(){
  formRef.value?.resetFields()
  activeMenuId.value = 0
  visible.value = true
}

async function handleConfirm(formEl: FormInstance | undefined){
  formEl?.validate(async (valid) => {
    if(!valid) return
    const params = Object.assign(formInline.value, {id: activeMenuId}, {menuPlatform: menuPlatform.value})
    await apiMenu.setMenu(params)
    ElMessage.success('操作成功！')
    formEl.resetFields()
    visible.value = false
    queryMenu()
  })
}

function handleEditMenu(row: any){
  const { id, menuTipText, menuIframeUrl, isJump, isShow, menuIcon, menuPath, order, isNeedAuth } = row
  activeMenuId.value = id
  formInline.value = {
    menuTipText,
    menuIframeUrl,
    isJump,
    isShow,
    menuIcon,
    menuPath,
    order,
    isNeedAuth,
    isSystem: menuPath ? false : true
  }
  visible.value = true
}

async function handleEditIcon(row: any){
  console.log('row: ', row);
  const { id, menuIcon: icon, menuTipText: text, order } = row;
  menuIcon.value = icon
  menuTipText.value = text
  menuTipOrder.value = order
  activeMenuId.value = id
  visibleIcon.value = true
}

async function handleConfirmUpdateIcon(){
  if(!menuIcon.value || !menuTipText.value || !menuTipOrder.value ) return ElMessage.error('请填写ICON编码');
  const params = {
    id: activeMenuId.value,
    menuIcon: menuIcon.value,
    menuTipText: menuTipText.value,
    order: menuTipOrder.value
  }
  await apiMenu.updateIcon(params)
  ElMessage.success('操作成功！')
  queryMenu()
  visibleIcon.value = false;
}



onMounted(() => {
  queryMenu()
})
</script>

<template>
  <div>
    <page-main>
      <el-alert :closable="false" show-icon title="动态菜单配置说明" description="请至少配置一个、如果不配置默认设置对话页面、排序ID越小越靠前、PC和移动端是两套独立的设置、图标选择请在此处： https://icon-sets.iconify.design/ 找到或搜索到喜欢的图标之后可以复制下方的图标编号 例如material-symbols:chat-outline、更加详细文档参考官方演示站公告文档地址！" type="success" />
    </page-main>
    <el-card style="margin: 20px;">
      <template #header>
        <div class="flex justify-between">
          <b>客户端动态菜单设置</b>
          <div class="flex items-center">
            <el-radio-group v-model="menuPlatform" size="large">
              <el-radio-button :label="1" >PC端</el-radio-button>
              <el-radio-button :label="0" >移动端</el-radio-button>
            </el-radio-group>
            <el-button  size="large" class="ml-5" @click="handleAddMenu">
              添加菜单
              <el-icon class="ml-3">
                <Plus />
              </el-icon>
            </el-button>
          </div>
        </div>
      </template>
      <el-table :data="menuList" style="width: 100%;">
        <el-table-column prop="menuTipText" label="菜单文本" />
        <el-table-column prop="menuType" label="菜单类型" >
          <template #default="scope">
            <el-tag :type="scope.row.menuType ? 'success' : 'danger'">
              {{ scope.row.menuType === 0 ? '系统预设' : '自定义菜单'}}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isJump" label="是否打开新窗口" >
          <template #default="scope">
            <el-tag :type="scope.row.isJump ? 'success' : 'danger'">
              {{ scope.row.isJump ? '是' : '否'}}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isShow" label="是否显示菜单" >
          <template #default="scope">
            <el-tag :type="scope.row.isShow ? 'success' : 'danger'">
              {{ scope.row.isShow ? '是' : '否'}}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isNeedAuth" label="是否需要登录访问" >
          <template #default="scope">
            <el-tag :type="scope.row.isNeedAuth ? 'success' : 'danger'">
              {{ scope.row.isNeedAuth ? '是' : '否'}}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="menuIcon" label="菜单图标" >
          <template #default="scope">
            <IconifyIcon  style="font-size: 24px;" :icon="scope.row.menuIcon"/>
          </template>
        </el-table-column>
        <el-table-column prop="order" label="排序" />
        <el-table-column prop="menuPath" label="菜单路径">
          <template  #default="scope">
              {{  scope.row.menuPath || '---' }}
          </template>
        </el-table-column>
        <el-table-column prop="menuIframeUrl" label="三方网页链接">
          <template  #default="scope">
              {{  scope.row.menuIframeUrl || '---' }}
          </template>
        </el-table-column>
        <el-table-column  label="操作" >
          <template #default="scope">
            <div class="flex items-center">
              <el-button @click="handleEditMenu(scope.row)" v-if="scope.row.menuType" size="small">编辑菜单</el-button>
              <el-button @click="handleEditIcon(scope.row)" v-if="!scope.row.menuType" size="small">修改默认</el-button>
              <el-button @click="handleShowMenu(scope.row)" v-if="!scope.row.menuType" :type="scope.row.isShow ? 'danger' : 'success'" size="small">{{  scope.row.isShow ? '隐藏菜单' : '打开菜单' }}</el-button>
              <el-popconfirm title="是否删除当前菜单？" @confirm="handleDelete(scope.row)" v-if="scope.row.menuType" >
                <template #reference>
                  <el-button type="danger" size="small">删除菜单</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="visible" :close-on-click-modal="false" :title="dialogTitle" width="570" @close="handlerCloseDialog(formRef)">
      <el-form ref="formRef" label-width="140" :rules="rules"  :model="formInline">
        <el-form-item label="是否打开菜单" prop="isShow">
          <el-switch
            v-model="formInline.isShow"
          />
        </el-form-item>
        <el-form-item label="是否属于三方网页" prop="isSystem">
          <el-switch
            v-model="formInline.isSystem"
          />
        </el-form-item>
        <el-form-item label="菜单文本提示信息" prop="menuTipText">
          <el-input v-model="formInline.menuTipText" placeholder="请填写菜单提示文字" />
        </el-form-item>
        <el-form-item label="菜单图标编号" prop="menuIcon">
          <el-input v-model="formInline.menuIcon" placeholder="请填写菜单ICON图标" />
        </el-form-item>
        <el-form-item label="加载三方网页地址" v-if="formInline.isSystem" prop="menuIframeUrl">
          <el-input v-model="formInline.menuIframeUrl" placeholder="请填写加载的三方网页地址" />
        </el-form-item>
        <el-form-item label="数字编号排序" prop="order">
          <el-input v-model="formInline.order" type="number" placeholder="请填写排序Id、越小越靠前" />
        </el-form-item>
        <el-form-item label="系统内菜单路径"  v-if="!formInline.isSystem" prop="menuPath">
          <el-input v-model="formInline.menuPath" placeholder="请填写系统内置菜单地址" />
        </el-form-item>
        <el-form-item label="是否打开新窗口" prop="isJump">
          <el-switch
            v-model="formInline.isJump"
          />
        </el-form-item>
        <el-form-item label="是否需要登录访问" prop="isNeedAuth">
          <el-switch
            v-model="formInline.isNeedAuth"
          />
        </el-form-item>
      </el-form>
      <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">我再想想</el-button>
        <el-button type="primary" @click="handleConfirm(formRef)">
          {{ confirmBtnMsg }}
        </el-button>
      </span>
    </template>
    </el-dialog>

    <el-dialog v-model="visibleIcon" title="修改默认信息" width="570" @close="handlerCloseDialog(formRef)">
      <div style="display: flex; align-items: center;">
        <span style="width: 130px;">修改ICON编码:</span>
        <el-input  v-model="menuIcon" placeholder="请填写要修改的ICON编码" />
      </div>
      <div style="display: flex; align-items: center;margin-top: 12px;">
        <span style="width: 130px;">修改菜单名称:</span>
        <el-input  v-model="menuTipText" placeholder="请填写要修改的菜单名称" />
      </div>
      <div style="display: flex; align-items: center;margin-top: 12px;">
        <span style="width: 130px;">修改菜单排序:</span>
        <el-input  v-model="menuTipOrder" placeholder="请修改菜单排序 越大越靠前" />
      </div>

      <template #footer>
      <span class="dialog-footer">
        <el-button @click="visibleIcon = false">我再想想</el-button>
        <el-button type="primary" @click="handleConfirmUpdateIcon">
          确认修改
        </el-button>
      </span>
    </template>
    </el-dialog>
  </div>
</template>
