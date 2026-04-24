/**
 * CRM Dashboard Page
 * Prompt 6/20 - CRM Unified Profile Standardization
 */

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { contactsAPI, crmLeadsAPI, crmConfigAPI } from '@/lib/crmApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  TrendingUp,
  Target,
  Phone,
  Calendar,
  ArrowRight,
  Sparkles,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function CRMDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalLeads: 0,
    newLeadsToday: 0,
    convertedThisMonth: 0,
    pendingFollowups: 0,
  });
  const [leadStages, setLeadStages] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [contactStatuses, setContactStatuses] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [contactsRes, leadsRes, stagesRes, statusesRes] = await Promise.all([
        contactsAPI.getAll({ limit: 100 }),
        crmLeadsAPI.getAll({ limit: 100 }),
        crmConfigAPI.getLeadStages(),
        crmConfigAPI.getContactStatuses(),
      ]);

      const contacts = contactsRes.data;
      const leads = leadsRes.data;
      const stages = stagesRes.data?.stages || [];
      const statuses = statusesRes.data?.statuses || [];

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      setStats({
        totalContacts: contacts.length,
        totalLeads: leads.length,
        newLeadsToday: leads.filter(l => l.created_at?.startsWith(today)).length,
        convertedThisMonth: leads.filter(l => l.stage === 'converted' && l.created_at?.startsWith(thisMonth)).length,
        pendingFollowups: leads.filter(l => !['converted', 'lost', 'disqualified'].includes(l.stage)).length,
      });

      setLeadStages(stages);
      setContactStatuses(statuses);
      setRecentLeads(leads.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStageCount = (stageCode) => {
    return recentLeads.filter(l => l.stage === stageCode).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6" data-testid="crm-dashboard-loading">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="crm-dashboard">
      <PageHeader
        title="CRM Dashboard"
        subtitle="Tổng quan quản lý khách hàng và leads"
        breadcrumbs={[
          { label: 'CRM', path: '/crm' },
          { label: 'Dashboard', path: '/crm' },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="stat-card bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Tổng Contacts</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalContacts}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Tổng Leads</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalLeads}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Leads hôm nay</p>
                  <p className="text-3xl font-bold mt-1">{stats.newLeadsToday}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Converted tháng này</p>
                  <p className="text-3xl font-bold mt-1">{stats.convertedThisMonth}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-sm font-medium">Cần follow-up</p>
                  <p className="text-3xl font-bold mt-1">{stats.pendingFollowups}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4 justify-start gap-3 bg-white hover:bg-slate-50"
            onClick={() => navigate('/crm/contacts')}
            data-testid="quick-action-contacts"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Quản lý Contacts</p>
              <p className="text-sm text-slate-500">Danh bạ khách hàng</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 justify-start gap-3 bg-white hover:bg-slate-50"
            onClick={() => navigate('/crm/leads')}
            data-testid="quick-action-leads"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Lead Pipeline</p>
              <p className="text-sm text-slate-500">Kanban board leads</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 justify-start gap-3 bg-white hover:bg-slate-50"
            onClick={() => navigate('/crm/demands')}
            data-testid="quick-action-demands"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Nhu cầu KH</p>
              <p className="text-sm text-slate-500">Demand profiles</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 justify-start gap-3 bg-white hover:bg-slate-50"
            onClick={() => navigate('/crm/contacts?new=true')}
            data-testid="quick-action-new-contact"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Thêm Contact</p>
              <p className="text-sm text-slate-500">Tạo contact mới</p>
            </div>
          </Button>
        </div>

        {/* Pipeline Overview & Recent Leads */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Pipeline Overview */}
          <Card className="lg:col-span-2 bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-[#316585]" />
                Lead Pipeline
              </CardTitle>
              <CardDescription>Phân bố leads theo giai đoạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadStages
                  .filter(s => !['disqualified', 'lost', 'recycled'].includes(s.code))
                  .slice(0, 8)
                  .map((stage) => {
                    const count = getStageCount(stage.code);
                    const percentage = stats.totalLeads > 0 
                      ? Math.round((count / stats.totalLeads) * 100) 
                      : 0;
                    return (
                      <div key={stage.code} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={stage.color || 'bg-slate-100 text-slate-700'}>
                              {stage.label}
                            </Badge>
                            <span className="text-sm text-slate-500">{count} leads</span>
                          </div>
                          <span className="text-sm font-medium text-slate-700">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-[#316585] hover:text-[#264f68]"
                onClick={() => navigate('/crm/leads')}
              >
                Xem Pipeline đầy đủ
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Leads gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLeads.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Chưa có leads</p>
                ) : (
                  recentLeads.map((lead) => (
                    <div 
                      key={lead.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                      onClick={() => navigate(`/crm/leads?id=${lead.id}`)}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#316585]/10 flex items-center justify-center text-[#316585] font-medium">
                        {lead.contact_name?.charAt(0) || 'L'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {lead.contact_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {lead.project_interest || lead.source || 'No info'}
                        </p>
                      </div>
                      <Badge className={
                        leadStages.find(s => s.code === lead.stage)?.color || 'bg-slate-100 text-slate-700'
                      }>
                        {leadStages.find(s => s.code === lead.stage)?.label || lead.stage}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-[#316585] hover:text-[#264f68]"
                onClick={() => navigate('/crm/leads')}
              >
                Xem tất cả leads
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Status Distribution */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Phân bố Contact Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {contactStatuses.map((status) => (
                <div 
                  key={status.code}
                  className="p-4 rounded-lg bg-slate-50 text-center hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/crm/contacts?status=${status.code}`)}
                >
                  <Badge className={`${status.color} mb-2`}>{status.label}</Badge>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.totalContacts > 0 ? Math.round(stats.totalContacts / contactStatuses.length) : 0}
                  </p>
                  <p className="text-xs text-slate-500">{status.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
