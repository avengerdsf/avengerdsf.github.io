---
title: 翻转等价二叉树
tags:
  - LeetCode
  - 二叉树
---

## 题目

给定两棵二叉树，判断它们是否翻转等价。

如果可以通过若干次交换某些节点的左子树和右子树，使两棵树完全相同，则认为它们翻转等价。

**输入格式**

依次输入两棵二叉树。

对于每棵树：

第一行输入两个整数 `n` 和 `root`，分别表示节点数量和根节点编号。

接下来输入 `n` 行，每行三个整数：

```text
node left right
```

分别表示当前节点编号、左孩子编号和右孩子编号。

如果某个孩子不存在，则对应编号为 `-1`。

**输出格式**

如果两棵二叉树翻转等价，输出：

```text
true
```

否则输出：

```text
false
```

**输入示例**

```text
8 1
1 2 3
2 4 5
3 6 -1
4 -1 -1
5 7 8
6 -1 -1
7 -1 -1
8 -1 -1
8 1
1 3 2
3 6 -1
2 4 5
6 -1 -1
4 -1 -1
5 8 7
8 -1 -1
7 -1 -1
```

**输出示例**

```text
true
```

## 思路

使用递归比较两棵二叉树，每个节点有两种匹配情况：

- 不翻转：`root1.left` 对应 `root2.left`，且 `root1.right` 对应 `root2.right`。
- 翻转：`root1.left` 对应 `root2.right`，且 `root1.right` 对应 `root2.left`。

两种情况中，只要有一种能让对应的两对子树都翻转等价，当前两棵树就翻转等价。

递归边界：两者都为空时返回 `True`；只有一个为空，或当前节点值不同，则返回 `False`。

## 代码

```python
class Solution:
    def flipEquiv(self, root1, root2):
        if not root1 and not root2:
            return True

        if not root1 or not root2 or root1.val != root2.val:
            return False

        return (
            (self.flipEquiv(root1.left, root2.left) and
             self.flipEquiv(root1.right, root2.right))
            or
            (self.flipEquiv(root1.left, root2.right) and
             self.flipEquiv(root1.right, root2.left))
        )
```
