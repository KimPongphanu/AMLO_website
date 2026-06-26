// src/i18n/index.ts
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import thCommon from './locales/th/common.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'th', label: 'ไทย', flag: '/flags/th.svg' },
  { code: 'en', label: 'English', flag: '/flags/gb.svg' },
]

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      th: { common: thCommon },
      en: { common: enCommon },
    },
    defaultNS: 'common',
    fallbackLng: 'th',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

export default i18n
