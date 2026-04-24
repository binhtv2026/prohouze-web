/**
 * DynamicField Component
 * Renders individual form fields based on attribute data type
 * 
 * Supports: string, number, select, multi_select, date, datetime, currency,
 *           email, phone, url, text, boolean, rating, color, percentage
 */

import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { 
  CalendarIcon, 
  Star, 
  X, 
  ChevronDown,
  Phone,
  Mail,
  Link as LinkIcon,
  DollarSign,
  Percent,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { masterDataAPI } from '../../api/dynamicFormApi';

/**
 * DynamicField - Renders a single form field based on attribute type
 * 
 * @param {object} field - Field definition from form schema
 * @param {any} value - Current value
 * @param {function} onChange - Callback when value changes
 * @param {object} errors - Validation errors
 * @param {boolean} disabled - Disable field
 */
export const DynamicField = ({ 
  field, 
  value, 
  onChange, 
  errors = {}, 
  disabled = false,
  className = ''
}) => {
  const attribute = field.attribute || {};
  const {
    code,
    name,
    data_type,
    required,
    readonly,
    placeholder,
    help_text,
    options: staticOptions,
    options_source,
    validation_rules = {},
  } = attribute;

  const [dynamicOptions, setDynamicOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadAttempted, setLoadAttempted] = useState(false);

  // Load options from master data if options_source is specified
  useEffect(() => {
    // Only load if we have a source, no static options, and haven't tried yet
    if (options_source && !staticOptions && !loadAttempted) {
      setLoadAttempted(true);
      setLoadingOptions(true);
      
      masterDataAPI.lookup(options_source)
        .then(data => {
          if (Array.isArray(data)) {
            setDynamicOptions(data.map(item => ({
              value: item.code || item.value,
              label: item.label || item.label_vi || item.item_label,
              color: item.color || item.color_code,
            })));
          }
        })
        .catch(error => {
          console.error('Error loading options for', options_source, ':', error.message);
          setDynamicOptions([]);
        })
        .finally(() => {
          setLoadingOptions(false);
        });
    }
  }, [options_source, staticOptions, loadAttempted]);

  const fieldOptions = staticOptions || dynamicOptions;
  const error = errors[code];
  const isRequired = required;
  const isReadonly = readonly || disabled;
  const fieldId = `field-${code}`;

  // Get effective placeholder
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (data_type) {
      case 'email': return 'email@example.com';
      case 'phone': return '0901234567';
      case 'url': return 'https://...';
      case 'currency': return '0';
      case 'number': return '0';
      case 'date': return 'Chọn ngày';
      case 'datetime': return 'Chọn ngày giờ';
      default: return `Nhập ${name?.toLowerCase() || ''}`;
    }
  };

  // Render different field types
  const renderField = () => {
    switch (data_type) {
      case 'string':
        return (
          <div className="relative">
            <Input
              id={fieldId}
              type="text"
              value={value || ''}
              onChange={(e) => onChange(code, e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isReadonly}
              className={cn(
                'h-10',
                error && 'border-red-500 focus:ring-red-500'
              )}
              maxLength={validation_rules?.max_length}
            />
          </div>
        );

      case 'text':
        return (
          <Textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => onChange(code, e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isReadonly}
            className={cn(
              'min-h-[100px]',
              error && 'border-red-500 focus:ring-red-500'
            )}
            maxLength={validation_rules?.max_length}
          />
        );

      case 'number':
      case 'decimal':
        return (
          <Input
            id={fieldId}
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(code, e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={getPlaceholder()}
            disabled={isReadonly}
            className={cn(
              'h-10',
              error && 'border-red-500 focus:ring-red-500'
            )}
            min={validation_rules?.min}
            max={validation_rules?.max}
            step={data_type === 'decimal' ? '0.01' : '1'}
          />
        );

      case 'currency':
        return (
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id={fieldId}
              type="number"
              value={value ?? ''}
              onChange={(e) => onChange(code, e.target.value ? parseFloat(e.target.value) : null)}
              placeholder={getPlaceholder()}
              disabled={isReadonly}
              className={cn(
                'h-10 pl-9',
                error && 'border-red-500 focus:ring-red-500'
              )}
              min={0}
              step="1000"
            />
          </div>
        );

      case 'percentage':
        return (
          <div className="relative">
            <Input
              id={fieldId}
              type="number"
              value={value ?? ''}
              onChange={(e) => onChange(code, e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0"
              disabled={isReadonly}
              className={cn(
                'h-10 pr-9',
                error && 'border-red-500 focus:ring-red-500'
              )}
              min={0}
              max={100}
              step="0.1"
            />
            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        );

      case 'email':
        return (
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id={fieldId}
              type="email"
              value={value || ''}
              onChange={(e) => onChange(code, e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isReadonly}
              className={cn(
                'h-10 pl-9',
                error && 'border-red-500 focus:ring-red-500'
              )}
            />
          </div>
        );

      case 'phone':
        return (
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id={fieldId}
              type="tel"
              value={value || ''}
              onChange={(e) => onChange(code, e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isReadonly}
              className={cn(
                'h-10 pl-9',
                error && 'border-red-500 focus:ring-red-500'
              )}
            />
          </div>
        );

      case 'url':
        return (
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id={fieldId}
              type="url"
              value={value || ''}
              onChange={(e) => onChange(code, e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isReadonly}
              className={cn(
                'h-10 pl-9',
                error && 'border-red-500 focus:ring-red-500'
              )}
            />
          </div>
        );

      case 'select':
        return (
          <Select
            value={value || undefined}
            onValueChange={(val) => onChange(code, val === '__empty__' ? '' : val)}
            disabled={isReadonly || loadingOptions}
          >
            <SelectTrigger 
              id={fieldId}
              className={cn(
                'h-10',
                error && 'border-red-500 focus:ring-red-500'
              )}
            >
              <SelectValue placeholder={loadingOptions ? 'Đang tải...' : getPlaceholder()} />
            </SelectTrigger>
            <SelectContent>
              {!isRequired && (
                <SelectItem value="__empty__">-- Chọn --</SelectItem>
              )}
              {fieldOptions.map((opt) => (
                <SelectItem key={opt.value || `opt-${opt.label}`} value={opt.value || `opt-${opt.label}`}>
                  <div className="flex items-center gap-2">
                    {opt.color && (
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: opt.color }} 
                      />
                    )}
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multi_select':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={isReadonly || loadingOptions}
                  className={cn(
                    'w-full justify-between h-auto min-h-10 font-normal',
                    error && 'border-red-500',
                    !selectedValues.length && 'text-muted-foreground'
                  )}
                >
                  <div className="flex flex-wrap gap-1">
                    {selectedValues.length > 0 ? (
                      selectedValues.map((val) => {
                        const opt = fieldOptions.find(o => o.value === val);
                        return (
                          <Badge 
                            key={val} 
                            variant="secondary"
                            className="mr-1 mb-1"
                            style={{ backgroundColor: opt?.color ? `${opt.color}20` : undefined }}
                          >
                            {opt?.label || val}
                            <button
                              className="ml-1 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                onChange(code, selectedValues.filter(v => v !== val));
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })
                    ) : (
                      <span>{loadingOptions ? 'Đang tải...' : 'Chọn nhiều...'}</span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2" align="start">
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {fieldOptions.map((opt) => {
                    const isSelected = selectedValues.includes(opt.value);
                    return (
                      <div
                        key={opt.value}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100',
                          isSelected && 'bg-blue-50'
                        )}
                        onClick={() => {
                          if (isSelected) {
                            onChange(code, selectedValues.filter(v => v !== opt.value));
                          } else {
                            onChange(code, [...selectedValues, opt.value]);
                          }
                        }}
                      >
                        <Checkbox checked={isSelected} />
                        {opt.color && (
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: opt.color }} 
                          />
                        )}
                        <span>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2 h-10">
            <Checkbox
              id={fieldId}
              checked={!!value}
              onCheckedChange={(checked) => onChange(code, checked)}
              disabled={isReadonly}
            />
            <Label htmlFor={fieldId} className="cursor-pointer">
              {name}
            </Label>
          </div>
        );

      case 'date':
        // Safe date parsing
        let dateValue = null;
        try {
          if (value) {
            dateValue = typeof value === 'string' ? parseISO(value) : value;
          }
        } catch (e) {
          dateValue = null;
        }
        
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                type="button"
                disabled={isReadonly}
                className={cn(
                  'w-full justify-start text-left font-normal h-10',
                  !value && 'text-muted-foreground',
                  error && 'border-red-500'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, 'dd/MM/yyyy', { locale: vi }) : getPlaceholder()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue || undefined}
                onSelect={(date) => onChange(code, date ? format(date, 'yyyy-MM-dd') : null)}
                locale={vi}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'datetime':
        // Safe datetime parsing
        let dtValue = null;
        try {
          if (value) {
            dtValue = typeof value === 'string' ? parseISO(value) : value;
          }
        } catch (e) {
          dtValue = null;
        }
        
        return (
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isReadonly}
                  className={cn(
                    'flex-1 justify-start text-left font-normal h-10',
                    !value && 'text-muted-foreground',
                    error && 'border-red-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dtValue ? format(dtValue, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dtValue || undefined}
                  onSelect={(date) => {
                    const currentTime = dtValue ? format(dtValue, 'HH:mm') : '00:00';
                    onChange(code, date ? `${format(date, 'yyyy-MM-dd')}T${currentTime}` : null);
                  }}
                  locale={vi}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <div className="relative w-28">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="time"
                value={dtValue ? format(dtValue, 'HH:mm') : ''}
                onChange={(e) => {
                  const currentDate = dtValue ? format(dtValue, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                  onChange(code, `${currentDate}T${e.target.value}`);
                }}
                disabled={isReadonly}
                className="h-10 pl-9"
              />
            </div>
          </div>
        );

      case 'time':
        return (
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id={fieldId}
              type="time"
              value={value || ''}
              onChange={(e) => onChange(code, e.target.value)}
              disabled={isReadonly}
              className={cn(
                'h-10 pl-9',
                error && 'border-red-500 focus:ring-red-500'
              )}
            />
          </div>
        );

      case 'rating':
        const maxRating = validation_rules?.max || 5;
        const currentRating = value || 0;
        return (
          <div className="flex gap-1 items-center h-10">
            {[...Array(maxRating)].map((_, i) => (
              <button
                key={i}
                type="button"
                disabled={isReadonly}
                onClick={() => onChange(code, i + 1)}
                className="focus:outline-none"
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    i < currentRating 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300 hover:text-yellow-300'
                  )}
                />
              </button>
            ))}
            {currentRating > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                {currentRating}/{maxRating}
              </span>
            )}
          </div>
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              id={fieldId}
              value={value || '#000000'}
              onChange={(e) => onChange(code, e.target.value)}
              disabled={isReadonly}
              className="h-10 w-10 rounded border cursor-pointer"
            />
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(code, e.target.value)}
              placeholder="#000000"
              disabled={isReadonly}
              className="h-10 flex-1 font-mono"
              maxLength={7}
            />
          </div>
        );

      default:
        return (
          <Input
            id={fieldId}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(code, e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isReadonly}
            className={cn(
              'h-10',
              error && 'border-red-500 focus:ring-red-500'
            )}
          />
        );
    }
  };

  // Don't render label for boolean type (handled inline)
  if (data_type === 'boolean') {
    return (
      <div className={cn('space-y-1', className)}>
        {renderField()}
        {help_text && (
          <p className="text-xs text-gray-500">{help_text}</p>
        )}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={fieldId} className="flex items-center gap-1">
        {name}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>
      {renderField()}
      {help_text && (
        <p className="text-xs text-gray-500">{help_text}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default DynamicField;
