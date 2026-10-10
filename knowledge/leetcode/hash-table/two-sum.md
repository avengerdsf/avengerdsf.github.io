---
title: P4000 · 两数之和
tags:
  - LeetCode
  - 哈希表
---

## 题目

给定一个整数数组 `nums` 和一个整数 `target`，请在数组中找出两个数，使它们的和等于 `target`。

返回这两个数在数组中的下标。

假设每组输入只存在一个答案，并且同一个元素不能重复使用。

**输入格式**

第一行输入两个整数 `n` 和 `target`，分别表示数组长度和目标值。

第二行输入 `n` 个整数，表示数组 `nums`。

**输出格式**

输出两个整数，表示满足条件的两个元素下标。

**输入示例**

```text
4 9
2 7 11 15
```

**输出示例**

```text
0 1
```

**说明**

`nums[0] + nums[1] = 2 + 7 = 9`，因此输出下标 `0 1`。

**数据范围**

-   `2 <= n <= 100000`
-   `-10^9 <= nums[i] <= 10^9`
-   `-10^9 <= target <= 10^9`

## 思路

遍历数组，用哈希表记录已经出现的数字及下标，检查 `target - nums[i]` 是否已存在即可。

## 代码

```python
from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        record = {}
        for i in range(len(nums)):
            other = target - nums[i]
            if record.get(other, -1) != -1:
                res = [record.get(other), i]
                res.sort()
                return res
            record[nums[i]] = i

        return [-1, -1]

def main():
    # 读取数组长度和目标值
    n, target = map(int, input().split())

    # 读取数组元素
    nums = list(map(int, input().split()))

    # 调用函数并输出结果
    solution = Solution()
    result = solution.twoSum(nums, target)
    print(result[0], result[1])

if __name__ == "__main__":
    main()
```
