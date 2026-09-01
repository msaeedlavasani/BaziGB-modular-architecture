import type { ReactNode } from 'react';
import { privateRouteMetadata } from '@/lib/seo';

export const metadata = privateRouteMetadata;

export default function LocalGameLayout({ children }: { children: ReactNode }) {
  return children;
}
