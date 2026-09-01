import LegalDocument from '@/components/legal/LegalDocument';
import { getPrivacyContent } from '@/i18n/legal';
import { getRequestLocale } from '@/lib/request-locale';

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  return <LegalDocument content={getPrivacyContent(locale)} />;
}
