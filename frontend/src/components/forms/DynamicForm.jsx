/**
 * ProHouze Dynamic Form Component
 * Version: 1.0 - Prompt 3/20
 * 
 * Renders forms dynamically based on entity schema configuration.
 * Supports all field types defined in the schema system.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useFormConfig, useMasterData } from '@/hooks/useDynamicData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// FIELD RENDERERS
// ============================================

/**
 * Render a text input field
 */
function TextField({ field, value, onChange, disabled }) {
  return (
    <Input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled || field.readonly}
      data-testid={`field-${field.key}`}
    />
  );
}

/**
 * Render a textarea field
 */
function TextareaField({ field, value, onChange, disabled }) {
  return (
    <Textarea
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled || field.readonly}
      rows={4}
      data-testid={`field-${field.key}`}
    />
  );
}

/**
 * Render a number input field
 */
function NumberField({ field, value, onChange, disabled }) {
  return (
    <Input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value ? Number(e.target.value) : null)}
      placeholder={field.placeholder}
      disabled={disabled || field.readonly}
      min={field.validation?.min}
      max={field.validation?.max}
      data-testid={`field-${field.key}`}
    />
  );
}

/**
 * Render a currency input field
 */
function CurrencyField({ field, value, onChange, disabled }) {
  const formatCurrency = (num) => {
    if (!num) return '';
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const parseCurrency = (str) => {
    if (!str) return null;
    return parseInt(str.replace(/[^\d]/g, ''), 10) || null;
  };

  const [displayValue, setDisplayValue] = useState(formatCurrency(value));

  useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);

  return (
    <div className="relative">
      <Input
        type="text"
        value={displayValue}
        onChange={(e) => {
          setDisplayValue(e.target.value);
          onChange(field.key, parseCurrency(e.target.value));
        }}
        placeholder={field.placeholder || '0'}
        disabled={disabled || field.readonly}
        className="pr-12"
        data-testid={`field-${field.key}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
        VND
      </span>
    </div>
  );
}

/**
 * Render a date input field
 */
function DateField({ field, value, onChange, disabled }) {
  return (
    <Input
      type="date"
      value={value ? value.split('T')[0] : ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      disabled={disabled || field.readonly}
      data-testid={`field-${field.key}`}
    />
  );
}

/**
 * Render a datetime input field
 */
function DateTimeField({ field, value, onChange, disabled }) {
  return (
    <Input
      type="datetime-local"
      value={value ? value.slice(0, 16) : ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      disabled={disabled || field.readonly}
      data-testid={`field-${field.key}`}
    />
  );
}

/**
 * Render a select field with options from master data
 */
function SelectField({ field, value, onChange, disabled }) {
  const source = field.options?.source;
  const staticItems = field.options?.items;
  
  // Use master data if source is specified, otherwise use static items
  const { items: masterItems, loading } = useMasterData(source || '');
  
  const options = source ? masterItems : (staticItems || []);

  if (loading && source) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-slate-50">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-400">Đang tải...</span>
      </div>
    );
  }

  return (
    <Select
      value={value || ''}
      onValueChange={(v) => onChange(field.key, v)}
      disabled={disabled || field.readonly}
    >
      <SelectTrigger data-testid={`field-${field.key}`}>
        <SelectValue placeholder={field.placeholder || 'Chọn...'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.code || opt.value} value={opt.code || opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Render a phone input field
 */
function PhoneField({ field, value, onChange, disabled }) {
  return (
    <Input
      type="tel"
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder || '0901234567'}
      disabled={disabled || field.readonly}
      data-testid={`field-${field.key}`}
    />
  );
}

/**
 * Render an email input field
 */
function EmailField({ field, value, onChange, disabled }) {
  return (
    <Input
      type="email"
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder || 'email@example.com'}
      disabled={disabled || field.readonly}
      data-testid={`field-${field.key}`}
    />
  );
}

/**
 * Render a boolean/switch field
 */
function BooleanField({ field, value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={value || false}
        onCheckedChange={(checked) => onChange(field.key, checked)}
        disabled={disabled || field.readonly}
        data-testid={`field-${field.key}`}
      />
      <span className="text-sm text-slate-600">{value ? 'Có' : 'Không'}</span>
    </div>
  );
}

/**
 * Render a tags input field
 */
function TagsField({ field, value, onChange, disabled }) {
  const [inputValue, setInputValue] = useState('');
  const tags = value || [];

  const addTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onChange(field.key, [...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(field.key, tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="Nhập tag..."
          disabled={disabled || field.readonly}
          className="flex-1"
          data-testid={`field-${field.key}`}
        />
        <Button type="button" variant="outline" onClick={addTag} disabled={disabled}>
          Thêm
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {tag}
              {!disabled && !field.readonly && (
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// FIELD RENDERER MAPPING
// ============================================

const FIELD_RENDERERS = {
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  currency: CurrencyField,
  date: DateField,
  datetime: DateTimeField,
  select: SelectField,
  phone: PhoneField,
  email: EmailField,
  boolean: BooleanField,
  tags: TagsField,
  multi_select: SelectField, // Can be enhanced for multi-select
  url: TextField,
  rich_text: TextareaField, // Can be enhanced with rich text editor
  address: TextareaField,
  user_picker: SelectField, // Would need user data source
  entity_relation: SelectField, // Would need entity data source
  file: TextField, // Would need file upload component
  image: TextField, // Would need image upload component
  hidden: () => null,
  rating: NumberField, // Would need star rating component
};

// ============================================
// DYNAMIC FIELD COMPONENT
// ============================================

/**
 * Renders a single field based on its type
 */
function DynamicField({ field, value, onChange, disabled, errors }) {
  const FieldRenderer = FIELD_RENDERERS[field.type] || TextField;
  const isRequired = field.flags?.includes('required');
  const error = errors?.[field.key];

  return (
    <div className="space-y-1.5">
      <Label 
        htmlFor={field.key}
        className={cn(
          "text-sm font-medium",
          isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}
      >
        {field.label}
      </Label>
      <FieldRenderer
        field={field}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {field.help_text && (
        <p className="text-xs text-slate-500">{field.help_text}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

// ============================================
// DYNAMIC FORM SECTION
// ============================================

/**
 * Renders a form section with its fields
 */
function FormSection({ section, values, onChange, disabled, errors, initialCollapsed }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  if (!section.fields || section.fields.length === 0) return null;

  return (
    <Card className="border-slate-200">
      <CardHeader 
        className={cn(
          "py-3",
          section.collapsible && "cursor-pointer"
        )}
        onClick={() => section.collapsible && setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-slate-900">
            {section.label}
          </CardTitle>
          {section.collapsible && (
            collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
          )}
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field) => (
              <div 
                key={field.key}
                className={cn(
                  field.type === 'textarea' || field.type === 'rich_text' || field.type === 'tags'
                    ? 'md:col-span-2'
                    : ''
                )}
              >
                <DynamicField
                  field={field}
                  value={values[field.key]}
                  onChange={onChange}
                  disabled={disabled}
                  errors={errors}
                />
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ============================================
// MAIN DYNAMIC FORM COMPONENT
// ============================================

/**
 * DynamicForm - Main form component that renders based on entity schema
 * 
 * @param {string} entity - Entity name (e.g., 'lead', 'task')
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit handler (values) => void
 * @param {Function} onChange - Optional change handler (key, value) => void
 * @param {boolean} loading - Loading state
 * @param {Object} errors - Field errors { fieldKey: errorMessage }
 * @param {boolean} disabled - Disable all fields
 * @param {string} submitLabel - Submit button label
 * @param {boolean} showCancel - Show cancel button
 * @param {Function} onCancel - Cancel handler
 */
export default function DynamicForm({
  entity,
  initialValues = {},
  onSubmit,
  onChange: externalOnChange,
  loading: externalLoading,
  errors = {},
  disabled = false,
  submitLabel = 'Lưu',
  showCancel = false,
  onCancel,
}) {
  const { formConfig, loading: configLoading } = useFormConfig(entity);
  const [values, setValues] = useState(initialValues);

  // Update values when initialValues change
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  // Apply default values from schema
  useEffect(() => {
    if (formConfig && Object.keys(initialValues).length === 0) {
      const defaults = {};
      formConfig.sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.default_value !== undefined && field.default_value !== null) {
            defaults[field.key] = field.default_value;
          }
        });
      });
      if (Object.keys(defaults).length > 0) {
        setValues(prev => ({ ...defaults, ...prev }));
      }
    }
  }, [formConfig, initialValues]);

  const handleChange = (key, value) => {
    setValues(prev => ({ ...prev, [key]: value }));
    externalOnChange?.(key, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#316585]" />
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="text-center py-12 text-slate-500">
        Không tìm thấy cấu hình form cho entity: {entity}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid={`dynamic-form-${entity}`}>
      {formConfig.sections.map((section) => (
        <FormSection
          key={section.key}
          section={section}
          values={values}
          onChange={handleChange}
          disabled={disabled || externalLoading}
          errors={errors}
          initialCollapsed={section.collapsed_by_default}
        />
      ))}

      <div className="flex items-center justify-end gap-3 pt-4">
        {showCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={externalLoading}
          >
            Hủy
          </Button>
        )}
        <Button 
          type="submit" 
          className="bg-[#316585] hover:bg-[#264f68]"
          disabled={disabled || externalLoading}
          data-testid="dynamic-form-submit"
        >
          {externalLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  DynamicField,
  FormSection,
  TextField,
  TextareaField,
  NumberField,
  CurrencyField,
  DateField,
  DateTimeField,
  SelectField,
  PhoneField,
  EmailField,
  BooleanField,
  TagsField,
};
