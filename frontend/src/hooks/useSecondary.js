/**
 * useSecondary.js — B4 Frontend API Hooks (Secondary Sales)
 * React Query hooks cho module Thứ cấp
 */
import { useQuery, useMutation, useQueryClient } from '@/lib/reactQuery';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// ─── Query Keys ───────────────────────────────────────────────────────────────
const KEYS = {
  listings:   (filters) => ['secondary', 'listings', filters],
  listing:    (id) => ['secondary', 'listing', id],
  deals:      (filters) => ['secondary', 'deals', filters],
  dashStats:  () => ['secondary', 'dashboard'],
};

// ─── LISTINGS ─────────────────────────────────────────────────────────────────
export const useSecondaryListings = (filters = {}) =>
  useQuery({
    queryKey: KEYS.listings(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.project) params.set('project', filters.project);
      if (filters.agent_id) params.set('agent_id', filters.agent_id);
      const res = await api.get(`/secondary/listings?${params}`);
      return res.data;
    },
    staleTime: 2 * 60 * 1000, // 2 min
  });

export const useSecondaryListing = (id) =>
  useQuery({
    queryKey: KEYS.listing(id),
    queryFn: async () => {
      const res = await api.get(`/secondary/listings/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

export const useCreateListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/secondary/listings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secondary', 'listings'] });
      toast.success('Đã tạo tin đăng thành công');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi tạo tin đăng'),
  });
};

export const useUpdateListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/secondary/listings/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['secondary', 'listings'] });
      qc.invalidateQueries({ queryKey: KEYS.listing(vars.id) });
      toast.success('Đã cập nhật tin đăng');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi cập nhật'),
  });
};

// ─── VALUATION ────────────────────────────────────────────────────────────────
export const useValuationEstimate = () =>
  useMutation({
    mutationFn: (data) => api.post('/secondary/valuation/estimate', data),
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi định giá'),
  });

// ─── DEALS ────────────────────────────────────────────────────────────────────
export const useSecondaryDeals = (filters = {}) =>
  useQuery({
    queryKey: KEYS.deals(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.stage) params.set('stage', filters.stage);
      if (filters.agent_id) params.set('agent_id', filters.agent_id);
      const res = await api.get(`/secondary/deals?${params}`);
      return res.data;
    },
    staleTime: 60 * 1000,
  });

export const useCreateDeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/secondary/deals', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secondary', 'deals'] });
      toast.success('Đã tạo deal mới');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi tạo deal'),
  });
};

export const useUpdateDealStage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }) => api.patch(`/secondary/deals/${id}/stage`, { stage }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secondary', 'deals'] });
      toast.success('Đã cập nhật giai đoạn deal');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi cập nhật'),
  });
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const useSecondaryDashStats = () =>
  useQuery({
    queryKey: KEYS.dashStats(),
    queryFn: async () => {
      const res = await api.get('/secondary/dashboard/stats');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
