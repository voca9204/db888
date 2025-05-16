import React from 'react';
import { type AxisConfig } from './AxisMapper';

// 이 파일에는 Recharts가 설치되면 실제 차트 컴포넌트를 구현할 것입니다.
// 지금은 차트를 구현하기 위한 인터페이스와 기본 구조만 정의합니다.

// 아래 차트가 제대로 작동하려면 먼저 다음 명령어로 Recharts를 설치해야 합니다:
// npm install recharts

/*
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
*/

// 테스트 데이터 및 기본 구현 예시는 Recharts가 설치된 후 추가할 것입니다.

interface ChartComponentProps {
  data: any[];
  config: AxisConfig;
  height?: number;
}

export const BarChartComponent: React.FC<ChartComponentProps> = ({ data, config, height = 400 }) => {
  return (
    <div className="text-center p-4 h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
      <p>Bar Chart 구현은 Recharts 설치 후 가능합니다.</p>
    </div>
  );
};

export const LineChartComponent: React.FC<ChartComponentProps> = ({ data, config, height = 400 }) => {
  return (
    <div className="text-center p-4 h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
      <p>Line Chart 구현은 Recharts 설치 후 가능합니다.</p>
    </div>
  );
};

export const AreaChartComponent: React.FC<ChartComponentProps> = ({ data, config, height = 400 }) => {
  return (
    <div className="text-center p-4 h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
      <p>Area Chart 구현은 Recharts 설치 후 가능합니다.</p>
    </div>
  );
};

export const PieChartComponent: React.FC<ChartComponentProps> = ({ data, config, height = 400 }) => {
  return (
    <div className="text-center p-4 h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
      <p>Pie Chart 구현은 Recharts 설치 후 가능합니다.</p>
    </div>
  );
};

export const ScatterChartComponent: React.FC<ChartComponentProps> = ({ data, config, height = 400 }) => {
  return (
    <div className="text-center p-4 h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
      <p>Scatter Chart 구현은 Recharts 설치 후 가능합니다.</p>
    </div>
  );
};

export const RadarChartComponent: React.FC<ChartComponentProps> = ({ data, config, height = 400 }) => {
  return (
    <div className="text-center p-4 h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
      <p>Radar Chart 구현은 Recharts 설치 후 가능합니다.</p>
    </div>
  );
};

// 여러 색상 팔레트 정의
export const CHART_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff8042',
  '#0088fe',
  '#00c49f',
  '#ffbb28',
  '#ff8042',
  '#a4de6c',
  '#d0ed57',
];

// Recharts 설치 후 아래 함수 구현
export const downloadChartAsPNG = (chartId: string, filename: string = 'chart') => {
  alert('Recharts와 html2canvas 라이브러리가 필요합니다. npm install recharts html2canvas');
};

export const downloadChartAsSVG = (chartId: string, filename: string = 'chart') => {
  alert('Recharts와 관련 라이브러리가 필요합니다. npm install recharts');
};
