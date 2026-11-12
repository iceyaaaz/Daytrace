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
    chart.setOption({
      animation: false,
      aria: { enabled: true },
      textStyle: { color: '#394842', fontFamily: 'system-ui, sans-serif' },
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
