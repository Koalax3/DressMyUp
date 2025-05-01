import { useTranslation as useTranslationOriginal } from 'react-i18next';
import en from './locales/en.json';

// Type récursif pour gérer les clés imbriquées
type NestedKeys<T> = {
  [K in keyof T]: T[K] extends object
    ? `${K & string}.${NestedKeys<T[K]> & string}`
    : K;
}[keyof T];

// Type pour les clés de traduction
export type TxKeys = NestedKeys<typeof en>;

/**
 * Hook personnalisé pour utiliser i18n avec typage
 * @returns Outils de traduction i18n avec typage
 */
export const useTranslation = () => {
  const { t, i18n } = useTranslationOriginal();
  
  // Fonction de traduction typée
  const tx = (key: TxKeys, options?: Record<string, any>) => {
    return t(key as string, options);
  };

  return {
    t: tx,
    i18n
  };
};

export default useTranslation; 