# 日迹 · Daytrace

日迹是一款中文时间日记。把灵感、阅读、学习、运动和日常消遣分开记录，想写哪一项就写哪一项。过几天再回来看，就能知道时间花在了哪里，也能找回当时的想法。

## 能做什么

- **今日**：查看每日一言，按板块记录内容、时长和标签，也可以选择过去的日期补记。保存后自动打开下一项，也可以留在当前板块继续记。
- **历史**：按月和日期回看，支持按日期跳转，以及编辑或删除记录。
- **统计与周报**：查看各板块用时、每日趋势和学习标签排行，按周比较时间分配。
- **手机使用与备份**：可把网页添加到手机主屏幕。使用同一账号可在不同设备查看记录，并在设置中导出 CSV。

[使用说明](使用说明.md) · [部署与备份](docs/部署与备份.md) · [历次界面截图](docs/evidence/) · [版本标签](https://github.com/iceyaaaz/Daytrace/tags)

## 项目结构

| 目录或文件 | 用途 |
| --- | --- |
| [`src/`](src/) | 应用源码。包含今日、历史、统计、周报和设置页面，以及数据读取、统计计算和共用样式。 |
| [`public/`](public/) | 浏览器和手机主屏幕使用的应用图标。 |
| [`supabase/`](supabase/) | 建表脚本、按用户隔离日记的访问规则，以及初始运动标签。 |
| [`tests/`](tests/) | 日期、记录校验、统计、录入流程、分页读取和 CSV 的单元测试。 |
| [`docs/evidence/`](docs/evidence/) | 使用虚构数据截取的界面验收图，保留各版本当时的样式。 |
| [`index.html`](index.html) | 网页入口，设置浏览器标签标题和图标。 |
| [`package.json`](package.json) · [`package-lock.json`](package-lock.json) | 项目依赖、运行命令及实际安装的依赖版本。 |
| [`vite.config.js`](vite.config.js) · [`vercel.json`](vercel.json) | 前端构建、手机安装清单、静态缓存和部署配置。 |
| [`.env.example`](.env.example) · [`.gitignore`](.gitignore) | 环境变量模板及 Git 忽略规则。个人配置填在本机的 `.env.local`。 |
| [使用说明](使用说明.md) · [验收记录](验收记录.md) | 手机安装和日常操作说明，以及历次测试结果。 |

前端使用 React 和 Vite，图表使用 ECharts，线性图标来自 Lucide。Supabase 提供邮箱登录和数据存储，`vite-plugin-pwa` 负责手机安装和静态页面缓存。

## 本地运行

1. 准备 Node.js 22.12 或更高版本。按[部署与备份指南](docs/部署与备份.md#准备-supabase)创建自己的 Supabase 项目和日记账号。
2. 把 `.env.example` 复制为 `.env.local`，填入你的 Supabase 项目网址和公开密钥。密码和管理员密钥留在自己的控制台。
3. 在项目目录执行以下命令，再打开终端显示的本地网址。

```sh
npm ci
npm run dev
```

如果 Windows PowerShell 拦截 `npm`，可把命令里的 `npm` 换成 `npm.cmd`。

## 构建与测试

```sh
npm test
npm run build
```

测试使用 Node.js 自带的测试工具。构建结果位于 `dist/`，可用 `npm run preview` 在本机查看。页面操作的复测步骤见[测试指南](docs/测试指南.md)。

## 自定义

每日一言在 [`src/data/quotes.json`](src/data/quotes.json)。修改 `text` 为正文，`author` 为作者（可留空），至少保留一条。应用按所选日期轮换。更换图标时，保留 [`public/`](public/) 中现有的 180、192 和 512 像素尺寸及文件名。
