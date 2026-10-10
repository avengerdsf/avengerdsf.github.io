---
title: P4060 · 验证二叉搜索树
tags:
  - LeetCode
  - 二叉树
---

## 题目

给定一棵二叉树的根节点 `root`，请判断它是否为有效的二叉搜索树。

二叉搜索树需要满足：

-   任意节点的左子树中，所有节点值都**小于当前节点值**。
-   任意节点的右子树中，所有节点值都**大于当前节点值**。
-   左右子树本身也必须分别是二叉搜索树。

**输入格式**

输入一棵二叉树的层序遍历序列，其中 `null` 表示空节点。

**输出格式**

如果该二叉树是有效的二叉搜索树，输出：

```text
true
```

否则输出：

```text
false
```

**输入示例**

```text
2 1 3
```

**输出示例**

```text
true
```

**说明**

对应的二叉树为：

```text
    2
   / \
  1   3
```

左子树节点值小于根节点，右子树节点值大于根节点，因此是有效的二叉搜索树。

## 思路

-   DFS 分别获取左右子树的**最大值和最小值**。
-   当前节点必须满足 **左子树最大值 < node.val < 右子树最小值**。
-   向上返回时，要返回**当前整棵子树的最大值和最小值**，供父节点继续判断。
-   空节点可以返回 `(-∞, +∞)`，避免影响比较。

## 代码

```python
class Solution:
    def __init__(self):
        self.is_valid = True

    def isValidBST(self, root):
        self.dfs(root)
        return self.is_valid

    def dfs(self, node):
        if not node:
            return -10**18, 10**18

        left_max, left_min = self.dfs(node.left)
        right_max, right_min = self.dfs(node.right)

        if not (left_max < node.val < right_min):
            self.is_valid = False

        cur_max = max(left_max, right_max, node.val)
        cur_min = min(left_min, right_min, node.val)

        return cur_max, cur_min
```

## 注意点

需要同时考虑节点左右的最大值最小值

```python
        cur_max = max(left_max, right_max, node.val)
        cur_min = min(left_min, right_min, node.val)
```
