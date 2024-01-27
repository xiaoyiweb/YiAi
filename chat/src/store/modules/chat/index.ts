import { defineStore } from 'pinia'
import { formatChatPre, getLocalState, setLocalState } from './helper'
import { fetchCreateGroupAPI, fetchDelAllGroupAPI, fetchDelGroupAPI, fetchQueryGroupAPI, fetchUpdateGroupAPI } from '@/api/group'
import { fetchDelChatLogAPI, fetchDelChatLogByGroupIdAPI, fetchQueryChatLogListAPI } from '@/api/chatLog'
import { fetchModelBaseConfigAPI } from '@/api/models'
import { fetchGetChatPreList } from '@/api/index'

export const useChatStore = defineStore('chat-store', {
  state: (): Chat.ChatState => getLocalState(),

  getters: {
    /* 当前选用模型的配置 */
    activeConfig: (state) => {
      const uuid = state.active
      if (!uuid)
        return {}
      const config = state.groupList.find(item => item.uuid === uuid)?.config
      return config ? JSON.parse(config) : state.baseConfig
    },

    activeGroupAppId: (state) => {
      const uuid = state.active
      if (!uuid)
        return null
      return state.groupList.find(item => item.uuid === uuid)?.appId
    },

    /* 当前选用模型的扣费类型 */
    activeModelKeyDeductType(state) {
      return this.activeConfig?.modelInfo?.deductType
    },

    /* 当前选用模型的模型类型 */
    activeModelKeyType(state) {
      return this.activeConfig?.modelInfo?.keyType
    },

    /* 当前选用模型的调用价格 */
    activeModelKeyPrice(state) {
      return this.activeConfig?.modelInfo?.deduct
    },

  },

  actions: {
    /* 对话组过滤 */
    setGroupKeyWord(keyWord: string) {
      this.groupKeyWord = keyWord
    },

    /* 计算拿到当前选择的对话组信息 */
    getChatByGroupInfo() {
      if (this.active)
        return this.groupList.find(item => item.uuid === this.active) || {}
    },

    /*  */
    getConfigFromUuid(uuid: any) {
      return this.groupList.find(item => item.uuid === uuid)?.config
    },

    /* 新增新的对话组 */
    async addNewChatGroup(appId = 0) {
      const res: any = await fetchCreateGroupAPI({ appId })
      const { id: uuid } = res.data
      await this.setActiveGroup(uuid)
      this.recordState()
    },

    /* 查询基础模型配置 兼容老的chatgroup  */
    async getBaseModelConfig() {
      const res = await fetchModelBaseConfigAPI()
      this.baseConfig = res?.data
    },

    /* 查询我的对话组 */
    async queryMyGroup() {
      const res: any = await fetchQueryGroupAPI()
      this.groupList = [...res.data.map((item: any) => {
        const { id: uuid, title, isSticky, createdAt, updatedAt, appId, config, appLogo } = item
        return { uuid, title, isEdit: false, appId, config, isSticky, appLogo, createdAt, updatedAt: new Date(updatedAt).getTime() }
      })]
      const isHasActive = this.groupList.some(item => Number(item.uuid) === Number(this.active))
      if (!this.active || !isHasActive)
        this.groupList.length && this.setActiveGroup(this.groupList[0].uuid)
    },

    /* 修改对话组信息 */
    async updateGroupInfo(params: { groupId: number; title?: string; isSticky?: boolean }) {
      await fetchUpdateGroupAPI(params)
    },

    /* 变更对话组 */
    async setActiveGroup(uuid: number) {
      this.active = uuid
      if (this.active)
        await this.queryActiveChatLogList()

      else
        this.chatList = []

      this.groupList.forEach(item => (item.isEdit = false))
      this.recordState()
    },

    /* 删除对话组 */
    async deleteGroup(params: Chat.History) {
      const curIndex = this.groupList.findIndex(item => item.uuid === params.uuid)
      const { uuid: groupId } = params
      await fetchDelGroupAPI({ groupId })
      await this.queryMyGroup()
      if (this.groupList.length === 0)
        await this.setActiveGroup(0)

      if (curIndex > 0 && curIndex < this.groupList.length)
        await this.setActiveGroup(this.groupList[curIndex].uuid)

      if (curIndex === 0 && this.groupList.length > 0)
        await this.setActiveGroup(this.groupList[0].uuid)

      if (curIndex > this.groupList.length || (curIndex === 0 && this.groupList.length === 0))
        await this.setActiveGroup(0)

      if (curIndex > 0 && curIndex === this.groupList.length)
        await this.setActiveGroup(this.groupList[curIndex - 1].uuid)

      this.recordState()
    },

    /* 删除全部非置顶对话组 */
    async delAllGroup() {
      if (!this.active || !this.groupList.length)
        return
      await fetchDelAllGroupAPI()
      await this.queryMyGroup()
      if (this.groupList.length === 0)
        await this.setActiveGroup(0)

      else
        await this.setActiveGroup(this.groupList[0].uuid)
    },

    /* 查询当前对话组的聊天记录 */
    async queryActiveChatLogList() {
      if (!this.active || Number(this.active) === 0)
        return
      const res: any = await fetchQueryChatLogListAPI({ groupId: this.active })
      this.chatList = res.data
    },

    /* 添加一条虚拟的对话记录 */
    addGroupChat(data) {
      this.chatList = [...this.chatList, data]
    },

    /* 动态修改对话记录 */
    updateGroupChat(index: number, data: Chat.Chat) {
      this.chatList[index] = { ...this.chatList[index], ...data }
    },

    /* 修改其中部分内容 */
    updateGroupChatSome(index: number, data: Partial<Chat.Chat>) {
      this.chatList[index] = { ...this.chatList[index], ...data }
    },

    /* 删除一条对话记录 */
    async deleteChatById(chatId: number | undefined) {
      console.log(chatId)
      if (!chatId)
        return
      await fetchDelChatLogAPI({ id: chatId })
      await this.queryActiveChatLogList()
    },

    /* 查询快问预设 */
    async queryChatPre() {
      const res: any = await fetchGetChatPreList()
      if (!res.data)
        return
      this.chatPreList = formatChatPre(res.data)
    },

    /* 设置使用上下文 */
    setUsingContext(context: boolean) {
      this.usingContext = context
      this.recordState()
    },

    /* 设置使用联网 */
    setUsingNetwork(context: boolean) {
      this.usingNetwork = context
      this.recordState()
    },

    /* 删除当前对话组的全部内容 */
    async clearChatByGroupId() {
      if (!this.active)
        return

      await fetchDelChatLogByGroupIdAPI({ groupId: this.active })
      await this.queryActiveChatLogList()
    },

    recordState() {
      setLocalState(this.$state)
    },

    clearChat() {
      this.chatList = []
      this.groupList = []
      this.active = 0
      this.recordState()
    },
  },
})
