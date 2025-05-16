import React, { useState } from 'react';
import { Card, Select, Switch } from '../../ui';

export interface AxisConfig {
  xAxis: string;
  yAxis: string[];
  stacked?: boolean;
  includeZero?: boolean;
}

interface AxisMapperProps {
  columns: { name: string; type: string }[];
  config: AxisConfig;
  onChange: (config: AxisConfig) => void;
  chartType: string;
}

const AxisMapper: React.FC<AxisMapperProps> = ({
  columns,
  config,
  onChange,
  chartType
}) => {
  const [selectedYAxis, setSelectedYAxis] = useState<string>('');

  // Determine which columns are suitable for X axis (typically categorical data or dates)
  const xAxisColumns = columns.map(col => ({
    value: col.name,
    label: `${col.name} (${col.type})`,
  }));

  // Determine which columns are suitable for Y axis (typically numerical data)
  const yAxisColumns = columns
    .filter(col => {
      const lowerType = col.type.toLowerCase();
      return (
        lowerType.includes('int') ||
        lowerType.includes('float') ||
        lowerType.includes('double') ||
        lowerType.includes('decimal') ||
        lowerType.includes('number')
      );
    })
    .map(col => ({
      value: col.name,
      label: `${col.name} (${col.type})`,
    }));

  // Handle X axis selection
  const handleXAxisChange = (value: string) => {
    onChange({
      ...config,
      xAxis: value,
    });
  };

  // Handle adding a Y axis column
  const handleAddYAxis = () => {
    if (!selectedYAxis || config.yAxis.includes(selectedYAxis)) return;
    onChange({
      ...config,
      yAxis: [...config.yAxis, selectedYAxis],
    });
    setSelectedYAxis('');
  };

  // Handle removing a Y axis column
  const handleRemoveYAxis = (column: string) => {
    onChange({
      ...config,
      yAxis: config.yAxis.filter(y => y !== column),
    });
  };

  // Handle stacked chart toggle
  const handleStackedChange = (checked: boolean) => {
    onChange({
      ...config,
      stacked: checked,
    });
  };

  // Handle include zero toggle
  const handleIncludeZeroChange = (checked: boolean) => {
    onChange({
      ...config,
      includeZero: checked,
    });
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">Chart Configuration</h3>
      
      {/* X-axis selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          X-Axis
        </label>
        <Select
          value={config.xAxis}
          onChange={(e) => handleXAxisChange(e.target.value)}
          options={[
            { value: '', label: 'Select column...' },
            ...xAxisColumns
          ]}
        />
      </div>

      {/* Y-axis selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Y-Axis Columns
        </label>
        <div className="flex space-x-2">
          <div className="flex-grow">
            <Select
              value={selectedYAxis}
              onChange={(e) => setSelectedYAxis(e.target.value)}
              options={[
                { value: '', label: 'Select column...' },
                ...yAxisColumns.filter(col => !config.yAxis.includes(col.value))
              ]}
            />
          </div>
          <button
            type="button"
            onClick={handleAddYAxis}
            disabled={!selectedYAxis || config.yAxis.includes(selectedYAxis)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Add
          </button>
        </div>
      </div>

      {/* Selected Y-axis columns */}
      {config.yAxis.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Selected Y-Axis Columns:
          </label>
          <div className="space-y-2">
            {config.yAxis.map(column => (
              <div 
                key={column} 
                className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded"
              >
                <span>{column}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveYAxis(column)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart specific options */}
      {(chartType === 'bar' || chartType === 'area' || chartType === 'line') && (
        <div className="space-y-4">
          {/* Stacked option for bar and area charts */}
          {(chartType === 'bar' || chartType === 'area') && (
            <div className="flex items-center">
              <Switch
                id="stacked-switch"
                checked={!!config.stacked}
                onChange={handleStackedChange}
              />
              <label 
                htmlFor="stacked-switch"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Stacked Chart
              </label>
            </div>
          )}

          {/* Include zero on Y-axis option */}
          <div className="flex items-center">
            <Switch
              id="include-zero-switch"
              checked={!!config.includeZero}
              onChange={handleIncludeZeroChange}
            />
            <label 
              htmlFor="include-zero-switch"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Start Y-Axis from Zero
            </label>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AxisMapper;
