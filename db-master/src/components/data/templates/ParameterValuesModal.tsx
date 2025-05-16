import React, { useState } from 'react';
import { Modal, Button, Input, Select } from '../../ui';
import { QueryTemplateParameter } from '../../../types/store';

interface ParameterValuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paramValues: Record<string, any>) => void;
  parameters: QueryTemplateParameter[];
  initialValues?: Record<string, any>;
}

const ParameterValuesModal: React.FC<ParameterValuesModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parameters,
  initialValues = {},
}) => {
  // 매개변수 값 상태
  const [paramValues, setParamValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 매개변수 값 변경
  const handleValueChange = (name: string, value: any, type: string) => {
    // 타입에 따른 값 변환
    let typedValue: any = value;
    
    if (value === '' || value === null || value === undefined) {
      typedValue = null;
    } else {
      switch (type) {
        case 'number':
          typedValue = Number(value);
          if (isNaN(typedValue)) {
            setErrors({
              ...errors,
              [name]: 'Please enter a valid number',
            });
            return;
          }
          break;
        case 'boolean':
          typedValue = value === 'true' || value === true;
          break;
        case 'date':
          try {
            typedValue = new Date(value).toISOString().split('T')[0];
          } catch (e) {
            setErrors({
              ...errors,
              [name]: 'Please enter a valid date',
            });
            return;
          }
          break;
      }
    }
    
    // 에러 초기화
    const newErrors = { ...errors };
    delete newErrors[name];
    setErrors(newErrors);
    
    // 값 설정
    setParamValues({
      ...paramValues,
      [name]: typedValue,
    });
  };
  
  // 폼 제출
  const handleSubmit = () => {
    // 필수 매개변수 검증
    const newErrors: Record<string, string> = {};
    let valid = true;
    
    parameters.forEach((param) => {
      if (param.required) {
        const value = paramValues[param.name];
        if (value === undefined || value === null || value === '') {
          newErrors[param.name] = 'This parameter is required';
          valid = false;
        }
      }
    });
    
    if (!valid) {
      setErrors(newErrors);
      return;
    }
    
    // 콜백 호출
    onSubmit(paramValues);
  };
  
  // 매개변수 입력 필드 렌더링
  const renderParameterInput = (param: QueryTemplateParameter) => {
    const value = paramValues[param.name] ?? '';
    const error = errors[param.name];
    
    switch (param.type) {
      case 'string':
        return (
          <div key={param.name} className="mb-4">
            <Input
              label={`${param.name}${param.required ? ' *' : ''}`}
              value={value}
              onChange={(e) => handleValueChange(param.name, e.target.value, param.type)}
              placeholder={param.description || `Enter ${param.name}`}
              error={error}
            />
          </div>
        );
      
      case 'number':
        return (
          <div key={param.name} className="mb-4">
            <Input
              label={`${param.name}${param.required ? ' *' : ''}`}
              type="number"
              value={value}
              onChange={(e) => handleValueChange(param.name, e.target.value, param.type)}
              placeholder={param.description || `Enter ${param.name}`}
              error={error}
            />
          </div>
        );
      
      case 'boolean':
        return (
          <div key={param.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {param.name}{param.required ? ' *' : ''}
            </label>
            <Select
              value={value === true || value === 'true' ? 'true' : value === false || value === 'false' ? 'false' : ''}
              onChange={(e) => handleValueChange(param.name, e.target.value, param.type)}
              options={[
                { value: '', label: 'Select a value' },
                { value: 'true', label: 'True' },
                { value: 'false', label: 'False' },
              ]}
              error={error}
            />
            {param.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {param.description}
              </p>
            )}
          </div>
        );
      
      case 'date':
        return (
          <div key={param.name} className="mb-4">
            <Input
              label={`${param.name}${param.required ? ' *' : ''}`}
              type="date"
              value={value}
              onChange={(e) => handleValueChange(param.name, e.target.value, param.type)}
              placeholder={param.description || `Select ${param.name}`}
              error={error}
            />
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enter Parameter Values"
    >
      <div className="p-1">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Please provide values for the following parameters:
        </p>
        
        {parameters.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No parameters required
          </div>
        ) : (
          <div>
            {parameters.map(renderParameterInput)}
          </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
          >
            Run Query
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ParameterValuesModal;
