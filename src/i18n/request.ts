import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import viMessages from '../../messages/vi.json';
import enMessages from '../../messages/en.json';

export default getRequestConfig(async () => {
  // Get locale from cookie or default to 'vi'
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'vi';

  // Use explicit imports instead of dynamic import
  const messages = locale === 'en' ? enMessages : viMessages;

  return {
    locale,
    messages,
    timeZone: 'Asia/Ho_Chi_Minh', // Add timezone configuration for Vietnam
    now: new Date() // Provide current time
  };
});
