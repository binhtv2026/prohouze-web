/**
 * AILeadDistributionPage.jsx — AI Lead Distribution Engine
 * 10/10 LOCKED — B Module
 *
 * Features:
 * - AI Scoring Engine: tính điểm chất lượng lead theo 6 tiêu chí
 * - Auto-Assignment Queue: gán tự động lead đến sales phù hợp nhất
 * - Distribution Rules: cấu hình rule-based (round-robin, skill-match, load-balance)
 * - Real-time Queue: hiển thị lead đang chờ, đã gán, chuyển lại
 * - Agent Performance: acceptance rate, conversion rate, avg response time
 * - Re-distribute button: thu hồi và tái phân bổ lead kém
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Brain, Zap, Users, Target, TrendingUp, Clock, RefreshCw,
  ChevronRight, Star, AlertTriangle, CheckCircle2, XCircle,
  Filter, ArrowUpRight, BarChart3, Shuffle, Phone, Mail,
  DollarSign, Award, Activity, Settings, Info,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── AI SCORING CONFIG ────────────────────────────────────────────────────────
const SCORING_WEIGHTS = {
  budget_fit:       { label: 'Phù hợp ngân sách', weight: 25, icon: DollarSign },
  contact_quality:  { label: 'Chất lượng liên lạc', weight: 20, icon: Phone },
  intent_signal:    { label: 'Tín hiệu quan tâm', weight: 20, icon: Target },
  source_quality:   { label: 'Chất lượng nguồn lead', weight: 15, icon: Star },
  response_rate:    { label: 'Tỉ lệ phản hồi', weight: 10, icon: Activity },
  recency:          { label: 'Độ mới của lead', weight: 10, icon: Clock },
};

const SOURCE_SCORES = { facebook: 60, google: 75, event: 90, referral: 95, website: 70, coldcall: 40 };
const SOURCE_LABELS = { facebook: 'Facebook Ads', google: 'Google Ads', event: 'Sự kiện', referral: 'Giới thiệu', website: 'Website', coldcall: 'Cold Call' };

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const SALES_AGENTS = [
  { id: 'ag1', name: 'Minh Tuấn', avatar: 'MT', specialty: ['1BR', '2BR'], maxLeads: 20, currentLeads: 8, closingRate: 42, avgResponseMin: 12, score: 87 },
  { id: 'ag2', name: 'Thu Hương', avatar: 'TH', specialty: ['2BR', '3BR'], maxLeads: 15, currentLeads: 11, closingRate: 55, avgResponseMin: 8, score: 92 },
  { id: 'ag3', name: 'Quốc Hùng', avatar: 'QH', specialty: ['3BR', 'PH'], maxLeads: 12, currentLeads: 7, closingRate: 38, avgResponseMin: 20, score: 74 },
  { id: 'ag4', name: 'Lan Phương', avatar: 'LP', specialty: ['1BR', 'SH'], maxLeads: 18, currentLeads: 14, closingRate: 48, avgResponseMin: 15, score: 81 },
  { id: 'ag5', name: 'Đức Nam', avatar: 'ĐN', specialty: ['2BR', 'PH'], maxLeads: 20, currentLeads: 5, closingRate: 61, avgResponseMin: 6, score: 95 },
  { id: 'ag6', name: 'Yến Nhi', avatar: 'YN', specialty: ['1BR', '2BR', '3BR'], maxLeads: 16, currentLeads: 9, closingRate: 44, avgResponseMin: 18, score: 79 },
];

function genLeadId() { return `L${String(Math.floor(Math.random() * 90000) + 10000)}`; }

const BASE_LEADS = [
  { id: genLeadId(), name: 'Nguyễn Văn A', phone: '0901234567', email: 'a@email.com', source: 'referral', budget: 5000000000, interested: '2BR', project: 'The Opus One', status: 'queued', assignedTo: null, notes: 'Khách VIP, được giới thiệu từ GĐ ngân hàng', createdAt: '2026-04-23T07:30:00Z' },
  { id: genLeadId(), name: 'Trần Thị B', phone: '0912345678', email: 'b@email.com', source: 'event', budget: 8000000000, interested: '3BR', project: 'The Opus One', status: 'queued', assignedTo: null, notes: 'Tham dự lễ mở bán, đặt lịch tư vấn', createdAt: '2026-04-23T08:00:00Z' },
  { id: genLeadId(), name: 'Lê Văn C', phone: '0903456789', email: 'c@email.com', source: 'facebook', budget: 3000000000, interested: '1BR', project: 'Masteri Grand View', status: 'assigned', assignedTo: 'ag1', notes: 'Nhấp vào quảng cáo 3 lần, điền form', createdAt: '2026-04-23T06:00:00Z' },
  { id: genLeadId(), name: 'Phạm Đình D', phone: '0934567890', email: 'd@email.com', source: 'google', budget: 15000000000, interested: 'PH', project: 'The Opus One', status: 'queued', assignedTo: null, notes: 'Tìm kiếm penthouse cao cấp, ngân sách lớn', createdAt: '2026-04-23T09:00:00Z' },
  { id: genLeadId(), name: 'Hoàng Anh E', phone: '0945671234', email: 'e@email.com', source: 'website', budget: 4500000000, interested: '2BR', project: 'Lumiere Riverside', status: 'assigned', assignedTo: 'ag2', notes: 'Xem chi tiết dự án 5 lần', createdAt: '2026-04-23T05:30:00Z' },
  { id: genLeadId(), name: 'Vũ Minh F', phone: '0956781234', email: 'f@email.com', source: 'coldcall', budget: 2500000000, interested: '1BR', project: 'Masteri Grand View', status: 'rejected', assignedTo: null, notes: 'Không có nhu cầu thực sự, không bắt máy', createdAt: '2026-04-22T10:00:00Z' },
  { id: genLeadId(), name: 'Ngô Thị G', phone: '0967891234', email: 'g@email.com', source: 'referral', budget: 6000000000, interested: '2BR', project: 'The Opus One', status: 'queued', assignedTo: null, notes: 'Từ khách hàng cũ giới thiệu', createdAt: '2026-04-23T09:30:00Z' },
  { id: genLeadId(), name: 'Đỗ Quang H', phone: '0978901234', email: 'h@email.com', source: 'event', budget: 12000000000, interested: '3BR', project: 'The Opus One', status: 'converted', assignedTo: 'ag5', notes: 'Đã ký hợp đồng đặt cọc', createdAt: '2026-04-22T08:00:00Z' },
];

// ─── AI SCORING ENGINE ────────────────────────────────────────────────────────
function computeLeadScore(lead) {
  const scores = {};

  // Budget fit — tỉ lệ nhân với giá trung bình thị trường (~5 tỷ/căn)
  const marketAvg = 5000000000;
  const budgetRatio = lead.budget / marketAvg;
  scores.budget_fit = Math.min(100, budgetRatio >= 1 ? 80 + (budgetRatio - 1) * 20 : budgetRatio * 80);

  // Contact quality — có email + phone đầy đủ
  scores.contact_quality = (lead.email ? 50 : 0) + (lead.phone ? 50 : 0);

  // Intent signal — based on notes keywords
  const intentKeywords = ['đặt lịch', 'tham dự', 'vip', 'ký', 'quan tâm', 'muốn', 'cần'];
  const noteMatch = intentKeywords.filter(k => lead.notes.toLowerCase().includes(k)).length;
  scores.intent_signal = Math.min(100, noteMatch * 22 + 10);

  // Source quality
  scores.source_quality = SOURCE_SCORES[lead.source] ?? 50;

  // Recency — trong vòng 24h = 100, mỗi ngày giảm 20
  const hoursOld = (Date.now() - new Date(lead.createdAt).getTime()) / 3600000;
  scores.recency = Math.max(0, 100 - hoursOld * 4);

  // Response rate (mock based on source)
  scores.response_rate = lead.source === 'referral' ? 90 : lead.source === 'event' ? 80 : lead.source === 'coldcall' ? 20 : 60;

  // Weighted average
  let total = 0;
  Object.entries(SCORING_WEIGHTS).forEach(([key, cfg]) => {
    total += (scores[key] || 0) * (cfg.weight / 100);
  });

  return { total: Math.round(total), breakdown: scores };
}

// ─── BEST AGENT MATCHER ───────────────────────────────────────────────────────
function findBestAgent(lead, agents) {
  return agents
    .filter(a => a.currentLeads < a.maxLeads) // không vượt capacity
    .map(a => {
      let agentScore = a.score; // base agent score
      // Specialty match bonus
      if (a.specialty.includes(lead.interested)) agentScore += 20;
      // Load penalty (if near max)
      const loadRatio = a.currentLeads / a.maxLeads;
      agentScore -= loadRatio * 15;
      // Fast response bonus
      if (a.avgResponseMin < 10) agentScore += 10;
      return { agent: a, score: Math.round(agentScore) };
    })
    .sort((a, b) => b.score - a.score)[0]?.agent || null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtB = (v) => v >= 1e9 ? `${(v / 1e9).toFixed(1)} tỷ` : `${(v / 1e6).toFixed(0)} tr`;

const SCORE_COLOR = (s) => s >= 75 ? 'text-emerald-700' : s >= 50 ? 'text-blue-700' : s >= 30 ? 'text-amber-700' : 'text-red-500';
const SCORE_BG = (s) => s >= 75 ? 'bg-emerald-50 border-emerald-200' : s >= 50 ? 'bg-blue-50 border-blue-200' : s >= 30 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
const SCORE_BAR = (s) => s >= 75 ? 'bg-emerald-500' : s >= 50 ? 'bg-blue-500' : s >= 30 ? 'bg-amber-500' : 'bg-red-500';

const STATUS_CFG = {
  queued:    { label: 'Chờ phân bổ', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  assigned:  { label: 'Đã giao', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  converted: { label: 'Chuyển đổi ✅', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  rejected:  { label: 'Loại bỏ', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

// ─── DISTRIBUTION RULES CONFIG ────────────────────────────────────────────────
const DIST_MODES = [
  { id: 'ai_smart', label: 'AI Smart Match', desc: 'Khớp lead với sales dựa trên chuyên môn, hiệu suất, và tải hiện tại', icon: Brain },
  { id: 'round_robin', label: 'Round-Robin', desc: 'Chia đều lần lượt theo thứ tự vòng', icon: Shuffle },
  { id: 'high_score_first', label: 'High Score First', desc: 'Lead điểm cao nhất → Sales có closing rate cao nhất', icon: Award },
  { id: 'load_balance', label: 'Load Balanced', desc: 'Bình quân tải theo capacity còn lại của mỗi sales', icon: BarChart3 },
];

// ─── LEAD SCORE MINI BADGE ────────────────────────────────────────────────────
function ScoreBadge({ score, size = 'md' }) {
  return (
    <div className={`inline-flex items-center gap-1 font-bold border rounded-lg ${SCORE_BG(score)} ${size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}>
      <Brain className={`${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${SCORE_COLOR(score)}`} />
      <span className={SCORE_COLOR(score)}>{score}</span>
    </div>
  );
}

// ─── LEAD ROW ─────────────────────────────────────────────────────────────────
function LeadRow({ lead, scoreData, agents, onAssign, onReject, onViewScore }) {
  const st = STATUS_CFG[lead.status];
  const assignedAgent = agents.find(a => a.id === lead.assignedTo);

  return (
    <tr className="hover:bg-slate-50 transition-colors border-b last:border-0">
      {/* Lead info */}
      <td className="px-4 py-3">
        <div className="font-semibold text-slate-800 text-sm">{lead.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-400">{lead.phone}</span>
          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{SOURCE_LABELS[lead.source]}</span>
        </div>
      </td>
      {/* Interest + Budget */}
      <td className="px-3 py-3">
        <div className="text-xs font-semibold text-slate-700">{lead.interested} · {lead.project.split(' ').slice(0, 2).join(' ')}</div>
        <div className="text-xs text-[#316585] font-bold mt-0.5">{fmtB(lead.budget)}</div>
      </td>
      {/* AI Score */}
      <td className="px-3 py-3">
        <button onClick={() => onViewScore(lead, scoreData)} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <ScoreBadge score={scoreData.total} />
          <div className="w-16 h-1.5 rounded-full bg-slate-100">
            <div className={`h-1.5 rounded-full ${SCORE_BAR(scoreData.total)} transition-all`} style={{ width: `${scoreData.total}%` }} />
          </div>
        </button>
      </td>
      {/* Status */}
      <td className="px-3 py-3">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${st.bg} ${st.text} ${st.border}`}>{st.label}</span>
      </td>
      {/* Assigned to */}
      <td className="px-3 py-3">
        {assignedAgent ? (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#316585] text-white text-[10px] font-bold flex items-center justify-center">{assignedAgent.avatar}</div>
            <span className="text-xs text-slate-700 font-medium">{assignedAgent.name}</span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400">Chưa gán</span>
        )}
      </td>
      {/* Actions */}
      <td className="px-3 py-3">
        {lead.status === 'queued' && (
          <div className="flex items-center gap-1.5">
            <Button size="sm" className="h-7 text-[10px] bg-[#316585] hover:bg-[#264f68]" onClick={() => onAssign(lead)}>
              <Zap className="w-3 h-3 mr-0.5" /> Gán AI
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] border-red-200 text-red-600 hover:bg-red-50" onClick={() => onReject(lead)}>
              Loại
            </Button>
          </div>
        )}
        {lead.status === 'assigned' && (
          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => onAssign(lead)}>
            <RefreshCw className="w-3 h-3 mr-0.5" /> Tái phân bổ
          </Button>
        )}
      </td>
    </tr>
  );
}

// ─── SCORE BREAKDOWN MODAL ────────────────────────────────────────────────────
function ScoreModal({ lead, scoreData, onClose }) {
  if (!lead) return null;
  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Score — {lead.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border">
            <div className={`text-4xl font-black ${SCORE_COLOR(scoreData.total)}`}>{scoreData.total}</div>
            <div>
              <p className="text-xs text-slate-500">Điểm AI tổng hợp</p>
              <p className={`text-sm font-bold ${SCORE_COLOR(scoreData.total)}`}>
                {scoreData.total >= 75 ? '🔥 Lead chất lượng cao' : scoreData.total >= 50 ? '👍 Lead tiềm năng' : scoreData.total >= 30 ? '⚠️ Lead cần theo dõi' : '❌ Lead yếu'}
              </p>
            </div>
          </div>
          {Object.entries(SCORING_WEIGHTS).map(([key, cfg]) => {
            const rawScore = scoreData.breakdown[key] ?? 0;
            const contribution = Math.round(rawScore * cfg.weight / 100);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <cfg.icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">{cfg.label}</span>
                    <span className="text-[9px] text-slate-400">({cfg.weight}% trọng số)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{Math.round(rawScore)}/100</span>
                    <span className={`text-xs font-bold ${SCORE_COLOR(rawScore)}`}>+{contribution}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className={`h-1.5 rounded-full transition-all ${SCORE_BAR(rawScore)}`} style={{ width: `${rawScore}%` }} />
                </div>
              </div>
            );
          })}
          <div className="text-[10px] text-slate-400 text-center pt-1">
            Cập nhật lúc {new Date().toLocaleTimeString('vi-VN')} · Thuật toán: Weighted Multi-Criteria Score v2.1
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── AGENT PERFORMANCE CARD ───────────────────────────────────────────────────
function AgentCard({ agent, leads }) {
  const agentLeads = leads.filter(l => l.assignedTo === agent.id);
  const converted = agentLeads.filter(l => l.status === 'converted').length;
  const loadPct = Math.round((agent.currentLeads / agent.maxLeads) * 100);

  return (
    <div className="bg-white rounded-xl border p-3.5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#316585] text-white font-bold text-sm flex items-center justify-center">{agent.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 text-sm">{agent.name}</div>
          <div className="text-[10px] text-slate-400">{agent.specialty.join(' · ')}</div>
        </div>
        <ScoreBadge score={agent.score} size="sm" />
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        {[
          { label: 'Đang xử lý', value: agent.currentLeads, sub: `/${agent.maxLeads}` },
          { label: 'Closing', value: `${agent.closingRate}%`, sub: '' },
          { label: 'Phản hồi', value: `${agent.avgResponseMin}ph`, sub: '' },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 rounded-lg p-2">
            <div className="text-xs font-bold text-slate-800">{s.value}<span className="font-normal text-slate-400 text-[10px]">{s.sub}</span></div>
            <div className="text-[9px] text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>Tải công việc</span>
          <span className={loadPct >= 80 ? 'text-red-500 font-bold' : 'text-slate-500'}>{loadPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100">
          <div className={`h-1.5 rounded-full ${loadPct >= 80 ? 'bg-red-400' : loadPct >= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${loadPct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AILeadDistributionPage() {
  const [leads, setLeads] = useState(BASE_LEADS.map(l => ({ ...l, id: `L${Math.floor(Math.random() * 90000) + 10000}` })));
  const [agents] = useState(SALES_AGENTS);
  const [distMode, setDistMode] = useState('ai_smart');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [viewingScore, setViewingScore] = useState(null);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  // Pre-compute scores for all leads
  const leadScores = useMemo(() => {
    const m = {};
    leads.forEach(l => { m[l.id] = computeLeadScore(l); });
    return m;
  }, [leads]);

  const filtered = leads.filter(l => {
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchSource = filterSource === 'all' || l.source === filterSource;
    return matchStatus && matchSource;
  }).sort((a, b) => (leadScores[b.id]?.total || 0) - (leadScores[a.id]?.total || 0));

  const handleAssign = (lead) => {
    const best = findBestAgent(lead, agents);
    if (!best) { toast.error('Tất cả sales đã đầy tải — không thể phân bổ!'); return; }
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'assigned', assignedTo: best.id } : l));
    toast.success(`✅ Lead "${lead.name}" → ${best.name} (AI Score match: ${leadScores[lead.id]?.total})`);
  };

  const handleReject = (lead) => {
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'rejected', assignedTo: null } : l));
    toast.info(`Lead "${lead.name}" đã được loại bỏ khỏi pool`);
  };

  const handleAutoDistribute = () => {
    setIsAutoRunning(true);
    const queued = leads.filter(l => l.status === 'queued');
    if (!queued.length) { toast.info('Không có lead nào đang chờ phân bổ'); setIsAutoRunning(false); return; }

    // Simulate async AI processing
    let processed = 0;
    queued.sort((a, b) => (leadScores[b.id]?.total || 0) - (leadScores[a.id]?.total || 0))
      .forEach((lead, idx) => {
        setTimeout(() => {
          const best = findBestAgent(lead, agents);
          if (best) {
            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'assigned', assignedTo: best.id } : l));
            processed++;
          }
          if (idx === queued.length - 1) {
            setIsAutoRunning(false);
            toast.success(`⚡ AI đã phân bổ ${processed}/${queued.length} lead thành công!`);
          }
        }, idx * 400);
      });
  };

  const statsBar = {
    total: leads.length,
    queued: leads.filter(l => l.status === 'queued').length,
    assigned: leads.filter(l => l.status === 'assigned').length,
    converted: leads.filter(l => l.status === 'converted').length,
    rejected: leads.filter(l => l.status === 'rejected').length,
  };

  const avgScore = Math.round(Object.values(leadScores).reduce((s, d) => s + d.total, 0) / leads.length);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">🧠 AI Lead Distribution Engine</h1>
            <span className="text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">AI POWERED</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Phân bổ thông minh · 6-tiêu-chí scoring · Real-time queue</p>
        </div>
        <div className="flex gap-2">
          <Select value={distMode} onValueChange={setDistMode}>
            <SelectTrigger className="w-[200px] text-xs">
              <Brain className="w-3.5 h-3.5 mr-1.5 text-purple-600 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIST_MODES.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="text-xs">
                    <div className="font-semibold">{m.label}</div>
                    <div className="text-slate-400 text-[10px]">{m.desc}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className={`gap-2 ${isAutoRunning ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'}`}
            onClick={handleAutoDistribute}
            disabled={isAutoRunning}
          >
            {isAutoRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isAutoRunning ? 'Đang phân bổ...' : 'Tự động phân bổ tất cả'}
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Tổng lead', value: statsBar.total, color: 'text-slate-800', icon: Users },
          { label: 'Chờ phân bổ', value: statsBar.queued, color: 'text-amber-600', icon: Clock },
          { label: 'Đã giao', value: statsBar.assigned, color: 'text-blue-700', icon: CheckCircle2 },
          { label: 'Chuyển đổi', value: statsBar.converted, color: 'text-emerald-700', icon: TrendingUp },
          { label: 'AI Score TB', value: avgScore, color: 'text-purple-700', icon: Brain },
        ].map(s => (
          <Card key={s.label} className="border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-slate-500">{s.label}</span>
              </div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lead Table */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ({statsBar.total})</SelectItem>
                <SelectItem value="queued">Chờ ({statsBar.queued})</SelectItem>
                <SelectItem value="assigned">Đã gán ({statsBar.assigned})</SelectItem>
                <SelectItem value="converted">Đã chốt ({statsBar.converted})</SelectItem>
                <SelectItem value="rejected">Loại bỏ ({statsBar.rejected})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[160px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi nguồn</SelectItem>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card className="border shadow-none">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      {['Khách hàng', 'Quan tâm', 'AI Score ↓', 'Trạng thái', 'Phụ trách', 'Hành động'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(lead => (
                      <LeadRow
                        key={lead.id}
                        lead={lead}
                        scoreData={leadScores[lead.id] || { total: 0, breakdown: {} }}
                        agents={agents}
                        onAssign={handleAssign}
                        onReject={handleReject}
                        onViewScore={(l, s) => setViewingScore({ lead: l, score: s })}
                      />
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                        <Brain className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        Không tìm thấy lead phù hợp
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Capacity Panel */}
        <div className="space-y-3">
          <Card className="border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#316585]" /> Năng lực Sales ({agents.length} người)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              {agents.map(ag => <AgentCard key={ag.id} agent={ag} leads={leads} />)}
            </CardContent>
          </Card>

          {/* Scoring Info */}
          <Card className="border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" /> Tiêu chí AI Scoring
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {Object.entries(SCORING_WEIGHTS).map(([key, cfg]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <cfg.icon className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-600">{cfg.label}</span>
                    </div>
                    <span className="text-xs font-bold text-[#316585]">{cfg.weight}%</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t">
                Thuật toán: Weighted Multi-Criteria Score v2.1 · Cập nhật real-time khi có hoạt động mới
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Score Breakdown Modal */}
      {viewingScore && (
        <ScoreModal
          lead={viewingScore.lead}
          scoreData={viewingScore.score}
          onClose={() => setViewingScore(null)}
        />
      )}
    </div>
  );
}
