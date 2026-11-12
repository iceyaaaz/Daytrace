import { Component, lazy, Suspense } from 'react';
import { categories, categoryIds, durationDelta, durationText } from '../domain/records.js';

const Chart = lazy(() => import('./Chart.jsx'));
const colors = categoryIds.map((category) => categories[category].color);
const legend = { type: 'scroll', bottom: 0, icon: 'circle' };
const percentage = (tenths) => `${(tenths / 10).toFixed(1)}%`;

class ChartBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <p className="notice error" role="alert">图表加载失败，请联网后刷新。</p>;
    return this.props.children;
  }
}

function CategoryTable({ rows }) {
  const compare = 'delta' in rows[0];
  return <table>
    <caption className="sr-only">各板块时间</caption>
    <thead><tr><th scope="col">板块</th><th scope="col">累计时间</th><th scope="col">占比</th>
      {compare && <th scope="col">较上周</th>}</tr></thead>
    <tbody>{rows.map(({ category, minutes, tenths, delta }) => (
      <tr key={category}>
        <th scope="row">{categories[category].label}</th><td>{durationText(minutes)}</td><td>{percentage(tenths)}</td>
        {compare && <td>{durationDelta(delta)}</td>}
      </tr>
    ))}</tbody>
  </table>;
}

function pieOption(rows) {
  return {
    color: colors, legend,
    tooltip: {
      trigger: 'item', renderMode: 'richText',
      formatter: ({ name, data }) => `${name}\n${durationText(data.value)} · ${percentage(data.tenths)}`,
    },
    series: [{
      type: 'pie', radius: '63%', center: ['50%', '44%'], label: { show: false },
      data: rows.map(({ category, minutes, tenths }) => ({ name: categories[category].label, value: minutes, tenths })),
    }],
  };
}

function dailyOption(days) {
  const zoom = days.length > 31;
  return {
    color: colors, legend,
    grid: { left: 53, right: 20, top: 22, bottom: zoom ? 74 : 52 },
    tooltip: { trigger: 'axis', renderMode: 'richText', confine: true, valueFormatter: durationText },
    xAxis: { type: 'category', data: days.map(({ date }) => date), axisLabel: { formatter: (date) => date.slice(5) } },
    yAxis: { type: 'value', name: '分钟', minInterval: 1 },
    dataZoom: zoom ? [{ type: 'slider', bottom: 27, startValue: days.length - 31, endValue: days.length - 1 }] : [],
    series: categoryIds.map((category) => ({
      name: categories[category].label, type: 'bar', stack: 'day',
      data: days.map(({ minutes }) => minutes ? minutes[category] : null),
    })),
  };
}

function tagOption(tags) {
  return {
    color: ['#38796c'],
    grid: { left: 18, right: 24, top: 22, bottom: 25, containLabel: true },
    tooltip: { trigger: 'axis', renderMode: 'richText', confine: true, valueFormatter: durationText },
    xAxis: { type: 'value', name: '分钟', minInterval: 1 },
    yAxis: { type: 'category', inverse: true, data: tags.map(({ name }) => name), axisLabel: { width: 102, overflow: 'truncate' } },
    series: [{ type: 'bar', data: tags.map(({ minutes }) => minutes) }],
  };
}

export function StatisticsPanel({ summary, rows = summary.breakdown, tagCount, weekly = false }) {
  const tags = summary.tags.slice(0, tagCount);
  return <>
    <section className="card">
      <div className="section-heading"><h2>各板块累计时间</h2><span className="metric">{durationText(summary.total)}</span></div>
      {weekly && <p className="muted">记录天数 {summary.recordedDays}/7</p>}
      <CategoryTable rows={rows} />
    </section>
    <ChartBoundary><Suspense fallback={<p className="notice" role="status">正在加载图表…</p>}>
      {summary.total > 0 && <section className="card">
        <h2>时间分布</h2><p className="muted">按已记录时长计算占比。</p>
        <Chart option={pieOption(rows)} label="各板块时间占比饼图" />
      </section>}
      {summary.days.length > 0 && <section className="card">
        <h2>每日用时</h2><p className="muted">每根柱子是一日，空白表示没有记录时长。</p>
        <Chart option={dailyOption(summary.days)} label="每日堆叠柱状图" />
      </section>}
      <section className="card">
        <h2>学习技能标签 · 前 {tagCount}</h2>
        {tags.length > 0 ? <>
          <Chart option={tagOption(tags)} label="学习技能标签排行柱状图" />
          <ol className="tag-ranking">{tags.map(({ name, minutes }) => <li key={name}>{name} <strong>{durationText(minutes)}</strong></li>)}</ol>
        </> : <p className="muted">暂无学习标签数据</p>}
        <p className="muted">一条记录有多个标签时，每个标签都计入完整时长，标签合计可能大于学习板块总时间。</p>
      </section>
    </Suspense></ChartBoundary>
  </>;
}
