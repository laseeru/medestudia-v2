import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { translations } from './translations';

type Language = 'es' | 'en';


interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load language from localStorage or default to Spanish
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('medestudia_language');
      if (stored === 'es' || stored === 'en') {
        return stored;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'es'; // Default to Spanish (Spanish-first)
  });

  // Update language and persist to localStorage
  const updateLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('medestudia_language', lang);
    } catch {
      // Ignore localStorage errors
    }
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
