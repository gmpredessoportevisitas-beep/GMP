import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  button?: ReactNode;
}

export default function PageHeader({ title, subtitle, button }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-3 sm:mb-6 px-2 sm:px-0">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {button}
    </div>
  );
}
