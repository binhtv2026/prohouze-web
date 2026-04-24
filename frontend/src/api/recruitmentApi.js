/**
 * Recruitment API - Phase 3.5: Auto Recruitment + Onboarding Engine
 * End-to-end recruitment flow from application to onboarding
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Helper for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
};

// ==================== CONFIG ====================

export const getRecruitmentConfig = () => apiCall('/api/recruitment/config');

// ==================== APPLICATION ====================

export const submitApplication = (data) =>
  apiCall('/api/recruitment/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getCandidate = (candidateId) =>
  apiCall(`/api/recruitment/candidate/${candidateId}`);

export const getCandidateStatus = (candidateId) =>
  apiCall(`/api/recruitment/candidate/${candidateId}/status`);

export const listCandidates = ({ status, source, campaign_id, position, limit = 50, skip = 0 } = {}) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (source) params.append('source', source);
  if (campaign_id) params.append('campaign_id', campaign_id);
  if (position) params.append('position', position);
  params.append('limit', limit);
  params.append('skip', skip);
  return apiCall(`/api/recruitment/candidates?${params}`);
};

// ==================== OTP ====================

export const sendOTP = (candidateId, channel = 'email', target = null) => {
  const params = new URLSearchParams({ candidate_id: candidateId, channel });
  if (target) params.append('target', target);
  return apiCall(`/api/recruitment/otp/send?${params}`, { method: 'POST' });
};

export const verifyOTP = (candidateId, otp) =>
  apiCall(`/api/recruitment/otp/verify?candidate_id=${candidateId}&otp=${otp}`, {
    method: 'POST',
  });

// ==================== CONSENT ====================

export const acceptConsent = (data) =>
  apiCall('/api/recruitment/consent/accept', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getConsent = (candidateId) =>
  apiCall(`/api/recruitment/consent/${candidateId}`);

// ==================== KYC ====================

export const uploadKYC = (data) =>
  apiCall('/api/recruitment/kyc/upload', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getKYCStatus = (candidateId) =>
  apiCall(`/api/recruitment/kyc/${candidateId}`);

export const verifyKYCManual = (candidateId, approved, notes = null) => {
  const params = new URLSearchParams({ candidate_id: candidateId, approved });
  if (notes) params.append('notes', notes);
  return apiCall(`/api/recruitment/kyc/verify?${params}`, { method: 'POST' });
};

// ==================== AI SCORING ====================

export const scoreCandidate = (candidateId) =>
  apiCall(`/api/recruitment/ai/score?candidate_id=${candidateId}`, { method: 'POST' });

export const getAIScore = (candidateId) =>
  apiCall(`/api/recruitment/ai/score/${candidateId}`);

// ==================== TEST ====================

export const getTestQuestions = (testType = 'screening') =>
  apiCall(`/api/recruitment/test/questions?test_type=${testType}`);

export const startTest = (candidateId, testType = 'screening') =>
  apiCall(`/api/recruitment/test/start?candidate_id=${candidateId}&test_type=${testType}`, {
    method: 'POST',
  });

export const submitTest = (attemptId, answers) =>
  apiCall(`/api/recruitment/test/submit?attempt_id=${attemptId}`, {
    method: 'POST',
    body: JSON.stringify(answers),
  });

export const getTestAttempt = (attemptId) =>
  apiCall(`/api/recruitment/test/attempt/${attemptId}`);

// ==================== DECISION ====================

export const makeDecision = (candidateId, override = null) => {
  const params = new URLSearchParams({ candidate_id: candidateId });
  if (override) params.append('override', override);
  return apiCall(`/api/recruitment/decision?${params}`, { method: 'POST' });
};

export const overrideDecision = (candidateId, decision, reason = null) => {
  const params = new URLSearchParams({ candidate_id: candidateId, decision });
  if (reason) params.append('reason', reason);
  return apiCall(`/api/recruitment/decision/override?${params}`, { method: 'POST' });
};

// ==================== CONTRACT ====================

export const generateContract = (candidateId) =>
  apiCall(`/api/recruitment/contract/generate?candidate_id=${candidateId}`, {
    method: 'POST',
  });

export const getContract = (contractId) =>
  apiCall(`/api/recruitment/contract/${contractId}`);

export const signContract = (contractId, signatureData) =>
  apiCall(`/api/recruitment/contract/sign?contract_id=${contractId}&signature_data=${encodeURIComponent(signatureData)}`, {
    method: 'POST',
  });

// ==================== ONBOARDING ====================

export const executeOnboarding = (candidateId) =>
  apiCall(`/api/recruitment/onboarding/execute?candidate_id=${candidateId}`, {
    method: 'POST',
  });

export const getOnboardingStatus = (candidateId) =>
  apiCall(`/api/recruitment/onboarding/${candidateId}`);

export const activateUser = (candidateId) =>
  apiCall(`/api/recruitment/onboarding/activate?candidate_id=${candidateId}`, {
    method: 'POST',
  });

// ==================== CAMPAIGN ====================

export const createCampaign = (data) =>
  apiCall('/api/recruitment/campaign', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const listCampaigns = (status = null, limit = 20) => {
  const params = new URLSearchParams({ limit });
  if (status) params.append('status', status);
  return apiCall(`/api/recruitment/campaigns?${params}`);
};

export const getCampaign = (campaignId) =>
  apiCall(`/api/recruitment/campaign/${campaignId}`);

// ==================== REFERRAL ====================

export const getReferralLink = (userId) =>
  apiCall(`/api/recruitment/referral/link/${userId}`);

export const getReferralStats = (userId) =>
  apiCall(`/api/recruitment/referral/stats/${userId}`);

export const getReferralTree = (userId) =>
  apiCall(`/api/recruitment/referral/tree/${userId}`);

// ==================== CONTRACT TEMPLATES (ADMIN) ====================

export const listContractTemplates = (contractType = null) => {
  const params = contractType ? `?contract_type=${contractType}` : '';
  return apiCall(`/api/recruitment/admin/contract-template/list${params}`);
};

export const getContractTemplate = (templateId) =>
  apiCall(`/api/recruitment/admin/contract-template/${templateId}`);

export const uploadContractTemplate = (name, contractType, templateContent, description = null) =>
  apiCall(`/api/recruitment/admin/contract-template/upload?name=${encodeURIComponent(name)}&contract_type=${contractType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: templateContent,
  });

export const activateContractTemplate = (templateId, approvedBy = null) =>
  apiCall(`/api/recruitment/admin/contract-template/${templateId}/activate${approvedBy ? `?approved_by=${approvedBy}` : ''}`, {
    method: 'POST',
  });

export const deleteContractTemplate = (templateId) =>
  apiCall(`/api/recruitment/admin/contract-template/${templateId}`, {
    method: 'DELETE',
  });

// ==================== QR CODE ====================

export const generateQRCode = (refId = null, campaignId = null) => {
  const params = new URLSearchParams();
  if (refId) params.append('ref_id', refId);
  if (campaignId) params.append('campaign_id', campaignId);
  return apiCall(`/api/recruitment/qr/generate?${params}`);
};

// ==================== PIPELINE ====================

export const getPipelineStats = () => apiCall('/api/recruitment/pipeline/stats');

export const getPipelineFunnel = () => apiCall('/api/recruitment/pipeline/funnel');

// ==================== AUDIT ====================

export const getAuditLog = (candidateId) =>
  apiCall(`/api/recruitment/audit/${candidateId}`);

// ==================== AUTO FLOW (DEV) ====================

export const runAutoFlow = (candidateId, skipKyc = true, skipTest = false) =>
  apiCall(`/api/recruitment/flow/auto?candidate_id=${candidateId}&skip_kyc=${skipKyc}&skip_test=${skipTest}`, {
    method: 'POST',
  });

export default {
  getRecruitmentConfig,
  submitApplication,
  getCandidate,
  getCandidateStatus,
  listCandidates,
  sendOTP,
  verifyOTP,
  acceptConsent,
  getConsent,
  uploadKYC,
  getKYCStatus,
  verifyKYCManual,
  scoreCandidate,
  getAIScore,
  getTestQuestions,
  startTest,
  submitTest,
  getTestAttempt,
  makeDecision,
  overrideDecision,
  generateContract,
  getContract,
  signContract,
  executeOnboarding,
  getOnboardingStatus,
  activateUser,
  createCampaign,
  listCampaigns,
  getCampaign,
  getReferralLink,
  getReferralStats,
  getReferralTree,
  listContractTemplates,
  getContractTemplate,
  uploadContractTemplate,
  activateContractTemplate,
  deleteContractTemplate,
  generateQRCode,
  getPipelineStats,
  getPipelineFunnel,
  getAuditLog,
  runAutoFlow,
};
