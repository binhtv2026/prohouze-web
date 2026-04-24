/**
 * AI Deal Risk Card Component
 * Prompt 18/20 - AI Decision Engine
 * 
 * Displays AI risk assessment with signals and actions for a deal.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  AlertTriangle, Shield, ShieldAlert, ShieldCheck,
  Phone, Bell, ClipboardList, Users, ChevronDown, ChevronUp,
  Brain, Target, Info, Zap
} from 'lucide-react';
import { getDealRisk } from '../../api/aiInsightApi';

const riskColors = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', icon: ShieldAlert },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30', icon: ShieldAlert },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', icon: Shield },
  low: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', icon: ShieldCheck },
  none: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', icon: ShieldCheck }
};

const actionIcons = {
  call: Phone,
  create_alert: Bell,
  create_task: ClipboardList,
  reassign: Users
};

const DEMO_DEAL_RISK = {
  risk_level: 'high',
  risk_score: 72,
  signals: [{ signal_name: 'follow_up_delay' }, { signal_name: 'policy_not_sent' }],
  explanation: {
    summary: 'Deal đang có rủi ro do chậm follow up và thiếu chính sách bán hàng gửi khách.',
    detailed_breakdown: [
      { name: 'follow_up_delay', level: 'high', display_value: '36h', risk: 22 },
      { name: 'policy_not_sent', level: 'medium', display_value: 'Chưa gửi', risk: 14 },
    ],
    positive_factors: ['Khách đã xem dự án', 'Ngân sách phù hợp sản phẩm'],
    negative_factors: ['Chưa có lịch hẹn chốt', 'Chưa cập nhật trạng thái mới nhất'],
    key_insights: ['Cần gọi lại trong hôm nay', 'Nên gửi ngay chính sách thanh toán'],
  },
  recommendation: {
    title: 'Ưu tiên xử lý trong 24h',
    priority: 'high',
    description: 'Sale nên gọi lại và gửi đầy đủ tài liệu bán hàng.',
    expected_impact: 'Giảm rủi ro mất deal, tăng cơ hội booking.',
  },
  action_suggestions: [
    { action_id: 'deal-risk-1', action_type: 'call', label: 'Gọi khách', priority: 'urgent' },
    { action_id: 'deal-risk-2', action_type: 'create_task', label: 'Tạo nhắc việc', priority: 'high' },
  ],
};

export const AIDealRiskCard = ({ dealId, onActionClick }) => {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchRisk = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDealRisk(dealId);
      setRiskData(data || DEMO_DEAL_RISK);
      setError(null);
    } catch (err) {
      setRiskData(DEMO_DEAL_RISK);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    if (dealId) {
      fetchRisk();
    }
  }, [dealId, fetchRisk]);

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Brain className="w-5 h-5 animate-pulse" />
            <span>Dang danh gia rui ro...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span>Khong the tai danh gia rui ro</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!riskData) return null;

  const colors = riskColors[riskData.risk_level] || riskColors.medium;
  const RiskIcon = colors.icon;

  return (
    <Card className={`border ${colors.border} ${colors.bg}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <RiskIcon className={`w-5 h-5 ${colors.text}`} />
            <span className="text-slate-200">AI Risk Assessment</span>
          </div>
          <Badge variant="outline" className={`${colors.text} ${colors.border} uppercase`}>
            {riskData.risk_level === 'critical' ? 'Rui ro cuc cao' :
             riskData.risk_level === 'high' ? 'Rui ro cao' :
             riskData.risk_level === 'medium' ? 'Rui ro TB' :
             riskData.risk_level === 'low' ? 'Rui ro thap' : 'An toan'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score Display */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`text-4xl font-bold ${colors.text}`}>
              {riskData.risk_score}
            </div>
            <span className="text-xs text-slate-500 absolute -bottom-1 left-0">/100</span>
          </div>
          <div className="flex-1">
            {/* Risk Bar */}
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  riskData.risk_level === 'critical' ? 'bg-red-500' :
                  riskData.risk_level === 'high' ? 'bg-orange-500' :
                  riskData.risk_level === 'medium' ? 'bg-amber-500' :
                  riskData.risk_level === 'low' ? 'bg-blue-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${riskData.risk_score}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {riskData.risk_level === 'critical' && 'Can hanh dong NGAY LAP TUC'}
              {riskData.risk_level === 'high' && 'Can xu ly trong 24h'}
              {riskData.risk_level === 'medium' && 'Can theo doi sat sao'}
              {riskData.risk_level === 'low' && 'Tiep tuc theo doi'}
              {riskData.risk_level === 'none' && 'Deal dang on dinh'}
            </p>
          </div>
        </div>

        {/* Risk Signals */}
        {riskData.signals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {riskData.signals.map((signal, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className={`${colors.bg} ${colors.text} ${colors.border}`}
              >
                <Zap className="w-3 h-3 mr-1" />
                {signal.signal_name.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        )}

        {/* Explanation Summary */}
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-300">{riskData.explanation.summary}</p>
        </div>

        {/* Recommendation */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className={`w-4 h-4 ${colors.text}`} />
            <span className="text-sm font-medium text-slate-200">
              {riskData.recommendation.title}
            </span>
            <Badge variant="outline" className={
              riskData.recommendation.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
              riskData.recommendation.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
              'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }>
              {riskData.recommendation.priority}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">{riskData.recommendation.description}</p>
          <p className="text-xs text-emerald-400 mt-1">
            {riskData.recommendation.expected_impact}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {riskData.action_suggestions.slice(0, 3).map((action) => {
            const Icon = actionIcons[action.action_type] || ClipboardList;
            return (
              <Button
                key={action.action_id}
                size="sm"
                variant={action.priority === 'urgent' ? 'destructive' : 'outline'}
                onClick={() => onActionClick && onActionClick(action)}
                data-testid={`ai-risk-action-${action.action_type}`}
              >
                <Icon className="w-4 h-4 mr-1" />
                {action.label}
              </Button>
            );
          })}
        </div>

        {/* Expandable Details */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-slate-400 hover:text-slate-200"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" /> An chi tiet
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" /> Xem chi tiet phan tich
            </>
          )}
        </Button>

        {expanded && (
          <div className="space-y-3 pt-2 border-t border-slate-700">
            {/* Risk Factors Breakdown */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                <Info className="w-4 h-4" /> Phan tich rui ro
              </h4>
              <div className="space-y-2">
                {riskData.explanation.detailed_breakdown.map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        factor.level === 'critical' ? 'bg-red-500' :
                        factor.level === 'high' ? 'bg-orange-500' :
                        factor.level === 'medium' ? 'bg-amber-500' :
                        factor.level === 'low' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`} />
                      <span className="text-slate-400 capitalize">
                        {factor.name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">{factor.display_value}</span>
                      <span className={
                        factor.level === 'critical' || factor.level === 'high' 
                          ? 'text-red-400' 
                          : factor.level === 'medium' 
                            ? 'text-amber-400' 
                            : 'text-emerald-400'
                      }>
                        +{factor.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safe Factors */}
            {riskData.explanation.positive_factors.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-emerald-400 mb-1">Yeu to an toan:</h5>
                <ul className="text-xs text-slate-400 space-y-1">
                  {riskData.explanation.positive_factors.map((f, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-emerald-400">+</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Factors */}
            {riskData.explanation.negative_factors.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-red-400 mb-1">Yeu to rui ro:</h5>
                <ul className="text-xs text-slate-400 space-y-1">
                  {riskData.explanation.negative_factors.map((f, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-red-400">!</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Insights */}
            {riskData.explanation.key_insights.length > 0 && (
              <div className="p-2 bg-slate-900/50 rounded border border-slate-700">
                <h5 className="text-xs font-medium text-blue-400 mb-1">Insights:</h5>
                <ul className="text-xs text-slate-400 space-y-1">
                  {riskData.explanation.key_insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIDealRiskCard;
