import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '../utils/navigationLogic';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigatePath: (path: string) => void;
  variant?: 'light' | 'dark';
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  onNavigatePath,
  variant = 'dark',
}) => {
  if (items.length <= 1) return null;

  const isDark = variant === 'dark';

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-1.5 text-xs font-medium ${
        isDark ? 'text-[#F2EBDD]/70' : 'text-[#1A1A1A]/65'
      }`}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && (
              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 ${
                  isDark ? 'text-[#F5B800]/70' : 'text-[#4C138E]/60'
                }`}
                aria-hidden="true"
              />
            )}
            {item.path && !isLast ? (
              <a
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigatePath(item.path!);
                }}
                className={`transition-colors ${
                  isDark ? 'hover:text-[#F5B800]' : 'hover:text-[#4C138E]'
                }`}
              >
                {item.label}
              </a>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                className={
                  isLast
                    ? isDark
                      ? 'text-[#F5B800] font-semibold'
                      : 'text-[#4C138E] font-semibold'
                    : undefined
                }
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
