import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type AIStatus = 'online' | 'limited' | 'offline';

interface AIStatusContextType {
  status: AIStatus;
  updateStatus: (success: boolean) => void;
  resetStatus: () => void;
}

const AIStatusContext = createContext<AIStatusContextType | undefined>(undefined);

export const AIStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial status from localStorage if available
  const [status, setStatus] = useState<AIStatus>(() => {
    try {
      const stored = localStorage.getItem('medestudia_ai_status');
      if (stored === 'online' || stored === 'limited' || stored === 'offline') {
        return stored;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'online'; // Default to online
  });

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

      // Persist to localStorage
      try {
        localStorage.setItem('medestudia_ai_status', newStatus);
      } catch {
        // Ignore localStorage errors
      }

      return newStatus;
    });
  }, []);

  const resetStatus = useCallback(() => {
    setStatus('online');
    try {
      localStorage.setItem('medestudia_ai_status', 'online');
    } catch {
      // Ignore localStorage errors
    }
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

