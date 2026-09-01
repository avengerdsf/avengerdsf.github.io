export const knowledgeEntries = [
  {
    id: "leetcode-core-patterns",
    title: "力扣高频算法笔记",
    description: "按解题模式整理二分、滑动窗口、DFS/BFS、并查集、拓扑排序与动态规划，重点记录边界、状态定义和常见错误。",
    category: "LeetCode Notes",
    tags: ["二分", "滑动窗口", "DFS/BFS", "并查集", "拓扑排序", "DP"],
    source: "Site note",
    kind: "note",
    updated: "2026-08",
    sections: [
      {
        title: "二分：先定义答案区间，再决定收缩规则",
        paragraphs: [
          "二分最容易错的不是 mid，而是左右边界的语义。先明确区间是 [l, r] 还是 [l, r)，再写 while 条件和更新规则。",
        ],
        bullets: [
          "找左边界：满足条件后继续向左收缩。",
          "找右边界：满足条件后继续向右收缩。",
          "不要在同一份模板里混用闭区间和半开区间。",
        ],
        code: "while (l <= r) {\n    int mid = l + (r - l) / 2;\n    if (check(mid)) r = mid - 1;\n    else l = mid + 1;\n}",
      },
      {
        title: "滑动窗口：右扩后恢复窗口合法状态",
        paragraphs: [
          "核心不是双指针本身，而是维护一个可增量更新的窗口状态。右指针加入元素后，只要窗口不合法就持续移动左指针。",
        ],
        bullets: [
          "先确定窗口合法条件。",
          "统计答案的位置必须与题目要求一致，不要把一个合法窗口重复统计。",
          "频次表、计数器和窗口长度通常是最重要的三个状态。",
        ],
      },
      {
        title: "DFS / BFS：先判断图结构，再选择遍历方式",
        paragraphs: [
          "树上 DFS 通常只需要记录父节点避免回边；一般图必须使用 visited。BFS 更适合最短步数、多源扩散和逐层状态。",
        ],
        bullets: [
          "DFS：递归状态要最小化，明确父子关系与回溯位置。",
          "BFS：多源问题把全部起点同时入队。",
          "需要最短无权路径时优先 BFS。",
        ],
      },
      {
        title: "并查集 / 拓扑排序：分别解决连通与依赖",
        paragraphs: [
          "并查集关注集合合并与连通性；拓扑排序关注有向无环图中的依赖顺序。",
        ],
        bullets: [
          "并查集：路径压缩 + 按秩或按大小合并。",
          "拓扑排序：入度归零后入队；最终处理节点数小于 n 就存在环。",
        ],
      },
      {
        title: "动态规划：状态定义比转移公式更重要",
        paragraphs: [
          "先写清楚 dp[i] 或 dp[i][j] 代表什么，再决定初始化、遍历顺序和转移。",
        ],
        bullets: [
          "LIS / 最大子段和：先处理一维状态和边界。",
          "0/1 背包：容量逆序；完全背包：容量正序。",
          "分组背包：每组只能选一个，循环层级不能交换。",
          "区间或多段 DP：先确认阶段、决策与不可达状态。",
        ],
      },
    ],
  },
  {
    id: "machine-learning-roadmap",
    title: "Machine Learning Notes",
    description: "按照公开 machine-learning-notes 仓库的章节结构，整理监督学习、深度学习、模型评估、决策树与无监督学习。",
    category: "Machine Learning",
    tags: ["监督学习", "深度学习", "模型评估", "决策树", "无监督学习"],
    source: "machine-learning-notes",
    sourceUrl: "https://github.com/avengerdsf/machine-learning-notes",
    kind: "note",
    updated: "2026-08",
    sections: [
      {
        title: "监督学习",
        bullets: [
          "线性回归、代价函数、梯度下降与特征缩放。",
          "逻辑回归、Sigmoid、决策边界与正则化。",
          "过拟合、欠拟合与模型泛化。",
        ],
      },
      {
        title: "深度学习",
        bullets: [
          "神经网络层与前向传播。",
          "PyTorch 神经网络构建与训练。",
          "激活函数、Softmax、多分类与多标签分类。",
        ],
      },
      {
        title: "模型评估与树模型",
        bullets: [
          "训练集、验证集、测试集与学习曲线。",
          "偏差与方差诊断。",
          "决策树、随机森林与 XGBoost。",
        ],
      },
      {
        title: "无监督学习",
        bullets: [
          "K-means 聚类。",
          "异常检测。",
          "推荐系统。",
          "PCA 主成分分析。",
        ],
      },
    ],
  },
];

export const knowledgeCategories = ["All", "LeetCode Notes", "Machine Learning"];
