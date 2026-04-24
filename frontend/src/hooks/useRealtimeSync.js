/**
 * useRealtimeSync.js — E2
 * React Query + Supabase Realtime subscriptions
 * Live sync cho Secondary, Leasing, HR, Notifications
 */
import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@/lib/reactQuery';
import { subscribeToTable, subscribeInserts, db } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// ─── E2a: Realtime Lease Contracts ────────────────────────────────────────────
export const useRealtimeContracts = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['realtime', 'lease-contracts'],
    queryFn: () => db.findAll('lease_contracts', {}, { order: { column: 'created_at' }, limit: 100 }),
    staleTime: 2 * 60 * 1000,
    retry: false,
    onError: () => {}, // Fail silently — demo data còn đó
  });

  useEffect(() => {
    const cleanup = subscribeToTable('lease_contracts', (payload) => {
      // Invalidate + refetch khi DB thay đổi
      qc.invalidateQueries({ queryKey: ['realtime', 'lease-contracts'] });
      qc.invalidateQueries({ queryKey: ['leasing', 'contracts'] });
      qc.invalidateQueries({ queryKey: ['leasing', 'dashboard'] });

      if (payload.eventType === 'INSERT') {
        toast.info(`📋 Hợp đồng mới: ${payload.new.tenant_name}`);
      } else if (payload.eventType === 'UPDATE' && payload.new.status !== payload.old?.status) {
        const labels = { active: '✅ Đang hiệu lực', expiring_soon: '⚠️ Sắp hết hạn', expired: '❌ Đã hết hạn' };
        toast.info(`HĐ ${payload.new.asset_code}: ${labels[payload.new.status] || payload.new.status}`);
      }
    });
    return cleanup;
  }, [qc]);

  return { data, isLoading };
};

// ─── E2b: Realtime Secondary Listings ────────────────────────────────────────
export const useRealtimeListings = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['realtime', 'secondary-listings'],
    queryFn: () => db.findAll('secondary_listings', {}, { order: { column: 'created_at' }, limit: 200 }),
    staleTime: 2 * 60 * 1000,
    retry: false,
    onError: () => {},
  });

  useEffect(() => {
    const cleanup = subscribeToTable('secondary_listings', (payload) => {
      qc.invalidateQueries({ queryKey: ['secondary', 'listings'] });
      qc.invalidateQueries({ queryKey: ['realtime', 'secondary-listings'] });

      if (payload.eventType === 'UPDATE' && payload.new.status === 'sold') {
        toast.success(`🎉 Tin đăng ${payload.new.code} đã bán!`);
      }
    });
    return cleanup;
  }, [qc]);

  return { data, isLoading };
};

// ─── E2c: Realtime Notifications ─────────────────────────────────────────────
export const useRealtimeNotifications = (userId) => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['realtime', 'notifications', userId],
    queryFn: () => db.findAll('notifications', { user_id: userId, is_read: false },
      { order: { column: 'created_at' }, limit: 50 }),
    enabled: !!userId,
    staleTime: 60 * 1000,
    retry: false,
    onError: () => {},
  });

  useEffect(() => {
    if (!userId) return;
    const cleanup = subscribeInserts('notifications', (newNotif) => {
      if (newNotif.user_id === userId || !newNotif.user_id) {
        qc.invalidateQueries({ queryKey: ['realtime', 'notifications'] });

        // Show browser notification nếu page background
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('ProHouze', {
            body: newNotif.message || 'Bạn có thông báo mới',
            icon: '/favicon.ico',
          });
        } else {
          toast.info(`🔔 ${newNotif.message || 'Thông báo mới'}`, { duration: 5000 });
        }
      }
    });
    return cleanup;
  }, [userId, qc]);

  return { unreadCount: data?.length || 0, notifications: data, isLoading };
};

// ─── E2d: Realtime HR Competition ─────────────────────────────────────────────
export const useRealtimeLeaderboard = (period = 'month') => {
  const qc = useQueryClient();

  useEffect(() => {
    const cleanup = subscribeUpdates('hr_competition_results', (updated) => {
      if (updated.period_type === period) {
        qc.invalidateQueries({ queryKey: ['hr-dev', 'leaderboard', period] });
        toast.info(`🏆 Bảng xếp hạng ${period} vừa cập nhật!`);
      }
    });
    return cleanup;
  }, [period, qc]);
};

// ─── E2e: Connection status hook ──────────────────────────────────────────────
export const useSupabaseStatus = () => {
  return useQuery({
    queryKey: ['system', 'supabase-status'],
    queryFn: async () => {
      try {
        const { checkSupabaseConnection } = await import('@/lib/supabaseClient');
        return await checkSupabaseConnection();
      } catch {
        return { connected: false, error: 'Import failed' };
      }
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });
};
