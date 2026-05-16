import i18n from 'i18next';
import { initReactI18next, useTranslation as useT } from 'react-i18next';
import * as Localization from 'expo-localization';
import ru from '../locales/ru.json';
import en from '../locales/en.json';

const lang = (Localization.getLocales()[0]?.languageCode === 'ru' ? 'ru' : 'en') as 'ru' | 'en';

i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru }, en: { translation: en } },
  lng: lang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v3',
});

export function setLanguage(l: 'ru' | 'en') {
  i18n.changeLanguage(l);
}

export function currentLang(): 'ru' | 'en' {
  return (i18n.language?.startsWith('ru') ? 'ru' : 'en');
}

export const useTranslation = useT;
export default i18n;
