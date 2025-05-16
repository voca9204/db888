import { create } from 'zustand';
import { logger, persist } from '../middleware';
import type { QueryResult } from '../../types/store';
import { v4 as uuidv4 } from 'uuid';

interface ResultsStore {
  // Current results
  currentResult: QueryResult | null;
  
  // Results history
  resultsHistory: QueryResult[];
  
  // Loading state
  loading: boolean;
  
  // Actions
  setCurrentResult: (result: QueryResult) => void;
  clearCurrentResult: () => void;
  addResultToHistory: (result: QueryResult) => void;
  clearResultHistory: () => void;
  setLoading: (loading: boolean) => void;
  loadResultFromHistory: (id: string) => void;
}

const useResultsStore = create<ResultsStore>()(
  logger(
    persist(
      (set, get) => ({
        currentResult: null,
        resultsHistory: [],
        loading: false,
        
        setCurrentResult: (result) => {
          // Generate ID if not already present
          const newResult: QueryResult = {
            ...result,
            id: result.id || uuidv4(),
            timestamp: result.timestamp || Date.now(),
          };
          
          set({
            currentResult: newResult,
            loading: false,
          });
          
          // Also add to history
          get().addResultToHistory(newResult);
        },
        
        clearCurrentResult: () => set({ currentResult: null }),
        
        addResultToHistory: (result) => set((state) => {
          // Don't add duplicate results to history
          if (state.resultsHistory.some(r => r.id === result.id)) {
            return state;
          }
          
          // Limit history to last 20 entries
          const history = [result, ...state.resultsHistory].slice(0, 20);
          
          return { resultsHistory: history };
        }),
        
        clearResultHistory: () => set({ resultsHistory: [] }),
        
        setLoading: (loading) => set({ loading }),
        
        loadResultFromHistory: (id) => {
          const { resultsHistory } = get();
          const historyItem = resultsHistory.find((item) => item.id === id);
          
          if (historyItem) {
            set({ currentResult: historyItem });
          }
        },
      }),
      { 
        name: 'query-results',
        partialize: (state) => ({
          // Only persist the results history, not the current result
          resultsHistory: state.resultsHistory.map(result => {
            // Limit stored rows to first 10 to save space
            return {
              ...result,
              rows: result.rows.slice(0, 10),
              rowCount: result.rowCount,
            };
          }).slice(0, 10), // Only store last 10 results
        }),
        version: 1
      }
    ),
    'resultsStore'
  )
);

export default useResultsStore;
