import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Attendez la résolution des cookies
  const userCookies = await cookies();

  // Essayer de lire la langue à partir des cookies
  const locale = userCookies.get('lang')?.value || 'en'; // Par défaut 'en'

  // Vérifiez si la langue est supportée, sinon revenez à 'en'
  const supportedLocales = ['en', 'fr','ar'];
  const selectedLocale = supportedLocales.includes(locale) ? locale : 'en';

  // Charger les messages pour la langue sélectionnée
  const messages = (await import(`../../messages/${selectedLocale}.json`)).default;

  return {
    locale: selectedLocale,
    messages,
  };
});
