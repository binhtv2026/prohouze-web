/**
 * ProHouze Breadcrumb Component
 * Provides navigation context for users
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBreadcrumb } from '@/config/navigation';

export default function Breadcrumb({ 
  items = [], 
  showHome = true,
  className 
}) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs if not provided
  const breadcrumbItems = items.length > 0 
    ? items 
    : getBreadcrumb(location.pathname);

  if (breadcrumbItems.length === 0 && !showHome) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('flex items-center text-sm', className)}
    >
      <ol className="flex items-center gap-1">
        {/* Home */}
        {showHome && (
          <>
            <li>
              <Link
                to="/dashboard"
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Trang chủ"
              >
                <Home className="w-4 h-4" />
              </Link>
            </li>
            {breadcrumbItems.length > 0 && (
              <li>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </li>
            )}
          </>
        )}

        {/* Breadcrumb Items */}
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <React.Fragment key={item.path || index}>
              <li>
                {isLast ? (
                  <span className="text-slate-600 font-medium">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
              
              {!isLast && (
                <li>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// Utility to create breadcrumb items
export function createBreadcrumb(items) {
  return items.map(item => ({
    label: item.label,
    path: item.path,
  }));
}
