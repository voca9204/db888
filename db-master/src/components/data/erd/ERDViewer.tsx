import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  Panel,
  MarkerType,
  NodeTypes,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';

// Types for schema data
interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
  foreign?: {
    table: string;
    column: string;
  };
}

interface Table {
  name: string;
  columns: TableColumn[];
}

interface SchemaData {
  tables: Record<string, Table>;
}

// Custom node component for tables
const TableNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-md shadow-md p-0 dark:bg-dark-500 dark:border-dark-600">
      <div className="bg-primary-600 text-white font-bold py-2 px-4 rounded-t-sm dark:bg-primary-800">
        {data.label}
      </div>
      <div className="p-0">
        {data.columns.map((column: TableColumn, index: number) => (
          <div 
            key={index} 
            className={`py-1 px-4 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-dark-400' : 'bg-white dark:bg-dark-500'} flex items-center`}
          >
            <div className="flex-1 truncate">
              <span className="font-mono text-sm">
                {column.name}
              </span>
            </div>
            <div className="text-gray-500 text-xs dark:text-gray-400 ml-2">
              {column.type}
            </div>
            <div className="ml-2 flex items-center space-x-1">
              {column.primary && (
                <span title="Primary Key" className="w-4 h-4 flex items-center justify-center bg-yellow-400 text-yellow-800 rounded-full text-xs font-bold">
                  P
                </span>
              )}
              {column.foreign && (
                <span title="Foreign Key" className="w-4 h-4 flex items-center justify-center bg-blue-400 text-blue-800 rounded-full text-xs font-bold">
                  F
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Define custom node types
const nodeTypes: NodeTypes = {
  table: TableNode,
};

// Props for ERDViewer component
interface ERDViewerProps {
  connectionId: string;
  schemaData: SchemaData | null;
  className?: string;
}

const ERDViewer: React.FC<ERDViewerProps> = ({
  connectionId,
  schemaData,
  className = ''
}) => {
  // Initial nodes and edges state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Generate graph data from schema
  useEffect(() => {
    if (!schemaData) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Create nodes from tables
      const graphNodes: Node[] = [];
      const tables = Object.values(schemaData.tables);
      
      // Arrange tables in a grid layout
      const gridCols = Math.ceil(Math.sqrt(tables.length));
      const gridSize = 350; // Space between tables
      
      tables.forEach((table, index) => {
        const col = index % gridCols;
        const row = Math.floor(index / gridCols);
        
        graphNodes.push({
          id: table.name,
          type: 'table',
          position: { x: col * gridSize, y: row * gridSize },
          data: {
            label: table.name,
            columns: table.columns,
          },
        });
      });
      
      // Create edges from foreign key relationships
      const graphEdges: Edge[] = [];
      
      tables.forEach(table => {
        table.columns.forEach(column => {
          if (column.foreign) {
            graphEdges.push({
              id: `${table.name}-${column.name}-${column.foreign.table}-${column.foreign.column}`,
              source: table.name,
              target: column.foreign.table,
              sourceHandle: column.name,
              targetHandle: column.foreign.column,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
              },
              style: {
                strokeWidth: 2,
                stroke: '#3182ce',
              },
              animated: true,
              label: `${column.name} → ${column.foreign.column}`,
              labelBgStyle: { fill: '#f0f9ff' },
              labelStyle: { fill: '#2563eb', fontWeight: 700 },
            });
          }
        });
      });
      
      setNodes(graphNodes);
      setEdges(graphEdges);
      setLoading(false);
    } catch (err) {
      console.error('Error generating ERD:', err);
      setError('Failed to generate ERD visualization.');
      setLoading(false);
    }
  }, [schemaData, setNodes, setEdges]);
  
  // Handle edge connection
  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );
  
  // Export diagram as image
  const exportDiagram = (type: 'png' | 'svg') => {
    // Implementation will be added later
    alert(`Export as ${type} will be implemented in a future release.`);
  };
  
  // If there's no connection or schema data, show a message
  if (!connectionId || !schemaData) {
    return (
      <div className={`bg-white rounded-md shadow-md p-6 dark:bg-dark-400 dark:text-white ${className}`}>
        <div className="text-center py-8">
          <p className="text-xl mb-2">No database schema available</p>
          <p className="text-gray-500 dark:text-gray-300">
            Connect to a database and select a schema to view the ERD.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-md shadow-md overflow-hidden h-[600px] ${className}`}>
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md max-w-md">
            <p className="font-medium">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Controls />
          <MiniMap 
            nodeStrokeWidth={3}
            zoomable 
            pannable
          />
          <Background color="#aaa" gap={16} />
          <Panel position="top-right">
            <div className="bg-white p-2 rounded shadow-md dark:bg-dark-400 flex space-x-2">
              <button
                onClick={() => exportDiagram('png')}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Export PNG
              </button>
              <button
                onClick={() => exportDiagram('svg')}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Export SVG
              </button>
            </div>
          </Panel>
        </ReactFlow>
      )}
    </div>
  );
};

export default ERDViewer;
