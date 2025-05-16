import React, { useRef } from 'react';
import { Card, Button } from '../../ui';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { type AxisConfig } from './AxisMapper';
import { type ChartType } from './ChartSelector';
import {
  BarChartComponent,
  LineChartComponent,
  AreaChartComponent,
  PieChartComponent,
  ScatterChartComponent,
  RadarChartComponent,
  downloadChartAsPNG,
  downloadChartAsSVG
} from './ChartComponents';

// This is a placeholder since we don't have Recharts yet
// When Recharts is installed, we'll replace this with actual chart components
interface ChartProps {
  data: any[];
  columns: { name: string; type: string }[];
  chartType: ChartType;
  config: AxisConfig;
}

const Chart: React.FC<ChartProps> = ({ 
  data, 
  columns, 
  chartType, 
  config 
}) => {
  // Chart container ref for export
  const chartRef = useRef<HTMLDivElement>(null);

  // Function to check if we have required configuration
  const isChartConfigValid = () => {
    if (!config.xAxis) return false;
    if (config.yAxis.length === 0) return false;
    
    // For pie charts, we need exactly one Y axis
    if (chartType === 'pie' && config.yAxis.length !== 1) return false;
    
    return true;
  };

  // Function to export chart as PNG
  const handleExportPNG = () => {
    if (chartRef.current) {
      downloadChartAsPNG(chartRef.current.id, `chart-${chartType}-${new Date().getTime()}`);
    }
  };

  // Function to export chart as SVG
  const handleExportSVG = () => {
    if (chartRef.current) {
      downloadChartAsSVG(chartRef.current.id, `chart-${chartType}-${new Date().getTime()}`);
    }
  };

  if (!isChartConfigValid()) {
    return (
      <Card className="p-4 text-center">
        <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-md">
          <h3 className="text-lg font-medium mb-4">Chart Configuration Incomplete</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {!config.xAxis 
              ? "Please select an X-axis column." 
              : "Please select at least one Y-axis column."}
            {chartType === 'pie' && config.yAxis.length > 1 && 
              " Pie charts can only display one value column."}
          </p>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-4 text-center">
        <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-md">
          <h3 className="text-lg font-medium mb-4">No Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            There is no data to display. Please run a query first.
          </p>
        </div>
      </Card>
    );
  }

  // Render appropriate chart based on type
  const renderChart = () => {
    const chartId = `chart-${chartType}-${Math.random().toString(36).substr(2, 9)}`;
    
    switch (chartType) {
      case 'bar':
        return (
          <div ref={chartRef} id={chartId}>
            <BarChartComponent data={data} config={config} />
          </div>
        );
      case 'line':
        return (
          <div ref={chartRef} id={chartId}>
            <LineChartComponent data={data} config={config} />
          </div>
        );
      case 'area':
        return (
          <div ref={chartRef} id={chartId}>
            <AreaChartComponent data={data} config={config} />
          </div>
        );
      case 'pie':
        return (
          <div ref={chartRef} id={chartId}>
            <PieChartComponent data={data} config={config} />
          </div>
        );
      case 'scatter':
        return (
          <div ref={chartRef} id={chartId}>
            <ScatterChartComponent data={data} config={config} />
          </div>
        );
      case 'radar':
        return (
          <div ref={chartRef} id={chartId}>
            <RadarChartComponent data={data} config={config} />
          </div>
        );
      case 'table':
      default:
        return (
          <div className="p-4 text-center bg-gray-100 dark:bg-gray-800 rounded-md">
            <p className="text-gray-600 dark:text-gray-400">
              Table view is available in the Table tab
            </p>
          </div>
        );
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
        </h3>
        <div className="flex space-x-2">
          <Button 
            size="sm"
            variant="secondary"
            onClick={handleExportPNG}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" /> PNG
          </Button>
          <Button 
            size="sm"
            variant="secondary"
            onClick={handleExportSVG}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" /> SVG
          </Button>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 h-96 overflow-hidden">
        {renderChart()}
        <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
          <p>
            To use chart visualization, please install Recharts:<br />
            <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">
              npm install recharts
            </code>
            <br />
            or <br />
            <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">
              yarn add recharts
            </code>
          </p>
        </div>
      </div>
    </Card>
  );
};

export default Chart;
