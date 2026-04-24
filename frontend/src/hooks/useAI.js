/**
 * useAI.js — Phase D: React Query hooks cho toàn bộ AI features
 * D1: Valuation | D2: Lead Scoring | D3: Chat | D4: Deal Prediction
 * D5: Smart Notif | D6: Content Gen | D7: Recommend | D8: KPI Coaching | D9: Sentiment
 */
import { useQuery, useMutation, useQueryClient } from '@/lib/reactQuery';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// ─── D1: AI Valuation ─────────────────────────────────────────────────────────
export const useAIValuation = () =>
  useMutation({
    mutationFn: (data) => api.post('/ai/valuation/estimate', data).then(r => r.data),
    onError: () => toast.error('Lỗi định giá AI. Kiểm tra kết nối.'),
  });

export const useAIBatchValuation = () =>
  useMutation({
    mutationFn: (units) => api.post('/ai/valuation/batch', { units }).then(r => r.data),
    onSuccess: (data) => toast.success(`Định giá xong ${data.total} căn`),
    onError:   () => toast.error('Lỗi định giá hàng loạt'),
  });

// ─── D2: Lead Scoring ─────────────────────────────────────────────────────────
export const useLeadScore = () =>
  useMutation({
    mutationFn: (leadData) => api.post('/ai/lead-score', leadData).then(r => r.data),
    onSuccess: (data) => {
      const emoji = { HOT: '🔥', WARM: '🌡️', COOL: '💙', COLD: '❄️' }[data.tier] || '🎯';
      toast.success(`${emoji} Lead: ${data.tier} (${data.score} điểm)`);
    },
    onError: () => toast.error('Lỗi chấm điểm lead'),
  });

export const useBatchLeadScore = () =>
  useMutation({
    mutationFn: (leads) => api.post('/ai/lead-score/batch', { leads }).then(r => r.data),
    onSuccess: (data) => toast.success(`Đã chấm điểm ${data.total} lead`),
    onError:   () => toast.error('Lỗi chấm điểm hàng loạt'),
  });

// ─── D3: Chat ─────────────────────────────────────────────────────────────────
export const useChatMessage = () =>
  useMutation({
    mutationFn: ({ message, conversationId }) =>
      api.post('/ai/chat/message', { message, conversation_id: conversationId }).then(r => r.data),
    onError: () => toast.error('Lỗi kết nối AI Assistant'),
  });

export const useChatQuickActions = () =>
  useQuery({
    queryKey: ['ai', 'chat-quick-actions'],
    queryFn: () => api.get('/ai/chat/quick-actions').then(r => r.data.quick_actions),
    staleTime: Infinity, // never refetch
  });

// ─── D4: Deal Prediction ──────────────────────────────────────────────────────
export const useDealPrediction = () =>
  useMutation({
    mutationFn: (dealData) => api.post('/ai/deal/prediction', dealData).then(r => r.data),
    onSuccess: (data) => {
      if (data.win_probability < 30) {
        toast.warning(`⚠️ Deal đang có rủi ro cao (${data.win_probability}%)`);
      }
    },
    onError: () => toast.error('Lỗi phân tích deal'),
  });

// ─── D5: Smart Notifications ──────────────────────────────────────────────────
export const useSmartNotifPriority = () =>
  useMutation({
    mutationFn: (notifications) =>
      api.post('/ai/smart-notif/prioritize', { notifications }).then(r => r.data),
    onError: () => toast.error('Lỗi phân tích thông báo'),
  });

// ─── D6: Content Generator ────────────────────────────────────────────────────
export const useContentGenerate = () =>
  useMutation({
    mutationFn: (params) => api.post('/ai/content/generate', params).then(r => r.data),
    onSuccess: () => toast.success('🖊️ Đã tạo nội dung thành công'),
    onError: (err) => toast.error(err.response?.data?.detail || 'Lỗi tạo nội dung'),
  });

export const useContentTemplates = () =>
  useQuery({
    queryKey: ['ai', 'content-templates'],
    queryFn: () => api.get('/ai/content/templates').then(r => r.data.templates),
    staleTime: 30 * 60 * 1000,
  });

// ─── D7: Product Recommendation ──────────────────────────────────────────────
export const useProductRecommend = () =>
  useMutation({
    mutationFn: (criteria) => api.post('/ai/recommend/products', criteria).then(r => r.data),
    onSuccess: (data) => {
      if (data.total > 0) {
        toast.success(`💡 Tìm thấy ${data.total} sản phẩm phù hợp`);
      } else {
        toast.info('Không có sản phẩm phù hợp. Thử điều chỉnh budget.');
      }
    },
    onError: () => toast.error('Lỗi gợi ý sản phẩm'),
  });

// ─── D8: KPI Coaching ─────────────────────────────────────────────────────────
export const useKPICoaching = (userId) =>
  useQuery({
    queryKey: ['ai', 'kpi-coaching', userId],
    queryFn: async () => {
      // Fetch KPI data từ HR module + gọi AI coaching
      const kpiRes = await api.get('/ai/kpi/coaching').catch(() => null);
      return kpiRes?.data || null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

export const useKPICoachingAnalyze = () =>
  useMutation({
    mutationFn: (kpiData) => api.post('/ai/kpi/coaching', kpiData).then(r => r.data),
    onSuccess: (data) => {
      if (!data.summary.on_track) {
        toast.warning('📊 KPI đang chậm tiến độ — xem gợi ý từ AI');
      }
    },
    onError: () => toast.error('Lỗi phân tích KPI'),
  });

// ─── D9: Sentiment ────────────────────────────────────────────────────────────
export const useSentimentAnalysis = () =>
  useMutation({
    mutationFn: (text) => api.post('/ai/sentiment', { text }).then(r => r.data),
    onSuccess: (data) => {
      const map = { positive: '😊 Tích cực', neutral: '😐 Trung lập', negative: '😟 Tiêu cực' };
      toast.info(`Cảm xúc: ${map[data.sentiment]} (${data.score}%)`);
    },
    onError: () => toast.error('Lỗi phân tích cảm xúc'),
  });

// ─── D10: AI Dashboard ────────────────────────────────────────────────────────
export const useAIDashboard = (userId) =>
  useQuery({
    queryKey: ['ai', 'dashboard', userId],
    queryFn: () => api.get(`/ai/dashboard?user_id=${userId || 'demo'}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000, // Refresh mỗi 10 phút
  });
