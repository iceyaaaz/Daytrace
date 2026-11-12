import { useEffect, useRef } from 'react';
import { init, use } from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import { AriaComponent, DataZoomComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([BarChart, PieChart, AriaComponent, DataZoomComponent, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

export default function Chart({ option, label }) {
  const container = useRef(null);
  useEffect(() => {
    const chart = init(container.current);
    const tokens = getComputedStyle(document.documentElement);
    chart.setOption({
      animation: false,
      aria: { enabled: true },
      textStyle: { color: tokens.getPropertyValue('--text-2').trim(), fontFamily: tokens.getPropertyValue('--font-body').trim() },
      ...option,
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [option]);
  return <div className="chart" ref={container} role="img" aria-label={label} />;
}
