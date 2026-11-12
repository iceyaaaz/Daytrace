# 日迹

自己用的中文时间日记。应用包含登录、今日填写、历史、统计、周报、标签管理、CSV 导出和手机桌面安装。

## 第 1 步　准备 Supabase 测试项目

1. 打开 [Supabase 控制台](https://supabase.com/dashboard)。在 **New organization** 创建一个组织，套餐选 **Free**。在该组织中点 **New project**，项目名可填 `growth-diary-test`。创建时设置的数据库密码由你自己保存。
2. 进入刚创建的测试项目。在左侧点 **SQL Editor → New query**。打开本项目的 `supabase/schema.sql`，复制全部内容到编辑框，点 **Run**，成功后会有提示。每个空项目执行一次。
3. 打开左侧 **Authentication**。找到 **Sign In / Providers** 或 **Authentication Settings**，关闭 **Allow new users to sign up**（允许新用户注册）及 **Allow anonymous sign-ins**（匿名登录），保存设置。保留邮箱登录。
4. 在 **Authentication → Users** 点 **Add user → Create new user**。填你控制的测试邮箱和自定的测试密码。如果出现 **Auto Confirm User**，勾选它。日记登录用的是这里创建的邮箱密码。测试项目只保留这个日记账号。
5. 回到 **SQL Editor → New query**，复制 `supabase/seed-exercise-tags.sql` 全部内容并点 **Run**。这样就有跑步、力量训练、散步、球类和瑜伽。初次执行一次即可，日后可在日记的设置页自行增删。

如果第 2 步提示已有同名表，先停在该步并反馈提示文字。

## 第 2 步　连接并打开本地网页

1. 在 Supabase 项目顶部点 **Connect**，复制 **Project URL** 和 **Publishable key**。在项目文件夹复制 `.env.example`，把副本命名为 `.env.local`。在两个等号后分别粘贴对应的值。保存时确认文件名末尾没有 `.txt`。网址和公开密钥之外的凭据留在你手里。
2. 在项目文件夹中打开 PowerShell。若第一次运行，执行 `npm.cmd ci`。然后执行 `npm.cmd run dev -- --port 5173`。
3. 打开 [本地日迹](http://127.0.0.1:5173/)，输入刚才在 **Authentication → Users** 中创建的测试邮箱和密码。修改 `.env.local` 后，关闭并重启第 2 步的命令。

这条本地网址只在运行项目的电脑上打开。部署后可在不同设备打开同一个线上网址，使用同一个日记账号查看记录。手机安装需要打开线上 HTTPS 网址。若要在电脑本地检查安装和更新，运行 `npm.cmd run build`，再运行 `npm.cmd run preview`，打开命令行显示的网址。

## 第 3 步　部署到自己的 Vercel

1. 在自己的 GitHub 个人账号下建一个 **Private** 仓库，把源码放入仓库根目录。保留 `.env.example` 和 `.gitignore`，只在电脑上保留 `.env.local`。同时排除 `node_modules`、`dist` 和本地测试文件。
2. 在 Vercel Hobby 控制台点 **Add New → Project**，导入这个仓库。首次授权时可以只勾选这一个仓库。框架选 **Vite**，构建命令用 `npm run build`，输出目录用 `dist`。
3. 展开 **Environment Variables**，添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`。它们分别是 Supabase 项目网址和公开密钥。然后点 **Deploy**。部署成功后打开页面显示的 `https://…vercel.app` 网址。
4. 先用测试数据登录并保存一条记录，再从另一台设备登录查看。上线自用时可按第 1 步另建生产项目并切换这两个值，然后重新部署。生产账号和真实日记仅由你管理。
5. 以后把改动推送到仓库的生产分支，Vercel 会自动构建。下次联网打开日记会获取新版。若曾临时邀请协作者，在 GitHub、Vercel 和 Supabase 的成员设置里移除其访问权限。

详见 [Vercel 的 Vite 部署说明](https://vercel.com/docs/frameworks/frontend/vite) 和 [环境变量说明](https://vercel.com/docs/environment-variables)。

## 备份和恢复

- **平时留一份可查看的备份。** 打开右上角「设置」→「导出全部数据」。CSV 可用 Excel 打开，包含全部日记记录。以公式符号开头的内容会加一个文本保护符号，原始日记内容仍保存在数据库中。
- **做完整备份。** CSV 用于查看和留档。要保留账号、标签设置和完整数据库信息，在 Supabase 控制台检查套餐提供的数据库备份能力，或按官方步骤导出数据库备份文件。密码只在你自己的电脑和控制台使用。
- **需要恢复时。** 先在一个空白测试项目按官方指南恢复完整数据库，核对账号、标签和记录，再把 Vercel 的项目网址和公开密钥切到恢复后的项目并重新部署。如果手上只有 CSV，可先用 Excel 查看并逐条补回需要的记录。应用内没有导入按钮。

[Supabase 数据库备份](https://supabase.com/docs/guides/platform/backups) · [备份与恢复操作](https://supabase.com/docs/guides/platform/migrating-within-supabase)

## 按页面手动验收

1. **登录。** 用错误密码试一次，再用正确密码登录。刷新网页，关闭浏览器后重开。最后在右上角「设置」点「退出登录」，点浏览器后退并重新打开本地网址，确认只见登录页。
2. **记今天和补记。** 登录后直接在灵感框写一条测试记录，时长保持默认。点「记录日期」选昨天，再试着选明天。逐个打开读书、学习、运动、新闻、线下娱乐和手机娱乐，先漏填一项，再填完整保存。读书可填「测试：学到一条」并选择 `30min`。
3. **断网和跨设备。** 在已经打开的填写页写一条测试记录，暂时断开 Wi-Fi 或网络，点「保存」。看到失败提示后，检查文字仍在。联网后再点保存，刷新确认能看到。第二台已经配置相同测试项目的电脑登录后，回看这条记录。
4. **标签与历史。** 在学习卡片的「新标签名称」输入 `阅读笔记`，按回车，再建一个 `摘录`，同时选中后保存 30 分钟。到「设置」删除 `摘录` 这个选项，确认历史里仍显示它。到「统计」查看两个标签各为 30 分钟，学习总时长仍只增加 30 分钟。回到历史页，点「加载更多」，再用日期框查找一条记录。试一次编辑、取消删除，再确认删除。
5. **看周报。** 打开「统计」切换四个日期范围，确认图表和表格合计相符。打开「周报」，切换上一周和下一周，对照日期范围、记录天数与较上周变化。
6. **检查云端设置。** 到 Supabase 的 **Authentication → Users** 确认只有测试账号，并检查公开注册开关已关闭。到 **Table Editor** 点开 `records` 和 `tags`，确认两张表的行级访问保护（RLS）已开启。这两项设置不需要在聊天里提供任何凭据。

## 构建与单元测试

```powershell
npm.cmd test
npm.cmd run build
```

`src/domain/` 放日期、记录校验和统计纯函数。`src/data/` 负责和数据库通信，超过单页上限时按日期和记录 ID 继续读取。`tests/` 是可直接运行的单元测试。

依赖用途：React 和 React DOM 渲染页面，Vite 与 React 插件用于本地预览和打包，Supabase JavaScript 客户端负责登录与数据请求，ECharts 绘制图表，`lucide-react` 提供板块和导航等线性图标，`vite-plugin-pwa` 生成手机安装清单与静态页面缓存。日记请求不进入这份缓存。单元测试使用 Node.js 自带工具。

每日一言在 `src/data/quotes.json`。修改 `text` 为正文，`author` 为作者（可留空），至少保留一条。应用按所选日期轮换。

应用图标放在 `public/icon-192.png`、`public/icon-512.png` 和 `public/apple-touch-icon.png`（180 × 180）。替换时保持尺寸和文件名。普通填写、标签和导出操作可看 [一页使用说明](使用说明.md)。
