/**
 * Executive Control Center
 * Prompt 17/20 - Executive Control Center & Operations Command Center
 * 
 * This is the OPERATING SYSTEM for the real estate business.
 * Not just a dashboard - a control engine.
 * 
 * Route: /control-center
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users,
  Building2,
  DollarSign,
  Clock,
  RefreshCw,
  ChevronRight,
  Bell,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  Shield,
  Lightbulb,
  AlertCircle,
  BarChart3,
  Gauge,
  FileText,
  UserCheck,
  Send,
  Play,
  ListTodo,
} from 'lucide-react';
import controlCenterApi from '../../api/controlCenterApi';

// ==================== UTILITY COMPONENTS ====================

const formatCurrency = (amount) => {
  if (!amount) return '0 đ';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} tr`;
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

const SeverityBadge = ({ severity }) => {
  const config = {
    critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' },
    high: { label: 'High', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    low: { label: 'Low', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    info: { label: 'Info', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    normal: { label: 'Normal', className: 'bg-green-100 text-green-700 border-green-200' },
  };
  const c = config[severity] || config.info;
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
};

const UrgencyBadge = ({ urgency }) => {
  const config = {
    critical: { label: 'NOW', className: 'bg-red-600 text-white animate-pulse' },
    high: { label: 'TODAY', className: 'bg-orange-500 text-white' },
    medium: { label: 'This Week', className: 'bg-yellow-500 text-white' },
    low: { label: 'Later', className: 'bg-slate-400 text-white' },
  };
  const c = config[urgency] || config.medium;
  return <Badge className={c.className}>{c.label}</Badge>;
};

const TrendIndicator = ({ direction, value }) => {
  if (direction === 'up') {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">+{value}</span>
      </div>
    );
  }
  if (direction === 'down') {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">{value}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-slate-400">
      <Minus className="h-4 w-4" />
      <span className="text-sm font-medium">0</span>
    </div>
  );
};

const HealthGrade = ({ grade, score }) => {
  const config = {
    A: { color: 'text-green-600', bg: 'bg-green-100', ring: 'ring-green-200' },
    B: { color: 'text-blue-600', bg: 'bg-blue-100', ring: 'ring-blue-200' },
    C: { color: 'text-yellow-600', bg: 'bg-yellow-100', ring: 'ring-yellow-200' },
    D: { color: 'text-orange-600', bg: 'bg-orange-100', ring: 'ring-orange-200' },
    F: { color: 'text-red-600', bg: 'bg-red-100', ring: 'ring-red-200' },
  };
  const c = config[grade] || config.C;
  
  return (
    <div className={`flex items-center justify-center w-20 h-20 rounded-full ${c.bg} ${c.ring} ring-4`}>
      <div className="text-center">
        <div className={`text-3xl font-bold ${c.color}`}>{grade}</div>
        <div className={`text-xs ${c.color}`}>{score}</div>
      </div>
    </div>
  );
};

// Action button mappings
const ACTION_CONFIG = {
  reassign_owner: { icon: UserCheck, label: 'Reassign', color: 'text-blue-600' },
  create_task: { icon: ListTodo, label: 'Create Task', color: 'text-green-600' },
  send_reminder: { icon: Send, label: 'Remind', color: 'text-orange-600' },
  escalate: { icon: AlertTriangle, label: 'Escalate', color: 'text-red-600' },
  trigger_campaign: { icon: Play, label: 'Campaign', color: 'text-purple-600' },
  assign_reviewer: { icon: FileText, label: 'Assign Review', color: 'text-teal-600' },
  mark_resolved: { icon: CheckCircle2, label: 'Resolve', color: 'text-green-600' },
};

// ==================== MAIN COMPONENT ====================

export default function ControlCenterPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [healthScore, setHealthScore] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertSummary, setAlertSummary] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [focusPanel, setFocusPanel] = useState(null);
  const [controlFeed, setControlFeed] = useState([]);
  const [bottlenecks, setBottlenecks] = useState(null);
  
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load all data
  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [
        healthRes,
        alertsRes,
        suggestionsRes,
        focusRes,
        feedRes,
        bottlenecksRes,
      ] = await Promise.all([
        controlCenterApi.getHealthScore(),
        controlCenterApi.getAlerts(),
        controlCenterApi.getSuggestions(),
        controlCenterApi.getTodayFocus(),
        controlCenterApi.getControlFeed(30),
        controlCenterApi.getBottlenecks(),
      ]);
      
      if (healthRes.success) setHealthScore(healthRes.data);
      if (alertsRes.success) {
        setAlerts(alertsRes.data.alerts || []);
        setAlertSummary(alertsRes.data.summary);
      }
      if (suggestionsRes.success) setSuggestions(suggestionsRes.data.suggestions || []);
      if (focusRes.success) setFocusPanel(focusRes.data);
      if (feedRes.success) setControlFeed(feedRes.data.items || []);
      if (bottlenecksRes.success) setBottlenecks(bottlenecksRes.data);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading control center data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Execute action handler
  const handleAction = async (actionType, sourceEntity, sourceId, alertId = null) => {
    try {
      const result = await controlCenterApi.executeAction(actionType, {
        source_alert_id: alertId,
        source_entity: sourceEntity,
        source_id: sourceId,
        params: {}
      });
      
      if (result.success) {
        // Refresh data after action
        loadData();
      }
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="control-center-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-amber-400" />
              Executive Control Center
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Operating System for Real Estate Business • CEO/Director View
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                Updated: {lastUpdated.toLocaleTimeString('vi-VN')}
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadData}
              disabled={refreshing}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              data-testid="refresh-btn"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-xs">Business Health</span>
              <Gauge className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {healthScore?.total_score || 0}
              <span className="text-sm text-slate-400 ml-1">/ 100</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-xs">Active Alerts</span>
              <Bell className="h-4 w-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {alertSummary?.total || 0}
              {alertSummary?.critical_count > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs">{alertSummary.critical_count} critical</Badge>
              )}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-xs">Focus Items</span>
              <Target className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {focusPanel?.total_items || 0}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-xs">Bottlenecks</span>
              <AlertCircle className="h-4 w-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold mt-1">
              {bottlenecks?.summary?.total_issues || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts">
              Alerts
              {alertSummary?.requires_immediate_action > 0 && (
                <Badge className="ml-2 bg-red-500">{alertSummary.requires_immediate_action}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggestions" data-testid="tab-suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="focus" data-testid="tab-focus">Today Focus</TabsTrigger>
            <TabsTrigger value="feed" data-testid="tab-feed">Control Feed</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Health Score Card */}
              <Card className="lg:row-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-amber-600" />
                    Business Health Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {healthScore && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-center">
                        <HealthGrade grade={healthScore.grade} score={healthScore.total_score} />
                      </div>
                      
                      <div className="text-center">
                        <Badge className={
                          healthScore.status === 'excellent' ? 'bg-green-100 text-green-700' :
                          healthScore.status === 'healthy' ? 'bg-blue-100 text-blue-700' :
                          healthScore.status === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {healthScore.status?.toUpperCase()}
                        </Badge>
                        {healthScore.trend && (
                          <div className="mt-2">
                            <TrendIndicator 
                              direction={healthScore.trend.direction} 
                              value={healthScore.trend.change} 
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Component breakdown */}
                      <div className="space-y-3">
                        {healthScore.components && Object.entries(healthScore.components).map(([key, data]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="capitalize text-slate-600">{key.replace(/_/g, ' ')}</span>
                              <span className="font-medium">{data.score.toFixed(0)}</span>
                            </div>
                            <Progress 
                              value={data.score} 
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                      
                      {/* Recommendations */}
                      {healthScore.recommendations?.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="text-sm font-medium text-amber-800 mb-2">Recommendations:</div>
                          {healthScore.recommendations.slice(0, 2).map((rec, i) => (
                            <div key={i} className="text-xs text-amber-700 mb-1">
                              • {rec.action}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Critical Alerts */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Critical Alerts
                    </span>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').slice(0, 5).map(alert => (
                      <div key={alert.id} className="p-3 mb-2 rounded-lg bg-red-50 border border-red-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-red-900">{alert.title}</div>
                            <div className="text-xs text-red-700 mt-1">{alert.description?.slice(0, 80)}...</div>
                          </div>
                          <SeverityBadge severity={alert.severity} />
                        </div>
                        {alert.recommended_actions?.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {alert.recommended_actions.slice(0, 2).map(action => {
                              const config = ACTION_CONFIG[action] || { icon: Zap, label: action };
                              const Icon = config.icon;
                              return (
                                <Button
                                  key={action}
                                  size="sm"
                                  variant="ghost"
                                  className={`h-6 text-xs ${config.color}`}
                                  onClick={() => handleAction(action, alert.source_entity, alert.source_id, alert.id)}
                                >
                                  <Icon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                    {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
                        <p>No critical alerts</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Top Suggestions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Decision Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    {suggestions.slice(0, 4).map(suggestion => (
                      <div key={suggestion.id} className="p-3 mb-2 rounded-lg bg-amber-50 border border-amber-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-amber-900">{suggestion.title}</div>
                            <div className="text-xs text-amber-700 mt-1">{suggestion.expected_impact}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-600">{suggestion.priority_score}</span>
                            <UrgencyBadge urgency={suggestion.urgency} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {suggestions.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-2" />
                        <p>No suggestions at this time</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Bottlenecks Summary */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Operations Bottlenecks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bottlenecks && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(bottlenecks.bottlenecks || {}).map(([key, data]) => (
                        <div key={key} className={`p-4 rounded-lg border ${
                          data.severity === 'critical' ? 'bg-red-50 border-red-200' :
                          data.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                          data.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium capitalize text-slate-600">{key}</span>
                            <SeverityBadge severity={data.severity} />
                          </div>
                          <div className="text-2xl font-bold">{data.count}</div>
                          <div className="text-xs text-slate-500 mt-1 truncate">{data.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ALERTS TAB */}
          <TabsContent value="alerts" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">All Alerts</h2>
                {alertSummary && (
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {alertSummary.by_severity?.critical || 0} Critical
                    </Badge>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      {alertSummary.by_severity?.high || 0} High
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      {alertSummary.by_severity?.medium || 0} Medium
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              {alerts.map(alert => (
                <Card key={alert.id} className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-red-500' :
                  alert.severity === 'high' ? 'border-l-orange-500' :
                  alert.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs capitalize">{alert.category}</Badge>
                          <SeverityBadge severity={alert.severity} />
                          <UrgencyBadge urgency={alert.urgency} />
                        </div>
                        <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                        {alert.metrics && (
                          <div className="flex gap-4 mt-2 text-xs text-slate-500">
                            {Object.entries(alert.metrics).slice(0, 3).map(([k, v]) => (
                              <span key={k} className="capitalize">{k}: <strong>{v}</strong></span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {alert.recommended_actions?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                        {alert.recommended_actions.map(action => {
                          const config = ACTION_CONFIG[action] || { icon: Zap, label: action, color: 'text-slate-600' };
                          const Icon = config.icon;
                          return (
                            <Button
                              key={action}
                              size="sm"
                              variant="outline"
                              className={config.color}
                              onClick={() => handleAction(action, alert.source_entity, alert.source_id, alert.id)}
                            >
                              <Icon className="h-4 w-4 mr-2" />
                              {config.label}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {alerts.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400" />
                    <h3 className="text-lg font-medium text-slate-900">All Clear!</h3>
                    <p className="text-slate-500">No active alerts at this time</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* SUGGESTIONS TAB */}
          <TabsContent value="suggestions" className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Decision Suggestions</h2>
            <div className="space-y-3">
              {suggestions.map(suggestion => (
                <Card key={suggestion.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="capitalize">{suggestion.category}</Badge>
                          <div className="flex items-center gap-1 text-amber-600">
                            <Zap className="h-4 w-4" />
                            <span className="text-sm font-bold">{suggestion.priority_score}</span>
                          </div>
                          <UrgencyBadge urgency={suggestion.urgency} />
                        </div>
                        <h3 className="font-semibold text-slate-900">{suggestion.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{suggestion.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-slate-50 rounded-lg">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Recommended Action</div>
                            <div className="text-sm font-medium">{suggestion.recommended_action}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Expected Impact</div>
                            <div className="text-sm font-medium text-green-600">{suggestion.expected_impact}</div>
                          </div>
                        </div>
                        
                        {suggestion.rationale && (
                          <div className="text-xs text-slate-500 mt-3 italic">
                            Rationale: {suggestion.rationale}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {suggestions.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-900">No Suggestions</h3>
                    <p className="text-slate-500">Business operations are running smoothly</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* TODAY FOCUS TAB */}
          <TabsContent value="focus" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Today's Focus Panel</h2>
                <p className="text-sm text-slate-500">
                  {focusPanel?.date} • {focusPanel?.total_items || 0} items requiring attention
                </p>
              </div>
              {focusPanel?.summary && (
                <div className="flex gap-2">
                  <Badge variant="outline">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {focusPanel.summary.alerts_count} Alerts
                  </Badge>
                  <Badge variant="outline">
                    <ListTodo className="h-3 w-3 mr-1" />
                    {focusPanel.summary.tasks_count} Tasks
                  </Badge>
                  <Badge variant="outline">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    {focusPanel.summary.suggestions_count} Suggestions
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {focusPanel?.focus_items?.map((item, index) => (
                <Card key={item.id || index} className={`border-l-4 ${
                  item.type === 'alert' ? 'border-l-red-500' :
                  item.type === 'task' ? 'border-l-blue-500' :
                  'border-l-amber-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          item.type === 'alert' ? 'bg-red-100' :
                          item.type === 'task' ? 'bg-blue-100' :
                          'bg-amber-100'
                        }`}>
                          {item.type === 'alert' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                          {item.type === 'task' && <ListTodo className="h-4 w-4 text-blue-600" />}
                          {item.type === 'suggestion' && <Lightbulb className="h-4 w-4 text-amber-600" />}
                        </div>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-slate-500">{item.description?.slice(0, 100)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900">Priority: {item.priority_score}</div>
                          <UrgencyBadge urgency={item.urgency} />
                        </div>
                        <Button size="sm" variant="outline">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!focusPanel?.focus_items || focusPanel.focus_items.length === 0) && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400" />
                    <h3 className="text-lg font-medium text-slate-900">All Caught Up!</h3>
                    <p className="text-slate-500">No urgent items for today</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* CONTROL FEED TAB */}
          <TabsContent value="feed" className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Control Feed</h2>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>
              <div className="space-y-4">
                {controlFeed.map((item, index) => (
                  <div key={item.id || index} className="relative pl-14">
                    <div className={`absolute left-4 w-4 h-4 rounded-full border-2 border-white ${
                      item.type === 'alert' ? 'bg-red-500' :
                      item.type === 'action' ? 'bg-green-500' :
                      item.type === 'escalation' ? 'bg-orange-500' :
                      item.type === 'resolution' ? 'bg-blue-500' :
                      'bg-slate-400'
                    }`}></div>
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                              {item.severity && <SeverityBadge severity={item.severity} />}
                            </div>
                            <div className="font-medium text-sm">{item.title}</div>
                            <div className="text-xs text-slate-500 mt-1">{item.description}</div>
                            {item.actor && (
                              <div className="text-xs text-slate-400 mt-1">by {item.actor}</div>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {item.timestamp && new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
                
                {controlFeed.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <h3 className="text-lg font-medium text-slate-900">No Activity Yet</h3>
                      <p className="text-slate-500">Control feed will show alerts, actions, and updates here</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
