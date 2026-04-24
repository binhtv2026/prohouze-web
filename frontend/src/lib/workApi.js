/**
 * ProHouze Work OS API Library
 * Prompt 10/20 - Task, Reminder & Follow-up Operating System
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// CONFIG APIs
// ============================================

export const getTaskTypes = async () => {
  const res = await fetch(`${API_URL}/api/work/config/task-types`);
  if (!res.ok) throw new Error('Failed to fetch task types');
  return res.json();
};

export const getTaskStatuses = async () => {
  const res = await fetch(`${API_URL}/api/work/config/task-statuses`);
  if (!res.ok) throw new Error('Failed to fetch task statuses');
  return res.json();
};

export const getTaskPriorities = async () => {
  const res = await fetch(`${API_URL}/api/work/config/task-priorities`);
  if (!res.ok) throw new Error('Failed to fetch task priorities');
  return res.json();
};

export const getTaskOutcomes = async () => {
  const res = await fetch(`${API_URL}/api/work/config/task-outcomes`);
  if (!res.ok) throw new Error('Failed to fetch task outcomes');
  return res.json();
};

export const getEntityTypes = async () => {
  const res = await fetch(`${API_URL}/api/work/config/entity-types`);
  if (!res.ok) throw new Error('Failed to fetch entity types');
  return res.json();
};

export const getTaskCategories = async () => {
  const res = await fetch(`${API_URL}/api/work/config/task-categories`);
  if (!res.ok) throw new Error('Failed to fetch task categories');
  return res.json();
};

// ============================================
// TASK CRUD APIs
// ============================================

export const createTask = async (taskData) => {
  const res = await fetch(`${API_URL}/api/work/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create task');
  }
  return res.json();
};

export const getTasks = async (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  const res = await fetch(`${API_URL}/api/work/tasks?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
};

export const getTask = async (taskId) => {
  const res = await fetch(`${API_URL}/api/work/tasks/${taskId}`);
  if (!res.ok) throw new Error('Task not found');
  return res.json();
};

export const updateTask = async (taskId, updateData) => {
  const res = await fetch(`${API_URL}/api/work/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update task');
  }
  return res.json();
};

export const completeTask = async (taskId, completeData) => {
  const res = await fetch(`${API_URL}/api/work/tasks/${taskId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(completeData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to complete task');
  }
  return res.json();
};

export const rescheduleTask = async (taskId, rescheduleData) => {
  const res = await fetch(`${API_URL}/api/work/tasks/${taskId}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rescheduleData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to reschedule task');
  }
  return res.json();
};

export const changeTaskStatus = async (taskId, statusData) => {
  const res = await fetch(`${API_URL}/api/work/tasks/${taskId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(statusData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to change status');
  }
  return res.json();
};

// ============================================
// DAILY WORKBOARD API
// ============================================

export const getDailyWorkboard = async (userId, date = null) => {
  const params = new URLSearchParams({ user_id: userId });
  if (date) params.append('date', date);
  
  const res = await fetch(`${API_URL}/api/work/tasks/my-day?${params}`);
  if (!res.ok) throw new Error('Failed to fetch workboard');
  return res.json();
};

// ============================================
// MANAGER APIs
// ============================================

export const getManagerWorkload = async (teamId = null, branchId = null) => {
  const params = new URLSearchParams();
  if (teamId) params.append('team_id', teamId);
  if (branchId) params.append('branch_id', branchId);
  
  const res = await fetch(`${API_URL}/api/work/manager/workload?${params}`);
  if (!res.ok) throw new Error('Failed to fetch manager workload');
  return res.json();
};

export const getOverdueTasks = async (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value);
  });
  
  const res = await fetch(`${API_URL}/api/work/manager/overdue?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch overdue tasks');
  return res.json();
};

// ============================================
// FOLLOW-UP APIs
// ============================================

export const getNextBestActions = async (userId, limit = 10) => {
  const res = await fetch(`${API_URL}/api/work/follow-up/next-actions?user_id=${userId}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch next actions');
  return res.json();
};

export const getTasksForEntity = async (entityType, entityId, includeCompleted = false) => {
  const res = await fetch(
    `${API_URL}/api/work/follow-up/entity/${entityType}/${entityId}?include_completed=${includeCompleted}`
  );
  if (!res.ok) throw new Error('Failed to fetch entity tasks');
  return res.json();
};

export const triggerAutoTask = async (event, entityType, entityId, entityData, condition = null) => {
  const res = await fetch(`${API_URL}/api/work/follow-up/trigger/${event}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entity_type: entityType,
      entity_id: entityId,
      entity_data: entityData,
      condition,
    }),
  });
  if (!res.ok) throw new Error('Failed to trigger auto task');
  return res.json();
};

// ============================================
// DASHBOARD API
// ============================================

export const getWorkDashboardSummary = async (userId = null, teamId = null, branchId = null) => {
  const params = new URLSearchParams();
  if (userId) params.append('user_id', userId);
  if (teamId) params.append('team_id', teamId);
  if (branchId) params.append('branch_id', branchId);
  
  const res = await fetch(`${API_URL}/api/work/dashboard/summary?${params}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
};

// ============================================
// BULK OPERATIONS
// ============================================

export const bulkUpdateTasks = async (taskIds, updateData) => {
  const res = await fetch(`${API_URL}/api/work/tasks/bulk/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_ids: taskIds, ...updateData }),
  });
  if (!res.ok) throw new Error('Failed to bulk update tasks');
  return res.json();
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getStatusColor = (status) => {
  const colors = {
    new: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    waiting_external: 'bg-purple-100 text-purple-800',
    blocked: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    overdue: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority) => {
  const colors = {
    urgent: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-gray-400 text-white',
  };
  return colors[priority] || 'bg-gray-400 text-white';
};

export const getTaskTypeIcon = (taskType) => {
  const icons = {
    call_customer: 'Phone',
    send_price_sheet: 'FileText',
    send_brochure: 'FileImage',
    arrange_site_visit: 'MapPin',
    follow_up_visit: 'MessageCircle',
    booking_follow_up: 'CreditCard',
    payment_reminder: 'DollarSign',
    document_collection: 'FolderOpen',
    document_verification: 'CheckSquare',
    contract_review: 'FileCheck',
    legal_check: 'Shield',
    notarization: 'Stamp',
    arrange_signing: 'PenTool',
    stale_lead_recovery: 'RefreshCw',
    stale_deal_recovery: 'AlertTriangle',
    customer_callback: 'PhoneCallback',
    meeting: 'Calendar',
    internal_task: 'Briefcase',
    other: 'MoreHorizontal',
  };
  return icons[taskType] || 'Circle';
};

export const formatDueTime = (dueAt) => {
  if (!dueAt) return '';
  const date = new Date(dueAt);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export const formatDueDate = (dueAt) => {
  if (!dueAt) return '';
  const date = new Date(dueAt);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

export const getUrgencyLabel = (hoursUntilDue) => {
  if (hoursUntilDue < 0) {
    const hours = Math.abs(Math.floor(hoursUntilDue));
    if (hours < 24) return `Qua han ${hours} gio`;
    const days = Math.floor(hours / 24);
    return `Qua han ${days} ngay`;
  }
  if (hoursUntilDue < 1) {
    return `Con ${Math.floor(hoursUntilDue * 60)} phut`;
  }
  if (hoursUntilDue < 24) {
    return `Con ${Math.floor(hoursUntilDue)} gio`;
  }
  const days = Math.floor(hoursUntilDue / 24);
  return `Con ${days} ngay`;
};
