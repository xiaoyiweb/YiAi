// export function selectKeyWithWeight(keys) {
//   // 创建两个数组用于存储每个键值及其对应的概率分布
//   const values = [];
//   const probabilities = [];

//   // 获取所有 keys 的总权重
//   const totalWeight = keys.reduce((prev, curr) => prev + curr.weight, 0);

//   // 计算每个键值所占的概率，并将其放入对应的数组中
//   for (let i = 0; i < keys.length; i++) {
//     const probability = keys[i].weight / totalWeight;
//     probabilities.push(probability);
//     values.push(i);
//   }

//   // 创建两个辅助数组，用于记录各个键值的别名（alias）和概率分布（prob）
//   const alias = new Array(keys.length).fill(0);
//   const prob = new Array(keys.length).fill(0);

//   // 创建两个栈，分别用于存储大于等于均值和小于均值的键值
//   const small = [];
//   const large = [];

//   // 初始化栈以及 prob 和 alias 数组
//   for (let i = 0; i < keys.length; i++) {
//     if (probabilities[i] < 1) {
//       small.push(i);
//     } else {
//       large.push(i);
//     }
//     prob[i] = probabilities[i] * keys.length;
//   }

//   // 循环填充 alias 和 prob 数组
//   while (small.length > 0 && large.length > 0) {
//     const smallIndex = small.pop();
//     const largeIndex = large.pop();

//     alias[smallIndex] = largeIndex;
//     prob[largeIndex] = prob[largeIndex] + prob[smallIndex] - 1;

//     if (prob[largeIndex] < 1) {
//       small.push(largeIndex);
//     } else {
//       large.push(largeIndex);
//     }
//   }

//   // 随机生成一个 [0, keys.length) 范围内的整数
//   const rand = Math.floor(Math.random() * keys.length);

//   // 根据随机值和对应的别名和概率分布数组，返回选中的键值
//   if (Math.random() < prob[rand]) {
//     return keys[rand];
//   } else {
//     return keys[alias[rand]];
//   }
// }

export interface KeyItem {
  id: number;
  key: string;
  weight: number;
  model: string;
}

/**
 * 根据概率按权重随机选择一项
 *
 * @param data 包含id、key和weight字段的Item数组
 * @returns 随机选择的一项
 */
export function selectKeyWithWeight(data: KeyItem[]): KeyItem | undefined {
  if (data.length === 0) return undefined;

  const totalWeight = data.reduce((sum, item) => sum + item.weight, 0);
  let randomWeight = Math.random() * totalWeight;

  for (const item of data) {
    randomWeight -= item.weight;
    if (randomWeight < 0) {
      return item;
    }
  }

  return data[data.length - 1];
}
