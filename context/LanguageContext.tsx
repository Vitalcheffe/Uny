/**
 * Language Context with IP-based auto-detection.
 *
 * Detects user location via IP geolocation and sets French for
 * African/francophone countries, English for everything else.
 * Users can override via localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n from '../lib/i18n';
import { useTranslation } from 'react-i18next';

type SupportedLanguage = 'en' | 'fr' | 'ar' | 'ary';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: ReturnType<typeof useTranslation>['t'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Countries where French is the default language
const FRENCH_COUNTRIES = new Set([
  'MA', // Morocco
  'FR', // France
  'DZ', // Algeria
  'TN', // Tunisia
  'SN', // Senegal
  'CI', // Ivory Coast
  'CM', // Cameroon
  'ML', // Mali
  'BF', // Burkina Faso
  'NE', // Niger
  'GN', // Guinea
  'TD', // Chad
  'CF', // Central African Republic
  'CG', // Congo
  'CD', // DRC
  'MG', // Madagascar
  'HT', // Haiti
  'BE', // Belgium
  'CH', // Switzerland
  'LU', // Luxembourg
  'MC', // Monaco
  'GA', // Gabon
  'KM', // Comoros
  'DJ', // Djibouti
  'BI', // Burundi
  'RW', // Rwanda
  'TG', // Togo
]);

/**
 * Detect language from IP geolocation.
 * Falls back to English on any error.
 */
async function detectLanguageFromIP(): Promise<SupportedLanguage> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const countryCode = data.country_code?.toUpperCase();

    if (countryCode && FRENCH_COUNTRIES.has(countryCode)) {
      return 'fr';
    }

    return 'en';
  } catch {
    // IP detection failed — default to English
    return 'en';
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [language, setLanguageState] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'en'
  );

  useEffect(() => {
    const initLanguage = async () => {
      // 1. Check saved preference first
      const savedLang = localStorage.getItem('uny_language') as SupportedLanguage;
      if (savedLang === 'en' || savedLang === 'fr' || savedLang === 'ar' || savedLang === 'ary') {
        i18n.changeLanguage(savedLang);
        setLanguageState(savedLang);
        return;
      }

      // 2. Detect from IP
      const detected = await detectLanguageFromIP();
      i18n.changeLanguage(detected);
      setLanguageState(detected);
      localStorage.setItem('uny_language', detected);
    };

    initLanguage();
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    setLanguageState(lang);
    localStorage.setItem('uny_language', lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
