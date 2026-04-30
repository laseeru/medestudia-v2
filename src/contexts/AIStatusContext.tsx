import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type AIStatus = 'online' | 'limited' | 'offline';

interface AIStatusContextType {
  status: AIStatus;
  updateStatus: (success: boolean) => void;
  resetStatus: () => void;
}

const AIStatusContext = createContext<AIStatusContextType | undefined>(undefined);

export const AIStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Start fresh each load to avoid stale offline badges from previous failures.
  const [status, setStatus] = useState<AIStatus>('online');

  const updateStatus = useCallback((success: boolean) => {
    setStatus((prev) => {
      let newStatus: AIStatus;
      
      if (success) {
        // Success: always set to online
        newStatus = 'online';
      } else {
        // Failure: degrade status
        if (prev === 'online') {
          newStatus = 'limited';
        } else {
          newStatus = 'offline';
        }
      }

      return newStatus;
    });
  }, []);

  const resetStatus = useCallback(() => {
    setStatus('online');
  }, []);

  return (
    <AIStatusContext.Provider value={{ status, updateStatus, resetStatus }}>
      {children}
    </AIStatusContext.Provider>
  );
};

export const useAIStatus = () => {
  const context = useContext(AIStatusContext);
  if (!context) {
    throw new Error('useAIStatus must be used within an AIStatusProvider');
  }
  return context;
};

