# GitHub 收藏同步

收藏记录保存在私有仓库 [avengerdsf/knowledge-favorites](https://github.com/avengerdsf/knowledge-favorites) 的 `main` 分支中，文件为 `favorites.json`。电脑和手机读取同一份记录。

## 首次授权

1. 打开 GitHub 的 [Fine-grained personal access tokens](https://github.com/settings/personal-access-tokens/new) 页面。
2. Resource owner 选择 `avengerdsf`，设置令牌的有效期。
3. Repository access 选择 Only select repositories，仅选择 `knowledge-favorites`。
4. Repository permissions 中将 Contents 设为 Read and write。Metadata 保留默认的只读权限。
5. 生成令牌，在知识库题目页点击“收藏”，或在收藏夹中点击“GitHub 授权”，把令牌填入授权窗口。
6. 选择是否“记住此设备”，然后点击“连接 GitHub”。

GitHub 令牌支持限定可访问的仓库和权限。[官方授权说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

“记住此设备”默认关闭，授权在当前标签页中保留；开启后在本设备保留授权。电脑和手机分别授权，收藏记录保存在 GitHub 中。令牌到期后，在授权窗口换成新的令牌。

## 收藏和复习

- 题目标题下点击“收藏”添加记录，点击“已收藏”取消收藏。
- 乱序浏览中操作收藏后，可以继续点击“下一题”，沿用本轮顺序。
- 力扣目录页点击“收藏夹”查看题目，最新收藏排在最前。
- 另一设备授权后，打开收藏夹或点击“刷新收藏”读取最新记录。
- 收藏夹中的“GitHub 授权”提供更新令牌和退出本设备授权的操作。

## 保存结果

按钮显示“已收藏”表示 GitHub 已确认保存。请求失败时页面显示提示，已有记录保留；可刷新收藏确认最新状态后重试。

多台设备同时操作同一文件时，会读取最新记录并合并本次添加或删除。更新冲突会重试一次，仍失败时停止写入并显示提示。

收藏文件格式或版本异常时停止写入。文件采用以下结构，数组中的值为题目路径，最新收藏在前：

```json
{
  "version": 1,
  "favorites": [
    "leetcode/linked-list/p4044"
  ]
}
```
