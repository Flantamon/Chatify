import { useMemo } from 'react';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

const translations = {
  en,
  ru,
};

const useTranslation = (language = 'ru') => {
  const t = useMemo(() => {
    const currentTranslations = translations[language] || translations.ru;

    const translate = (key, params = {}) => {
      const keys = key.split('.');
      let value = currentTranslations;

      for (const k of keys) {
        value = value?.[k];
      }

      if (typeof value !== 'string') {
        return key; // Return key if translation not found
      }

      // Replace placeholders like {{name}} with actual values
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] || match;
      });
    };

    return translate;
  }, [language]);

  return { t };
};

export default useTranslation;
