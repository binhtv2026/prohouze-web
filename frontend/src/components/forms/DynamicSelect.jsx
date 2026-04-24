/**
 * ProHouze Dynamic Select Component
 * Version: 1.0 - Prompt 3/20
 * 
 * A select component that automatically fetches options from master data.
 * Drop-in replacement for hardcoded select options.
 */

import React from 'react';
import { useMasterData } from '@/hooks/useDynamicData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

/**
 * DynamicSelect - Select component with options from master data
 * 
 * @param {string} source - Master data category key (e.g., 'lead_statuses')
 * @param {string} value - Current value
 * @param {Function} onValueChange - Change handler
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disabled state
 * @param {boolean} showColor - Show color badge for options
 * @param {string} className - Additional CSS classes
 * @param {string} testId - Test ID for testing
 */
export function DynamicSelect({
  source,
  value,
  onValueChange,
  placeholder = 'Chọn...',
  disabled = false,
  showColor = false,
  className = '',
  testId,
  ...props
}) {
  const { items, loading, getColor, getLabel } = useMasterData(source);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 h-10 px-3 border rounded-md bg-slate-50 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-400">Đang tải...</span>
      </div>
    );
  }

  return (
    <Select
      value={value || ''}
      onValueChange={onValueChange}
      disabled={disabled}
      {...props}
    >
      <SelectTrigger className={className} data-testid={testId}>
        <SelectValue placeholder={placeholder}>
          {value && showColor ? (
            <Badge className={getColor(value)}>
              {getLabel(value)}
            </Badge>
          ) : (
            value ? getLabel(value) : placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.code} value={item.code}>
            {showColor && item.color ? (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color.split(' ')[0]}`} />
                {item.label}
              </div>
            ) : (
              item.label
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * DynamicFilterSelect - Select with "All" option for filters
 */
export function DynamicFilterSelect({
  source,
  value,
  onValueChange,
  placeholder = 'Tất cả',
  allLabel = 'Tất cả',
  disabled = false,
  className = '',
  testId,
  ...props
}) {
  const { items, loading, getLabel } = useMasterData(source);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 h-10 px-3 border rounded-md bg-slate-50 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <Select
      value={value || 'all'}
      onValueChange={(v) => onValueChange(v === 'all' ? '' : v)}
      disabled={disabled}
      {...props}
    >
      <SelectTrigger className={className} data-testid={testId}>
        <SelectValue placeholder={placeholder}>
          {value ? getLabel(value) : allLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {items.map((item) => (
          <SelectItem key={item.code} value={item.code}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * StatusBadge - Display a status with color from master data
 */
export function StatusBadge({ source, code, className = '' }) {
  const { getLabel, getColor } = useMasterData(source);
  
  return (
    <Badge className={`${getColor(code)} ${className}`}>
      {getLabel(code)}
    </Badge>
  );
}

/**
 * SourceBadge - Display a source/channel badge
 */
export function SourceBadge({ code, className = '' }) {
  const { getLabel, getItem } = useMasterData('lead_sources');
  const item = getItem(code);
  
  return (
    <Badge variant="outline" className={`text-slate-600 ${className}`}>
      {item?.label || code}
    </Badge>
  );
}

/**
 * Hook to get status utilities for a specific source
 */
export function useStatusHelpers(source) {
  const { getLabel, getColor, getItem, items } = useMasterData(source);
  
  return {
    getStatusLabel: getLabel,
    getStatusColor: getColor,
    getStatusItem: getItem,
    statuses: items,
  };
}

export default DynamicSelect;
