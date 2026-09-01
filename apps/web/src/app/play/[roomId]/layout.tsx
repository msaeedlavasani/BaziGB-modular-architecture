import type { ReactNode } from 'react';
import { privateRouteMetadata } from '@/lib/seo';

export const metadata = privateRouteMetadata;

export default function PlayLayout({ children }: { children: ReactNode }) {
  return children;
}
