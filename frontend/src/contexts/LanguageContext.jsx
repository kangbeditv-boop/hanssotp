import { createContext, useContext, useState, useCallback } from 'react';
import id from '../i18n/id';
import en from '../i18n/en';

const languages = { id, en };
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'id');

  const t = useCallback(
    (key) => {
      const keys = key.split('.');
      let value = languages[lang];
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    },
    [lang]
  );

  function changeLang(newLang) {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  }

  return (
    <LanguageContext.Provider value={{ lang, t, changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
