import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Zap, Settings, PlayCircle, PauseCircle, AlertTriangle, 
  TrendingUp, Activity, Clock, Target, DollarSign,
  ArrowUpRight, ChevronRight, RefreshCw, ListFilter,
  BarChart3, Users, Calendar, FileText, Bell
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_AUTOMATION_STATS = {
  enabled_rules: 7,
  total_rules: 11,
  total_rules_count: 11,
  rules_by_domain: {
    lead: 4,
    deal: 2,
    task: 3,
    booking: 2,
  },
  current_status: {
    hot_leads_pending: 5,
    high_value_deals_active: 3,
    escalations_24h: 2,
  },
};

const DEMO_TOP_RULES = [
  { id: 'rule-001', name: 'Lead nóng quá 15 phút chưa xử lý', execution_count: 86, success_rate: 92 },
  { id: 'rule-002', name: 'Deal lớn chậm cập nhật', execution_count: 52, success_rate: 88 },
];

const DEMO_EXECUTIONS = [
  { id: 'exec-001', rule_name: 'Lead nóng quá 15 phút chưa xử lý', status: 'success', created_at: new Date().toISOString() },
  { id: 'exec-002', rule_name: 'Deal lớn chậm cập nhật', status: 'success', created_at: new Date().toISOString() },
];

export default function AutomationDashboardPage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [topRules, setTopRules] = useState([]);
  const [recentExecutions, setRecentExecutions] = useState([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load phase 3 status
      const statusRes = await fetch(`${API_URL}/api/automation/phase3/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statusData = await statusRes.json();
      
      // Load rules
      const rulesRes = await fetch(`${API_URL}/api/automation/rules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rulesData = await rulesRes.json();
      
      // Load recent executions
      const execRes = await fetch(`${API_URL}/api/automation/executions?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const execData = await execRes.json();
      
      const mergedStats = {
        ...statusData,
        rules: rulesData.rules || [],
        totalRules: rulesData.count || 0
      };
      setStats(mergedStats);
      
      // Sort rules by execution count
      const sortedRules = (rulesData.rules || [])
        .sort((a, b) => (b.execution_count || 0) - (a.execution_count || 0))
        .slice(0, 5);
      setTopRules(sortedRules.length > 0 ? sortedRules : DEMO_TOP_RULES);
      
      setRecentExecutions(execData.executions?.length > 0 ? execData.executions : DEMO_EXECUTIONS);
      
    } catch (error) {
      console.error('Load dashboard error:', error);
      setStats(DEMO_AUTOMATION_STATS);
      setTopRules(DEMO_TOP_RULES);
      setRecentExecutions(DEMO_EXECUTIONS);
      toast.error('Không thể tải dữ liệu automation, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const runScheduledChecks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/automation/scheduled-checks/run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      toast.success(`Đã chạy scheduled checks: ${data.total_events_emitted || 0} events`);
      loadDashboardData();
    } catch (error) {
      toast.error('Lỗi chạy scheduled checks');
    }
  };

  const runEscalationChecks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/automation/escalation-checks/run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      toast.success(`Đã chạy escalation checks: ${data.total_escalations || 0} escalations`);
      loadDashboardData();
    } catch (error) {
      toast.error('Lỗi chạy escalation checks');
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full bg-${color}-500/10`}>
            <Icon className={`h-6 w-6 text-${color}-500`} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-3 text-xs">
            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const activeRules = stats?.enabled_rules || 0;
  const totalRules = stats?.total_rules || 0;
  const currentStatus = stats?.current_status || {};

  return (
    <div className="min-h-screen bg-background" data-testid="automation-dashboard">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              Automation Control Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý và giám sát automation cho doanh nghiệp
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={runScheduledChecks}>
              <Clock className="h-4 w-4 mr-2" />
              Scheduled Checks
            </Button>
            <Button variant="outline" size="sm" onClick={runEscalationChecks}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Escalation Checks
            </Button>
            <Button asChild>
              <Link to="/automation">
                <Settings className="h-4 w-4 mr-2" />
                Quản lý Rules
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Active Rules"
            value={activeRules}
            subtitle={`/ ${totalRules} total rules`}
            icon={PlayCircle}
            color="green"
          />
          <StatCard
            title="Hot Leads Pending"
            value={currentStatus.hot_leads_pending || 0}
            subtitle="Cần xử lý ngay"
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="High Value Deals"
            value={currentStatus.high_value_deals_active || 0}
            subtitle="> 1 tỷ VND"
            icon={DollarSign}
            color="yellow"
          />
          <StatCard
            title="Escalations (24h)"
            value={currentStatus.escalations_24h || 0}
            subtitle="Tasks đã escalate"
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Rules by Domain */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Lead Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.rules_by_domain?.lead || 0}</div>
              <Progress value={(stats?.rules_by_domain?.lead || 0) / activeRules * 100} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Hot lead, warm lead, SLA breach, escalation
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Deal Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.rules_by_domain?.deal || 0}</div>
              <Progress value={(stats?.rules_by_domain?.deal || 0) / activeRules * 100} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                VIP deal, stale recovery, won/lost flows
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                Booking Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.rules_by_domain?.booking || 0}</div>
              <Progress value={(stats?.rules_by_domain?.booking || 0) / activeRules * 100} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Expiring alerts, expired release
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Rules Đang Chạy
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/automation">
                    Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topRules.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Chưa có rule nào được thực thi
                  </p>
                ) : (
                  topRules.map((rule, index) => (
                    <div key={rule.rule_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">{rule.trigger_event}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={rule.is_enabled ? "default" : "secondary"}>
                          {rule.is_enabled ? "Active" : "Inactive"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Priority: {rule.priority}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Executions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Executions Gần Đây
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/automation">
                    Xem logs <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentExecutions.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Chưa có execution nào
                  </p>
                ) : (
                  recentExecutions.slice(0, 5).map((exec) => (
                    <div key={exec.trace_id || exec.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{exec.event_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {exec.rules_matched || 0} rules • {exec.actions_executed || 0} actions
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={exec.status === 'success' ? 'default' : 'destructive'}>
                          {exec.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {exec.duration_ms}ms
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Enabled */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Revenue-Driven Features
            </CardTitle>
            <CardDescription>
              Các tính năng automation đang hoạt động
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(stats?.features_enabled || [
                "Multi-step lead intake flow",
                "Revenue-based priority",
                "Automatic escalation chains",
                "Hot lead reassignment",
                "VIP deal handling",
                "Stale deal recovery",
                "Booking expiry management",
                "Deadline enforcement"
              ]).map((feature, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
