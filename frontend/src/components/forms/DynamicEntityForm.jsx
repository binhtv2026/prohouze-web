/**
 * DynamicEntityForm - Unified Create/Edit Form Component
 * Replaces all hardcoded forms in the system
 * 
 * Features:
 * - Loads form schema from API
 * - Supports Create and Edit modes
 * - Data binding with entity fields
 * - Attribute values support
 * - Validation based on schema
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../../lib/utils';
import { 
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
import { formsAPI, attributesAPI } from '../../api/dynamicFormApi';
import { SimpleDynamicField } from './SimpleDynamicField';

// Icon mapping
const ICON_MAP = {
  'user': User, 'phone': Phone, 'globe': Globe, 'star': Star,
  'sticky-note': StickyNote, 'home': Home, 'dollar-sign': DollarSign,
  'calendar': Calendar, 'file-alt': FileText, 'tasks': Briefcase,
  'check-circle': CheckCircle, 'tags': Tag, 'handshake': Briefcase,
  'ruler-combined': Ruler, 'tag': Tag, 'building': Building, 'settings': Settings,
};

// Layout classes
const LAYOUT_CLASSES = {
  'full': 'col-span-12',
  'half': 'col-span-12 md:col-span-6',
  'third': 'col-span-12 md:col-span-4',
  'two_thirds': 'col-span-12 md:col-span-8',
  'quarter': 'col-span-12 md:col-span-3',
  'three_quarters': 'col-span-12 md:col-span-9',
};

// Field mapping: attribute code -> entity field name
const FIELD_MAPPINGS = {
  lead: {
    full_name: 'contact_name',
    phone: 'contact_phone',
    email: 'contact_email',
    source_channel: 'source',
    lead_status: 'stage',
    intent_level: 'intent_level',
    notes: 'qualification_notes',
    budget_min: 'budget_min',
    budget_max: 'budget_max',
    project_interest: 'project_interest',
  },
  deal: {
    deal_name: 'deal_name',
    current_stage: 'current_stage',
    sales_channel: 'sales_channel',
    expected_value: 'deal_value',
    expected_close_date: 'expected_close_date',
    probability: 'probability',
    notes: 'notes',
  },
  customer: {
    full_name: 'full_name',
    phone: 'phone',
    email: 'email',
    customer_type: 'customer_type',
    company_name: 'company_name',
    address: 'address',
    notes: 'notes',
    source: 'source',
  },
  product: {
    product_name: 'name',
    product_code: 'code',
    description: 'description',
    product_type: 'product_type',
    price: 'price',
    status: 'status',
  },
};

/**
 * DynamicEntityForm Component
 * 
 * @param {string} entityType - lead, customer, deal, product
 * @param {string} mode - 'create' or 'edit'
 * @param {object} entity - Existing entity data (for edit mode)
 * @param {function} onSubmit - Callback(formData, attributeValues)
 * @param {function} onCancel - Cancel callback
 * @param {boolean} loading - External loading state
 * @param {string} submitLabel - Custom submit button text
 */
export const DynamicEntityForm = ({
  entityType,
  mode = 'create',
  entity = null,
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
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [schemaError, setSchemaError] = useState(null);

  // Get field mapping for entity type
  const fieldMapping = useMemo(() => FIELD_MAPPINGS[entityType] || {}, [entityType]);

  // Map entity data to form data (for edit mode)
  const mapEntityToFormData = useCallback((entityData) => {
    if (!entityData) return {};
    
    const data = {};
    
    // Reverse mapping: entity field -> attribute code
    Object.entries(fieldMapping).forEach(([attrCode, entityField]) => {
      if (entityData[entityField] !== undefined) {
        data[attrCode] = entityData[entityField];
      }
    });
    
    // Include attribute_values if present
    if (entityData.attribute_values) {
      Object.entries(entityData.attribute_values).forEach(([key, val]) => {
        data[key] = val;
      });
    }
    
    return data;
  }, [fieldMapping]);

  // Map form data to entity data (for save)
  const mapFormDataToEntity = useCallback((data) => {
    const entityData = {};
    const attributeValues = {};
    
    Object.entries(data).forEach(([attrCode, value]) => {
      // Check if this maps to a core entity field
      const entityField = fieldMapping[attrCode];
      if (entityField) {
        entityData[entityField] = value;
      } else {
        // Custom attribute
        attributeValues[attrCode] = value;
      }
    });
    
    return { entityData, attributeValues };
  }, [fieldMapping]);

  // Load form schema AND attribute values (for edit mode)
  useEffect(() => {
    let mounted = true;
    
    const loadSchemaAndData = async () => {
      setLoadingSchema(true);
      setSchemaError(null);
      try {
        const formType = mode === 'create' ? 'create' : 'edit';
        const data = await formsAPI.getRenderableForm(entityType, formType);
        
        if (mounted) {
          setFormSchema(data);
          
          // Initialize form data for edit mode
          if (mode === 'edit' && entity) {
            // Start with entity core fields
            const coreData = mapEntityToFormData(entity);
            
            // Load attribute values from API
            try {
              const attrResponse = await attributesAPI.getValues(entityType, entity.id);
              if (attrResponse.values) {
                // Merge attribute values into form data
                Object.entries(attrResponse.values).forEach(([attrCode, valObj]) => {
                  if (valObj.is_set && valObj.value !== null && valObj.value !== undefined) {
                    coreData[attrCode] = valObj.value;
                  }
                });
              }
            } catch (attrError) {
              console.warn('Could not load attribute values:', attrError);
              // Continue without attribute values
            }
            
            setFormData(coreData);
          }
        }
      } catch (error) {
        console.error('Error loading form schema:', error);
        if (mounted) {
          setSchemaError(
            error.response?.data?.detail || 
            'Không thể tải form. Vui lòng thử lại.'
          );
        }
      } finally {
        if (mounted) setLoadingSchema(false);
      }
    };
    
    if (entityType) {
      loadSchemaAndData();
    }
    
    return () => { mounted = false; };
  }, [entityType, mode, entity, mapEntityToFormData]);

  // Handle field change
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

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    formSchema?.sections?.forEach(section => {
      section.fields?.forEach(fieldItem => {
        const fields = fieldItem.type === 'row' ? fieldItem.fields : [fieldItem];
        
        fields.forEach(field => {
          const attr = field.attribute;
          if (!attr) return;
          
          const value = formData[attr.code];
          
          // Required validation
          if (attr.required && (value === null || value === undefined || value === '')) {
            newErrors[attr.code] = `${attr.name} là bắt buộc`;
          }
          
          // Type-specific validation
          const rules = attr.validation_rules || {};
          if (value !== null && value !== undefined && value !== '') {
            if (rules.min !== undefined && parseFloat(value) < rules.min) {
              newErrors[attr.code] = `${attr.name} phải >= ${rules.min}`;
            }
            if (rules.max !== undefined && parseFloat(value) > rules.max) {
              newErrors[attr.code] = `${attr.name} phải <= ${rules.max}`;
            }
            
            // Email validation
            if (attr.data_type === 'email') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                newErrors[attr.code] = 'Email không hợp lệ';
              }
            }
            
            // Phone validation
            if (attr.data_type === 'phone') {
              const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
              if (!phoneRegex.test(value)) {
                newErrors[attr.code] = 'Số điện thoại không hợp lệ';
              }
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
      const { entityData, attributeValues } = mapFormDataToEntity(formData);
      await onSubmit?.(entityData, attributeValues);
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

  if (!formSchema) return null;

  const schema = formSchema.schema || {};
  const sections = formSchema.sections || [];
  const isLoading = externalLoading || submitting;

  // Render field
  const renderFieldItem = (fieldItem, index) => {
    if (fieldItem.type === 'row') {
      return (
        <div key={`row-${index}`} className="grid grid-cols-12 gap-4">
          {fieldItem.fields.map((field, fieldIndex) => (
            <div key={field.id || fieldIndex} className={LAYOUT_CLASSES[field.layout] || 'col-span-12'}>
              <SimpleDynamicField
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
    
    return (
      <div key={fieldItem.id || index} className={LAYOUT_CLASSES[fieldItem.layout] || 'col-span-12'}>
        <SimpleDynamicField
          field={fieldItem}
          value={formData[fieldItem.attribute?.code]}
          onChange={handleFieldChange}
          errors={errors}
          disabled={isLoading}
        />
      </div>
    );
  };

  // Render section
  const renderSection = (section, index) => {
    const IconComponent = ICON_MAP[section.icon] || FileText;
    const sectionFields = section.fields || [];
    
    if (sectionFields.length === 0) return null;

    return (
      <div key={section.id || index} className={cn(compact ? 'space-y-3' : 'space-y-4')}>
        <div className="flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">{section.name}</h3>
        </div>
        <div className="grid grid-cols-12 gap-4">
          {sectionFields.map((fieldItem, fieldIndex) => renderFieldItem(fieldItem, fieldIndex))}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={className} data-testid={`dynamic-${entityType}-form`}>
      <Card>
        {showHeader && (
          <CardHeader className={compact ? 'pb-2' : ''}>
            <CardTitle className="flex items-center gap-2">
              {schema.icon && ICON_MAP[schema.icon] && React.createElement(ICON_MAP[schema.icon], { className: 'h-5 w-5' })}
              {schema.title || schema.name || (mode === 'create' ? `Tạo ${entityType}` : `Sửa ${entityType}`)}
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
                data-testid="form-cancel-btn"
              >
                <X className="h-4 w-4 mr-2" />
                {cancelLabel}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="form-submit-btn"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {submitLabel || (mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default DynamicEntityForm;
