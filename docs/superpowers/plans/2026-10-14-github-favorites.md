# GitHub 私有收藏同步实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在力扣笔记中收藏题目，保存到独立 GitHub 私有仓库，并修复合并有序链表的代码折叠。

**Architecture:** 浏览器使用受限 GitHub 令牌调用 Contents API，收藏保存在一个 JSON 文件中。现有 Quartz 插件提供收藏按钮、授权窗口和收藏夹，沿用现有乱序会话及题目卡片。

**Tech Stack:** 原生 JavaScript、Fetch API、Preact 服务端组件、Quartz 5、GitHub Contents API、Node.js 测试、Playwright。

**Spec:** [GitHub 私有收藏同步设计](../specs/2026-10-14-github-favorites-design.md)

## 全局约束

- 数据仓库 `avengerdsf/knowledge-favorites`，必须为私有仓库；分支 `main`，文件 `favorites.json`。
- JSON 格式为 `{ "version": 1, "favorites": [] }`，最新收藏排在开头。
- 令牌仅授予收藏仓库 Contents 读写权限，不写入公开源码、收藏文件或日志。
- “记住此设备”默认关闭，退出授权时清理浏览器授权。
- 收藏操作保留当前题目和本轮乱序顺序。
- 临时文件使用项目根目录 `tmp/`，完成后清理；不写入 C 盘。

## 重点验证条件

- 两个设备同时保存不同题目：发生 SHA 冲突后合并两份操作。
- 收藏文件损坏或版本未知：显示错误并停止写入。
- 网络失败或写入被拒绝：已有收藏保持正确，不显示保存成功。
- 切换题目后收到旧请求响应：只更新当前题目的收藏状态。
- 授权保存及退出：按照“记住此设备”选择保存，退出后清除令牌。

## 任务一 GitHub 收藏存储模块

**Files:** 新增 `knowledge-quartz/plugins/site-ui/src/favorites-store.mjs` 和 `knowledge-quartz/plugins/site-ui/test/favorites-store.test.mjs`。

**Interfaces:** `parseFavorites(value) -> string[]`；`setFavorite(slugs, slug, wanted) -> string[]`；`createGitHubFavoritesStore({token, fetchImpl}) -> {read(), set(slug, wanted)}`。读写方法返回 `Promise<string[]>`；目标仓库、分支和文件固定为设计值。

- [ ] 先写失败用例：`setFavorite(['leetcode/heap/p4083'], 'leetcode/linked-list/p4044', true)` 返回 `['leetcode/linked-list/p4044', 'leetcode/heap/p4083']`；重复添加保留原顺序；删除只移除指定题目。
- [ ] 运行 `node --test knowledge-quartz/plugins/site-ui/test/favorites-store.test.mjs`，确认缺少实现时失败。
- [ ] 实现数据验证、UTF-8/Base64 文件读写、写入前重新读取和一次 SHA 冲突重试。串行执行同一客户端的写入。
- [ ] 补齐 401、403、网络失败、损坏文件、未知版本和连续冲突用例，检查请求正文没有令牌，执行测试并确认通过。
- [ ] 提交存储模块及测试。

## 任务二 收藏界面与乱序浏览整合

**Files:** 新增 `knowledge-quartz/plugins/site-ui/src/favorites.mjs`；修改 `src/components.mjs`、`src/random.mjs`、`knowledge-quartz/custom.scss`；新增 `scripts/test-favorites-browser.py`，更新 `scripts/test-random-navigation.py`。

**Interfaces:** `favoritesBridge` 提供浏览器脚本；内部收藏服务读写任务一的存储模块，通过收藏状态变化事件更新当前页面。题目按钮携带 `data-favorite-note` 和题目 slug，目录入口使用 `data-favorites-toggle`，收藏列表使用 `data-favorite-notes`。

- [ ] 浏览器用例先检查 P4044 的收藏按钮存在并可打开授权窗口，在当前构建中确认失败。
- [ ] 增加收藏按钮、密码令牌输入窗口、“记住此设备”、退出授权、收藏夹及空列表和错误状态。保存成功后更新界面。
- [ ] 收藏夹根据当前题目元数据显示名称和链接，最新收藏在前；收藏夹与题型目录、乱序列表之间切换时保留原有乱序。
- [ ] 使用两个独立浏览器上下文和共享 GitHub API 测试服务验证收藏同步、取消同步、刷新、授权退出、保存失败和题目切换后的响应。
- [ ] 更新普通题目页的乱序测试：收藏按钮可见，乱序进度及下一题只在乱序上下文显示。验证 390、1440、3840 像素窗口。
- [ ] 提交界面和测试，并把浏览器收藏测试接入 `.github/workflows/validate.yml`。

## 任务三 私有仓库初始化与使用说明

**Files:** 新增 `docs/github-favorites.md`；云端创建或复用 `avengerdsf/knowledge-favorites`。

**Interfaces:** 私有仓库 `main` 分支提供 UTF-8 `favorites.json`，任务一通过 Contents API 访问。

- [ ] 核对同名仓库是否已存在及可见性。新建时保持私有并初始化默认分支。
- [ ] 初始化空收藏文件；已有文件则读取并保留原记录。
- [ ] 说明令牌创建时只选择收藏仓库、Contents 读写权限，以及在网站输入令牌的步骤。写明数据同步和本设备授权的区别。
- [ ] 核对真实仓库和文件；通过网站授权后验证添加和删除记录。测试收藏记录完成后恢复原状。
- [ ] 提交使用说明，不提交令牌或用户收藏记录。

## 任务四 代码折叠与发布验证

**Files:** 修改 `knowledge/leetcode/linked-list/p4044.md` 的代码标题；保留代码正文；完成相关浏览器验证。

- [ ] 复现旧页面没有折叠控件：已观察到 `fold_controls = 0`。
- [ ] 将代码上方的“题目”标题改为“代码”，构建后验证默认收起、展开和再次收起。
- [ ] 检查其他题解的主代码区，保持补充说明及示例内容。
- [ ] 运行 `npm test`、`node scripts/validate-site.mjs --source`、Quartz 构建和 `node scripts/validate-site.mjs --built`，运行乱序与收藏浏览器测试。
- [ ] 完成独立整分支审查，处理发现的问题后再次验证。
- [ ] 整理本地提交，在用户明确允许本次发布后推送主分支，核对线上收藏界面与折叠表现，清理 `tmp/`。
