import React, { useState, useEffect, useRef } from 'react';
import { Button, Input } from '../../ui';
import useQueryStore from '../../../store/core/queryStore';
import { 
  DocumentDuplicateIcon, 
  PlayIcon, 
  PencilIcon, 
  ArrowPathIcon, 
  CheckIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { generateSqlQuery, validateSqlQuery } from '../../../utils/query';

interface SqlPreviewProps {
  connectionId: string;
}

const SqlPreview: React.FC<SqlPreviewProps> = ({ connectionId }) => {
  const { queryState, saveQueryToHistory } = useQueryStore();
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [editableSql, setEditableSql] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [queryName, setQueryName] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Reference to the textarea for focusing
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string | undefined>();
  
  // Generate SQL query based on the query state
  useEffect(() => {
    if (!queryState.selectedTable) {
      setSqlQuery('');
      setEditableSql('');
      return;
    }
    
    try {
      const sql = generateSqlQuery(queryState);
      setSqlQuery(sql);
      setEditableSql(sql);
      
      // Validate the generated SQL
      const { isValid, error } = validateSqlQuery(sql);
      setIsValid(isValid);
      setValidationError(error);
    } catch (error) {
      console.error('Error generating SQL:', error);
      setSqlQuery('-- Error generating SQL query');
      setEditableSql('-- Error generating SQL query');
      setIsValid(false);
      setValidationError('Error generating SQL query');
    }
  }, [queryState]);
  
  // Focus the textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);
  
  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editableSql : sqlQuery).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // Toggle edit mode
  const handleToggleEdit = () => {
    if (isEditing) {
      // Exit edit mode and reset editable SQL to generated SQL
      setIsEditing(false);
      setEditableSql(sqlQuery);
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };
  
  // Apply custom SQL edits
  const handleApplyEdits = () => {
    // In a more advanced implementation, this could parse the edited SQL
    // and update the query state accordingly
    setIsEditing(false);
  };
  
  // Regenerate SQL from query state
  const handleRegenerateSql = () => {
    try {
      const sql = generateSqlQuery(queryState);
      setSqlQuery(sql);
      setEditableSql(sql);
    } catch (error) {
      console.error('Error regenerating SQL:', error);
    }
  };
  
  // Open save dialog
  const handleSaveQuery = () => {
    setQueryName(`Query ${new Date().toLocaleString()}`);
    setShowSaveDialog(true);
  };
  
  // Save query to history
  const handleConfirmSave = () => {
    saveQueryToHistory(
      queryName || `Query ${new Date().toLocaleString()}`, 
      isEditing ? editableSql : sqlQuery
    );
    setShowSaveDialog(false);
    
    // Show confirmation message
    alert('Query saved to history!');
  };
  
  // Handle execute query (will be implemented later)
  const handleExecute = () => {
    setIsExecuting(true);
    
    // Simulate execution
    setTimeout(() => {
      setIsExecuting(false);
      alert('Query execution will be implemented in a future update');
      
      // Save to history
      saveQueryToHistory(
        `Query ${new Date().toLocaleString()}`, 
        isEditing ? editableSql : sqlQuery
      );
    }, 1000);
  };
  
  // Determine if query is valid for execution/saving
  const isQueryValid = (isEditing ? editableSql : sqlQuery).trim().length > 0;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          SQL Preview
        </h3>
        <div className="flex space-x-2">
          {/* Toggle edit button */}
          <Button
            size="sm"
            variant={isEditing ? "primary" : "secondary"}
            onClick={handleToggleEdit}
            disabled={!sqlQuery}
          >
            {isEditing ? (
              <>
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit SQL
              </>
            )}
          </Button>
          
          {/* Apply edits button (only visible in edit mode) */}
          {isEditing && (
            <Button
              size="sm"
              variant="success"
              onClick={handleApplyEdits}
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Apply
            </Button>
          )}
          
          {/* Regenerate button (only visible in edit mode) */}
          {isEditing && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRegenerateSql}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
          
          {/* Copy button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopy}
            disabled={!isQueryValid}
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          
          {/* Save button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSaveQuery}
            disabled={!isQueryValid}
          >
            Save
          </Button>
          
          {/* Execute button */}
          <Button
            size="sm"
            variant="primary"
            onClick={handleExecute}
            disabled={!isQueryValid || isExecuting}
          >
            {isExecuting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-1" />
                Execute
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* SQL display/editor */}
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-md ${isEditing ? 'p-0' : 'p-4'} font-mono text-sm`}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editableSql}
            onChange={(e) => {
              setEditableSql(e.target.value);
              // Validate the edited SQL
              const { isValid, error } = validateSqlQuery(e.target.value);
              setIsValid(isValid);
              setValidationError(error);
            }}
            className={`w-full h-40 p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y ${
              !isValid ? 'border-2 border-red-500' : ''
            }`}
            spellCheck={false}
          />
        ) : sqlQuery ? (
          <div className="overflow-x-auto">
            <pre className="whitespace-pre-wrap">{sqlQuery}</pre>
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 italic">
            Build your query using the options above to preview the SQL here.
          </div>
        )}
      </div>
      
      {/* Validation errors */}
      {!isValid && validationError && (
        <div className="text-red-500 text-sm mt-1">
          <span className="font-semibold">Error:</span> {validationError}
        </div>
      )}
      
      {/* Syntax helpers (in edit mode) */}
      {isEditing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setEditableSql(prev => prev + ' SELECT ')}
          >
            SELECT
          </Button>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setEditableSql(prev => prev + ' FROM ')}
          >
            FROM
          </Button>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setEditableSql(prev => prev + ' WHERE ')}
          >
            WHERE
          </Button>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setEditableSql(prev => prev + ' AND ')}
          >
            AND
          </Button>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setEditableSql(prev => prev + ' OR ')}
          >
            OR
          </Button>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setEditableSql(prev => prev + ' ORDER BY ')}
          >
            ORDER BY
          </Button>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setEditableSql(prev => prev + ' GROUP BY ')}
          >
            GROUP BY
          </Button>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setEditableSql(prev => prev + ' LIMIT ')}
          >
            LIMIT
          </Button>
        </div>
      )}
      
      {/* Save dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Save Query
            </h3>
            <div className="mb-4">
              <Input
                type="text"
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                placeholder="Enter query name"
                label="Query Name"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSave}
                disabled={!queryName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SqlPreview;