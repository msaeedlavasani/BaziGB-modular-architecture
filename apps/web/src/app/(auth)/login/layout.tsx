import type { ReactNode } from 'react';
import { privateRouteMetadata } from '@/lib/seo';

export const metadata = privateRouteMetadata;

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
