/**
 * Sales Operations API
 * TASK 1 - SALES WORKING INTERFACE
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// MY INVENTORY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get my assigned products
 */
export const getMyInventory = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page);
  if (params.page_size) queryParams.append('page_size', params.page_size);
  
  const response = await fetch(
    `${API_BASE}/api/sales-ops/my-inventory?${queryParams}`,
    { headers: getAuthHeaders() }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch inventory');
  }
  
  return response.json();
};

/**
 * Get product detail
 */
export const getProductDetail = async (productId) => {
  const response = await fetch(
    `${API_BASE}/api/sales-ops/products/${productId}`,
    { headers: getAuthHeaders() }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch product');
  }
  
  return response.json();
};

/**
 * Get available products for browsing
 */
export const getAvailableProducts = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.project_id) queryParams.append('project_id', params.project_id);
  if (params.product_type) queryParams.append('product_type', params.product_type);
  if (params.min_price) queryParams.append('min_price', params.min_price);
  if (params.max_price) queryParams.append('max_price', params.max_price);
  if (params.page) queryParams.append('page', params.page);
  if (params.page_size) queryParams.append('page_size', params.page_size);
  
  const response = await fetch(
    `${API_BASE}/api/sales-ops/available-products?${queryParams}`,
    { headers: getAuthHeaders() }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch available products');
  }
  
  return response.json();
};

// ═══════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute quick action on product
 */
export const executeQuickAction = async (productId, action, options = {}) => {
  const response = await fetch(
    `${API_BASE}/api/sales-ops/products/${productId}/action`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action,
        hold_hours: options.hold_hours || 24,
        reason: options.reason,
        booking_id: options.booking_id,
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `Failed to ${action}`);
  }
  
  return response.json();
};

/**
 * Hold product
 */
export const holdProduct = async (productId, hours = 24, reason = '') => {
  return executeQuickAction(productId, 'hold', { hold_hours: hours, reason });
};

/**
 * Release hold
 */
export const releaseHold = async (productId) => {
  return executeQuickAction(productId, 'release_hold');
};

/**
 * Create booking request
 */
export const createBooking = async (productId, bookingId = null) => {
  return executeQuickAction(productId, 'create_booking', { booking_id: bookingId });
};

/**
 * Cancel booking
 */
export const cancelBooking = async (productId) => {
  return executeQuickAction(productId, 'cancel_booking');
};

export default {
  getMyInventory,
  getProductDetail,
  getAvailableProducts,
  executeQuickAction,
  holdProduct,
  releaseHold,
  createBooking,
  cancelBooking,
};
