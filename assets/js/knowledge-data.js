export const knowledgeEntries = [
  {
    id: "leetcode-core-patterns",
    title: "力扣高频算法笔记",
    description: "按解题模式整理二分、滑动窗口、DFS/BFS、并查集、拓扑排序与动态规划，优先记录边界、状态定义和常见坑。",
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
        title: "滑动窗口：每次右扩后，把窗口恢复到合法状态",
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
        title: "DFS / BFS：先判断图的结构，再选择遍历方式",
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
          "并查集关注集合合并与连通性；拓扑排序关注有向无环图中的依赖顺序。两者都适合把复杂关系压缩成很小的状态。",
        ],
        bullets: [
          "并查集：路径压缩 + 按秩或按大小合并。",
          "拓扑排序：入度归零后入队；最终处理节点数小于 n 就存在环。",
        ],
      },
      {
        title: "动态规划：状态定义比转移公式更重要",
        paragraphs: [
          "先写清楚 dp[i] 或 dp[i][j] 代表什么，再决定初始化、遍历顺序和转移。大部分 DP Bug 都来自状态语义和初始化不一致。",
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
    id: "gdb-debugging-workflow",
    title: "GDB 调试工作流",
    description: "从断点、单步、变量与调用栈，到多线程和自动 commands，把临时调试动作整理成稳定流程。",
    category: "Linux & Tooling",
    tags: ["GDB", "Breakpoint", "Threads", "commands"],
    source: "Site note",
    kind: "note",
    updated: "2026-08",
    sections: [
      {
        title: "动态库断点的最短流程",
        bullets: [
          "先执行 set breakpoint pending on。",
          "run 让动态库加载后，再使用 b function 或 b file:line。",
          "命中后使用 n / s / finish 控制执行范围。",
        ],
        code: "set breakpoint pending on\nrun\nb function_name\nn\ns\nfinish",
      },
      {
        title: "变量、调用栈与自动断点动作",
        bullets: [
          "p / p/x 用于查看变量的十进制或十六进制值。",
          "bt 查看当前线程调用栈。",
          "commands 1 可以让 1 号断点命中后自动打印、回溯并继续。",
        ],
        code: "commands 1\n  p a\n  bt\n  c\nend",
      },
      {
        title: "多线程问题",
        bullets: [
          "info threads 查看线程列表。",
          "thread 3 切换到 3 号线程。",
          "thread apply all bt 获取全部线程栈。",
          "set scheduler-locking on/off 控制单步时其他线程是否继续运行。",
        ],
      },
    ],
  },
  {
    id: "bash-history-reliability",
    title: "Bash 历史命令可靠记录",
    description: "解决历史命令遗漏、多个终端覆盖和无法追溯执行时间的问题。",
    category: "Linux & Tooling",
    tags: ["Bash", "history", "HISTSIZE", "HISTTIMEFORMAT"],
    source: "Site note",
    kind: "note",
    updated: "2026-08",
    sections: [
      {
        title: "先确认当前历史配置",
        code: "echo \"$HISTCONTROL\"\necho \"$HISTSIZE\"\necho \"$HISTFILESIZE\"\necho \"$HISTFILE\"\nshopt histappend",
      },
      {
        title: "避免多终端覆盖",
        paragraphs: [
          "开启 histappend 后，退出 Shell 时使用追加而不是覆盖。为了让多个终端更及时共享历史，可以在 PROMPT_COMMAND 中执行 history -a 和 history -n。",
        ],
        code: "shopt -s histappend\nPROMPT_COMMAND='history -a; history -n'",
      },
      {
        title: "给历史命令加时间戳",
        code: "export HISTTIMEFORMAT='%F %T  '",
        bullets: ["%F 是 YYYY-MM-DD。", "%T 是 HH:MM:SS。"],
      },
    ],
  },
  {
    id: "git-ssh-troubleshooting",
    title: "GitHub SSH 443 排障",
    description: "当 22 端口或网络环境不稳定时，通过 ssh.github.com:443 建立可诊断的 Git SSH 路径。",
    category: "Linux & Tooling",
    tags: ["Git", "SSH", "443", "Proxy"],
    source: "Site note",
    kind: "note",
    updated: "2026-08",
    sections: [
      {
        title: "SSH 配置",
        code: "Host github.com\n    HostName ssh.github.com\n    Port 443\n    User git",
      },
      {
        title: "验证链路",
        code: "ssh -vT git@github.com\ngit remote -v",
        bullets: [
          "先确认 ~/.ssh/config 确实被加载。",
          "再看连接是否进入 ssh.github.com:443。",
          "如果仍然断开，继续排查本机代理、公司网络或运营商链路。",
        ],
      },
    ],
  },
  {
    id: "machine-learning-roadmap",
    title: "机器学习学习路线",
    description: "按照现有公开笔记的章节结构，快速定位监督学习、深度学习、模型评估、决策树与无监督学习。",
    category: "Machine Learning",
    tags: ["监督学习", "深度学习", "模型评估", "无监督学习"],
    source: "machine-learning-notes",
    sourceUrl: "https://github.com/avengerdsf/machine-learning-notes",
    kind: "note",
    updated: "2026-08",
    sections: [
      {
        title: "监督学习与深度学习",
        bullets: ["线性回归与梯度下降。", "逻辑回归与分类边界。", "神经网络层、前向传播与激活函数。", "Softmax、多分类与多标签分类。"],
      },
      {
        title: "模型评估与树模型",
        bullets: ["训练 / 验证 / 测试集。", "偏差与方差诊断。", "决策树、随机森林与 XGBoost。"],
      },
      {
        title: "无监督学习",
        bullets: ["K-means。", "异常检测。", "推荐系统。", "PCA。"],
      },
    ],
  },
  {
    id: "reinforcement-learning-workflow",
    title: "强化学习工程工作流",
    description: "从机器人配置、环境配置、PPO 配置到 train/play 入口，梳理一个可维护的机器人强化学习主链路。",
    category: "Robotics & Reinforcement Learning",
    tags: ["PPO", "MJLab", "MuJoCo", "Train/Play"],
    source: "agibot_rl_mjlab",
    sourceUrl: "https://github.com/avengerdsf/agibot_rl_mjlab",
    kind: "note",
    updated: "2026-08",
    sections: [
      {
        title: "训练工程的四层",
        bullets: [
          "机器人资产与关节 / body 命名。",
          "环境、观测、动作和奖励配置。",
          "PPO 网络与训练超参数。",
          "train / play 与独立仿真验证入口。",
        ],
      },
      {
        title: "验证顺序",
        bullets: [
          "先确认资产和环境能稳定启动。",
          "再检查 reward / observation 是否符合预期。",
          "训练后先回放，再做 Sim-to-Sim。",
          "进入实机前单独检查传感、时序、动作范围和安全边界。",
        ],
      },
    ],
  },
  {
    id: "linux-engineering-toolbox",
    title: "Linux 工程工具箱",
    description: "把查询、诊断、操作和自动化分层，避免把 Linux 知识退化成零散命令收藏。",
    category: "Linux & Tooling",
    tags: ["Ubuntu", "Shell", "C++", "tmux"],
    source: "ubuntu_toolbox / Tmux-generator",
    sourceUrl: "https://github.com/avengerdsf/ubuntu_toolbox",
    kind: "note",
    updated: "2026-08",
    sections: [
      {
        title: "三层结构",
        bullets: ["查询层：进程、端口、内核、驱动、日志。", "诊断层：建立资源与故障之间的因果关系。", "操作层：修改、恢复、脚本化。"],
      },
      {
        title: "高频命令",
        code: "ps -ef | grep process_name\nss -lntp\ntar -xzf archive.tar.gz\nuname -r",
      },
      {
        title: "什么时候工具化",
        paragraphs: ["同一套操作稳定重复三次以上，就应该考虑从笔记升级为 Shell / C++ 工具或配置生成器。"],
      },
    ],
  },
  {
    id: "invoice-manager-engineering",
    title: "桌面应用工程实践",
    description: "以 Invoice Manager 为入口，关注本地数据组织、离线能力、导入导出和跨平台构建。",
    category: "Engineering Practice",
    tags: ["Electron", "React", "TypeScript", "Desktop"],
    source: "invoice-manager",
    sourceUrl: "https://github.com/avengerdsf/invoice-manager",
    kind: "note",
    updated: "2026-08",
    sections: [
      {
        title: "工程关注点",
        bullets: ["本地项目数据与自动保存。", "附件导入、预览与路径记忆。", "资金核算与导出。", "Windows / Linux 构建与升级数据保护。"],
      },
    ],
  },
  {
    id: "machine-learning-repo",
    title: "Machine Learning Notes · 源仓库",
    description: "完整公开机器学习笔记仓库。",
    category: "Machine Learning",
    tags: ["Repository", "PyTorch", "NumPy"],
    source: "GitHub",
    sourceUrl: "https://github.com/avengerdsf/machine-learning-notes",
    kind: "repository",
  },
  {
    id: "agibot-repo",
    title: "AgiBot RL Mjlab · 源仓库",
    description: "AgiBot X1 轻量强化学习工程。",
    category: "Robotics & Reinforcement Learning",
    tags: ["Repository", "MJLab", "MuJoCo"],
    source: "GitHub",
    sourceUrl: "https://github.com/avengerdsf/agibot_rl_mjlab",
    kind: "repository",
  },
  {
    id: "ubuntu-toolbox-repo",
    title: "Ubuntu Toolbox · 源仓库",
    description: "Ubuntu 常用 Shell 与 C++ 工具集合。",
    category: "Linux & Tooling",
    tags: ["Repository", "Ubuntu", "C++"],
    source: "GitHub",
    sourceUrl: "https://github.com/avengerdsf/ubuntu_toolbox",
    kind: "repository",
  },
];

export const knowledgeCategories = [
  "All",
  "LeetCode Notes",
  "Machine Learning",
  "Robotics & Reinforcement Learning",
  "Linux & Tooling",
  "Engineering Practice",
];
