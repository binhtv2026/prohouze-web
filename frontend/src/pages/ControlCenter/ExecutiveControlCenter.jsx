import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, AlertTriangle, TrendingUp, Target, Users, UserPlus,
  RefreshCw, Clock, CheckCircle2, Zap, XCircle, Play,
  AlertCircle, ArrowUp, ArrowDown, Bell, LayoutDashboard,
  Send, UserCog, ListTodo, Megaphone, RotateCcw, Check, X,
  Bot, Power, Undo2, Settings2, ShieldCheck, Brain, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import controlCenterApi from '../../api/controlCenterApi';
import { AITodayActionsPanel, AIWarRoom } from '../../components/ai';
import aiInsightApi from '../../api/aiInsightApi';

const DEMO_CONTROL_CENTER_DATA = {
  overview: {
    health_score: {
      total_score: 78,
      grade: 'B',
      trend: { direction: 'up', change: 6 },
      components: {
        sales_pipeline: { score: 82, detail: 'Deal dang chay on dinh, can day nhanh nhom booking.' },
        finance: { score: 74, detail: 'Cong no qua han dang duoc kiem soat, can uu tien thu dot 2.' },
        operations: { score: 79, detail: 'Cac viec tre han giam so voi hom qua.' }
      },
      recommendations: [
        { area: 'sales', issue: 'Lead nong chua cham trong 24h', action: 'Day uu tien cho doi kinh doanh trong ngay' },
        { area: 'finance', issue: 'Cong no dot 2 sap qua han', action: 'Canh bao sale va ke toan thu hoi som' }
      ]
    },
    quick_metrics: {
      active_deals: 34,
      total_leads: 186,
      conversion_rate: 7.8
    }
  },
  alerts: {
    summary: {
      requires_immediate_action: 3
    },
    alerts: [
      {
        id: 'alert-001',
        title: 'Lead nong chua duoc goi lai',
        severity: 'critical',
        category: 'sales',
        description: 'Co 5 lead nong chua duoc goi lai trong 4 gio qua.',
        metrics: { lead_count: 5, team: 'Kinh doanh 1', sla_minutes: 240 },
        recommended_actions: ['create_task', 'send_reminder', 'escalate']
      },
      {
        id: 'alert-002',
        title: 'Cong no qua han dot 2',
        severity: 'high',
        category: 'finance',
        description: '3 khach hang dang qua han thanh toan dot 2 can xu ly ngay.',
        metrics: { customer_count: 3, amount: '1.24 ty', days_overdue: 7 },
        recommended_actions: ['send_reminder', 'create_task']
      }
    ]
  },
  bottlenecks: {
    bottlenecks: {
      sales: { count: 5, severity: 'high', description: 'Lead nong dang ton don trong ngay' },
      finance: { count: 3, severity: 'medium', description: 'Cong no chua thu duoc dung han' },
      legal: { count: 1, severity: 'normal', description: '1 bo ho so dang cho bo sung' }
    }
  },
  suggestions: {
    suggestions: [
      {
        id: 'suggestion-001',
        title: 'Day chien dich thuong nong cuoi tuan',
        description: 'Tang uu tien thong tin thuong nong cho doi sale de day booking.',
        urgency: 'high',
        priority_score: 86,
        expected_impact: 'Tang ty le booking them 8-10%',
        recommended_action: 'Gui thong bao va cap nhat bang chinh sach moi'
      }
    ]
  },
  focus: {
    focus_items: [
      {
        id: 'focus-001',
        title: 'Xu ly 5 lead nong trong buoi sang',
        description: 'Tap trung sale doi 1 goi lai va cap nhat pipeline ngay.',
        urgency: 'critical',
        priority_score: 94,
        type: 'lead_follow_up',
        expected_impact: 'Tranh mat lead nong va tang co hoi hen gap',
        recommended_action: 'Assign task va goi ngay'
      },
      {
        id: 'focus-002',
        title: 'Thu hoi cong no dot 2',
        description: 'Ke toan va sale can phoi hop xu ly 3 truong hop qua han.',
        urgency: 'high',
        priority_score: 82,
        type: 'receivable',
        expected_impact: 'Giu on dinh dong tien trong ngay',
        recommended_action: 'Gui nhac va dat lich lam viec voi khach'
      }
    ]
  },
  feed: {
    items: [
      {
        id: 'feed-001',
        type: 'action',
        title: 'Tao task nhac sale cham lead nong',
        description: 'He thong da tao 5 task uu tien cao cho doi Kinh doanh 1.',
        timestamp: '2026-03-26T09:10:00+07:00',
        actor: 'AUTO CONTROL',
        category: 'auto_executed',
        is_auto: true,
        metadata: {
          action_id: 'action-001',
          rule_id: 'rule-001',
          rule_name: 'Lead nong qua 2 gio',
          improvement: 'Da assign ngay cho 3 sale dang online'
        }
      }
    ]
  }
};

const DEMO_AUTO_RULES = [
  {
    id: 'rule-001',
    name: 'Lead nong qua 2 gio',
    description: 'Tu dong tao task va gui nhac cho sale khi lead nong khong duoc cham.',
    is_active: true,
    action_type: 'auto_create_task',
    condition_type: 'lead_unassigned',
    condition_json: { operator: '>', value: '120m' },
    priority_threshold: 80,
    execution_count: 14
  },
  {
    id: 'rule-002',
    name: 'Cong no qua han 5 ngay',
    description: 'Tu dong nhac sale va ke toan khi cong no qua han.',
    is_active: true,
    action_type: 'auto_notify',
    condition_type: 'deal_stale',
    condition_json: { operator: '>', value: '5d' },
    priority_threshold: 70,
    execution_count: 6,
    follow_up_action: 'auto_escalate',
    follow_up_delay_hours: 24
  }
];

const DEMO_AUTO_STATS = {
  today: { executed: 11, remaining: 89 },
  daily_limit: 100,
  undo_window_minutes: 30
};

const ExecutiveControlCenter = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [activeTab, setActiveTab] = useState('control');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [actionResults, setActionResults] = useState({});
  const [autoRules, setAutoRules] = useState([]);
  const [autoStats, setAutoStats] = useState(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const [overview, alerts, bottlenecks, suggestions, focus, feed, rules, stats] = await Promise.all([
        controlCenterApi.getExecutiveOverview(),
        controlCenterApi.getAlerts(),
        controlCenterApi.getBottlenecks(),
        controlCenterApi.getSuggestions(),
        controlCenterApi.getTodayFocus(),
        controlCenterApi.getControlFeed(50),
        controlCenterApi.getAutoRules().catch(() => ({ data: { rules: [] } })),
        controlCenterApi.getAutoStats().catch(() => ({ data: null }))
      ]);
      
      setData({
        overview: overview.data,
        alerts: alerts.data,
        bottlenecks: bottlenecks.data,
        suggestions: suggestions.data,
        focus: focus.data,
        feed: feed.data
      });
      setAutoRules(rules.data?.rules || []);
      setAutoStats(stats.data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setData(DEMO_CONTROL_CENTER_DATA);
      setAutoRules(DEMO_AUTO_RULES);
      setAutoStats(DEMO_AUTO_STATS);
      setLastRefresh(new Date());
      setError(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Execute Action Handler
  const executeAction = async (actionType, item, customParams = {}) => {
    const actionKey = `${item.id}_${actionType}`;
    setActionInProgress(actionKey);
    
    try {
      const result = await controlCenterApi.executeAction(actionType, {
        source_alert_id: item.id,
        source_entity: item.source_entity || item.type,
        source_id: item.source_id || item.id,
        params: customParams
      });
      
      if (result.success) {
        setActionResults(prev => ({
          ...prev,
          [item.id]: {
            action: actionType,
            success: true,
            message: result.data?.message || 'Action executed',
            timestamp: new Date().toISOString()
          }
        }));
        toast.success(`Action: ${actionType}`, { description: result.data?.message });
        setTimeout(() => fetchData(true), 1000);
      } else {
        toast.error('Action failed', { description: result.data?.error });
      }
    } catch (err) {
      toast.error('Action failed', { description: err.message });
    } finally {
      setActionInProgress(null);
    }
  };

  // Mark as Resolved / Still Problematic
  const markResult = async (item, isResolved) => {
    try {
      const actionResult = actionResults[item.id];
      if (actionResult?.actionId) {
        await controlCenterApi.verifyAction(actionResult.actionId, isResolved);
      }
      
      setActionResults(prev => ({
        ...prev,
        [item.id]: {
          ...prev[item.id],
          verified: true,
          isResolved,
          verifiedAt: new Date().toISOString()
        }
      }));
      
      toast.success(isResolved ? 'Marked as Resolved' : 'Marked as Still Problematic');
      fetchData(true);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Toggle Auto Rule
  const toggleAutoRule = async (ruleId, isActive) => {
    try {
      await controlCenterApi.toggleAutoRule(ruleId, isActive);
      toast.success(`Rule ${isActive ? 'activated' : 'deactivated'}`);
      fetchData(true);
    } catch (err) {
      toast.error('Failed to toggle rule');
    }
  };

  // Initialize Default Rules
  const initDefaultRules = async () => {
    try {
      const result = await controlCenterApi.initDefaultRules();
      toast.success(`Created ${result.data?.created || 0} default rules`);
      fetchData(true);
    } catch (err) {
      toast.error('Failed to initialize rules');
    }
  };

  // Run Auto Actions Manually
  const runAutoActions = async () => {
    try {
      const result = await controlCenterApi.runAutoActions();
      toast.success(`Executed ${result.data?.actions_executed || 0} actions`);
      fetchData(true);
    } catch (err) {
      toast.error('Failed to run auto actions');
    }
  };

  // Undo Auto Action
  const undoAutoAction = async (actionId) => {
    try {
      await controlCenterApi.undoAutoAction(actionId);
      toast.success('Action undone');
      fetchData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to undo action');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading Control Center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Card className="bg-red-950/30 border-red-900/50 max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => fetchData()} variant="outline" className="border-red-700 text-red-400">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const healthScore = data?.overview?.health_score || {};
  const alertsSummary = data?.alerts?.summary || {};
  const alerts = data?.alerts?.alerts || [];
  const focusItems = data?.focus?.focus_items || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6" data-testid="executive-control-center">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-cyan-400" />
            Control Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ProHouze Operating System - Real-time Business Control
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-500">
            Last update: {lastRefresh?.toLocaleTimeString('vi-VN')}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="border-slate-700 hover:bg-slate-800"
            data-testid="refresh-button"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <HealthScoreCard score={healthScore} />
        <CriticalAlertsCard summary={alertsSummary} alerts={alerts} />
        <ActionRequiredCard focusItems={focusItems} />
        <QuickMetricsCard metrics={data?.overview?.quick_metrics} />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="control" className="data-[state=active]:bg-red-950 data-[state=active]:text-red-400">
            ACTION REQUIRED ({alertsSummary.requires_immediate_action || 0})
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-blue-950 data-[state=active]:text-blue-400">
            <Brain className="w-4 h-4 mr-1" />
            WAR ROOM
          </TabsTrigger>
          <TabsTrigger value="focus" className="data-[state=active]:bg-orange-950 data-[state=active]:text-orange-400">
            TODAY ACTIONS
          </TabsTrigger>
          <TabsTrigger value="feed" className="data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-400">
            ACTION LOG
          </TabsTrigger>
          <TabsTrigger value="auto" className="data-[state=active]:bg-purple-950 data-[state=active]:text-purple-400">
            <Bot className="w-4 h-4 mr-1" />
            AUTO MODE ({autoRules.filter(r => r.is_active).length})
          </TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200">
            HEALTH DETAILS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="control">
          <ActionRequiredTab 
            alerts={alerts}
            onAction={executeAction}
            actionInProgress={actionInProgress}
            actionResults={actionResults}
            onMarkResult={markResult}
          />
        </TabsContent>

        <TabsContent value="ai">
          <AIInsightsTab />
        </TabsContent>

        <TabsContent value="focus">
          <TodayActionsTab 
            focusItems={focusItems}
            suggestions={data?.suggestions?.suggestions || []}
            onAction={executeAction}
            actionInProgress={actionInProgress}
            actionResults={actionResults}
            onMarkResult={markResult}
          />
        </TabsContent>

        <TabsContent value="feed">
          <ActionLogTab feed={data?.feed?.items || []} onUndo={undoAutoAction} />
        </TabsContent>

        <TabsContent value="auto">
          <AutoModeTab 
            rules={autoRules}
            stats={autoStats}
            onToggle={toggleAutoRule}
            onInitDefaults={initDefaultRules}
            onRunAuto={runAutoActions}
          />
        </TabsContent>

        <TabsContent value="health">
          <HealthDetailsTab healthScore={healthScore} bottlenecks={data?.bottlenecks?.bottlenecks || {}} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ==================== CARD COMPONENTS ====================

const HealthScoreCard = ({ score }) => {
  const getScoreColor = (s) => {
    if (s >= 80) return 'text-green-400';
    if (s >= 60) return 'text-yellow-400';
    if (s >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getGradeColor = (grade) => {
    const colors = { A: 'bg-green-500', B: 'bg-cyan-500', C: 'bg-yellow-500', D: 'bg-orange-500', F: 'bg-red-500' };
    return colors[grade] || 'bg-slate-500';
  };

  const trend = score.trend || {};

  return (
    <Card className="bg-slate-900/50 border-slate-800" data-testid="health-score-card">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Health Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-bold ${getScoreColor(score.total_score || 0)}`}>
                {Math.round(score.total_score || 0)}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getGradeColor(score.grade)}`}>
                {score.grade || '-'}
              </span>
            </div>
            <div className={`flex items-center gap-1 mt-1 text-xs ${trend.direction === 'up' ? 'text-green-400' : trend.direction === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
              {trend.direction === 'up' ? <ArrowUp className="w-3 h-3" /> : trend.direction === 'down' ? <ArrowDown className="w-3 h-3" /> : null}
              <span>{trend.change > 0 ? '+' : ''}{trend.change || 0} pts</span>
            </div>
          </div>
          <Activity className="w-8 h-8 text-cyan-400/30" />
        </div>
        <Progress value={score.total_score || 0} className="mt-3 h-1.5 bg-slate-800" />
      </CardContent>
    </Card>
  );
};

const CriticalAlertsCard = ({ summary, alerts }) => {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;
  
  return (
    <Card className={`border ${criticalCount > 0 ? 'bg-red-950/30 border-red-900' : highCount > 0 ? 'bg-orange-950/30 border-orange-900' : 'bg-slate-900/50 border-slate-800'}`} data-testid="critical-alerts-card">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Action Required</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-bold ${criticalCount > 0 ? 'text-red-400' : highCount > 0 ? 'text-orange-400' : 'text-white'}`}>
                {summary.requires_immediate_action || 0}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 text-red-400 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  {criticalCount} CRITICAL
                </span>
              )}
              {highCount > 0 && (
                <span className="flex items-center gap-1 text-orange-400">
                  <AlertCircle className="w-3 h-3" />
                  {highCount} HIGH
                </span>
              )}
            </div>
          </div>
          <Bell className={`w-8 h-8 ${criticalCount > 0 ? 'text-red-400/50 animate-pulse' : 'text-orange-400/30'}`} />
        </div>
      </CardContent>
    </Card>
  );
};

const ActionRequiredCard = ({ focusItems }) => {
  const criticalItems = focusItems.filter(i => i.urgency === 'critical' || i.urgency === 'high').length;
  
  return (
    <Card className="bg-slate-900/50 border-slate-800" data-testid="action-required-card">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Today Actions</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-white">{focusItems.length}</span>
              <span className="text-slate-500 text-sm">items</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="text-orange-400 font-medium">{criticalItems} urgent</span>
            </div>
          </div>
          <Target className="w-8 h-8 text-purple-400/30" />
        </div>
      </CardContent>
    </Card>
  );
};

const QuickMetricsCard = ({ metrics = {} }) => {
  return (
    <Card className="bg-slate-900/50 border-slate-800" data-testid="quick-metrics-card">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Pipeline</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-white">{metrics.active_deals || 0}</span>
              <span className="text-slate-500 text-sm">deals</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span>{metrics.total_leads || 0} leads</span>
              <span>{(metrics.conversion_rate || 0).toFixed(1)}% conv</span>
            </div>
          </div>
          <TrendingUp className="w-8 h-8 text-green-400/30" />
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== ACTION BUTTONS COMPONENT ====================

const ActionButtons = ({ item, onAction, actionInProgress, compact = false }) => {
  const isLoading = (action) => actionInProgress === `${item.id}_${action}`;
  
  const actions = [
    { type: 'reassign_owner', label: 'Reassign', icon: UserPlus, color: 'bg-blue-600 hover:bg-blue-700' },
    { type: 'create_task', label: 'Create Task', icon: ListTodo, color: 'bg-purple-600 hover:bg-purple-700' },
    { type: 'send_reminder', label: 'Notify', icon: Send, color: 'bg-cyan-600 hover:bg-cyan-700' },
    { type: 'escalate', label: 'Escalate', icon: Megaphone, color: 'bg-red-600 hover:bg-red-700' },
  ];

  const recommendedActions = item.recommended_actions || [];
  const displayActions = recommendedActions.length > 0 
    ? actions.filter(a => recommendedActions.includes(a.type))
    : actions;

  return (
    <div className={`flex ${compact ? 'gap-1' : 'gap-2'} flex-wrap`}>
      {displayActions.map(action => {
        const Icon = action.icon;
        return (
          <Button
            key={action.type}
            size="sm"
            className={`${action.color} text-white ${compact ? 'h-7 px-2 text-xs' : 'h-8 px-3'}`}
            onClick={() => onAction(action.type, item)}
            disabled={!!actionInProgress}
            data-testid={`action-${action.type}-${item.id}`}
          >
            {isLoading(action.type) ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Icon className={`${compact ? 'w-3 h-3' : 'w-4 h-4 mr-1'}`} />
                {!compact && action.label}
              </>
            )}
          </Button>
        );
      })}
    </div>
  );
};

// ==================== RESULT FEEDBACK COMPONENT ====================

const ResultFeedback = ({ item, actionResult, onMarkResult }) => {
  if (!actionResult) return null;

  return (
    <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">Action executed: {actionResult.action}</span>
          <span className="text-xs text-slate-500">
            {new Date(actionResult.timestamp).toLocaleTimeString('vi-VN')}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-1">{actionResult.message}</p>
      
      {!actionResult.verified && (
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-slate-400">Result:</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs border-green-700 text-green-400 hover:bg-green-950"
            onClick={() => onMarkResult(item, true)}
          >
            <Check className="w-3 h-3 mr-1" />
            Resolved
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs border-orange-700 text-orange-400 hover:bg-orange-950"
            onClick={() => onMarkResult(item, false)}
          >
            <X className="w-3 h-3 mr-1" />
            Still Problematic
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs border-slate-600 text-slate-400 hover:bg-slate-800"
            onClick={() => onMarkResult(item, false)}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Re-trigger
          </Button>
        </div>
      )}
      
      {actionResult.verified && (
        <div className={`mt-2 text-xs ${actionResult.isResolved ? 'text-green-400' : 'text-orange-400'}`}>
          Status: {actionResult.isResolved ? '✓ Resolved' : '⚠ Still Problematic'}
        </div>
      )}
    </div>
  );
};

// ==================== ACTION REQUIRED TAB ====================

const ActionRequiredTab = ({ alerts, onAction, actionInProgress, actionResults, onMarkResult }) => {
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
  });

  const severityConfig = {
    critical: { bg: 'bg-red-950', border: 'border-red-800', text: 'text-red-400', badge: 'bg-red-600' },
    high: { bg: 'bg-orange-950/50', border: 'border-orange-800', text: 'text-orange-400', badge: 'bg-orange-600' },
    medium: { bg: 'bg-yellow-950/30', border: 'border-yellow-800/50', text: 'text-yellow-400', badge: 'bg-yellow-600' },
    low: { bg: 'bg-slate-900', border: 'border-slate-700', text: 'text-slate-400', badge: 'bg-slate-600' }
  };

  return (
    <div className="space-y-3" data-testid="action-required-tab">
      {sortedAlerts.length === 0 ? (
        <Card className="bg-green-950/20 border-green-900/50">
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400/50 mx-auto mb-2" />
            <p className="text-green-400">All clear - No action required</p>
          </CardContent>
        </Card>
      ) : (
        sortedAlerts.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.low;
          const actionResult = actionResults[alert.id];
          
          return (
            <Card key={alert.id} className={`${config.bg} ${config.border} border-l-4`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Priority Indicator */}
                  <div className={`w-2 h-full min-h-[60px] rounded-full ${config.badge}`} />
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`w-5 h-5 ${config.text}`} />
                      <span className={`font-semibold ${config.text}`}>{alert.title}</span>
                      <Badge className={`${config.badge} text-white text-[10px]`}>
                        {alert.severity?.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{alert.category}</Badge>
                    </div>
                    
                    <p className="text-sm text-slate-300 mb-3">{alert.description}</p>
                    
                    {/* Impact Metrics */}
                    {alert.metrics && (
                      <div className="flex flex-wrap gap-3 mb-3 text-xs">
                        {Object.entries(alert.metrics).slice(0, 3).map(([key, value]) => (
                          <span key={key} className="px-2 py-1 bg-slate-800 rounded text-slate-300">
                            {key.replace(/_/g, ' ')}: <strong>{typeof value === 'number' ? value.toLocaleString() : value}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <ActionButtons 
                      item={alert} 
                      onAction={onAction} 
                      actionInProgress={actionInProgress}
                    />
                    
                    {/* Result Feedback */}
                    <ResultFeedback 
                      item={alert}
                      actionResult={actionResult}
                      onMarkResult={onMarkResult}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

// ==================== TODAY ACTIONS TAB ====================

const TodayActionsTab = ({ focusItems, suggestions, onAction, actionInProgress, actionResults, onMarkResult }) => {
  const sortedItems = [...focusItems, ...suggestions.map(s => ({
    ...s,
    type: 'suggestion',
    urgency: s.urgency || 'medium'
  }))].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

  const urgencyConfig = {
    critical: { bg: 'bg-red-950/50', border: 'border-l-red-500', icon: AlertTriangle, iconColor: 'text-red-400' },
    high: { bg: 'bg-orange-950/30', border: 'border-l-orange-500', icon: AlertCircle, iconColor: 'text-orange-400' },
    medium: { bg: 'bg-yellow-950/20', border: 'border-l-yellow-500', icon: Clock, iconColor: 'text-yellow-400' },
    low: { bg: 'bg-slate-900/50', border: 'border-l-slate-500', icon: Activity, iconColor: 'text-slate-400' }
  };

  return (
    <div className="space-y-3" data-testid="today-actions-tab">
      <div className="text-xs text-slate-400 mb-4">
        Sorted by priority score - highest impact first
      </div>
      
      {sortedItems.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400/50 mx-auto mb-2" />
            <p className="text-slate-400">No actions for today</p>
          </CardContent>
        </Card>
      ) : (
        sortedItems.slice(0, 15).map((item, idx) => {
          const config = urgencyConfig[item.urgency] || urgencyConfig.medium;
          const Icon = config.icon;
          const actionResult = actionResults[item.id];
          
          return (
            <Card key={item.id || idx} className={`${config.bg} border-l-4 ${config.border} border-slate-800`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Priority Score */}
                  <div className="text-center min-w-[50px]">
                    <div className={`text-2xl font-bold ${config.iconColor}`}>
                      {item.priority_score || '-'}
                    </div>
                    <div className="text-[10px] text-slate-500">PRIORITY</div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${config.iconColor}`} />
                      <span className="font-medium text-white">{item.title}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {item.type || item.category}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-400 mb-2">{item.description}</p>
                    
                    {/* Expected Impact */}
                    {item.expected_impact && (
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400">Expected: {item.expected_impact}</span>
                      </div>
                    )}
                    
                    {/* Recommended Action */}
                    {item.recommended_action && (
                      <div className="p-2 bg-slate-800/50 rounded mb-3">
                        <span className="text-xs text-slate-400">Recommended: </span>
                        <span className="text-xs text-cyan-400">{item.recommended_action}</span>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <ActionButtons 
                      item={item} 
                      onAction={onAction} 
                      actionInProgress={actionInProgress}
                    />
                    
                    {/* Result Feedback */}
                    <ResultFeedback 
                      item={item}
                      actionResult={actionResult}
                      onMarkResult={onMarkResult}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

// ==================== ACTION LOG TAB ====================

const ActionLogTab = ({ feed, onUndo }) => {
  const logConfig = {
    action: { icon: Play, color: 'text-cyan-400', bg: 'bg-cyan-950/30' },
    resolution: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-950/30' },
    alert: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-950/30' },
    escalation: { icon: Megaphone, color: 'text-red-400', bg: 'bg-red-950/30' },
    update: { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-800/50' }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800" data-testid="action-log-tab">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Action Log - Real-time Activity Stream
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {feed.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No activity yet</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-800" />
              
              {feed.map((item, i) => {
                const config = logConfig[item.type] || logConfig.update;
                const Icon = config.icon;
                const isAuto = item.is_auto || item.metadata?.rule_id || item.category === 'auto_executed';
                const canUndo = isAuto && item.metadata?.action_id && item.type === 'action';
                
                return (
                  <div key={item.id || i} className="relative flex items-start gap-4 py-3">
                    {/* Timeline dot */}
                    <div className={`relative z-10 p-2 rounded-full ${config.bg} border border-slate-700`}>
                      {isAuto ? <Bot className={`w-4 h-4 ${config.color}`} /> : <Icon className={`w-4 h-4 ${config.color}`} />}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${config.color}`}>{item.title}</span>
                        {/* Manual vs Auto Badge */}
                        <Badge className={`text-[10px] ${isAuto ? 'bg-purple-600 text-white' : 'bg-slate-600 text-white'}`}>
                          {isAuto ? 'AUTO' : 'MANUAL'}
                        </Badge>
                        {item.severity && (
                          <Badge variant="outline" className="text-[10px]">{item.severity}</Badge>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN') : '-'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {item.actor && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            {isAuto ? <Bot className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                            {item.actor}
                          </div>
                        )}
                        {/* Undo button for auto actions */}
                        {canUndo && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px] text-orange-400 hover:bg-orange-950"
                            onClick={() => onUndo(item.metadata.action_id)}
                          >
                            <Undo2 className="w-3 h-3 mr-1" />
                            Undo
                          </Button>
                        )}
                      </div>
                      {item.metadata?.improvement && (
                        <div className="mt-1 text-xs text-green-400">
                          → Result: {typeof item.metadata.improvement === 'object' ? item.metadata.improvement.description : item.metadata.improvement}
                        </div>
                      )}
                      {item.metadata?.rule_name && (
                        <div className="mt-1 text-[10px] text-purple-400">
                          Rule: {item.metadata.rule_name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// ==================== AUTO MODE TAB ====================

const AutoModeTab = ({ rules, stats, onToggle, onInitDefaults, onRunAuto }) => {
  const actionTypeLabels = {
    auto_create_task: 'Create Task',
    auto_notify: 'Send Notification',
    auto_reassign: 'Auto Reassign',
    auto_escalate: 'Escalate'
  };

  const conditionLabels = {
    deal_stale: 'Deal không cập nhật',
    lead_unassigned: 'Lead chưa assign',
    booking_expiring: 'Booking sắp hết hạn',
    task_overdue: 'Task quá hạn',
    contract_pending: 'Contract pending',
    low_absorption: 'Absorption thấp'
  };

  return (
    <div className="space-y-4" data-testid="auto-mode-tab">
      {/* Auto Stats Header */}
      <Card className="bg-purple-950/30 border-purple-900/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-900/50 rounded-lg">
                <Bot className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Auto Control Mode</h3>
                <p className="text-sm text-slate-400">System tự động thực hiện actions theo rules</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats?.today?.executed || 0}</div>
                <div className="text-[10px] text-slate-500">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-300">{stats?.today?.remaining || 100}</div>
                <div className="text-[10px] text-slate-500">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{rules.filter(r => r.is_active).length}</div>
                <div className="text-[10px] text-slate-500">Active Rules</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onRunAuto}
            >
              <Play className="w-4 h-4 mr-1" />
              Run Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-purple-700 text-purple-400"
              onClick={onInitDefaults}
            >
              <Settings2 className="w-4 h-4 mr-1" />
              Init Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Safety Info */}
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-950/30 rounded-lg border border-yellow-800/50">
        <ShieldCheck className="w-4 h-4 text-yellow-400" />
        <span className="text-xs text-yellow-400">
          Safety: Max {stats?.daily_limit || 100} actions/day • Undo within {stats?.undo_window_minutes || 30} mins
        </span>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-8 text-center">
              <Bot className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 mb-4">No auto rules configured</p>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={onInitDefaults}
              >
                Initialize Default Rules
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card 
              key={rule.id} 
              className={`border ${rule.is_active ? 'bg-purple-950/30 border-purple-800' : 'bg-slate-900/50 border-slate-800'}`}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{rule.name}</span>
                      <Badge className={`text-[10px] ${rule.is_active ? 'bg-green-600' : 'bg-slate-600'}`}>
                        {rule.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {actionTypeLabels[rule.action_type] || rule.action_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{rule.description}</p>
                    
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="px-2 py-1 bg-slate-800 rounded">
                        IF: {conditionLabels[rule.condition_type] || rule.condition_type} {rule.condition_json?.operator} {rule.condition_json?.value}
                      </span>
                      <span className="px-2 py-1 bg-slate-800 rounded">
                        Priority ≥ {rule.priority_threshold}
                      </span>
                      {rule.follow_up_action && (
                        <span className="px-2 py-1 bg-orange-950 text-orange-400 rounded">
                          Then: {actionTypeLabels[rule.follow_up_action]} after {rule.follow_up_delay_hours}h
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                      <span>Executed: {rule.execution_count || 0} times</span>
                      {rule.last_executed_at && (
                        <span>Last: {new Date(rule.last_executed_at).toLocaleString('vi-VN')}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-slate-500">{rule.is_active ? 'ON' : 'OFF'}</span>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => onToggle(rule.id, checked)}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// ==================== HEALTH DETAILS TAB ====================

const HealthDetailsTab = ({ healthScore, bottlenecks }) => {
  const components = healthScore.components || {};

  return (
    <div className="grid grid-cols-2 gap-4" data-testid="health-details-tab">
      {/* Health Components */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Health Score Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(components).map(([key, comp]) => {
              const scoreColor = comp.score >= 60 ? 'text-green-400' : comp.score >= 40 ? 'text-yellow-400' : 'text-red-400';
              
              return (
                <div key={key} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={`text-xl font-bold ${scoreColor}`}>{Math.round(comp.score)}</span>
                  </div>
                  <Progress value={comp.score} className="h-2 bg-slate-700" />
                  <p className="text-xs text-slate-500 mt-2">{comp.detail}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottlenecks */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Operational Bottlenecks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(bottlenecks).map(([key, data]) => {
              const severityColor = {
                critical: 'border-red-500 bg-red-950/30',
                high: 'border-orange-500 bg-orange-950/30',
                medium: 'border-yellow-500 bg-yellow-950/20',
                normal: 'border-green-500 bg-green-950/20'
              };
              
              return (
                <div key={key} className={`p-3 rounded-lg border-l-4 ${severityColor[data.severity] || severityColor.normal}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200 capitalize">{key}</span>
                    <span className="text-2xl font-bold text-white">{data.count}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{data.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {healthScore.recommendations?.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800 col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Improvement Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {healthScore.recommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{rec.area}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{rec.issue}</p>
                  <p className="text-xs text-cyan-400 mt-1">→ {rec.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ==================== AI WAR ROOM TAB ====================
// Using imported AIWarRoom component

const AIInsightsTab = () => {
  return <AIWarRoom />;
};

export default ExecutiveControlCenter;
