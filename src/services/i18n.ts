import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

import en from '../../locales/en.json';
import es from '../../locales/es.json';

const i18n = new I18n({
  en,
  es,
});

const getLocaleFromDevice = (): string => {
  try {
    const locales = Localization.getLocales();
    
    if (locales && locales.length > 0) {
      const localeCode = locales[0].languageCode;
      
      if (localeCode && typeof localeCode === 'string') {
        return localeCode.startsWith('es') ? 'es' : 'en';
      }
    }
    
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language.startsWith('es') ? 'es' : 'en';
    }
  } catch (error) {
    console.warn('Error getting locale:', error);
  }
  
  return 'en';
};

const deviceLocale = getLocaleFromDevice();
i18n.locale = deviceLocale; 
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

console.log('i18n initialized with locale:', i18n.locale);

export default i18n;