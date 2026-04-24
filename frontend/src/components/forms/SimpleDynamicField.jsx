/**
 * SimpleDynamicField Component - Minimal version without complex components
 * To debug infinite loop issue
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { 
  Phone,
  Mail,
  Link as LinkIcon,
  DollarSign,
  Percent,
  Star,
} from 'lucide-react';
import { masterDataAPI } from '../../api/dynamicFormApi';

export const SimpleDynamicField = ({ 
  field, 
  value, 
  onChange, 
  errors = {}, 
  disabled = false,
}) => {
  const attribute = useMemo(() => field?.attribute || {}, [field]);
  const {
    code = '',
    name = '',
    data_type = 'string',
    required = false,
    readonly = false,
    placeholder = '',
    help_text = '',
    options: staticOptions = null,
    options_source = null,
    validation_rules = {},
  } = attribute;

  const [dynamicOptions, setDynamicOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load options from master data - run once per source
  useEffect(() => {
    let mounted = true;
    
    if (options_source && !staticOptions) {
      setLoadingOptions(true);
      masterDataAPI.lookup(options_source)
        .then(data => {
          if (mounted && Array.isArray(data)) {
            setDynamicOptions(data.map(item => ({
              value: item.code || item.value || '',
              label: item.label || item.label_vi || '',
              color: item.color || '',
            })).filter(opt => opt.value));
          }
        })
        .catch(() => {
          if (mounted) setDynamicOptions([]);
        })
        .finally(() => {
          if (mounted) setLoadingOptions(false);
        });
    }
    
    return () => { mounted = false; };
  }, [options_source, staticOptions]); // Only depend on option sources

  const fieldOptions = staticOptions || dynamicOptions;
  const error = errors[code];
  const isRequired = required;
  const isReadonly = readonly || disabled;
  const fieldId = `field-${code}`;

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (data_type) {
      case 'email': return 'email@example.com';
      case 'phone': return '0901234567';
      case 'url': return 'https://...';
      default: return `Nhập ${name?.toLowerCase() || ''}`;
    }
  };

  const handleChange = (newValue) => {
    onChange(code, newValue);
  };

  // Simple field rendering without complex components
  const renderField = () => {
    switch (data_type) {
      case 'string':
      case 'text':
        return data_type === 'text' ? (
          <Textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isReadonly}
            className={cn('min-h-[80px]', error && 'border-red-500')}
          />
        ) : (
          <Input
            id={fieldId}
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isReadonly}
            className={cn('h-10', error && 'border-red-500')}
          />
        );

      case 'number':
      case 'decimal':
      case 'currency':
      case 'percentage':
        const prefix = data_type === 'email' ? <Mail className="h-4 w-4" /> :
                      data_type === 'currency' ? <DollarSign className="h-4 w-4" /> : null;
        const suffix = data_type === 'percentage' ? <Percent className="h-4 w-4" /> : null;
        
        return (
          <div className="relative">
            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{prefix}</span>}
            <Input
              id={fieldId}
              type="number"
              value={value ?? ''}
              onChange={(e) => handleChange(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0"
              disabled={isReadonly}
              className={cn('h-10', prefix && 'pl-9', suffix && 'pr-9', error && 'border-red-500')}
              min={validation_rules?.min}
              max={validation_rules?.max}
              step={data_type === 'decimal' ? '0.01' : data_type === 'percentage' ? '0.1' : '1'}
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{suffix}</span>}
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
              onChange={(e) => handleChange(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isReadonly}
              className={cn('h-10 pl-9', error && 'border-red-500')}
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
              onChange={(e) => handleChange(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isReadonly}
              className={cn('h-10 pl-9', error && 'border-red-500')}
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
              onChange={(e) => handleChange(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isReadonly}
              className={cn('h-10 pl-9', error && 'border-red-500')}
            />
          </div>
        );

      case 'select':
        return (
          <Select
            value={value || undefined}
            onValueChange={(val) => handleChange(val === '__none__' ? null : val)}
            disabled={isReadonly || loadingOptions}
          >
            <SelectTrigger id={fieldId} className={cn('h-10', error && 'border-red-500')}>
              <SelectValue placeholder={loadingOptions ? 'Đang tải...' : 'Chọn...'} />
            </SelectTrigger>
            <SelectContent>
              {!isRequired && <SelectItem value="__none__">-- Chọn --</SelectItem>}
              {fieldOptions.map((opt, idx) => (
                <SelectItem key={`${opt.value}-${idx}`} value={opt.value}>
                  <div className="flex items-center gap-2">
                    {opt.color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color }} />}
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2 h-10">
            <Checkbox
              id={fieldId}
              checked={!!value}
              onCheckedChange={(checked) => handleChange(checked)}
              disabled={isReadonly}
            />
            <Label htmlFor={fieldId} className="cursor-pointer">{name}</Label>
          </div>
        );

      case 'date':
        return (
          <Input
            id={fieldId}
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isReadonly}
            className={cn('h-10', error && 'border-red-500')}
          />
        );

      case 'datetime':
        return (
          <Input
            id={fieldId}
            type="datetime-local"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isReadonly}
            className={cn('h-10', error && 'border-red-500')}
          />
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
                onClick={() => handleChange(i + 1)}
                className="focus:outline-none"
              >
                <Star className={cn('h-6 w-6', i < currentRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')} />
              </button>
            ))}
          </div>
        );

      default:
        return (
          <Input
            id={fieldId}
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isReadonly}
            className={cn('h-10', error && 'border-red-500')}
          />
        );
    }
  };

  if (data_type === 'boolean') {
    return (
      <div className="space-y-1">
        {renderField()}
        {help_text && <p className="text-xs text-gray-500">{help_text}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className="flex items-center gap-1">
        {name}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>
      {renderField()}
      {help_text && <p className="text-xs text-gray-500">{help_text}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default SimpleDynamicField;
