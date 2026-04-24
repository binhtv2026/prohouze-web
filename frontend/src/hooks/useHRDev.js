/**
 * useHRDev.js — B6 Frontend API Hooks (HR Career Path, Competition, Training)
 * B7 — File upload hook via Storage API
 * B8 — Offline cache via localStorage fallback
 */
import { useQuery, useMutation, useQueryClient } from '@/lib/reactQuery';
import { useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// ─── Offline cache helper (B8) ────────────────────────────────────────────────
const CACHE_TTL = 30 * 60 * 1000; // 30 min

const getCached = (key) => {
  try {
    const raw = localStorage.getItem(`prohouzing_cache_${key}`);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(`prohouzing_cache_${key}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCache = (key, data) => {
  try {
    localStorage.setItem(`prohouzing_cache_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
  } catch { /* storage full */ }
};

const fetchWithOfflineCache = async (cacheKey, fetchFn) => {
  try {
    const data = await fetchFn();
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    const cached = getCached(cacheKey);
    if (cached) {
      toast.info('Đang hiển thị dữ liệu offline (cache)', { id: 'offline-mode' });
      return cached;
    }
    throw err;
  }
};

// ─── CAREER PATH ─────────────────────────────────────────────────────────────
export const useCareerProgress = (userId) =>
  useQuery({
    queryKey: ['hr-dev', 'career', userId],
    queryFn: () =>
      fetchWithOfflineCache(`career_${userId}`, async () => {
        const res = await api.get(`/hr-dev/career-path/${userId}`);
        return res.data;
      }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateCareerProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...data }) => api.patch(`/hr-dev/career-path/${userId}/update`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['hr-dev', 'career', vars.userId] });
      toast.success('Đã cập nhật lộ trình thăng tiến');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi cập nhật'),
  });
};

// ─── BADGES ──────────────────────────────────────────────────────────────────
export const useUserBadges = (userId) =>
  useQuery({
    queryKey: ['hr-dev', 'badges', userId],
    queryFn: () =>
      fetchWithOfflineCache(`badges_${userId}`, async () => {
        const res = await api.get(`/hr-dev/badges/${userId}`);
        return res.data;
      }),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

export const useAwardBadge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, badge, ...data }) =>
      api.post(`/hr-dev/badges/${userId}/award`, { badge, ...data }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['hr-dev', 'badges', vars.userId] });
      toast.success(`🏅 Đã trao huy hiệu thành công!`);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi trao badge'),
  });
};

// ─── COMPETITION LEADERBOARD ─────────────────────────────────────────────────
export const useLeaderboard = (period = 'month') =>
  useQuery({
    queryKey: ['hr-dev', 'leaderboard', period],
    queryFn: () =>
      fetchWithOfflineCache(`leaderboard_${period}`, async () => {
        const res = await api.get(`/hr-dev/competition/leaderboard?period=${period}`);
        return res.data;
      }),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000, // Refresh mỗi 3 phút
  });

export const useMyRank = (userId, period = 'month') =>
  useQuery({
    queryKey: ['hr-dev', 'my-rank', userId, period],
    queryFn: async () => {
      const res = await api.get(`/hr-dev/competition/my-rank/${userId}?period=${period}`);
      return res.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

// ─── TRAINING ─────────────────────────────────────────────────────────────────
export const useTrainingProgress = (userId) =>
  useQuery({
    queryKey: ['hr-dev', 'training', userId],
    queryFn: () =>
      fetchWithOfflineCache(`training_${userId}`, async () => {
        const res = await api.get(`/hr-dev/training/progress/${userId}`);
        return res.data;
      }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

export const useEnrollCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, courseId, title }) =>
      api.post('/hr-dev/training/enroll', { user_id: userId, course_id: courseId, title }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['hr-dev', 'training', vars.userId] });
      toast.success('Đã ghi danh khóa học');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi ghi danh'),
  });
};

export const useUpdateCourseProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, courseId, progress }) =>
      api.patch('/hr-dev/training/progress-update', { user_id: userId, course_id: courseId, progress }),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ['hr-dev', 'training', vars.userId] });
      if (res.data?.progress === 100) {
        toast.success('🎉 Hoàn thành khóa học!');
      }
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi cập nhật tiến độ'),
  });
};

// ─── FILE UPLOAD (B7) ─────────────────────────────────────────────────────────
export const useFileUpload = () => {
  const uploadFile = useCallback(async (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Can use external state for progress bar
          console.log(`Upload: ${pct}%`);
        },
      });
      return res.data; // { url, filename, size }
    } catch (err) {
      toast.error('Lỗi tải file lên. Vui lòng thử lại.');
      throw err;
    }
  }, []);

  const uploadMultiple = useCallback(async (files, folder = 'listings') => {
    const results = await Promise.all(
      Array.from(files).map(file => uploadFile(file, folder))
    );
    return results;
  }, [uploadFile]);

  return { uploadFile, uploadMultiple };
};

// ─── OFFLINE SYNC HELPER (B8) ─────────────────────────────────────────────────
export const useOfflineCache = () => {
  const clearCache = useCallback(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('prohouzing_cache_'))
      .forEach(k => localStorage.removeItem(k));
    toast.success('Đã xóa cache offline');
  }, []);

  const getCacheSize = useCallback(() => {
    let total = 0;
    Object.keys(localStorage)
      .filter(k => k.startsWith('prohouzing_cache_'))
      .forEach(k => { total += (localStorage.getItem(k) || '').length; });
    return `${(total / 1024).toFixed(1)} KB`;
  }, []);

  return { clearCache, getCacheSize, getCached, setCache };
};
