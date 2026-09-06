---
title: 两数之和
tags:
  - LeetCode
  - 哈希表
---

<p class="algorithm-idea-line"><strong>核心思路：</strong>哈希表记录元素下标，查找当前元素的补数 <code>target - nums[i]</code>。</p>

## 动画

<two-sum-demo values="2,7,11,15" target="9"></two-sum-demo>

## 代码

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        st = {}

        for i, x in enumerate(nums):
            need = target - x

            if need in st:
                return [st[need], i]

            st[x] = i
```
