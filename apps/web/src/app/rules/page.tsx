import LegalDocument from '@/components/legal/LegalDocument';
import { getRulesContent } from '@/i18n/legal';
import { getRequestLocale } from '@/lib/request-locale';

export default async function RulesPage() {
  const locale = await getRequestLocale();
  return <LegalDocument content={getRulesContent(locale)} />;
}
