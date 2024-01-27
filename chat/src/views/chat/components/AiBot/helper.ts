interface ChatBoxItemChildrenItem {
	appId?: number
	id: number
	prompt: number
	title: string
	coverImg: string
}
export interface ChatboxItem {
	id: number
	icon: string
	name: string
	childList: ChatBoxItemChildrenItem[]
}

export const defaultChatBox: any = [
  {
    "id": 1,
    "name": "私人助理",
    "icon": "ri:ai-generate",
    "childList": [
      {
        "appId": 0,
        "prompt": "我希望你能担任英语翻译、拼写校对和修辞改进的角色。我会用任何语言和你交流，你会识别语言，将其翻译并用更为优美和精炼的英语回答我。请将我简单的词汇和句子替换成更为优美和高雅的表达方式，确保意思不变，但使其更具文学性。请仅回答更正和改进的部分，不要写解释。我的第一句话是“how are you ?”，请翻译它。",
        "title": "英语翻译官",
      },
      {
        "id": 3,
        "appId": 0,
        "prompt": "我想让你扮演一个心理学家。我会告诉你我的想法。我希望你能给我科学的建议，让我感觉更好。我的第一个想法，{ 在这里输入你的想法，如果你解释得更详细，我想你会得到更准确的答案。}",
        "title": "心理学家",
      },
      {
        "id": 4,
        "appId": 0,
        "prompt": "请确认我的以下请求。请您作为产品经理回复我。我将会提供一个主题，您将帮助我编写一份包括以下章节标题的PRD文档：主题、简介、问题陈述、目标与目的、用户故事、技术要求、收益、KPI指标、开发风险以及结论。在我要求具体主题、功能或开发的PRD之前，请不要先写任何一份PRD文档。",
        "title": "产品经理",
      }
    ]
  },
  {
    "id": 2,
    "name": "轻松娱乐",
    "icon": "ri:lightbulb-flash-line",
    "childList": [
      {
        "id": 5,
        "appId": 0,
        "prompt": "我要你做我的私人厨师。我会告诉你我的饮食偏好和过敏，你会建议我尝试的食谱。你应该只回复你推荐的食谱，别无其他。不要写解释。我的第一个请求是“我是一名素食主义者，我正在寻找健康的晚餐点子。”",
        "title": "如何学做菜",
      },
      {
        "id": 6,
        "appId": 0,
        "prompt": "我想让你做一个旅游指南。我会把我的位置写给你，你会推荐一个靠近我的位置的地方。在某些情况下，我还会告诉您我将访问的地方类型。您还会向我推荐靠近我的第一个位置的类似类型的地方。我的第一个建议请求是“我在上海，我只想参观博物馆。",
        "title": "旅游攻略",
      },
      {
        "id": 7,
        "appId": 0,
        "prompt": "如果你能穿越时空，你会去哪个时代？",
        "title": "穿越时空",
      }
    ]
  },
  {
    "id": 3,
    "name": "AI百科",
    "icon": "ri:book-mark-line",
    "childList": [
      {
        "id": 8,
        "appId": 0,
        "prompt": "解释一下量子力学是什么？",
        "title": "量子力学",
      },
      {
        "id": 9,
        "appId": 0,
        "prompt": "介绍一下人工智能的历史",
        "title": "人工智能",
      },
      {
        "id": 10,
        "appId": 0,
        "prompt": "讲解一下深度学习是如何工作的？",
        "title": "深度学习",
      }
    ]
  }
]
