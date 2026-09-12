# Renting-Assistant · 合租生活管家

🔗 **在线体验：https://renting-assistant.vercel.app** （Vercel 自动部署，随 main 分支更新）

> Mark's Renting Assistant Demo —— 一款面向合租室友的生活协作工具，把「钱、卫生、规矩」三件事管起来。

## 这是什么

合租生活管家是一个帮助合租室友协调公共生活的应用 Demo，核心解决三类痛点：

- 💰 **费用分摊** —— 房租、水电燃、网费等公共开销的记账、AA 分摊、收付跟踪与月度结算
- 🧹 **值日排班** —— 清洁区域定义、轮换排班、值日提醒与拍照打卡闭环
- 📜 **室友公约** —— 规则共识、公告触达与公共物品管理

## 功能模块

| 模块 | 定位 |
|------|------|
| 空间与成员管理 | 合租空间创建、邀请室友、角色权限、退租结算 |
| 消费管家 | 记一笔、灵活分摊、周期账单、一键催款、月度结算、债务简化 |
| 清洁工作 | 区域任务定义、轮换排班、值日日历、打卡留痕、换班代班 |
| 室友公约及公告栏 | 公约编辑与确认、公告发布、投票表决 |
| 公共物品管理 | 物品登记、库存与补货提醒 |
| 消息与提醒中心 | 缴费提醒、值日提醒、催款消息 |
| 首页 / 日历总览 | 今日待办、值日与账单一屏聚合 |

完整功能清单（58 个功能点，含 P0/P1/P2 优先级）见 [合租生活管家-功能清单-v1.0.md](合租生活管家-功能清单-v1.0.md)。

## 仓库结构

```
├── app/                    # 前端应用（React 19 + Vite 7 + TypeScript + Tailwind CSS）
│   └── src/
│       ├── pages/          # 首页 / 账单 / 清洁 / 公约 / 物品 / 我的
│       ├── components/     # 业务组件与 shadcn/ui 组件库
│       ├── store/          # 应用状态管理
│       └── data/           # 示例数据
├── assets/                 # 文档渲染依赖（mermaid）
├── 合租生活管家-功能清单-v1.0.md        # 产品功能清单
├── 合租生活管家-信息架构与流程图-v1.0.md # 信息架构与业务流程图（Mermaid 源码）
└── 合租生活管家-架构与流程图.html        # 流程图渲染版，浏览器直接打开可看
```

## 本地运行

环境要求：Node.js 18+

```bash
cd app
npm install
npm run dev
```

启动后访问终端提示的本地地址（默认 http://localhost:5173）。

其他常用命令：

```bash
npm run build    # 生产构建
npm run lint     # 代码检查
npm run preview  # 预览构建产物
```

## 技术栈

React 19 · Vite 7 · TypeScript · Tailwind CSS · shadcn/ui (Radix UI) · React Router 7 · Recharts · React Hook Form + Zod
