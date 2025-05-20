declare module 'echarts-for-react' {
  import React from 'react';
  import { ECharts, EChartsOption } from 'echarts';
  
  interface ReactEChartsProps {
    option: EChartsOption;
    notMerge?: boolean;
    lazyUpdate?: boolean;
    style?: React.CSSProperties;
    className?: string;
    theme?: string | object;
    onChartReady?: (instance: ECharts) => void;
    onEvents?: Record<string, (params: unknown) => void>;
    opts?: {
      devicePixelRatio?: number;
      renderer?: 'canvas' | 'svg';
      width?: number | string | null;
      height?: number | string | null;
    };
  }
  
  export default class ReactECharts extends React.Component<ReactEChartsProps> {
    getEchartsInstance: () => ECharts;
  }
} 