/**
 * DynamicFormRenderer Component
 * Renders a complete form based on schema from /api/v2/forms/render/{entity_type}
 * 
 * Features:
 * - Dynamic sections and fields
 * - Collapsible sections
 * - Field layout (full, half, third, etc.)
 * - Validation based on attribute rules
 * - Support for all 22 attribute data types
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../../lib/utils';
import { 
  ChevronDown, 
  ChevronUp, 
  Save, 
  X, 
  Loader2,
  AlertCircle,
  User,
  Phone,
  Globe,
  Star,
  StickyNote,
  Home,
  DollarSign,
  Calendar,
  FileText,
  Briefcase,
  CheckCircle,
  Tag,
  Settings,
  Ruler,
  Building
} from 'lucide-react';
import { formsAPI } from '../../api/dynamicFormApi';
import { SimpleDynamicField as DynamicField } from './SimpleDynamicField';

// Icon mapping for section icons
const ICON_MAP = {
  'user': User,
  'phone': Phone,
  'globe': Globe,
  'star': Star,
  'sticky-note': StickyNote,
  'home': Home,
  'dollar-sign': DollarSign,
  'calendar': Calendar,
  'file-alt': FileText,
  'tasks': Briefcase,
  'check-circle': CheckCircle,
  'tags': Tag,
  'handshake': Briefcase,
  'ruler-combined': Ruler,
  'tag': Tag,
  'building': Building,
  'settings': Settings,
};

// Layout width classes
const LAYOUT_CLASSES = {
  'full': 'col-span-12',
  'half': 'col-span-12 md:col-span-6',
  'third': 'col-span-12 md:col-span-4',
  'two_thirds': 'col-span-12 md:col-span-8',
  'quarter': 'col-span-12 md:col-span-3',
  'three_quarters': 'col-span-12 md:col-span-9',
};

/**
 * DynamicFormRenderer - Main component to render dynamic forms
 * 
 * @param {string} entityType - Type of entity (lead, customer, deal, product, task)
 * @param {string} formType - Type of form (create, edit, view, quick)
 * @param {object} initialData - Initial form values
 * @param {function} onSubmit - Callback when form is submitted
 * @param {function} onCancel - Callback when form is cancelled
 * @param {boolean} loading - External loading state
 * @param {string} submitLabel - Custom submit button label
 * @param {string} cancelLabel - Custom cancel button label
 */
export const DynamicFormRenderer = ({
  entityType,
  formType = 'create',
  initialData = {},
  onSubmit,
  onCancel,
  loading: externalLoading = false,
  submitLabel,
  cancelLabel = 'Hủy',
  className = '',
  showHeader = true,
  compact = false,
}) => {
  const [formSchema, setFormSchema] = useState(null);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [schemaError, setSchemaError] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Load form schema
  useEffect(() => {
    const loadSchema = async () => {
      setLoadingSchema(true);
      setSchemaError(null);
      try {
        const data = await formsAPI.getRenderableForm(entityType, formType);
        setFormSchema(data);
        
        // Initialize collapsed sections
        const collapsed = {};
        data.sections?.forEach(section => {
          if (section.collapsed) {
            collapsed[section.id] = true;
          }
        });
        setCollapsedSections(collapsed);
      } catch (error) {
        console.error('Error loading form schema:', error);
        setSchemaError(
          error.response?.data?.detail || 
          'Không thể tải form. Vui lòng thử lại.'
        );
      } finally {
        setLoadingSchema(false);
      }
    };
    
    if (entityType) {
      loadSchema();
    }
  }, [entityType, formType]);

  // Update form data when initial data changes (only on mount)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle field value change
  const handleFieldChange = useCallback((fieldCode, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldCode]: value
    }));
    
    // Clear error for this field
    setErrors(prev => {
      if (prev[fieldCode]) {
        const newErrors = { ...prev };
        delete newErrors[fieldCode];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Toggle section collapse
  const toggleSection = useCallback((sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    formSchema?.sections?.forEach(section => {
      section.fields?.forEach(fieldItem => {
        // Handle row type
        const fields = fieldItem.type === 'row' ? fieldItem.fields : [fieldItem];
        
        fields.forEach(field => {
          const attr = field.attribute;
          if (!attr) return;
          
          const value = formData[attr.code];
          const isRequired = attr.required;
          
          // Required validation
          if (isRequired && (value === null || value === undefined || value === '')) {
            newErrors[attr.code] = `${attr.name} là bắt buộc`;
          }
          
          // Min/Max validation for numbers
          const rules = attr.validation_rules || {};
          if (value !== null && value !== undefined && value !== '') {
            if (rules.min !== undefined && parseFloat(value) < rules.min) {
              newErrors[attr.code] = `${attr.name} phải >= ${rules.min}`;
            }
            if (rules.max !== undefined && parseFloat(value) > rules.max) {
              newErrors[attr.code] = `${attr.name} phải <= ${rules.max}`;
            }
            if (rules.min_length !== undefined && String(value).length < rules.min_length) {
              newErrors[attr.code] = `${attr.name} phải >= ${rules.min_length} ký tự`;
            }
            if (rules.max_length !== undefined && String(value).length > rules.max_length) {
              newErrors[attr.code] = `${attr.name} phải <= ${rules.max_length} ký tự`;
            }
          }
          
          // Email validation
          if (attr.data_type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              newErrors[attr.code] = 'Email không hợp lệ';
            }
          }
          
          // Phone validation
          if (attr.data_type === 'phone' && value) {
            const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
            if (!phoneRegex.test(value)) {
              newErrors[attr.code] = 'Số điện thoại không hợp lệ';
            }
          }
          
          // URL validation
          if (attr.data_type === 'url' && value) {
            try {
              new URL(value);
            } catch {
              newErrors[attr.code] = 'URL không hợp lệ';
            }
          }
        });
      });
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formSchema, formData]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit?.(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ _form: error.message || 'Lỗi khi gửi form' });
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading skeleton
  if (loadingSchema) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-12 gap-4">
                <Skeleton className="h-10 col-span-6" />
                <Skeleton className="h-10 col-span-6" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (schemaError) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {schemaError}
          <Button 
            variant="link" 
            className="ml-2 p-0 h-auto"
            onClick={() => window.location.reload()}
          >
            Tải lại
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!formSchema) {
    return null;
  }

  const schema = formSchema.schema || {};
  const sections = formSchema.sections || [];
  const isLoading = externalLoading || submitting;

  // Render a field (handles both single field and row)
  const renderFieldItem = (fieldItem, index) => {
    if (fieldItem.type === 'row') {
      // Render row of fields
      return (
        <div key={`row-${index}`} className="grid grid-cols-12 gap-4">
          {fieldItem.fields.map((field, fieldIndex) => (
            <div key={field.id || fieldIndex} className={LAYOUT_CLASSES[field.layout] || 'col-span-12'}>
              <DynamicField
                field={field}
                value={formData[field.attribute?.code]}
                onChange={handleFieldChange}
                errors={errors}
                disabled={isLoading}
              />
            </div>
          ))}
        </div>
      );
    }
    
    // Single field
    return (
      <div key={fieldItem.id || index} className={LAYOUT_CLASSES[fieldItem.layout] || 'col-span-12'}>
        <DynamicField
          field={fieldItem}
          value={formData[fieldItem.attribute?.code]}
          onChange={handleFieldChange}
          errors={errors}
          disabled={isLoading}
        />
      </div>
    );
  };

  // Render a section
  const renderSection = (section, index) => {
    const IconComponent = ICON_MAP[section.icon] || FileText;
    const isCollapsed = collapsedSections[section.id];
    const sectionFields = section.fields || [];
    
    if (sectionFields.length === 0) return null;
    
    const sectionContent = (
      <div className="grid grid-cols-12 gap-4">
        {sectionFields.map((fieldItem, fieldIndex) => renderFieldItem(fieldItem, fieldIndex))}
      </div>
    );

    if (section.collapsible) {
      return (
        <Collapsible
          key={section.id || index}
          open={!isCollapsed}
          onOpenChange={() => toggleSection(section.id)}
          className="border rounded-lg"
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <IconComponent className="h-5 w-5 text-gray-500" />
                <h3 className="font-medium">{section.name}</h3>
              </div>
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4">
              {sectionContent}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div key={section.id || index} className={cn(compact ? 'space-y-3' : 'space-y-4')}>
        <div className="flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">{section.name}</h3>
        </div>
        {sectionContent}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <Card>
        {showHeader && (
          <CardHeader className={compact ? 'pb-2' : ''}>
            <CardTitle className="flex items-center gap-2">
              {schema.icon && ICON_MAP[schema.icon] && React.createElement(ICON_MAP[schema.icon], { className: 'h-5 w-5' })}
              {schema.title || schema.name}
            </CardTitle>
            {schema.subtitle && (
              <CardDescription>{schema.subtitle}</CardDescription>
            )}
          </CardHeader>
        )}
        
        <CardContent className={cn(compact ? 'space-y-4' : 'space-y-6')}>
          {/* Form error */}
          {errors._form && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors._form}</AlertDescription>
            </Alert>
          )}
          
          {/* Sections */}
          {sections.map((section, index) => renderSection(section, index))}
          
          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                {cancelLabel}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {submitLabel || (formType === 'create' ? 'Tạo mới' : 'Lưu')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default DynamicFormRenderer;
