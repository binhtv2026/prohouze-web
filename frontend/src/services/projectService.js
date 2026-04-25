/**
 * ProHouze — Project Service
 * Layer dữ liệu dự án: API-first với local fallback
 *
 * Thứ tự ưu tiên:
 *   1. GET /api/projects/:slug (MongoDB qua Vercel proxy)
 *   2. Local projectsData (hardcoded — fallback khi offline/API down)
 *
 * Chuẩn này dùng cho TẤT CẢ các dự án, không hardcode API_AVAILABLE.
 */

import { api } from '../lib/api';

// ─── API calls ───────────────────────────────────────────────────────────────

/**
 * Lấy chi tiết dự án theo slug từ API
 * @param {string} slug - ví dụ: 'nobu-danang'
 */
export const fetchProjectBySlug = async (slug) => {
  const res = await api.get(`/projects/slug/${slug}`);
  return res.data;
};

/**
 * Lấy danh sách dự án (có filter)
 */
export const fetchProjects = async (params = {}) => {
  const res = await api.get('/projects', { params });
  return res.data;
};

/**
 * Lấy dự án nổi bật cho homepage
 */
export const fetchFeaturedProjects = async (limit = 6) => {
  const res = await api.get('/projects/featured', { params: { limit } });
  return res.data;
};

/**
 * Thống kê tóm tắt dự án
 */
export const fetchProjectStats = async () => {
  const res = await api.get('/projects/stats/summary');
  return res.data;
};

// ─── Main resolver — API-first với fallback ──────────────────────────────────

/**
 * Resolve project data cho ProjectLandingPage
 *
 * @param {string} slug - slug của dự án
 * @param {Object} localData - projectsData[slug] từ local JS (fallback)
 * @returns {Promise<{ project: Object, source: 'api' | 'local' }>}
 */
export const resolveProject = async (slug, localData = null) => {
  // 1. Thử API
  try {
    const project = await fetchProjectBySlug(slug);
    if (project && project.id) {
      return { project, source: 'api' };
    }
  } catch (err) {
    // API down hoặc 404 → fallback
    if (err?.response?.status !== 404) {
      console.warn(`[ProjectService] API error for '${slug}':`, err.message);
    }
  }

  // 2. Fallback về local data
  if (localData) {
    return { project: localData, source: 'local' };
  }

  // 3. Không có data
  throw new Error(`Project '${slug}' not found in API or local data`);
};

// ─── Admin CRUD (yêu cầu auth token) ─────────────────────────────────────────

export const adminCreateProject = async (data) => {
  const res = await api.post('/admin/projects', data);
  return res.data;
};

export const adminUpdateProject = async (id, data) => {
  const res = await api.put(`/admin/projects/${id}`, data);
  return res.data;
};

export const adminDeleteProject = async (id) => {
  const res = await api.delete(`/admin/projects/${id}`);
  return res.data;
};

export const adminGetAllProjects = async (params = {}) => {
  const res = await api.get('/admin/projects', { params });
  return res.data;
};

export const adminToggleHot = async (id) => {
  const res = await api.put(`/admin/projects/${id}/toggle-hot`);
  return res.data;
};

export const adminTogglePriceList = async (id) => {
  const res = await api.put(`/admin/projects/${id}/toggle-price-list`);
  return res.data;
};
