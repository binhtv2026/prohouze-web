/**
 * ProHouze HR API
 * API client for HR Profile 360° module
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Helper function to get auth headers
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Helper function to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// HR PROFILE APIs
// ═══════════════════════════════════════════════════════════════════════════════

export const hrApi = {
  // Dashboard
  getDashboard: async () => {
    const response = await fetch(`${API_URL}/api/hr/dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getRecentEmployees: async (limit = 10) => {
    const response = await fetch(`${API_URL}/api/hr/dashboard/recent-employees?limit=${limit}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getIncompleteProfiles: async (limit = 10) => {
    const response = await fetch(`${API_URL}/api/hr/dashboard/incomplete-profiles?limit=${limit}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getExpiringContracts: async (days = 30) => {
    const response = await fetch(`${API_URL}/api/hr/dashboard/expiring-contracts?days=${days}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Profiles
  listProfiles: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.team_id) searchParams.append('team_id', params.team_id);
    if (params.skip !== undefined) searchParams.append('skip', params.skip);
    if (params.limit !== undefined) searchParams.append('limit', params.limit);

    const response = await fetch(`${API_URL}/api/hr/profiles?${searchParams}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getProfile: async (profileId) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getProfileByUser: async (userId) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/user/${userId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getProfile360: async (profileId) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/360`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createProfile: async (data) => {
    const response = await fetch(`${API_URL}/api/hr/profiles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateProfile: async (profileId, data) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  searchProfiles: async (query, params = {}) => {
    const searchParams = new URLSearchParams({ q: query });
    if (params.status) searchParams.append('status', params.status);
    if (params.team_id) searchParams.append('team_id', params.team_id);
    if (params.limit) searchParams.append('limit', params.limit);

    const response = await fetch(`${API_URL}/api/hr/search?${searchParams}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Family Members
  addFamilyMember: async (profileId, data) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/family`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateFamilyMember: async (memberId, data) => {
    const response = await fetch(`${API_URL}/api/hr/family/${memberId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteFamilyMember: async (memberId) => {
    const response = await fetch(`${API_URL}/api/hr/family/${memberId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Education
  addEducation: async (profileId, data) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/education`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateEducation: async (educationId, data) => {
    const response = await fetch(`${API_URL}/api/hr/education/${educationId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteEducation: async (educationId) => {
    const response = await fetch(`${API_URL}/api/hr/education/${educationId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Work History
  addWorkHistory: async (profileId, data) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/work-history`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateWorkHistory: async (historyId, data) => {
    const response = await fetch(`${API_URL}/api/hr/work-history/${historyId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteWorkHistory: async (historyId) => {
    const response = await fetch(`${API_URL}/api/hr/work-history/${historyId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Certificates
  addCertificate: async (profileId, data) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/certificates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateCertificate: async (certificateId, data) => {
    const response = await fetch(`${API_URL}/api/hr/certificates/${certificateId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  verifyCertificate: async (certificateId) => {
    const response = await fetch(`${API_URL}/api/hr/certificates/${certificateId}/verify`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Documents
  getDocuments: async (profileId, params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.append('category', params.category);
    if (params.latest_only !== undefined) searchParams.append('latest_only', params.latest_only);

    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/documents?${searchParams}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  uploadDocument: async (profileId, formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },

  getDocumentVersions: async (profileId, category) => {
    const response = await fetch(
      `${API_URL}/api/hr/documents/versions?profile_id=${profileId}&category=${category}`,
      { headers: getHeaders() }
    );
    return handleResponse(response);
  },

  verifyDocument: async (documentId) => {
    const response = await fetch(`${API_URL}/api/hr/documents/${documentId}/verify`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Rewards & Discipline
  addRewardDiscipline: async (profileId, data) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/rewards`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getRewardsDiscipline: async (profileId, type) => {
    const searchParams = new URLSearchParams();
    if (type) searchParams.append('type', type);

    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/rewards?${searchParams}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Internal Work History
  getInternalHistory: async (profileId) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/internal-history`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  addInternalHistory: async (profileId, data) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/internal-history`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Contracts
  getContracts: async (profileId) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/contracts`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  addContract: async (profileId, data) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/contracts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // KPI
  getKPI: async (profileId, year) => {
    const searchParams = new URLSearchParams();
    if (year) searchParams.append('year', year);

    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/kpi?${searchParams}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Onboarding
  getOnboardingChecklist: async (profileId) => {
    const response = await fetch(`${API_URL}/api/hr/profiles/${profileId}/onboarding`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  completeOnboardingItem: async (itemId) => {
    const response = await fetch(`${API_URL}/api/hr/onboarding/${itemId}/complete`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Alerts
  getAlerts: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.resolved !== undefined) searchParams.append('resolved', params.resolved);
    if (params.severity) searchParams.append('severity', params.severity);
    if (params.limit) searchParams.append('limit', params.limit);

    const response = await fetch(`${API_URL}/api/hr/alerts?${searchParams}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  resolveAlert: async (alertId, notes) => {
    const searchParams = new URLSearchParams();
    if (notes) searchParams.append('notes', notes);

    const response = await fetch(`${API_URL}/api/hr/alerts/${alertId}/resolve?${searchParams}`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export default hrApi;
