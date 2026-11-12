# 前端源码

- `main.jsx` 加载 React 应用，`App.jsx` 管理登录状态和页面导航。
- `pages/` 包含今日、历史、统计、周报和设置。录入和编辑共用 `components/RecordForm.jsx`。
- `domain/` 包含日期、时长、分类、统计与 CSV 转换。统计计算与图表渲染分开。
- `data/` 包含 Supabase 客户端、数据读写及每日一言。读取多条记录时按日期和记录 ID 分页。
- `styles/tokens.css` 集中定义颜色、字号、圆角和间距。
