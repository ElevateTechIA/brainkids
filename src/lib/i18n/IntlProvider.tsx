'use client';

import { NextIntlClientProvider, IntlErrorCode, type AbstractIntlMessages } from 'next-intl';

export default function IntlProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Europe/Paris"
      onError={(error) => {
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
      }}
      getMessageFallback={({ key, namespace }) => {
        const path = [namespace, key].filter(Boolean).join('.');
        return path.split('.').pop() ?? path;
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
