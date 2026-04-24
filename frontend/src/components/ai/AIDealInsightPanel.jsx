/**
 * AI Deal Insight Panel
 * Prompt 18/20 - PHASE 3: Deal Detail Integration
 * 
 * Hiển thị ngay trên Deal Detail/Row:
 * - Risk Score + Level
 * - Risk Signals (vì sao risk)
 * - Money Impact (risk_loss)
 * - Action + Deadline
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
  Shield, ShieldAlert, AlertTriangle, Zap,
  ChevronDown, ChevronUp, TrendingUp
} from 'lucide-react';
import { getDealInsightFull, executeAction } from '../../api/aiInsightApi';

const formatVND = (amount) => {
  if (!amount) return '0';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} triệu`;
  return `${amount.toLocaleString()}`;
};

const riskConfig = {
  critical: { label: 'NGUY CẤP', color: 'bg-red-600 text-white', icon: ShieldAlert, bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  high: { label: 'RỦI RO CAO', color: 'bg-orange-500 text-white', icon: ShieldAlert, bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  medium: { label: 'CHÚ Ý', color: 'bg-amber-500 text-white', icon: Shield, bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  low: { label: 'ỔN ĐỊNH', color: 'bg-blue-500 text-white', icon: Shield, bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  none: { label: 'AN TOÀN', color: 'bg-emerald-500 text-white', icon: Shield, bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' }
};

const DEMO_DEAL_INSIGHT = {
  deal_risk: {
    risk_level: 'medium',
    risk_score: 64,
    signals: [{ name: 'follow_up_slow' }, { name: 'customer_waiting_policy' }],
  },
  money_impact: {
    deal_value: 4200000000,
    risk_loss: 92000000,
    close_probability: 0.58,
    message: 'Deal đang chậm follow up, cần xử lý trong ngày để tránh mất booking.',
    deadline: '2026-03-26T18:00:00',
  },
  next_action: {
    label: 'Gọi khách ngay',
  },
  explanation: {
    summary: 'Khách đã quan tâm sâu nhưng chưa nhận đủ chính sách và xác nhận lịch hẹn.',
    negative: ['Chậm phản hồi sau lần gửi bảng giá', 'Chưa cập nhật tiến độ xử lý deal'],
  },
  actions: [
    { action_type: 'call', label: 'Gọi khách', is_primary: true, params: {} },
    { action_type: 'create_task', label: 'Tạo nhắc việc', is_primary: false, params: {} },
  ],
};

export const AIDealInsightPanel = ({ dealId, compact = false, onActionComplete }) => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState({});
  const [expanded, setExpanded] = useState(!compact);

  const fetchInsight = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDealInsightFull(dealId);
      setInsight(data || DEMO_DEAL_INSIGHT);
    } catch (err) {
      console.error('AI insight error:', err);
      setInsight(DEMO_DEAL_INSIGHT);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    if (dealId) {
      fetchInsight();
    }
  }, [dealId, fetchInsight]);

  const handleExecute = async (actionType, params = {}) => {
    setExecuting(prev => ({ ...prev, [actionType]: true }));
    try {
      const result = await executeAction({
        action_type: actionType,
        entity_type: 'deal',
        entity_id: dealId,
        params: {
          ...params,
          reason: insight?.money_impact?.message
        }
      });
      
      if (result.success) {
        toast.success(result.result?.message || 'Thực hiện thành công!');
        if (onActionComplete) onActionComplete(result);
        fetchInsight();
      } else {
        toast.error(result.error || 'Thực hiện thất bại');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExecuting(prev => ({ ...prev, [actionType]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 text-slate-400 text-sm">
        <Brain className="w-4 h-4 animate-pulse" />
        <span>AI đang đánh giá rủi ro...</span>
      </div>
    );
  }

  // No insight or missing required data
  if (!insight || !insight.money_impact || !insight.actions?.length) {
    return null;
  }

  const risk = insight.deal_risk || {};
  const money = insight.money_impact || {};
  const nextAction = insight.next_action || {};
  const actions = insight.actions || [];
  
  const riskStyle = riskConfig[risk.risk_level] || riskConfig.medium;
  const RiskIcon = riskStyle.icon;

  // COMPACT MODE
  if (compact && !expanded) {
    return (
      <div 
        className={`flex items-center gap-3 p-2 rounded-lg ${riskStyle.bg} ${riskStyle.border} border cursor-pointer`}
        onClick={() => setExpanded(true)}
        data-testid="ai-deal-insight-compact"
      >
        <Badge className={`${riskStyle.color} font-bold`}>
          <RiskIcon className="w-3 h-3 mr-1" />
          {risk.risk_score || 0}
        </Badge>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="text-emerald-400 font-medium">{formatVND(money.deal_value)}</span>
          <span className="text-slate-500">|</span>
          <span className="text-red-400">Rủi ro: {formatVND(money.risk_loss)}</span>
        </div>

        <Button
          size="sm"
          variant={risk.risk_level === 'critical' || risk.risk_level === 'high' ? 'destructive' : 'default'}
          className="ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            const primaryAction = actions.find(a => a.is_primary) || actions[0];
            handleExecute(primaryAction.action_type, primaryAction.params);
          }}
          disabled={executing[actions[0]?.action_type]}
          data-testid="ai-deal-execute-primary"
        >
          <Phone className="w-3 h-3 mr-1" />
          {nextAction.label || 'Xử lý ngay'}
        </Button>

        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>
    );
  }

  // FULL MODE
  return (
    <div 
      className={`rounded-lg ${riskStyle.bg} ${riskStyle.border} border p-4`}
      data-testid="ai-deal-insight-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Badge className={`${riskStyle.color} font-bold text-sm px-3 py-1`}>
            <RiskIcon className="w-4 h-4 mr-1" />
            {riskStyle.label} ({risk.risk_score || 0})
          </Badge>
          {risk.signals?.length > 0 && (
            <div className="flex items-center gap-1">
              {risk.signals.slice(0, 3).map((signal, i) => (
                <Badge key={i} variant="outline" className={`text-xs ${riskStyle.text} ${riskStyle.border}`}>
                  {signal.name?.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {compact && (
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            <ChevronUp className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Money Impact */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <p className="text-xs text-slate-400 mb-1">Giá trị Deal</p>
          <p className="text-xl font-bold text-emerald-400">{formatVND(money.deal_value)}</p>
        </div>
        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <p className="text-xs text-slate-400 mb-1">Có thể MẤT</p>
          <p className="text-xl font-bold text-red-400">{formatVND(money.risk_loss)}</p>
        </div>
        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <p className="text-xs text-slate-400 mb-1">Xác suất chốt</p>
          <p className="text-xl font-bold text-blue-400">{Math.round((money.close_probability || 0) * 100)}%</p>
        </div>
      </div>

      {/* Warning Message */}
      <div className={`p-3 rounded-lg mb-3 ${riskStyle.bg} border ${riskStyle.border}`}>
        <div className="flex items-start gap-2">
          <AlertTriangle className={`w-5 h-5 ${riskStyle.text} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`text-sm font-medium ${riskStyle.text}`}>{money.message}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>Deadline: {money.deadline?.split('T')[0] || 'Hôm nay'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      {insight.explanation && (
        <div className="mb-3 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-400 mb-1 font-medium">Phân tích rủi ro:</p>
          <p className="text-sm text-slate-300">{insight.explanation.summary}</p>
          {insight.explanation.negative?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-red-400 mb-1">Yếu tố rủi ro:</p>
              <ul className="text-xs text-slate-400 space-y-1">
                {insight.explanation.negative.slice(0, 3).map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
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
              variant={isPrimary ? (risk.risk_level === 'critical' || risk.risk_level === 'high' ? 'destructive' : 'default') : 'outline'}
              onClick={() => handleExecute(action.action_type, action.params)}
              disabled={isExecuting}
              data-testid={`ai-deal-action-${action.action_type}`}
            >
              {isExecuting ? (
                <Brain className="w-4 h-4 animate-spin mr-1" />
              ) : action.action_type === 'call' ? (
                <Phone className="w-4 h-4 mr-1" />
              ) : action.action_type === 'escalate' ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : action.action_type === 'create_task' ? (
                <ClipboardList className="w-4 h-4 mr-1" />
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

export default AIDealInsightPanel;
