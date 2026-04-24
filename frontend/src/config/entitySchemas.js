/**
 * ProHouze Entity Schemas
 * Version: 1.0 - Prompt 3/20
 * 
 * Canonical field definitions for all major entities
 * Used for: Forms, Filters, Import/Export, Validation, Reports
 */

// ============================================
// FIELD TYPES
// ============================================
export const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  CURRENCY: 'currency',
  DATE: 'date',
  DATETIME: 'datetime',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  MULTI_SELECT: 'multi_select',
  PHONE: 'phone',
  EMAIL: 'email',
  URL: 'url',
  USER_PICKER: 'user_picker',
  ENTITY_RELATION: 'entity_relation',
  TAGS: 'tags',
  FILE: 'file',
  IMAGE: 'image',
  HIDDEN: 'hidden',
};

// ============================================
// FIELD CAPABILITIES FLAGS
// ============================================
export const FIELD_FLAGS = {
  REQUIRED: 'required',
  SEARCHABLE: 'searchable',
  FILTERABLE: 'filterable',
  SORTABLE: 'sortable',
  REPORTABLE: 'reportable',
  EXPORTABLE: 'exportable',
  IMPORTABLE: 'importable',
  EDITABLE: 'editable',
  VISIBLE_IN_LIST: 'visibleInList',
  VISIBLE_IN_DETAIL: 'visibleInDetail',
  VISIBLE_IN_FORM: 'visibleInForm',
};

// ============================================
// LEAD ENTITY SCHEMA
// ============================================
export const LEAD_SCHEMA = {
  entity: 'lead',
  label: 'Lead',
  labelPlural: 'Leads',
  icon: 'users',
  primaryField: 'full_name',
  
  fields: [
    // Core System Fields
    {
      key: 'id',
      label: 'ID',
      type: FIELD_TYPES.TEXT,
      layer: 'core',
      flags: ['sortable'],
      system: true,
    },
    {
      key: 'created_at',
      label: 'Ngày tạo',
      type: FIELD_TYPES.DATETIME,
      layer: 'core',
      flags: ['sortable', 'filterable', 'exportable'],
      system: true,
    },
    {
      key: 'updated_at',
      label: 'Cập nhật',
      type: FIELD_TYPES.DATETIME,
      layer: 'core',
      flags: ['sortable'],
      system: true,
    },
    
    // Business Fields - Contact Info
    {
      key: 'full_name',
      label: 'Họ tên',
      type: FIELD_TYPES.TEXT,
      layer: 'business',
      flags: ['required', 'searchable', 'sortable', 'filterable', 'exportable', 'importable', 'visibleInList'],
      validation: { minLength: 2, maxLength: 100 },
      section: 'contact',
      order: 1,
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      type: FIELD_TYPES.PHONE,
      layer: 'business',
      flags: ['required', 'searchable', 'filterable', 'exportable', 'importable', 'visibleInList'],
      validation: { pattern: /^[0-9]{10,11}$/ },
      section: 'contact',
      order: 2,
    },
    {
      key: 'email',
      label: 'Email',
      type: FIELD_TYPES.EMAIL,
      layer: 'business',
      flags: ['searchable', 'filterable', 'exportable', 'importable'],
      section: 'contact',
      order: 3,
    },
    
    // Business Fields - Source & Status
    {
      key: 'status',
      label: 'Trạng thái',
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['required', 'filterable', 'sortable', 'exportable', 'reportable', 'visibleInList'],
      options: { source: 'LEAD_STATUSES' },
      defaultValue: 'new',
      section: 'status',
      order: 1,
    },
    {
      key: 'source',
      label: 'Nguồn',
      labelAlias: ['channel', 'kênh'],
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['required', 'filterable', 'sortable', 'exportable', 'importable', 'reportable', 'visibleInList'],
      options: { source: 'LEAD_SOURCES' },
      defaultValue: 'website',
      section: 'source',
      order: 1,
    },
    {
      key: 'segment',
      label: 'Phân khúc',
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['filterable', 'exportable', 'reportable'],
      options: { source: 'LEAD_SEGMENTS' },
      section: 'source',
      order: 2,
    },
    
    // Business Fields - Interest
    {
      key: 'project_interest',
      label: 'Dự án quan tâm',
      type: FIELD_TYPES.ENTITY_RELATION,
      layer: 'business',
      flags: ['filterable', 'exportable', 'importable'],
      options: { entity: 'project' },
      section: 'interest',
      order: 1,
    },
    {
      key: 'product_interest',
      label: 'Sản phẩm quan tâm',
      type: FIELD_TYPES.TEXT,
      layer: 'business',
      flags: ['searchable', 'exportable', 'importable'],
      section: 'interest',
      order: 2,
    },
    {
      key: 'budget_min',
      label: 'Ngân sách tối thiểu',
      type: FIELD_TYPES.CURRENCY,
      layer: 'business',
      flags: ['filterable', 'exportable', 'importable'],
      section: 'budget',
      order: 1,
    },
    {
      key: 'budget_max',
      label: 'Ngân sách tối đa',
      type: FIELD_TYPES.CURRENCY,
      layer: 'business',
      flags: ['filterable', 'exportable', 'importable'],
      section: 'budget',
      order: 2,
    },
    {
      key: 'location',
      label: 'Khu vực',
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['filterable', 'exportable', 'importable'],
      options: { source: 'PROVINCES' },
      section: 'interest',
      order: 3,
    },
    
    // Business Fields - Assignment
    {
      key: 'assigned_to',
      label: 'Người phụ trách',
      type: FIELD_TYPES.USER_PICKER,
      layer: 'business',
      flags: ['filterable', 'sortable', 'exportable', 'visibleInList'],
      section: 'assignment',
      order: 1,
    },
    {
      key: 'assigned_at',
      label: 'Ngày phân công',
      type: FIELD_TYPES.DATETIME,
      layer: 'business',
      flags: ['sortable', 'exportable'],
      section: 'assignment',
      order: 2,
    },
    
    // Business Fields - Activity
    {
      key: 'score',
      label: 'Điểm',
      type: FIELD_TYPES.NUMBER,
      layer: 'business',
      flags: ['sortable', 'filterable', 'reportable'],
      section: 'activity',
      order: 1,
    },
    {
      key: 'last_activity',
      label: 'Hoạt động cuối',
      type: FIELD_TYPES.DATETIME,
      layer: 'business',
      flags: ['sortable', 'filterable'],
      section: 'activity',
      order: 2,
    },
    
    // Extension Fields
    {
      key: 'notes',
      label: 'Ghi chú',
      type: FIELD_TYPES.TEXTAREA,
      layer: 'extension',
      flags: ['searchable', 'exportable', 'importable'],
      section: 'notes',
      order: 1,
    },
    {
      key: 'tags',
      label: 'Tags',
      type: FIELD_TYPES.TAGS,
      layer: 'extension',
      flags: ['filterable', 'exportable', 'importable'],
      section: 'tags',
      order: 1,
    },
    
    // Referral
    {
      key: 'referrer_id',
      label: 'Người giới thiệu',
      type: FIELD_TYPES.ENTITY_RELATION,
      layer: 'business',
      flags: ['filterable', 'exportable'],
      options: { entity: 'collaborator' },
      section: 'referral',
      order: 1,
    },
  ],
  
  // Form sections
  sections: [
    { key: 'contact', label: 'Thông tin liên hệ', order: 1 },
    { key: 'source', label: 'Nguồn & Phân khúc', order: 2 },
    { key: 'interest', label: 'Nhu cầu', order: 3 },
    { key: 'budget', label: 'Ngân sách', order: 4 },
    { key: 'assignment', label: 'Phân công', order: 5 },
    { key: 'referral', label: 'Giới thiệu', order: 6 },
    { key: 'notes', label: 'Ghi chú', order: 7 },
    { key: 'tags', label: 'Tags', order: 8 },
  ],
  
  // Validation rules
  validation: {
    entity: [
      { rule: 'phoneOrEmail', message: 'Phải có ít nhất số điện thoại hoặc email' },
    ],
  },
  
  // Import mapping aliases
  importAliases: {
    full_name: ['name', 'ho_ten', 'hovaten', 'customer_name', 'khach_hang'],
    phone: ['sdt', 'so_dien_thoai', 'phone_number', 'mobile', 'contact'],
    email: ['mail', 'email_address'],
    source: ['nguon', 'channel', 'kenh'],
    notes: ['ghi_chu', 'note', 'comment'],
  },
};

// ============================================
// TASK ENTITY SCHEMA
// ============================================
export const TASK_SCHEMA = {
  entity: 'task',
  label: 'Task',
  labelPlural: 'Tasks',
  icon: 'check-square',
  primaryField: 'title',
  
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: FIELD_TYPES.TEXT,
      layer: 'core',
      flags: ['sortable'],
      system: true,
    },
    {
      key: 'title',
      label: 'Tiêu đề',
      type: FIELD_TYPES.TEXT,
      layer: 'business',
      flags: ['required', 'searchable', 'sortable', 'exportable', 'importable', 'visibleInList'],
      validation: { minLength: 2, maxLength: 200 },
      section: 'main',
      order: 1,
    },
    {
      key: 'description',
      label: 'Mô tả',
      type: FIELD_TYPES.TEXTAREA,
      layer: 'business',
      flags: ['searchable', 'exportable'],
      section: 'main',
      order: 2,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['required', 'filterable', 'sortable', 'exportable', 'reportable', 'visibleInList'],
      options: { source: 'TASK_STATUSES' },
      defaultValue: 'todo',
      section: 'status',
      order: 1,
    },
    {
      key: 'priority',
      label: 'Ưu tiên',
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['filterable', 'sortable', 'exportable', 'visibleInList'],
      options: { source: 'TASK_PRIORITIES' },
      defaultValue: 'medium',
      section: 'status',
      order: 2,
    },
    {
      key: 'type',
      label: 'Loại',
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['filterable', 'exportable'],
      options: { source: 'TASK_TYPES' },
      defaultValue: 'task',
      section: 'status',
      order: 3,
    },
    {
      key: 'assignee_id',
      label: 'Người thực hiện',
      type: FIELD_TYPES.USER_PICKER,
      layer: 'business',
      flags: ['filterable', 'sortable', 'exportable', 'visibleInList'],
      section: 'assignment',
      order: 1,
    },
    {
      key: 'due_date',
      label: 'Hạn hoàn thành',
      type: FIELD_TYPES.DATETIME,
      layer: 'business',
      flags: ['filterable', 'sortable', 'exportable', 'importable', 'visibleInList'],
      section: 'dates',
      order: 1,
    },
    {
      key: 'related_lead_id',
      label: 'Lead liên quan',
      type: FIELD_TYPES.ENTITY_RELATION,
      layer: 'business',
      flags: ['filterable', 'exportable'],
      options: { entity: 'lead' },
      section: 'relations',
      order: 1,
    },
    {
      key: 'labels',
      label: 'Labels',
      type: FIELD_TYPES.TAGS,
      layer: 'extension',
      flags: ['filterable', 'exportable'],
      section: 'tags',
      order: 1,
    },
  ],
  
  sections: [
    { key: 'main', label: 'Thông tin chính', order: 1 },
    { key: 'status', label: 'Trạng thái', order: 2 },
    { key: 'assignment', label: 'Phân công', order: 3 },
    { key: 'dates', label: 'Thời hạn', order: 4 },
    { key: 'relations', label: 'Liên kết', order: 5 },
    { key: 'tags', label: 'Tags', order: 6 },
  ],
};

// ============================================
// PROJECT ENTITY SCHEMA (BĐS Project)
// ============================================
export const PROJECT_SCHEMA = {
  entity: 'project',
  label: 'Dự án',
  labelPlural: 'Dự án',
  icon: 'building-2',
  primaryField: 'name',
  
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: FIELD_TYPES.TEXT,
      layer: 'core',
      flags: ['sortable'],
      system: true,
    },
    {
      key: 'name',
      label: 'Tên dự án',
      type: FIELD_TYPES.TEXT,
      layer: 'business',
      flags: ['required', 'searchable', 'sortable', 'filterable', 'exportable', 'visibleInList'],
      validation: { minLength: 2, maxLength: 200 },
      section: 'main',
      order: 1,
    },
    {
      key: 'slogan',
      label: 'Slogan',
      type: FIELD_TYPES.TEXT,
      layer: 'business',
      flags: ['exportable'],
      section: 'main',
      order: 2,
    },
    {
      key: 'type',
      label: 'Loại hình',
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['required', 'filterable', 'sortable', 'exportable', 'visibleInList'],
      options: { source: 'PROPERTY_TYPES' },
      section: 'type',
      order: 1,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['required', 'filterable', 'sortable', 'exportable', 'visibleInList'],
      options: { source: 'PROJECT_STATUSES' },
      defaultValue: 'selling',
      section: 'type',
      order: 2,
    },
    {
      key: 'province',
      label: 'Tỉnh/Thành phố',
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['required', 'filterable', 'sortable', 'exportable', 'importable'],
      options: { source: 'PROVINCES' },
      section: 'location',
      order: 1,
    },
    {
      key: 'district',
      label: 'Quận/Huyện',
      type: FIELD_TYPES.TEXT,
      layer: 'business',
      flags: ['filterable', 'exportable', 'importable'],
      section: 'location',
      order: 2,
    },
    {
      key: 'address',
      label: 'Địa chỉ',
      type: FIELD_TYPES.TEXT,
      layer: 'business',
      flags: ['searchable', 'exportable', 'importable'],
      section: 'location',
      order: 3,
    },
    {
      key: 'priceFrom',
      label: 'Giá từ',
      type: FIELD_TYPES.CURRENCY,
      layer: 'business',
      flags: ['filterable', 'sortable', 'exportable', 'importable', 'visibleInList'],
      section: 'price',
      order: 1,
    },
    {
      key: 'priceTo',
      label: 'Giá đến',
      type: FIELD_TYPES.CURRENCY,
      layer: 'business',
      flags: ['filterable', 'exportable', 'importable'],
      section: 'price',
      order: 2,
    },
    {
      key: 'area',
      label: 'Diện tích',
      type: FIELD_TYPES.TEXT,
      layer: 'business',
      flags: ['filterable', 'exportable', 'importable'],
      section: 'specs',
      order: 1,
    },
    {
      key: 'totalUnits',
      label: 'Tổng số căn',
      type: FIELD_TYPES.NUMBER,
      layer: 'business',
      flags: ['sortable', 'exportable', 'importable'],
      section: 'inventory',
      order: 1,
    },
    {
      key: 'availableUnits',
      label: 'Còn lại',
      type: FIELD_TYPES.NUMBER,
      layer: 'business',
      flags: ['sortable', 'exportable', 'reportable'],
      section: 'inventory',
      order: 2,
    },
    {
      key: 'description',
      label: 'Mô tả',
      type: FIELD_TYPES.TEXTAREA,
      layer: 'business',
      flags: ['searchable', 'exportable'],
      section: 'description',
      order: 1,
    },
    {
      key: 'images',
      label: 'Hình ảnh',
      type: FIELD_TYPES.IMAGE,
      layer: 'business',
      flags: ['exportable'],
      multiple: true,
      section: 'media',
      order: 1,
    },
  ],
  
  sections: [
    { key: 'main', label: 'Thông tin chính', order: 1 },
    { key: 'type', label: 'Phân loại', order: 2 },
    { key: 'location', label: 'Vị trí', order: 3 },
    { key: 'price', label: 'Giá', order: 4 },
    { key: 'specs', label: 'Thông số', order: 5 },
    { key: 'inventory', label: 'Quỹ hàng', order: 6 },
    { key: 'description', label: 'Mô tả', order: 7 },
    { key: 'media', label: 'Hình ảnh', order: 8 },
  ],
};

// ============================================
// DEAL ENTITY SCHEMA
// ============================================
export const DEAL_SCHEMA = {
  entity: 'deal',
  label: 'Deal',
  labelPlural: 'Deals',
  icon: 'target',
  primaryField: 'name',
  
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: FIELD_TYPES.TEXT,
      layer: 'core',
      flags: ['sortable'],
      system: true,
    },
    {
      key: 'name',
      label: 'Tên Deal',
      type: FIELD_TYPES.TEXT,
      layer: 'business',
      flags: ['required', 'searchable', 'sortable', 'exportable', 'visibleInList'],
      section: 'main',
      order: 1,
    },
    {
      key: 'stage',
      label: 'Giai đoạn',
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['required', 'filterable', 'sortable', 'exportable', 'reportable', 'visibleInList'],
      options: { source: 'DEAL_STAGES' },
      defaultValue: 'lead',
      section: 'stage',
      order: 1,
    },
    {
      key: 'value',
      label: 'Giá trị',
      type: FIELD_TYPES.CURRENCY,
      layer: 'business',
      flags: ['filterable', 'sortable', 'exportable', 'reportable', 'visibleInList'],
      section: 'value',
      order: 1,
    },
    {
      key: 'lead_id',
      label: 'Lead',
      type: FIELD_TYPES.ENTITY_RELATION,
      layer: 'business',
      flags: ['filterable', 'exportable'],
      options: { entity: 'lead' },
      section: 'relations',
      order: 1,
    },
    {
      key: 'project_id',
      label: 'Dự án',
      type: FIELD_TYPES.ENTITY_RELATION,
      layer: 'business',
      flags: ['filterable', 'exportable'],
      options: { entity: 'project' },
      section: 'relations',
      order: 2,
    },
    {
      key: 'product_id',
      label: 'Sản phẩm',
      type: FIELD_TYPES.ENTITY_RELATION,
      layer: 'business',
      flags: ['filterable', 'exportable'],
      options: { entity: 'product' },
      section: 'relations',
      order: 3,
    },
    {
      key: 'owner_id',
      label: 'Người phụ trách',
      type: FIELD_TYPES.USER_PICKER,
      layer: 'business',
      flags: ['filterable', 'sortable', 'exportable', 'visibleInList'],
      section: 'assignment',
      order: 1,
    },
    {
      key: 'expected_close_date',
      label: 'Ngày dự kiến chốt',
      type: FIELD_TYPES.DATE,
      layer: 'business',
      flags: ['filterable', 'sortable', 'exportable'],
      section: 'dates',
      order: 1,
    },
    {
      key: 'loss_reason',
      label: 'Lý do mất',
      type: FIELD_TYPES.SELECT,
      layer: 'business',
      flags: ['filterable', 'exportable', 'reportable'],
      options: { source: 'LOSS_REASONS' },
      section: 'outcome',
      order: 1,
      visibleWhen: { stage: ['lost'] },
    },
    {
      key: 'notes',
      label: 'Ghi chú',
      type: FIELD_TYPES.TEXTAREA,
      layer: 'extension',
      flags: ['exportable'],
      section: 'notes',
      order: 1,
    },
  ],
  
  sections: [
    { key: 'main', label: 'Thông tin chính', order: 1 },
    { key: 'stage', label: 'Giai đoạn', order: 2 },
    { key: 'value', label: 'Giá trị', order: 3 },
    { key: 'relations', label: 'Liên kết', order: 4 },
    { key: 'assignment', label: 'Phân công', order: 5 },
    { key: 'dates', label: 'Thời hạn', order: 6 },
    { key: 'outcome', label: 'Kết quả', order: 7 },
    { key: 'notes', label: 'Ghi chú', order: 8 },
  ],
};

// ============================================
// ALL SCHEMAS
// ============================================
export const ENTITY_SCHEMAS = {
  lead: LEAD_SCHEMA,
  task: TASK_SCHEMA,
  project: PROJECT_SCHEMA,
  deal: DEAL_SCHEMA,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get schema by entity name
 */
export const getSchema = (entityName) => {
  return ENTITY_SCHEMAS[entityName];
};

/**
 * Get fields by layer
 */
export const getFieldsByLayer = (schema, layer) => {
  return schema.fields.filter(f => f.layer === layer);
};

/**
 * Get fields by section
 */
export const getFieldsBySection = (schema, sectionKey) => {
  return schema.fields.filter(f => f.section === sectionKey).sort((a, b) => a.order - b.order);
};

/**
 * Get fields with specific flag
 */
export const getFieldsWithFlag = (schema, flag) => {
  return schema.fields.filter(f => f.flags?.includes(flag));
};

/**
 * Get filterable fields
 */
export const getFilterableFields = (schema) => {
  return getFieldsWithFlag(schema, 'filterable');
};

/**
 * Get searchable fields
 */
export const getSearchableFields = (schema) => {
  return getFieldsWithFlag(schema, 'searchable');
};

/**
 * Get exportable fields
 */
export const getExportableFields = (schema) => {
  return getFieldsWithFlag(schema, 'exportable');
};

/**
 * Get required fields
 */
export const getRequiredFields = (schema) => {
  return getFieldsWithFlag(schema, 'required');
};

/**
 * Get form fields
 */
export const getFormFields = (schema) => {
  return schema.fields.filter(f => !f.system && f.flags?.includes('visibleInForm') !== false);
};

/**
 * Get list columns
 */
export const getListColumns = (schema) => {
  return schema.fields.filter(f => f.flags?.includes('visibleInList'));
};

/**
 * Map import alias to field key
 */
export const mapImportAlias = (schema, alias) => {
  const aliasLower = alias.toLowerCase().trim();
  
  // Check direct field key
  const directMatch = schema.fields.find(f => f.key.toLowerCase() === aliasLower);
  if (directMatch) return directMatch.key;
  
  // Check label
  const labelMatch = schema.fields.find(f => f.label.toLowerCase() === aliasLower);
  if (labelMatch) return labelMatch.key;
  
  // Check import aliases
  if (schema.importAliases) {
    for (const [fieldKey, aliases] of Object.entries(schema.importAliases)) {
      if (aliases.some(a => a.toLowerCase() === aliasLower)) {
        return fieldKey;
      }
    }
  }
  
  // Check labelAlias in field definition
  for (const field of schema.fields) {
    if (field.labelAlias?.some(a => a.toLowerCase() === aliasLower)) {
      return field.key;
    }
  }
  
  return null;
};

export default {
  FIELD_TYPES,
  FIELD_FLAGS,
  ENTITY_SCHEMAS,
  LEAD_SCHEMA,
  TASK_SCHEMA,
  PROJECT_SCHEMA,
  DEAL_SCHEMA,
  getSchema,
  getFieldsByLayer,
  getFieldsBySection,
  getFieldsWithFlag,
  getFilterableFields,
  getSearchableFields,
  getExportableFields,
  getRequiredFields,
  getFormFields,
  getListColumns,
  mapImportAlias,
};
