---
title: P4061 · 二叉搜索树中第K小的元素
tags:
  - LeetCode
  - 二叉树
---

## 题目

给定一棵二叉搜索树的根节点 `root` 和一个整数 `k`，请找出其中第 `k` 小的节点值。

二叉搜索树满足：

-   左子树中的所有节点值都小于当前节点值。
-   右子树中的所有节点值都大于当前节点值。

**输入格式**

第一行输入一棵二叉搜索树的层序遍历序列，其中 `null` 表示空节点。

第二行输入一个整数 `k`。

**输出格式**

输出二叉搜索树中第 `k` 小的节点值。

**输入示例**

```text
3 1 4 null 2
1
```

**输出示例**

```text
1
```

**说明**

该二叉搜索树的中序遍历结果为：

```text
1 2 3 4
```

因此第 `1` 小的元素为 `1`。

**数据范围**

-   `1 <= k <= 二叉树节点数量`
-   节点值互不相同

## 思路

-   利用二叉搜索树**中序遍历天然升序**的性质，按照 **左 → 根 → 右** 遍历。
-   每访问一个节点就让 `cnt += 1`。
-   当 `cnt == k` 时，当前节点就是第 `k` 小的元素，记录到 `res`。

## 代码

```python
class Solution:
    def __init__(self):
        self.cnt = 0
        self.res = None

    def kthSmallest(self, root, k):
        self.dfs(root, k)
        return self.res

    def dfs(self, node, k):
        if not node:
            return

        self.dfs(node.left, k)
        self.cnt += 1
        if self.cnt == k:
            self.res = node.val
        self.dfs(node.right, k)

```

## 注意点

### 普通二叉树

```python
class Solution:
    def __init__(self):
        self.stack = []
    def kthSmallest(self, root, k):
        self.dfs(root)
        return self.stack[k - 1]

    def dfs(self, node):
        if not node:
            return
        
        self.dfs(node.left)
        self.dfs(node.right)

        if not self.stack:
            self.stack.append(node.val)
            
        tmp =[]
        while self.stack and self.stack[-1] > node.val:
            tmp.append(self.stack[-1])
            self.stack.pop()

        if self.stack and self.stack[-1] == node.val:
            return

        self.stack.append(node.val)
        
        while tmp:
            self.stack.append(tmp[-1])
            tmp.pop()
```
