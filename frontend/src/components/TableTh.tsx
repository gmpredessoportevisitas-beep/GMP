import { ReactNode } from 'react';

export default function TableTh({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider ${className}`}>{children}</th>;
}
