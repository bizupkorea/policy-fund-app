import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string; // 회사명 + 연도 표시용
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {subtitle && (
            <div className="mb-3">
              <span className="inline-block px-4 py-2 bg-primary-500 text-white font-semibold text-lg rounded-lg">
                {subtitle}
              </span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          {description && (
            <p className="text-lg text-gray-600">{description}</p>
          )}
        </div>
        {actions && (
          <div className="ml-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
