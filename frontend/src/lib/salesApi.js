/**
 * ProHouze Sales API Service
 * Prompt 8/20 - Sales Pipeline, Booking & Deal Engine
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// DEAL APIs
// ============================================

export const dealApi = {
  // Get all deals with filters
  getDeals: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.stage) query.append('stage', params.stage);
    if (params.status) query.append('status', params.status);
    if (params.assigned_to) query.append('assigned_to', params.assigned_to);
    if (params.search) query.append('search', params.search);
    if (params.skip) query.append('skip', params.skip);
    if (params.limit) query.append('limit', params.limit);
    
    const res = await fetch(`${API_URL}/api/sales/deals?${query}`);
    if (!res.ok) throw new Error('Failed to fetch deals');
    return res.json();
  },

  // Get deal by ID
  getDeal: async (id) => {
    const res = await fetch(`${API_URL}/api/sales/deals/${id}`);
    if (!res.ok) throw new Error('Failed to fetch deal');
    return res.json();
  },

  // Create new deal
  createDeal: async (data) => {
    const res = await fetch(`${API_URL}/api/sales/deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create deal');
    return res.json();
  },

  // Update deal
  updateDeal: async (id, data) => {
    const res = await fetch(`${API_URL}/api/sales/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update deal');
    return res.json();
  },

  // Change deal stage
  changeDealStage: async (id, data) => {
    const res = await fetch(`${API_URL}/api/sales/deals/${id}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to change deal stage');
    return res.json();
  },

  // Get pipeline summary
  getPipeline: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.project_id) query.append('project_id', params.project_id);
    
    const res = await fetch(`${API_URL}/api/sales/deals/pipeline?${query}`);
    if (!res.ok) throw new Error('Failed to fetch pipeline');
    return res.json();
  },

  // Get deal timeline
  getTimeline: async (id) => {
    const res = await fetch(`${API_URL}/api/sales/deals/${id}/timeline`);
    if (!res.ok) throw new Error('Failed to fetch timeline');
    return res.json();
  },
};

// ============================================
// SOFT BOOKING APIs
// ============================================

export const softBookingApi = {
  // Get all soft bookings
  getSoftBookings: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.sales_event_id) query.append('sales_event_id', params.sales_event_id);
    if (params.status) query.append('status', params.status);
    if (params.skip) query.append('skip', params.skip);
    if (params.limit) query.append('limit', params.limit);
    
    const res = await fetch(`${API_URL}/api/sales/soft-bookings?${query}`);
    if (!res.ok) throw new Error('Failed to fetch soft bookings');
    return res.json();
  },

  // Get soft booking by ID
  getSoftBooking: async (id) => {
    const res = await fetch(`${API_URL}/api/sales/soft-bookings/${id}`);
    if (!res.ok) throw new Error('Failed to fetch soft booking');
    return res.json();
  },

  // Create soft booking
  createSoftBooking: async (data) => {
    const res = await fetch(`${API_URL}/api/sales/soft-bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create soft booking');
    return res.json();
  },

  // Confirm soft booking
  confirmSoftBooking: async (id) => {
    const res = await fetch(`${API_URL}/api/sales/soft-bookings/${id}/confirm`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to confirm soft booking');
    return res.json();
  },

  // Set priorities
  setPriorities: async (id, priorities) => {
    const res = await fetch(`${API_URL}/api/sales/soft-bookings/${id}/priorities`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priorities }),
    });
    if (!res.ok) throw new Error('Failed to set priorities');
    return res.json();
  },

  // Submit for allocation
  submitForAllocation: async (id) => {
    const res = await fetch(`${API_URL}/api/sales/soft-bookings/${id}/submit`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to submit for allocation');
    return res.json();
  },

  // Cancel soft booking
  cancelSoftBooking: async (id, reason) => {
    const res = await fetch(`${API_URL}/api/sales/soft-bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to cancel soft booking');
    return res.json();
  },

  // Get queue for project
  getQueue: async (projectId, salesEventId) => {
    let url = `${API_URL}/api/sales/soft-bookings/queue/${projectId}`;
    if (salesEventId) url += `?sales_event_id=${salesEventId}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch queue');
    return res.json();
  },
};

// ============================================
// HARD BOOKING APIs
// ============================================

export const hardBookingApi = {
  // Get all hard bookings
  getHardBookings: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.status) query.append('status', params.status);
    if (params.skip) query.append('skip', params.skip);
    if (params.limit) query.append('limit', params.limit);
    
    const res = await fetch(`${API_URL}/api/sales/hard-bookings?${query}`);
    if (!res.ok) throw new Error('Failed to fetch hard bookings');
    return res.json();
  },

  // Get hard booking by ID
  getHardBooking: async (id) => {
    const res = await fetch(`${API_URL}/api/sales/hard-bookings/${id}`);
    if (!res.ok) throw new Error('Failed to fetch hard booking');
    return res.json();
  },

  // Create hard booking
  createHardBooking: async (data) => {
    const res = await fetch(`${API_URL}/api/sales/hard-bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create hard booking');
    return res.json();
  },

  // Record deposit
  recordDeposit: async (id, data) => {
    const res = await fetch(`${API_URL}/api/sales/hard-bookings/${id}/deposit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record deposit');
    return res.json();
  },

  // Convert to contract
  convertToContract: async (id) => {
    const res = await fetch(`${API_URL}/api/sales/hard-bookings/${id}/convert-contract`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to convert to contract');
    return res.json();
  },
};

// ============================================
// SALES EVENT APIs
// ============================================

export const salesEventApi = {
  // Get all events
  getEvents: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.status) query.append('status', params.status);
    if (params.skip) query.append('skip', params.skip);
    if (params.limit) query.append('limit', params.limit);
    
    const res = await fetch(`${API_URL}/api/sales/events?${query}`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  // Get event by ID
  getEvent: async (id) => {
    const res = await fetch(`${API_URL}/api/sales/events/${id}`);
    if (!res.ok) throw new Error('Failed to fetch event');
    return res.json();
  },

  // Create event
  createEvent: async (data) => {
    const res = await fetch(`${API_URL}/api/sales/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
  },

  // Update event
  updateEvent: async (id, data) => {
    const res = await fetch(`${API_URL}/api/sales/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update event');
    return res.json();
  },

  // Run allocation
  runAllocation: async (id) => {
    const res = await fetch(`${API_URL}/api/sales/events/${id}/run-allocation`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to run allocation');
    return res.json();
  },

  // Get allocation results
  getAllocationResults: async (id) => {
    const res = await fetch(`${API_URL}/api/sales/events/${id}/allocation-results`);
    if (!res.ok) throw new Error('Failed to fetch allocation results');
    return res.json();
  },

  // Manual allocate
  manualAllocate: async (eventId, data) => {
    const res = await fetch(`${API_URL}/api/sales/events/${eventId}/manual-allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to manual allocate');
    return res.json();
  },
};

// ============================================
// PRICING APIs
// ============================================

export const pricingApi = {
  // Calculate price
  calculatePrice: async (data) => {
    const res = await fetch(`${API_URL}/api/sales/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to calculate price');
    return res.json();
  },

  // Get pricing policies
  getPricingPolicies: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.status) query.append('status', params.status);
    
    const res = await fetch(`${API_URL}/api/sales/pricing-policies?${query}`);
    if (!res.ok) throw new Error('Failed to fetch pricing policies');
    return res.json();
  },

  // Create pricing policy
  createPricingPolicy: async (data) => {
    const res = await fetch(`${API_URL}/api/sales/pricing-policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create pricing policy');
    return res.json();
  },

  // Get payment plans
  getPaymentPlans: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.status) query.append('status', params.status);
    
    const res = await fetch(`${API_URL}/api/sales/payment-plans?${query}`);
    if (!res.ok) throw new Error('Failed to fetch payment plans');
    return res.json();
  },

  // Create payment plan
  createPaymentPlan: async (data) => {
    const res = await fetch(`${API_URL}/api/sales/payment-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create payment plan');
    return res.json();
  },

  // Get promotions
  getPromotions: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.status) query.append('status', params.status);
    
    const res = await fetch(`${API_URL}/api/sales/promotions?${query}`);
    if (!res.ok) throw new Error('Failed to fetch promotions');
    return res.json();
  },

  // Create promotion
  createPromotion: async (data) => {
    const res = await fetch(`${API_URL}/api/sales/promotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create promotion');
    return res.json();
  },
};

// ============================================
// CONFIG APIs
// ============================================

export const salesConfigApi = {
  // Get deal stages
  getDealStages: async () => {
    const res = await fetch(`${API_URL}/api/sales/config/deal-stages`);
    if (!res.ok) throw new Error('Failed to fetch deal stages');
    return res.json();
  },

  // Get soft booking statuses
  getSoftBookingStatuses: async () => {
    const res = await fetch(`${API_URL}/api/sales/config/soft-booking-statuses`);
    if (!res.ok) throw new Error('Failed to fetch soft booking statuses');
    return res.json();
  },

  // Get hard booking statuses
  getHardBookingStatuses: async () => {
    const res = await fetch(`${API_URL}/api/sales/config/hard-booking-statuses`);
    if (!res.ok) throw new Error('Failed to fetch hard booking statuses');
    return res.json();
  },

  // Get booking tiers
  getBookingTiers: async () => {
    const res = await fetch(`${API_URL}/api/sales/config/booking-tiers`);
    if (!res.ok) throw new Error('Failed to fetch booking tiers');
    return res.json();
  },

  // Get payment plan types
  getPaymentPlanTypes: async () => {
    const res = await fetch(`${API_URL}/api/sales/config/payment-plan-types`);
    if (!res.ok) throw new Error('Failed to fetch payment plan types');
    return res.json();
  },

  // Get lost reasons
  getLostReasons: async () => {
    const res = await fetch(`${API_URL}/api/sales/config/lost-reasons`);
    if (!res.ok) throw new Error('Failed to fetch lost reasons');
    return res.json();
  },
};

// Export all APIs
export default {
  deal: dealApi,
  softBooking: softBookingApi,
  hardBooking: hardBookingApi,
  salesEvent: salesEventApi,
  pricing: pricingApi,
  config: salesConfigApi,
};
