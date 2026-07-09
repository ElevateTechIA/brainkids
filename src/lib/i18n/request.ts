import { getRequestConfig } from 'next-intl/server';
import { IntlErrorCode } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as 'es' | 'en' | 'pt' | 'fr')) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    timeZone: 'Europe/Paris',
    now: new Date(),
    messages: (await import(`../../../messages/${locale}.json`)).default,
    onError(error) {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[i18n] missing:', error.message);
        }
        return;
      }
      if (error.code === IntlErrorCode.ENVIRONMENT_FALLBACK) {
        return;
      }
      console.error(error);
    },
    getMessageFallback({ key, namespace }) {
      const path = [namespace, key].filter(Boolean).join('.');
      return path.split('.').pop() ?? path;
    },
  };
});
