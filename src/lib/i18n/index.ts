import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translationEn from './locales/en-US.json';
import translationPt from './locales/pt-BR.json';

const resources = {
  'en-US': { translation: translationEn },
  'pt-BR': { translation: translationPt },
};

export const initI18n = async (): Promise<void> => {
  if (i18n.isInitialized) return;

  let savedLanguage = await AsyncStorage.getItem('language');

  if (!savedLanguage) {
    savedLanguage = 'en-US';
  }

  await i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: savedLanguage,
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
  });
};

export default i18n;
