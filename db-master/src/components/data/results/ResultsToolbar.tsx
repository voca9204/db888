import React from 'react';
import { 
  Button,
  Input
} from '../../ui';
import { 
  ArrowDownTrayIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  FunnelIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export interface ResultsToolbarProps {
  onExport?: () => void;
  onCopy?: () => void;
  onRefresh?: () => void;
  onShowAllColumns?: () => void;
  onHideAllColumns?: () => void;
  onToggleFilters?: () => void;
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
  rowCount?: number;
  selectedCount?: number;
  filtersVisible?: boolean;
  isLoading?: boolean;
  enabledFeatures?: {
    export?: boolean;
    copy?: boolean;
    refresh?: boolean;
    columnVisibility?: boolean;
    search?: boolean;
    filters?: boolean;
  };
}

const ResultsToolbar: React.FC<ResultsToolbarProps> = ({
  onExport,
  onCopy,
  onRefresh,
  onShowAllColumns,
  onHideAllColumns,
  onToggleFilters,
  onSearch,
  searchTerm = '',
  rowCount = 0,
  selectedCount = 0,
  filtersVisible = false,
  isLoading = false,
  enabledFeatures = {
    export: true,
    copy: true,
    refresh: true,
    columnVisibility: true,
    search: true,
    filters: true
  }
}) => {
  return (
    <div className="flex flex-wrap justify-between items-center gap-2 py-2">
      <div className="flex items-center space-x-2">
        {enabledFeatures.export && onExport && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onExport}
            title="Export data"
            disabled={rowCount === 0 || isLoading}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
        )}
        
        {enabledFeatures.copy && onCopy && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onCopy}
            title="Copy to clipboard"
            disabled={rowCount === 0 || isLoading}
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            Copy
          </Button>
        )}
        
        {enabledFeatures.refresh && onRefresh && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onRefresh}
            title="Refresh data"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
        
        {enabledFeatures.columnVisibility && onShowAllColumns && onHideAllColumns && (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={onShowAllColumns}
              title="Show all columns"
              disabled={isLoading}
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              Show All
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              onClick={onHideAllColumns}
              title="Hide all columns"
              disabled={isLoading}
            >
              <EyeSlashIcon className="h-4 w-4 mr-1" />
              Hide All
            </Button>
          </>
        )}
        
        {enabledFeatures.filters && onToggleFilters && (
          <Button
            size="sm"
            variant={filtersVisible ? "primary" : "secondary"}
            onClick={onToggleFilters}
            title={filtersVisible ? "Hide filters" : "Show filters"}
            disabled={isLoading}
          >
            <FunnelIcon className="h-4 w-4 mr-1" />
            {filtersVisible ? 'Hide Filters' : 'Filters'}
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {rowCount > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedCount > 0 ? `${selectedCount} of ${rowCount} selected` : `${rowCount} rows`}
          </span>
        )}
        
        {enabledFeatures.search && onSearch && (
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search..."
            className="text-sm w-64"
            disabled={isLoading || rowCount === 0}
          />
        )}
      </div>
    </div>
  );
};

export default ResultsToolbar;