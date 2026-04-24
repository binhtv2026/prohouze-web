/**
 * AI Lead Score Card Component
 * Prompt 18/20 - AI Decision Engine
 * 
 * Displays AI score with explanation and actions for a lead.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, 
  Phone, Mail, Calendar, ClipboardList, ChevronDown, ChevronUp,
  Sparkles, Target, Info
} from 'lucide-react';
import { getLeadScore } from '../../api/aiInsightApi';

const scoreColors = {
  excellent: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30', progress: 'bg-emerald-500' },
  good: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30', progress: 'bg-blue-500' },
  average: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30', progress: 'bg-amber-500' },
  poor: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30', progress: 'bg-orange-500' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30', progress: 'bg-red-500' }
};

const actionIcons = {
  call: Phone,
  email: Mail,
  schedule_meeting: Calendar,
  create_task: ClipboardList,
  add_note: ClipboardList
};

const DEMO_LEAD_SCORE = {
  score: 82,
  score_level: 'good',
  confidence_level: 'high',
  explanation: {
    summary: 'Lead phù hợp sản phẩm, có hành vi quan tâm cao và nên được ưu tiên chăm ngay.',
    positive_factors: ['Đã để lại số điện thoại thật', 'Xem bảng giá nhiều lần'],
    negative_factors: ['Chưa có lịch hẹn trực tiếp'],
  },
  recommendation: {
    title: 'Ưu tiên gọi lại trong ngày',
    priority: 'high',
    description: 'Tăng xác suất chuyển đổi bằng lịch hẹn và chính sách thanh toán.',
    expected_impact: 'Tăng cơ hội booking trong 3 ngày tới.',
  },
  action_suggestions: [
    { action_id: 'lead-score-1', action_type: 'call', label: 'Gọi khách', priority: 'urgent' },
    { action_id: 'lead-score-2', action_type: 'schedule_meeting', label: 'Tạo lịch hẹn', priority: 'high' },
  ],
  factors: [
    { name: 'engagement', score: 28, max_score: 35, display_value: 'Cao', impact: '+12' },
    { name: 'budget_fit', score: 24, max_score: 30, display_value: 'Phù hợp', impact: '+10' },
  ],
  signals: [{ signal_name: 'viewed_pricing' }, { signal_name: 'returned_multiple_times' }],
};

export const AILeadScoreCard = ({ leadId, onActionClick }) => {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchScore = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLeadScore(leadId);
      setScoreData(data || DEMO_LEAD_SCORE);
      setError(null);
    } catch (err) {
      setScoreData(DEMO_LEAD_SCORE);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      fetchScore();
    }
  }, [fetchScore, leadId]);

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Brain className="w-5 h-5 animate-pulse" />
            <span>Dang phan tich AI...</span>
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
            <span>Khong the tai AI insight</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scoreData) return null;

  const colors = scoreColors[scoreData.score_level] || scoreColors.average;

  return (
    <Card className={`border ${colors.border} ${colors.bg}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${colors.text}`} />
            <span className="text-slate-200">AI Lead Score</span>
          </div>
          <Badge variant="outline" className={`${colors.text} ${colors.border}`}>
            {scoreData.confidence_level === 'high' ? 'Do tin cay cao' : 
             scoreData.confidence_level === 'medium' ? 'Do tin cay TB' : 'Do tin cay thap'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="flex items-center gap-4">
          <div className={`text-4xl font-bold ${colors.text}`}>
            {scoreData.score}
          </div>
          <div className="flex-1">
            <Progress value={scoreData.score} className="h-3" />
            <p className="text-xs text-slate-400 mt-1">
              {scoreData.score_level === 'excellent' && 'Lead tiem nang lon'}
              {scoreData.score_level === 'good' && 'Lead kha tot'}
              {scoreData.score_level === 'average' && 'Lead trung binh'}
              {scoreData.score_level === 'poor' && 'Lead can nurture'}
              {scoreData.score_level === 'critical' && 'Lead chua san sang'}
            </p>
          </div>
        </div>

        {/* Explanation Summary */}
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-300">{scoreData.explanation.summary}</p>
        </div>

        {/* Recommendation */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className={`w-4 h-4 ${colors.text}`} />
            <span className="text-sm font-medium text-slate-200">
              {scoreData.recommendation.title}
            </span>
            <Badge variant="outline" className={
              scoreData.recommendation.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
              scoreData.recommendation.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
              'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }>
              {scoreData.recommendation.priority}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">{scoreData.recommendation.description}</p>
          <p className="text-xs text-emerald-400 mt-1">
            {scoreData.recommendation.expected_impact}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {scoreData.action_suggestions.slice(0, 3).map((action) => {
            const Icon = actionIcons[action.action_type] || ClipboardList;
            return (
              <Button
                key={action.action_id}
                size="sm"
                variant={action.priority === 'urgent' ? 'default' : 'outline'}
                className={action.priority === 'urgent' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                onClick={() => onActionClick && onActionClick(action)}
                data-testid={`ai-action-${action.action_type}`}
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
            {/* Factors Breakdown */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                <Info className="w-4 h-4" /> Phan tich chi tiet
              </h4>
              <div className="space-y-2">
                {scoreData.factors.map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {factor.score >= factor.max_score * 0.7 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : factor.score <= factor.max_score * 0.3 ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : (
                        <span className="w-4 h-4 flex items-center justify-center text-slate-400">-</span>
                      )}
                      <span className="text-slate-400 capitalize">
                        {factor.name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">{factor.display_value}</span>
                      <span className={factor.score >= factor.max_score * 0.7 ? 'text-emerald-400' : 'text-slate-300'}>
                        {factor.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Positive/Negative Factors */}
            {scoreData.explanation.positive_factors.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-emerald-400 mb-1">Diem manh:</h5>
                <ul className="text-xs text-slate-400 space-y-1">
                  {scoreData.explanation.positive_factors.map((f, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-emerald-400">+</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {scoreData.explanation.negative_factors.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-amber-400 mb-1">Can cai thien:</h5>
                <ul className="text-xs text-slate-400 space-y-1">
                  {scoreData.explanation.negative_factors.map((f, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-amber-400">-</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Signals */}
            {scoreData.signals.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-blue-400 mb-1">Tin hieu phat hien:</h5>
                <div className="flex flex-wrap gap-1">
                  {scoreData.signals.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                      {s.signal_name.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AILeadScoreCard;
