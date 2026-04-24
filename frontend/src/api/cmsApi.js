/**
 * ProHouze CMS API Client - Prompt 14/20
 * Website CMS / Landing Page / SEO Engine
 * 
 * INTEGRATED WITH MARKETING ENGINE:
 * - CMS is Single Source of Truth for content
 * - Forms and Campaigns from Marketing Engine
 * - Auto attribution tracking
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ==================== MARKETING ENGINE DATA ====================

export const cmsMarketingApi = {
  getForms: () => fetch(`${API_URL}/api/cms/marketing/forms`).then(r => r.json()),
  getCampaigns: () => fetch(`${API_URL}/api/cms/marketing/campaigns`).then(r => r.json()),
  getChannels: () => fetch(`${API_URL}/api/cms/marketing/channels`).then(r => r.json()),
};

// ==================== TRACKING APIs ====================

export const cmsTrackingApi = {
  trackPageView: (data) => fetch(`${API_URL}/api/cms/track/pageview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  submitForm: (data) => fetch(`${API_URL}/api/cms/submit/form`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
};

// ==================== CONFIG APIs ====================

export const cmsConfigApi = {
  getContentStatuses: () => fetch(`${API_URL}/api/cms/config/content-statuses`).then(r => r.json()),
  getPageTypes: () => fetch(`${API_URL}/api/cms/config/page-types`).then(r => r.json()),
  getArticleCategories: () => fetch(`${API_URL}/api/cms/config/article-categories`).then(r => r.json()),
  getStaticPageTypes: () => fetch(`${API_URL}/api/cms/config/static-page-types`).then(r => r.json()),
  getLandingPageTypes: () => fetch(`${API_URL}/api/cms/config/landing-page-types`).then(r => r.json()),
  getPartnerCategories: () => fetch(`${API_URL}/api/cms/config/partner-categories`).then(r => r.json()),
  getTestimonialCategories: () => fetch(`${API_URL}/api/cms/config/testimonial-categories`).then(r => r.json()),
  getMediaAssetTypes: () => fetch(`${API_URL}/api/cms/config/media-asset-types`).then(r => r.json()),
  getSeoSettings: () => fetch(`${API_URL}/api/cms/config/seo`).then(r => r.json()),
  getVisibilityLevels: () => fetch(`${API_URL}/api/cms/config/visibility-levels`).then(r => r.json()),
  getCtaTypes: () => fetch(`${API_URL}/api/cms/config/cta-types`).then(r => r.json()),
  getFormTypes: () => fetch(`${API_URL}/api/cms/config/form-types`).then(r => r.json()),
};

// ==================== DASHBOARD API ====================

export const cmsDashboardApi = {
  getStats: () => fetch(`${API_URL}/api/cms/dashboard`).then(r => r.json()),
};

// ==================== PAGES APIs ====================

export const cmsPagesApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/cms/pages${query ? `?${query}` : ''}`).then(r => r.json());
  },
  
  get: (id) => fetch(`${API_URL}/api/cms/pages/${id}`).then(r => r.json()),
  
  getBySlug: (slug, incrementView = false) => 
    fetch(`${API_URL}/api/cms/pages/by-slug/${slug}?increment_view=${incrementView}`).then(r => r.json()),
  
  create: (data) => fetch(`${API_URL}/api/cms/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  update: (id, data) => fetch(`${API_URL}/api/cms/pages/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  delete: (id) => fetch(`${API_URL}/api/cms/pages/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  publish: (id) => fetch(`${API_URL}/api/cms/pages/${id}/publish`, { method: 'POST' }).then(r => r.json()),
  
  unpublish: (id) => fetch(`${API_URL}/api/cms/pages/${id}/unpublish`, { method: 'POST' }).then(r => r.json()),
};

// ==================== ARTICLES APIs ====================

export const cmsArticlesApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/cms/articles${query ? `?${query}` : ''}`).then(r => r.json());
  },
  
  get: (id) => fetch(`${API_URL}/api/cms/articles/${id}`).then(r => r.json()),
  
  getBySlug: (slug, incrementView = false) => 
    fetch(`${API_URL}/api/cms/articles/by-slug/${slug}?increment_view=${incrementView}`).then(r => r.json()),
  
  create: (data) => fetch(`${API_URL}/api/cms/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  update: (id, data) => fetch(`${API_URL}/api/cms/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  delete: (id) => fetch(`${API_URL}/api/cms/articles/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  publish: (id) => fetch(`${API_URL}/api/cms/articles/${id}/publish`, { method: 'POST' }).then(r => r.json()),
};

// ==================== LANDING PAGES APIs ====================

export const cmsLandingPagesApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/cms/landing-pages${query ? `?${query}` : ''}`).then(r => r.json());
  },
  
  get: (id) => fetch(`${API_URL}/api/cms/landing-pages/${id}`).then(r => r.json()),
  
  getBySlug: (slug, incrementView = false) => 
    fetch(`${API_URL}/api/cms/landing-pages/by-slug/${slug}?increment_view=${incrementView}`).then(r => r.json()),
  
  create: (data) => fetch(`${API_URL}/api/cms/landing-pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  update: (id, data) => fetch(`${API_URL}/api/cms/landing-pages/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  delete: (id) => fetch(`${API_URL}/api/cms/landing-pages/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  trackSubmission: (id) => fetch(`${API_URL}/api/cms/landing-pages/${id}/track-submission`, { method: 'POST' }).then(r => r.json()),
};

// ==================== PUBLIC PROJECTS APIs ====================

export const cmsPublicProjectsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/cms/public-projects${query ? `?${query}` : ''}`).then(r => r.json());
  },
  
  get: (id) => fetch(`${API_URL}/api/cms/public-projects/${id}`).then(r => r.json()),
  
  getBySlug: (slug, incrementView = false) => 
    fetch(`${API_URL}/api/cms/public-projects/by-slug/${slug}?increment_view=${incrementView}`).then(r => r.json()),
  
  create: (data) => fetch(`${API_URL}/api/cms/public-projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  update: (id, data) => fetch(`${API_URL}/api/cms/public-projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  delete: (id) => fetch(`${API_URL}/api/cms/public-projects/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  syncFromMaster: (id) => fetch(`${API_URL}/api/cms/public-projects/${id}/sync-from-master`, { method: 'POST' }).then(r => r.json()),
};

// ==================== TESTIMONIALS APIs ====================

export const cmsTestimonialsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/cms/testimonials${query ? `?${query}` : ''}`).then(r => r.json());
  },
  
  get: (id) => fetch(`${API_URL}/api/cms/testimonials/${id}`).then(r => r.json()),
  
  create: (data) => fetch(`${API_URL}/api/cms/testimonials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  update: (id, data) => fetch(`${API_URL}/api/cms/testimonials/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  delete: (id) => fetch(`${API_URL}/api/cms/testimonials/${id}`, { method: 'DELETE' }).then(r => r.json()),
};

// ==================== PARTNERS APIs ====================

export const cmsPartnersApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/cms/partners${query ? `?${query}` : ''}`).then(r => r.json());
  },
  
  get: (id) => fetch(`${API_URL}/api/cms/partners/${id}`).then(r => r.json()),
  
  create: (data) => fetch(`${API_URL}/api/cms/partners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  update: (id, data) => fetch(`${API_URL}/api/cms/partners/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  delete: (id) => fetch(`${API_URL}/api/cms/partners/${id}`, { method: 'DELETE' }).then(r => r.json()),
};

// ==================== CAREERS APIs ====================

export const cmsCareersApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/cms/careers${query ? `?${query}` : ''}`).then(r => r.json());
  },
  
  get: (id) => fetch(`${API_URL}/api/cms/careers/${id}`).then(r => r.json()),
  
  getBySlug: (slug, incrementView = false) => 
    fetch(`${API_URL}/api/cms/careers/by-slug/${slug}?increment_view=${incrementView}`).then(r => r.json()),
  
  create: (data) => fetch(`${API_URL}/api/cms/careers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  update: (id, data) => fetch(`${API_URL}/api/cms/careers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  delete: (id) => fetch(`${API_URL}/api/cms/careers/${id}`, { method: 'DELETE' }).then(r => r.json()),
};

// ==================== MEDIA ASSETS APIs ====================

export const cmsMediaAssetsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/cms/media-assets${query ? `?${query}` : ''}`).then(r => r.json());
  },
  
  get: (id) => fetch(`${API_URL}/api/cms/media-assets/${id}`).then(r => r.json()),
  
  create: (data) => fetch(`${API_URL}/api/cms/media-assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  update: (id, data) => fetch(`${API_URL}/api/cms/media-assets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  delete: (id) => fetch(`${API_URL}/api/cms/media-assets/${id}`, { method: 'DELETE' }).then(r => r.json()),
};

// ==================== FAQ APIs ====================

export const cmsFaqsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/api/cms/faqs${query ? `?${query}` : ''}`).then(r => r.json());
  },
  
  get: (id) => fetch(`${API_URL}/api/cms/faqs/${id}`).then(r => r.json()),
  
  create: (data) => fetch(`${API_URL}/api/cms/faqs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  update: (id, data) => fetch(`${API_URL}/api/cms/faqs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  delete: (id) => fetch(`${API_URL}/api/cms/faqs/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  markHelpful: (id) => fetch(`${API_URL}/api/cms/faqs/${id}/helpful`, { method: 'POST' }).then(r => r.json()),
};

// ==================== SITEMAP API ====================

export const cmsSitemapApi = {
  generate: (baseUrl = 'https://prohouze.com') => 
    fetch(`${API_URL}/api/cms/sitemap?base_url=${encodeURIComponent(baseUrl)}`).then(r => r.json()),
};

// ==================== MENU APIs ====================

export const cmsMenuApi = {
  list: (visibility = null) => {
    const query = visibility ? `?visibility=${visibility}` : '';
    return fetch(`${API_URL}/api/cms/menu-items${query}`).then(r => r.json());
  },
  
  create: (data) => fetch(`${API_URL}/api/cms/menu-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  update: (id, data) => fetch(`${API_URL}/api/cms/menu-items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  delete: (id) => fetch(`${API_URL}/api/cms/menu-items/${id}`, { method: 'DELETE' }).then(r => r.json()),
};

// ==================== SEED DATA API ====================

export const cmsSeedApi = {
  seed: () => fetch(`${API_URL}/api/cms/seed`, { method: 'POST' }).then(r => r.json()),
};

// Default export
export default {
  config: cmsConfigApi,
  dashboard: cmsDashboardApi,
  marketing: cmsMarketingApi,  // Marketing Engine data
  tracking: cmsTrackingApi,     // Page view & form tracking
  pages: cmsPagesApi,
  articles: cmsArticlesApi,
  landingPages: cmsLandingPagesApi,
  publicProjects: cmsPublicProjectsApi,
  testimonials: cmsTestimonialsApi,
  partners: cmsPartnersApi,
  careers: cmsCareersApi,
  mediaAssets: cmsMediaAssetsApi,
  faqs: cmsFaqsApi,
  sitemap: cmsSitemapApi,
  menu: cmsMenuApi,
  seed: cmsSeedApi,
};
