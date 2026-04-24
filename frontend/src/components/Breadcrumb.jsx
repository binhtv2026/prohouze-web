/**
 * Breadcrumb Component
 * Uses module_registry.js as Single Source of Truth
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { getBreadcrumb, getModuleByPath } from '../config/module_registry';

export default function Breadcrumb() {
  const location = useLocation();
  const path = location.pathname;
  
  // Get breadcrumb items from registry
  const items = getBreadcrumb(path);
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <nav className="flex items-center text-sm text-gray-500 mb-4" data-testid="breadcrumb">
      <Link 
        to="/dashboard" 
        className="flex items-center hover:text-gray-700 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          {index === items.length - 1 ? (
            <span className="text-gray-900 font-medium">
              {item.label}
            </span>
          ) : (
            <Link 
              to={item.path} 
              className="hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/**
 * Page Title Hook
 * Updates document title based on current path
 */
export function usePageTitle() {
  const location = useLocation();
  
  React.useEffect(() => {
    const module = getModuleByPath(location.pathname);
    if (module) {
      const items = getBreadcrumb(location.pathname);
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        document.title = `${lastItem.label} | ${module.label} | ProHouze`;
      } else {
        document.title = `${module.label} | ProHouze`;
      }
    } else {
      document.title = 'ProHouze';
    }
  }, [location.pathname]);
}
