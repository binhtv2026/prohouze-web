/**
 * Unified Profile Modal Component
 * Prompt 6/20 - CRM Unified Profile Standardization
 * 
 * Shows aggregated view of a Contact with all related data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { contactsAPI, crmConfigAPI } from '@/lib/crmApi';
import { formatDate, getScoreColor } from '@/lib/utils';
import { toast } from 'sonner';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Target,
  DollarSign,
  Clock,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  Tag,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import InteractionTimeline from './InteractionTimeline';

export default function UnifiedProfileModal({ open, onOpenChange, contactId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [contactStatuses, setContactStatuses] = useState([]);
  const [leadStages, setLeadStages] = useState([]);

  const loadConfig = useCallback(async () => {
    try {
      const [statusesRes, stagesRes] = await Promise.all([
        crmConfigAPI.getContactStatuses(),
        crmConfigAPI.getLeadStages(),
      ]);
      setContactStatuses(statusesRes.data?.statuses || []);
      setLeadStages(stagesRes.data?.stages || []);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await contactsAPI.getUnifiedProfile(contactId);
      setProfile(response.data);
    } catch (error) {
      toast.error('Không thể tải thông tin profile');
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    if (open && contactId) {
      loadProfile();
      loadConfig();
    }
  }, [contactId, loadConfig, loadProfile, open]);

  const getStatusBadge = (statusCode) => {
    const status = contactStatuses.find(s => s.code === statusCode);
    return (
      <Badge className={status?.color || 'bg-slate-100 text-slate-700'}>
        {status?.label || statusCode}
      </Badge>
    );
  };

  const getStageInfo = (stageCode) => {
    return leadStages.find(s => s.code === stageCode) || {};
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : profile ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#316585] to-[#264f68] text-white p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {profile.contact?.full_name?.charAt(0) || 'C'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{profile.contact?.full_name}</h2>
                    {getStatusBadge(profile.contact?.status)}
                    {profile.contact?.is_vip && (
                      <Badge className="bg-amber-500 text-white">VIP</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {profile.contact?.phone_masked || profile.contact?.phone}
                    </span>
                    {profile.contact?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {profile.contact?.email}
                      </span>
                    )}
                  </div>
                  {profile.contact?.company_name && (
                    <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
                      <Building2 className="w-4 h-4" />
                      {profile.contact?.company_name}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => { onOpenChange(false); navigate(`/crm/contacts?edit=${contactId}`); }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Chỉnh sửa
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{profile.summary?.total_leads || 0}</p>
                  <p className="text-xs text-white/70">Leads</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{profile.summary?.total_deals || 0}</p>
                  <p className="text-xs text-white/70">Deals</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{profile.total_interactions || 0}</p>
                  <p className="text-xs text-white/70">Tương tác</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">
                    {profile.summary?.total_value 
                      ? `${(profile.summary.total_value / 1000000000).toFixed(1)} tỷ`
                      : '0'}
                  </p>
                  <p className="text-xs text-white/70">Giá trị GD</p>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="overview" className="flex-1">
              <div className="px-6 pt-4 border-b">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                  <TabsTrigger value="leads">Leads ({profile.leads?.length || 0})</TabsTrigger>
                  <TabsTrigger value="demands">Nhu cầu ({profile.demand_profiles?.length || 0})</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[400px]">
                {/* Overview Tab */}
                <TabsContent value="overview" className="p-6 space-y-6">
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-500">Thông tin liên hệ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{profile.contact?.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{profile.contact?.phone}</span>
                        </div>
                        {profile.contact?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="text-sm">{profile.contact?.email}</span>
                          </div>
                        )}
                        {(profile.contact?.address || profile.contact?.city) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-sm">
                              {[profile.contact?.address, profile.contact?.district, profile.contact?.city]
                                .filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-500">Phân công & Nguồn</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">Phụ trách</span>
                          <span className="text-sm font-medium">{profile.contact?.assigned_to_name || 'Chưa phân công'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">Chi nhánh</span>
                          <span className="text-sm font-medium">{profile.contact?.branch_name || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">Nguồn gốc</span>
                          <span className="text-sm font-medium">{profile.contact?.original_source || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">Ngày tạo</span>
                          <span className="text-sm font-medium">{formatDate(profile.contact?.created_at)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Active Demand */}
                  {profile.active_demand && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Nhu cầu hiện tại
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-slate-500">Ngân sách</p>
                            <p className="font-medium">{profile.active_demand.budget_display || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Loại BĐS</p>
                            <p className="font-medium">{profile.active_demand.property_types?.join(', ') || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Diện tích</p>
                            <p className="font-medium">{profile.active_demand.area_display || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Độ khẩn cấp</p>
                            <Badge variant="outline">{profile.active_demand.urgency}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tags */}
                  {profile.contact?.tags?.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-4 h-4 text-slate-400" />
                      {profile.contact.tags.map((tag, i) => (
                        <Badge key={i} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Leads Tab */}
                <TabsContent value="leads" className="p-6">
                  {profile.leads?.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Chưa có lead nào</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {profile.leads?.map((lead) => {
                        const stageInfo = getStageInfo(lead.stage);
                        return (
                          <Card key={lead.id} className="hover:shadow-sm transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge className={stageInfo.color || 'bg-slate-100 text-slate-700'}>
                                    {stageInfo.label || lead.stage}
                                  </Badge>
                                  <span className="font-medium">{lead.project_interest || lead.source}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  {lead.score > 0 && (
                                    <Badge className={getScoreColor(lead.score)}>
                                      {lead.score}
                                    </Badge>
                                  )}
                                  <span className="text-sm text-slate-500">{formatDate(lead.created_at)}</span>
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>
                              </div>
                              {lead.budget_display && (
                                <p className="text-sm text-slate-500 mt-2">
                                  <DollarSign className="w-3 h-3 inline mr-1" />
                                  {lead.budget_display}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Demands Tab */}
                <TabsContent value="demands" className="p-6">
                  {profile.demand_profiles?.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Chưa có nhu cầu nào</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {profile.demand_profiles?.map((demand) => (
                        <Card key={demand.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={demand.is_active ? 'default' : 'outline'}>
                                  {demand.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline">{demand.purpose}</Badge>
                              </div>
                              <span className="text-sm text-slate-500">{formatDate(demand.created_at)}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-slate-500">Ngân sách</p>
                                <p className="font-medium">{demand.budget_display || '-'}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Loại BĐS</p>
                                <p className="font-medium">{demand.property_types?.join(', ') || '-'}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Diện tích</p>
                                <p className="font-medium">{demand.area_display || '-'}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Độ khẩn cấp</p>
                                <p className="font-medium">{demand.urgency}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="p-6">
                  <InteractionTimeline 
                    interactions={profile.recent_interactions || []} 
                    total={profile.total_interactions || 0}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </>
        ) : (
          <div className="p-6 text-center text-slate-500">
            Không tìm thấy thông tin profile
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
