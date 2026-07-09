import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import IntlProvider from '@/lib/i18n/IntlProvider';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { BrainKidsThemeProvider } from '@/lib/theme/ThemeProvider';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <IntlProvider locale={locale} messages={messages}>
      <AppRouterCacheProvider>
        <BrainKidsThemeProvider>{children}</BrainKidsThemeProvider>
      </AppRouterCacheProvider>
    </IntlProvider>
  );
}
