import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { zhCN } from './zh-CN';
import { enUS } from './en-US';

// 获取存储的语言设置或默认使用中文
const getStoredLanguage = (): string => {
  const stored = localStorage.getItem('app_language');
  return stored || 'zh-CN';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
