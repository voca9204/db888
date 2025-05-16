import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Layout components
import MainLayout from '@/components/layouts/MainLayout'

// Pages
const Dashboard = () => <div>Dashboard Page</div>
const Connections = () => <div>Connections Page</div>
const TableBrowser = () => <div>Table Browser Page</div>
const QueryBuilder = () => <div>Query Builder Page</div>
const QueryTemplates = () => <div>Query Templates Page</div>
const ERDVisualizer = () => <div>ERD Visualizer Page</div>
const Settings = () => <div>Settings Page</div>
const NotFound = () => <div>Not Found Page</div>

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="connections" element={<Connections />} />
            <Route path="table-browser" element={<TableBrowser />} />
            <Route path="query-builder" element={<QueryBuilder />} />
            <Route path="query-templates" element={<QueryTemplates />} />
            <Route path="erd" element={<ERDVisualizer />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
