/**
 * AI Today Actions Panel
 * Prompt 18/20 - AI Decision Engine
 * 
 * Displays prioritized AI-recommended actions for today.
 * Integrates with Control Center.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Brain, Phone, Mail, Calendar, ClipboardList, 
  AlertTriangle, RefreshCw, ChevronRight, Sparkles, Target
} from 'lucide-react';
import { getTodayActions, generateAIAlerts, pushTodayActions } from '../../api/aiInsightApi';

const priorityColors = {
  urgent: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  high: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  medium: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  low: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
};

const actionIcons = {
  call: Phone,
  email: Mail,
  follow_up: Phone,
  schedule_meeting: Calendar,
  create_task: ClipboardList
};

export const AITodayActionsPanel = ({ onActionClick, onViewEntity }) => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const data = await getTodayActions(15);
      setActions(data.actions || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      setGenerating(true);
      await generateAIAlerts();
      await pushTodayActions();
      await fetchActions();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-slate-200">AI Today Focus</span>
            {actions.length > 0 && (
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {actions.length} actions
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchActions}
              disabled={loading}
              className="text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateAlerts}
              disabled={generating}
              className="text-xs"
            >
              <Brain className={`w-4 h-4 mr-1 ${generating ? 'animate-pulse' : ''}`} />
              {generating ? 'Dang tao...' : 'Tao AI Alerts'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Brain className="w-6 h-6 animate-pulse mr-2" />
            <span>Dang phan tich...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-amber-400">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>Khong the tai AI actions</span>
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Khong co AI actions cho hom nay</p>
            <p className="text-xs mt-1">Bam "Tao AI Alerts" de AI phan tich</p>
          </div>
        ) : (
          <div className="space-y-2">
            {actions.map((action, idx) => {
              const Icon = actionIcons[action.action_type] || ClipboardList;
              const colors = priorityColors[action.priority] || priorityColors.medium;
              
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${colors.border} ${colors.bg} hover:bg-opacity-30 transition-colors cursor-pointer`}
                  onClick={() => onViewEntity && onViewEntity(action.entity_type, action.entity_id)}
                  data-testid={`today-action-${idx}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">
                            {action.action_label}
                          </span>
                          <Badge variant="outline" className={`text-xs ${colors.text} ${colors.border}`}>
                            {action.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 mt-0.5">
                          {action.entity_name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {action.reason}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onActionClick && onActionClick(action);
                      }}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AITodayActionsPanel;
