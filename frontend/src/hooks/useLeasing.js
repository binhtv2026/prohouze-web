/**
 * useLeasing.js — B5 Frontend API Hooks (Leasing)
 * React Query hooks với Realtime alerts cho module Cho thuê
 */
import { useQuery, useMutation, useQueryClient } from '@/lib/reactQuery';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const KEYS = {
  assets:      (filters) => ['leasing', 'assets', filters],
  contracts:   (filters) => ['leasing', 'contracts', filters],
  maintenance: (filters) => ['leasing', 'maintenance', filters],
  invoices:    (filters) => ['leasing', 'invoices', filters],
  dashboard:   () => ['leasing', 'dashboard'],
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const useLeasingDashboard = () =>
  useQuery({
    queryKey: KEYS.dashboard(),
    queryFn: async () => {
      const res = await api.get('/leasing/dashboard/stats');
      return res.data;
    },
    staleTime: 3 * 60 * 1000,
    // Realtime: refetch mỗi 5 phút để check hợp đồng sắp hết hạn
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
  });

// ─── ASSETS ──────────────────────────────────────────────────────────────────
export const useLeasingAssets = (filters = {}) =>
  useQuery({
    queryKey: KEYS.assets(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.agent_id) params.set('agent_id', filters.agent_id);
      const res = await api.get(`/leasing/assets?${params}`);
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

export const useCreateAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/leasing/assets', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leasing', 'assets'] });
      toast.success('Đã thêm tài sản mới');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi thêm tài sản'),
  });
};

// ─── CONTRACTS ────────────────────────────────────────────────────────────────
export const useLeasingContracts = (filters = {}) =>
  useQuery({
    queryKey: KEYS.contracts(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      const res = await api.get(`/leasing/contracts?${params}`);
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    select: (data) => {
      // Alert nếu có HĐ sắp hết hạn
      if (data?.alerts?.expiring_soon > 0) {
        // Sẽ show notification khi data load
      }
      return data;
    }
  });

// Hook với side-effect alert tự động
export const useLeasingContractsWithAlerts = () => {
  const query = useLeasingContracts();
  useEffect(() => {
    if (query.data?.alerts?.expiring_soon > 0) {
      toast.warning(
        `⚠️ ${query.data.alerts.expiring_soon} hợp đồng sắp hết hạn trong 30 ngày`,
        { duration: 8000, id: 'expiring-contracts' }
      );
    }
  }, [query.data?.alerts?.expiring_soon]);
  return query;
};

export const useCreateContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/leasing/contracts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leasing', 'contracts'] });
      qc.invalidateQueries({ queryKey: KEYS.dashboard() });
      toast.success('Đã tạo hợp đồng thuê');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi tạo hợp đồng'),
  });
};

export const useRenewContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/leasing/contracts/${id}/renew`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leasing', 'contracts'] });
      toast.success('Đã gia hạn hợp đồng');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi gia hạn'),
  });
};

// ─── MAINTENANCE ──────────────────────────────────────────────────────────────
export const useLeasingMaintenance = (filters = {}) =>
  useQuery({
    queryKey: KEYS.maintenance(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      const res = await api.get(`/leasing/maintenance?${params}`);
      return res.data;
    },
    staleTime: 60 * 1000,
  });

export const useCreateMaintenanceTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/leasing/maintenance', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leasing', 'maintenance'] });
      toast.success('Đã tạo phiếu bảo trì');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi tạo phiếu'),
  });
};

export const useAssignMaintenance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, technician }) => api.patch(`/leasing/maintenance/${id}/assign`, { technician }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leasing', 'maintenance'] });
      toast.success('Đã phân công thợ kỹ thuật');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi phân công'),
  });
};

export const useResolveMaintenance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/leasing/maintenance/${id}/resolve`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leasing', 'maintenance'] });
      toast.success('Đã đánh dấu hoàn thành bảo trì');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi cập nhật'),
  });
};

// ─── INVOICES / PAYMENTS ──────────────────────────────────────────────────────
export const useLeasingInvoices = (filters = {}) =>
  useQuery({
    queryKey: KEYS.invoices(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.month) params.set('month', filters.month);
      const res = await api.get(`/leasing/invoices?${params}`);
      return res.data;
    },
    staleTime: 60 * 1000,
  });

export const useMarkInvoicePaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, method }) => api.post(`/leasing/invoices/${id}/pay`, { method }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leasing', 'invoices'] });
      qc.invalidateQueries({ queryKey: KEYS.dashboard() });
      toast.success('Đã ghi nhận thanh toán');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi ghi nhận'),
  });
};

// B9 — Auto generate invoices
export const useAutoGenerateInvoices = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/leasing/invoices/auto-generate'),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['leasing', 'invoices'] });
      const { generated_count, month } = res.data;
      toast.success(`Đã tạo ${generated_count} hóa đơn tháng ${month}`);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi tạo hóa đơn'),
  });
};
