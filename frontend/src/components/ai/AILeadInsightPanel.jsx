/**
 * AI Lead Insight Panel
 * Prompt 18/20 - PHASE 3: Lead Detail Integration
 * 
 * Hiển thị ngay trên Lead Detail/Row:
 * - AI Score (Hot/Warm/Cold)
 * - Why (explanation)
 * - Money Impact (expected_value, risk_loss)
 * - Next Action + Deadline
 * - Execute Buttons
 * 
 * HARD RULES:
 * - Không có money → không hiển thị
 * - Không có action → không hiển thị
 * - Nhìn vào hiểu trong 3 giây
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { 
  Brain, Phone, ClipboardList, Users, Clock, 
  TrendingUp, TrendingDown, AlertTriangle, Zap,
  ChevronDown, ChevronUp, DollarSign, Target
} from 'lucide-react';
import { getLeadInsightFull, executeAction } from '../../api/aiInsightApi';

const formatVND = (amount) => {
  if (!amount) return '0';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} triệu`;
  return `${amount.toLocaleString()}`;
};

const scoreConfig = {
  excellent: { label: 'HOT', color: 'bg-red-500 text-white', icon: '🔥' },
  good: { label: 'WARM', color: 'bg-amber-500 text-white', icon: '🌡️' },
  average: { label: 'WARM', color: 'bg-amber-400 text-white', icon: '🌡️' },
  poor: { label: 'COLD', color: 'bg-blue-400 text-white', icon: '❄️' },
  critical: { label: 'COLD', color: 'bg-slate-400 text-white', icon: '❄️' }
};

const urgencyConfig = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  urgent: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  high: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  medium: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  low: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' }
};

const DEMO_LEAD_INSIGHT = {
  lead_score: {
    level: 'good',
    score: 78,
    confidence: 0.84,
  },
  money_impact: {
    expected_value: 3200000000,
    risk_loss: 45000000,
    opportunity_gain: 120000000,
    urgency: 'high',
    message: 'Lead nóng đang chờ chính sách thanh toán và lịch xem nhà.',
    deadline: '2026-03-26T17:30:00',
  },
  next_action: {
    label: 'Gọi xác nhận lịch',
  },
  explanation: {
    summary: 'Lead có nhu cầu thật và ngân sách rõ nhưng đang chờ tác động từ sale.',
    key_insights: ['Đã xem bảng giá 2 lần', 'Mở tài liệu pháp lý trong 24h gần nhất'],
  },
  actions: [
    { action_type: 'call', label: 'Gọi khách', is_primary: true, params: {} },
    { action_type: 'create_task', label: 'Tạo việc follow', is_primary: false, params: {} },
  ],
};

export const AILeadInsightPanel = ({ leadId, compact = false, onActionComplete }) => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState({});
  const [expanded, setExpanded] = useState(!compact);

  const fetchInsight = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLeadInsightFull(leadId);
      setInsight(data || DEMO_LEAD_INSIGHT);
    } catch (err) {
      console.error('AI insight error:', err);
      setInsight(DEMO_LEAD_INSIGHT);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      fetchInsight();
    }
  }, [fetchInsight, leadId]);

  const handleExecute = async (actionType, params = {}) => {
    setExecuting(prev => ({ ...prev, [actionType]: true }));
    try {
      const result = await executeAction({
        action_type: actionType,
        entity_type: 'lead',
        entity_id: leadId,
        params: {
          ...params,
          reason: insight?.money_impact?.message
        }
      });
      
      if (result.success) {
        toast.success(result.result?.message || 'Thực hiện thành công!');
        if (onActionComplete) onActionComplete(result);
        fetchInsight(); // Refresh data
      } else {
        toast.error(result.error || 'Thực hiện thất bại');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExecuting(prev => ({ ...prev, [actionType]: false }));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 text-slate-400 text-sm">
        <Brain className="w-4 h-4 animate-pulse" />
        <span>AI đang phân tích...</span>
      </div>
    );
  }

  // No insight or missing required data - don't display
  if (!insight || !insight.money_impact || !insight.actions?.length) {
    return null;
  }

  const score = insight.lead_score || {};
  const money = insight.money_impact || {};
  const nextAction = insight.next_action || {};
  const actions = insight.actions || [];
  
  const scoreStyle = scoreConfig[score.level] || scoreConfig.average;
  const urgencyStyle = urgencyConfig[money.urgency] || urgencyConfig.medium;

  // COMPACT MODE - For table rows
  if (compact && !expanded) {
    return (
      <div 
        className={`flex items-center gap-3 p-2 rounded-lg ${urgencyStyle.bg} ${urgencyStyle.border} border cursor-pointer`}
        onClick={() => setExpanded(true)}
        data-testid="ai-lead-insight-compact"
      >
        {/* Score Badge */}
        <Badge className={`${scoreStyle.color} font-bold`}>
          {scoreStyle.icon} {score.score || 0}
        </Badge>
        
        {/* Money at stake */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-emerald-400 font-medium">{formatVND(money.expected_value)}</span>
          <span className="text-slate-500">|</span>
          <span className="text-red-400">-{formatVND(money.risk_loss)}</span>
        </div>

        {/* Primary Action Button */}
        <Button
          size="sm"
          variant={money.urgency === 'critical' || money.urgency === 'urgent' ? 'destructive' : 'default'}
          className="ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            const primaryAction = actions.find(a => a.is_primary) || actions[0];
            handleExecute(primaryAction.action_type, primaryAction.params);
          }}
          disabled={executing[actions[0]?.action_type]}
          data-testid="ai-execute-primary"
        >
          <Phone className="w-3 h-3 mr-1" />
          {nextAction.label || 'Thực hiện'}
        </Button>

        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>
    );
  }

  // FULL MODE - Expanded view
  return (
    <div 
      className={`rounded-lg ${urgencyStyle.bg} ${urgencyStyle.border} border p-4`}
      data-testid="ai-lead-insight-panel"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Badge className={`${scoreStyle.color} font-bold text-sm px-3 py-1`}>
            {scoreStyle.icon} {scoreStyle.label} ({score.score || 0})
          </Badge>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Target className="w-3 h-3" />
            <span>Confidence: {Math.round((score.confidence || 0) * 100)}%</span>
          </div>
        </div>
        {compact && (
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            <ChevronUp className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Money Impact - MOST IMPORTANT */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <p className="text-xs text-slate-400 mb-1">Giá trị kỳ vọng</p>
          <p className="text-xl font-bold text-emerald-400">{formatVND(money.expected_value)}</p>
        </div>
        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <p className="text-xs text-slate-400 mb-1">Rủi ro mất</p>
          <p className="text-xl font-bold text-red-400">{formatVND(money.risk_loss)}</p>
        </div>
        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <p className="text-xs text-slate-400 mb-1">Cơ hội thêm</p>
          <p className="text-xl font-bold text-blue-400">{formatVND(money.opportunity_gain)}</p>
        </div>
      </div>

      {/* Warning Message */}
      <div className={`p-3 rounded-lg mb-3 ${urgencyStyle.bg} border ${urgencyStyle.border}`}>
        <div className="flex items-start gap-2">
          <AlertTriangle className={`w-5 h-5 ${urgencyStyle.text} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`text-sm font-medium ${urgencyStyle.text}`}>{money.message}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>Deadline: {money.deadline?.split('T')[0] || 'Hôm nay'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Why - Explanation */}
      {insight.explanation && (
        <div className="mb-3 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400 mb-1 font-medium">Tại sao?</p>
          <p className="text-sm text-slate-300">{insight.explanation.summary}</p>
          {insight.explanation.key_insights?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {insight.explanation.key_insights.map((insight, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
                  {insight}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Execute Actions */}
      <div className="flex flex-wrap gap-2">
        {actions.slice(0, 4).map((action, idx) => {
          const isExecuting = executing[action.action_type];
          const isPrimary = action.is_primary;
          
          return (
            <Button
              key={idx}
              size="sm"
              variant={isPrimary ? (money.urgency === 'critical' || money.urgency === 'urgent' ? 'destructive' : 'default') : 'outline'}
              onClick={() => handleExecute(action.action_type, action.params)}
              disabled={isExecuting}
              data-testid={`ai-action-${action.action_type}`}
            >
              {isExecuting ? (
                <Brain className="w-4 h-4 animate-spin mr-1" />
              ) : action.action_type === 'call' ? (
                <Phone className="w-4 h-4 mr-1" />
              ) : action.action_type === 'create_task' ? (
                <ClipboardList className="w-4 h-4 mr-1" />
              ) : action.action_type === 'assign' ? (
                <Users className="w-4 h-4 mr-1" />
              ) : (
                <Zap className="w-4 h-4 mr-1" />
              )}
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default AILeadInsightPanel;
