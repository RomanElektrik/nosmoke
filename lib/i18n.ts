import i18n from 'i18next';
import { initReactI18next, useTranslation as useT } from 'react-i18next';
import ru from '../locales/ru.json';

// 🔴 Приложение — ТОЛЬКО русское (доступно только в РФ, требование entitlement
// внешней оплаты). Английский язык убран везде: экрана выбора языка нет,
// переключателя в профиле нет, локаль устройства не читается. i18n намертво
// на русском, поэтому любая ветка `lang === 'en'` в коде рендерит русский, а
// каждый t() берёт строку из ru.json. en.json не подключён.
i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru } },
  lng: 'ru',
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v3',
});

// Сигнатуру оставляем (её зовёт _layout при старте), но язык не меняем: русский —
// единственный. Так старые вызовы не ломаются, а английский недостижим.
export function setLanguage(_l?: 'ru' | 'en') {
  if (i18n.language !== 'ru') i18n.changeLanguage('ru');
}

// Тип оставляем union: по коду всюду встречаются сравнения `lang === 'en'`
// (двуязычные тернарники). Сузь мы тип до 'ru' — они бы стали ошибками
// компиляции. Значение всегда 'ru', поэтому такие ветки просто не выполняются.
export function currentLang(): 'ru' | 'en' {
  return 'ru';
}

export const useTranslation = useT;
export default i18n;
