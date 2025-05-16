import React, { useState } from 'react';
import { Button, Input, Select, Checkbox, Textarea } from '../ui';
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../icons';
import { QueryTemplateParameter } from '../../types/store';
import { extractParameters, findParameterPlaceholders } from '../../utils/parameterUtils';

interface ParameterEditorProps {
  parameters: QueryTemplateParameter[];
  onParametersChange: (parameters: QueryTemplateParameter[]) => void;
  sql: string;
}

const ParameterEditor: React.FC<ParameterEditorProps> = ({
  parameters,
  onParametersChange,
  sql,
}) => {
  const [newParamName, setNewParamName] = useState('');
  const [newParamType, setNewParamType] = useState<'string' | 'number' | 'boolean' | 'date'>('string');
  const [newParamDefault, setNewParamDefault] = useState('');
  const [newParamDesc, setNewParamDesc] = useState('');
  const [newParamRequired, setNewParamRequired] = useState(true);
  
  // SQL에서 사용된 파라미터 이름 목록
  const usedParameterNames = findParameterPlaceholders(sql);
  
  // 파라미터 추가 핸들러
  const handleAddParameter = () => {
    if (!newParamName.trim()) return;
    
    // 이미 존재하는 파라미터인지 확인
    if (parameters.some(p => p.name === newParamName.trim())) {
      alert('이미 존재하는 파라미터 이름입니다.');
      return;
    }
    
    // 파라미터 객체 생성
    const newParam: QueryTemplateParameter = {
      name: newParamName.trim(),
      type: newParamType,
      defaultValue: newParamDefault.trim() || undefined,
      description: newParamDesc.trim() || undefined,
      required: newParamRequired,
    };
    
    // 새 파라미터 배열 생성 및 업데이트
    onParametersChange([...parameters, newParam]);
    
    // 입력 필드 초기화
    setNewParamName('');
    setNewParamDefault('');
    setNewParamDesc('');
  };
  
  // 파라미터 제거 핸들러
  const handleRemoveParameter = (index: number) => {
    const newParams = [...parameters];
    newParams.splice(index, 1);
    onParametersChange(newParams);
  };
  
  // 파라미터 순서 변경 핸들러
  const handleMoveParameter = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === parameters.length - 1)
    ) {
      return;
    }
    
    const newParams = [...parameters];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // 파라미터 위치 교환
    [newParams[index], newParams[targetIndex]] = [newParams[targetIndex], newParams[index]];
    onParametersChange(newParams);
  };
  
  // 파라미터 업데이트 핸들러
  const handleUpdateParameter = (index: number, field: keyof QueryTemplateParameter, value: any) => {
    const newParams = [...parameters];
    newParams[index] = { ...newParams[index], [field]: value };
    onParametersChange(newParams);
  };
  
  // SQL에서 파라미터 자동 추출 핸들러
  const handleExtractParameters = () => {
    if (!sql.trim()) {
      alert('SQL 쿼리가 비어있습니다.');
      return;
    }
    
    const extractedParams = extractParameters(sql);
    
    if (extractedParams.length === 0) {
      alert('SQL 쿼리에서 파라미터를 찾을 수 없습니다. {{paramName:type:description}} 형식을 사용하세요.');
      return;
    }
    
    // 기존 파라미터와 병합 (이름 기준)
    const mergedParams = extractedParams.map(param => {
      const existing = parameters.find(p => p.name === param.name);
      return existing || param;
    });
    
    onParametersChange(mergedParams);
  };
  
  // 렌더링
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">쿼리 파라미터</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExtractParameters}
        >
          SQL에서 파라미터 추출
        </Button>
      </div>
      
      {/* 현재 파라미터 목록 */}
      {parameters.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  타입
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  기본값
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  설명
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  필수
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  SQL 사용
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  동작
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {parameters.map((param, index) => (
                <tr 
                  key={index}
                  className={`${
                    usedParameterNames.includes(param.name)
                      ? ''
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Input
                      size="sm"
                      value={param.name}
                      onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Select
                      size="sm"
                      value={param.type}
                      onChange={(e) => handleUpdateParameter(
                        index, 
                        'type', 
                        e.target.value as 'string' | 'number' | 'boolean' | 'date'
                      )}
                    >
                      <option value="string">문자열</option>
                      <option value="number">숫자</option>
                      <option value="boolean">불리언</option>
                      <option value="date">날짜</option>
                    </Select>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {param.type === 'boolean' ? (
                      <Select
                        size="sm"
                        value={param.defaultValue?.toString() || ''}
                        onChange={(e) => handleUpdateParameter(
                          index, 
                          'defaultValue', 
                          e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined
                        )}
                      >
                        <option value="">선택없음</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </Select>
                    ) : (
                      <Input
                        size="sm"
                        type={param.type === 'number' ? 'number' : param.type === 'date' ? 'date' : 'text'}
                        value={param.defaultValue !== undefined ? param.defaultValue : ''}
                        onChange={(e) => handleUpdateParameter(
                          index, 
                          'defaultValue', 
                          param.type === 'number' && e.target.value ? parseFloat(e.target.value) : e.target.value
                        )}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Input
                      size="sm"
                      value={param.description || ''}
                      onChange={(e) => handleUpdateParameter(index, 'description', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center">
                    <Checkbox
                      checked={param.required}
                      onChange={(e) => handleUpdateParameter(index, 'required', e.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center">
                    {usedParameterNames.includes(param.name) ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleMoveParameter(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUpIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleMoveParameter(index, 'down')}
                        disabled={index === parameters.length - 1}
                      >
                        <ArrowDownIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="danger"
                        onClick={() => handleRemoveParameter(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md">
          아직 파라미터가 없습니다. 아래에서 파라미터를 추가하세요.
        </div>
      )}
      
      {/* 새 파라미터 추가 폼 */}
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-medium mb-2">새 파라미터 추가</h4>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          <div className="md:col-span-2">
            <label htmlFor="newParamName" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <Input
              id="newParamName"
              size="sm"
              value={newParamName}
              onChange={(e) => setNewParamName(e.target.value)}
              placeholder="파라미터 이름"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="newParamType" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              타입
            </label>
            <Select
              id="newParamType"
              size="sm"
              value={newParamType}
              onChange={(e) => setNewParamType(e.target.value as any)}
            >
              <option value="string">문자열</option>
              <option value="number">숫자</option>
              <option value="boolean">불리언</option>
              <option value="date">날짜</option>
            </Select>
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="newParamDefault" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              기본값
            </label>
            {newParamType === 'boolean' ? (
              <Select
                id="newParamDefault"
                size="sm"
                value={newParamDefault}
                onChange={(e) => setNewParamDefault(e.target.value)}
              >
                <option value="">선택없음</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </Select>
            ) : (
              <Input
                id="newParamDefault"
                size="sm"
                type={newParamType === 'number' ? 'number' : newParamType === 'date' ? 'date' : 'text'}
                value={newParamDefault}
                onChange={(e) => setNewParamDefault(e.target.value)}
                placeholder="기본값 (선택사항)"
              />
            )}
          </div>
          
          <div className="md:col-span-4">
            <label htmlFor="newParamDesc" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              설명
            </label>
            <Input
              id="newParamDesc"
              size="sm"
              value={newParamDesc}
              onChange={(e) => setNewParamDesc(e.target.value)}
              placeholder="파라미터 설명 (선택사항)"
            />
          </div>
          
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              필수
            </label>
            <Checkbox
              checked={newParamRequired}
              onChange={(e) => setNewParamRequired(e.target.checked)}
            />
          </div>
          
          <div className="md:col-span-1">
            <label className="invisible block text-xs mb-1">
              추가
            </label>
            <Button
              color="primary"
              size="sm"
              onClick={handleAddParameter}
              disabled={!newParamName.trim()}
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* 도움말 */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
        <h4 className="font-medium text-sm mb-1">파라미터 형식 도움말</h4>
        <p className="mb-2">SQL 쿼리 내에서 다음과 같은 형식으로 파라미터를 사용할 수 있습니다:</p>
        <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
          {'{{paramName:type?defaultValue:description}}'}
        </pre>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li><strong>paramName</strong>: 파라미터 이름</li>
          <li><strong>type</strong>: string, number, boolean, date 중 하나</li>
          <li><strong>defaultValue</strong>: (선택사항) 기본값</li>
          <li><strong>description</strong>: (선택사항) 파라미터 설명</li>
        </ul>
        <p className="mt-2">예: <code>{'SELECT * FROM users WHERE user_id = {{userId:number:사용자 ID}}'}</code></p>
      </div>
    </div>
  );
};

export default ParameterEditor;