import React from 'react';
import { AlertConditionType, ComparisonOperator } from '../../firebase/models/scheduling';
import { Button, Select, Input } from '../ui';
import { Plus, Trash2 } from 'lucide-react';

type AlertConditionsProps = {
  conditions: Array<{
    type: AlertConditionType;
    operator?: ComparisonOperator;
    value?: number | string;
    columnName?: string;
    expression?: string;
  }>;
  onChange: (conditions: any[]) => void;
};

const AlertConditions: React.FC<AlertConditionsProps> = ({ conditions, onChange }) => {
  // 조건 추가
  const handleAddCondition = () => {
    onChange([...conditions, { type: AlertConditionType.ALWAYS }]);
  };
  
  // 조건 제거
  const handleRemoveCondition = (index: number) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    onChange(newConditions);
  };
  
  // 조건 타입 변경
  const handleTypeChange = (index: number, type: AlertConditionType) => {
    const newConditions = [...conditions];
    
    // 타입에 따른 기본값 설정
    switch (type) {
      case AlertConditionType.ROWS_COUNT:
        newConditions[index] = {
          type,
          operator: ComparisonOperator.GREATER_THAN,
          value: 0,
        };
        break;
      
      case AlertConditionType.CUSTOM_CONDITION:
        newConditions[index] = {
          type,
          columnName: '',
          operator: ComparisonOperator.EQUAL,
          value: '',
        };
        break;
      
      default:
        newConditions[index] = { type };
        break;
    }
    
    onChange(newConditions);
  };
  
  // 조건 연산자 변경
  const handleOperatorChange = (index: number, operator: ComparisonOperator) => {
    const newConditions = [...conditions];
    newConditions[index].operator = operator;
    onChange(newConditions);
  };
  
  // 조건 값 변경
  const handleValueChange = (index: number, value: number | string) => {
    const newConditions = [...conditions];
    newConditions[index].value = value;
    onChange(newConditions);
  };
  
  // 컬럼명 변경
  const handleColumnNameChange = (index: number, columnName: string) => {
    const newConditions = [...conditions];
    newConditions[index].columnName = columnName;
    onChange(newConditions);
  };
  
  // 표현식 변경
  const handleExpressionChange = (index: number, expression: string) => {
    const newConditions = [...conditions];
    newConditions[index].expression = expression;
    onChange(newConditions);
  };
  
  // 조건별 UI 렌더링
  const renderConditionFields = (condition: any, index: number) => {
    switch (condition.type) {
      case AlertConditionType.ROWS_COUNT:
        return (
          <div className="flex items-center space-x-2">
            <span>Row count</span>
            <Select
              value={condition.operator || ComparisonOperator.GREATER_THAN}
              onChange={(e) => handleOperatorChange(index, e.target.value as ComparisonOperator)}
              className="w-44"
            >
              <option value={ComparisonOperator.EQUAL}>equals</option>
              <option value={ComparisonOperator.NOT_EQUAL}>does not equal</option>
              <option value={ComparisonOperator.GREATER_THAN}>is greater than</option>
              <option value={ComparisonOperator.LESS_THAN}>is less than</option>
              <option value={ComparisonOperator.GREATER_THAN_OR_EQUAL}>is greater than or equal to</option>
              <option value={ComparisonOperator.LESS_THAN_OR_EQUAL}>is less than or equal to</option>
            </Select>
            <Input
              type="number"
              value={condition.value || 0}
              onChange={(e) => handleValueChange(index, parseInt(e.target.value, 10))}
              className="w-24"
              min={0}
            />
          </div>
        );
      
      case AlertConditionType.CUSTOM_CONDITION:
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span>Column</span>
              <Input
                value={condition.columnName || ''}
                onChange={(e) => handleColumnNameChange(index, e.target.value)}
                placeholder="column_name"
                className="w-40"
              />
              <Select
                value={condition.operator || ComparisonOperator.EQUAL}
                onChange={(e) => handleOperatorChange(index, e.target.value as ComparisonOperator)}
                className="w-44"
              >
                <option value={ComparisonOperator.EQUAL}>equals</option>
                <option value={ComparisonOperator.NOT_EQUAL}>does not equal</option>
                <option value={ComparisonOperator.GREATER_THAN}>is greater than</option>
                <option value={ComparisonOperator.LESS_THAN}>is less than</option>
                <option value={ComparisonOperator.GREATER_THAN_OR_EQUAL}>is greater than or equal to</option>
                <option value={ComparisonOperator.LESS_THAN_OR_EQUAL}>is less than or equal to</option>
              </Select>
              <Input
                value={condition.value || ''}
                onChange={(e) => handleValueChange(index, e.target.value)}
                placeholder="value"
                className="w-32"
              />
            </div>
          </div>
        );
      
      case AlertConditionType.ALWAYS:
      case AlertConditionType.NO_RESULTS:
      case AlertConditionType.ERROR:
      default:
        return null;
    }
  };
  
  // 조건 타입 표시 텍스트
  const getConditionTypeText = (type: AlertConditionType) => {
    switch (type) {
      case AlertConditionType.ALWAYS:
        return 'Always send notification';
      case AlertConditionType.NO_RESULTS:
        return 'When query returns no results';
      case AlertConditionType.ERROR:
        return 'When query execution fails';
      case AlertConditionType.ROWS_COUNT:
        return 'Based on row count';
      case AlertConditionType.CUSTOM_CONDITION:
        return 'Based on column value';
      default:
        return 'Unknown condition';
    }
  };
  
  return (
    <div className="space-y-4">
      {conditions.length === 0 ? (
        <p className="text-sm italic text-gray-500 dark:text-gray-400">
          No alert conditions. Notifications will be sent for all executions.
        </p>
      ) : (
        <ul className="space-y-4">
          {conditions.map((condition, index) => (
            <li 
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded p-4"
            >
              <div className="flex justify-between mb-2">
                <div>
                  <Select
                    value={condition.type}
                    onChange={(e) => handleTypeChange(index, e.target.value as AlertConditionType)}
                    className="w-48"
                  >
                    <option value={AlertConditionType.ALWAYS}>Always</option>
                    <option value={AlertConditionType.NO_RESULTS}>No Results</option>
                    <option value={AlertConditionType.ERROR}>Error</option>
                    <option value={AlertConditionType.ROWS_COUNT}>Row Count</option>
                    <option value={AlertConditionType.CUSTOM_CONDITION}>Custom Condition</option>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveCondition(index)}
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mt-2">
                {renderConditionFields(condition, index)}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      <div className="mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleAddCondition}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Condition
        </Button>
      </div>
    </div>
  );
};

export default AlertConditions;
