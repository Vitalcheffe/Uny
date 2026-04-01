import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../lib/i18n';
import { useTranslation } from 'react-i18next';

type SupportedLanguage = 'en' | 'fr';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [language, setLanguageState] = useState<SupportedLanguage>(i18n.language as SupportedLanguage || 'en');

  useEffect(() => {
    const detectLanguage = async () => {
      // 1. Check saved language
      const savedLang = localStorage.getItem('uny_language') as SupportedLanguage;
      if (savedLang) {
        i18n.changeLanguage(savedLang);
        setLanguageState(savedLang);
        return;
      }

      // 2. IP-based detection
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const detectedLang: SupportedLanguage = (data.country_code === 'MA' || data.country_code === 'FR' || data.country_code === 'DZ' || data.country_code === 'TN') ? 'fr' : 'en';
        
        i18n.changeLanguage(detectedLang);
        setLanguageState(detectedLang);
        localStorage.setItem('uny_language', detectedLang);
      } catch (error) {
        console.error("Language detection failed:", error);
        // Fallback to i18next default (which is 'en')
      }
    };

    detectLanguage();
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    setLanguageState(lang);
    localStorage.setItem('uny_language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
