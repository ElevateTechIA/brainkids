import pkg from '../../package.json';

export const APP_VERSION = pkg.version;
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME ?? '';

export function formatBuildDate(locale = 'es') {
  if (!BUILD_TIME) return '';
  try {
    return new Date(BUILD_TIME).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
