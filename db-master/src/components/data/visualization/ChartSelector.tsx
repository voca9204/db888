import React from 'react';
import { Card, Select } from '../../ui';

export type ChartType = 
  | 'bar' 
  | 'line' 
  | 'area' 
  | 'pie' 
  | 'scatter' 
  | 'radar'
  | 'table';

interface ChartSelectorProps {
  chartType: ChartType;
  onChange: (chartType: ChartType) => void;
}

const ChartSelector: React.FC<ChartSelectorProps> = ({ 
  chartType, 
  onChange 
}) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">Chart Type</h3>
      <Select
        value={chartType}
        onChange={(e) => onChange(e.target.value as ChartType)}
        options={[
          { value: 'table', label: 'Table' },
          { value: 'bar', label: 'Bar Chart' },
          { value: 'line', label: 'Line Chart' },
          { value: 'area', label: 'Area Chart' },
          { value: 'pie', label: 'Pie Chart' },
          { value: 'scatter', label: 'Scatter Plot' },
          { value: 'radar', label: 'Radar Chart' },
        ]}
      />
    </Card>
  );
};

export default ChartSelector;
