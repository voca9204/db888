import React, { useState, useMemo } from 'react';
import ChartSelector, { type ChartType } from './ChartSelector';
import AxisMapper, { type AxisConfig } from './AxisMapper';
import Chart from './Chart';

interface DataVisualizationProps {
  data: any[];
  columns: { name: string; type: string }[];
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ 
  data,
  columns 
}) => {
  // State for chart configuration
  const [chartType, setChartType] = useState<ChartType>('table');
  const [axisConfig, setAxisConfig] = useState<AxisConfig>({
    xAxis: '',
    yAxis: [],
    stacked: false,
    includeZero: true,
  });

  // Prepare the data for the selected chart type
  const preparedData = useMemo(() => {
    if (!data || data.length === 0 || !axisConfig.xAxis || axisConfig.yAxis.length === 0) {
      return [];
    }

    return data.map(row => {
      // Extract only the relevant fields for the chart
      const chartRow: Record<string, any> = {
        [axisConfig.xAxis]: row[axisConfig.xAxis],
      };
      
      // Add the y-axis values
      axisConfig.yAxis.forEach(yAxisField => {
        chartRow[yAxisField] = row[yAxisField] !== undefined && row[yAxisField] !== null 
          ? Number(row[yAxisField]) 
          : null;
      });
      
      return chartRow;
    });
  }, [data, axisConfig]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4">Data Visualization</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart Type Selector */}
        <div className="md:col-span-1">
          <ChartSelector
            chartType={chartType}
            onChange={setChartType}
          />
        </div>
        
        {/* Axis Configuration */}
        <div className="md:col-span-2">
          <AxisMapper
            columns={columns}
            config={axisConfig}
            onChange={setAxisConfig}
            chartType={chartType}
          />
        </div>
      </div>
      
      {/* Chart Rendering Area */}
      <div className="mt-6">
        <Chart
          data={preparedData}
          columns={columns}
          chartType={chartType}
          config={axisConfig}
        />
      </div>
    </div>
  );
};

export default DataVisualization;
