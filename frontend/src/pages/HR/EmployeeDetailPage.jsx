/**
 * Employee Detail Page - Hồ sơ nhân viên 360°
 * ProHouze HR Profile 360°
 * 
 * Tabs:
 * 1. Thông tin cá nhân
 * 2. Nhân thân
 * 3. Timeline (Học vấn + Công tác trước)
 * 4. Bằng cấp
 * 5. Tài liệu
 * 6. Công tác nội bộ
 * 7. KPI / Thu nhập
 * 8. Khen thưởng / Kỷ luật
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  User, Users, GraduationCap, Award, FileText, Building, 
  TrendingUp, Star, ChevronLeft, Edit, Save, X, Plus,
  Upload, CheckCircle, AlertCircle, Clock, Calendar,
  Phone, Mail, MapPin, CreditCard, Briefcase, Trophy, AlertTriangle
} from 'lucide-react';
import { hrApi } from '../../api/hrApi';
import { toast } from 'sonner';

// Tab Components
import PersonalInfoTab from './tabs/PersonalInfoTab';
import FamilyTab from './tabs/FamilyTab';
import TimelineTab from './tabs/TimelineTab';
import CertificatesTab from './tabs/CertificatesTab';
import DocumentsTab from './tabs/DocumentsTab';
import InternalHistoryTab from './tabs/InternalHistoryTab';
import KPITab from './tabs/KPITab';
import RewardsDisciplineTab from './tabs/RewardsDisciplineTab';

const TABS = [
  { id: 'personal', label: 'Thông tin cá nhân', icon: User },
  { id: 'family', label: 'Nhân thân', icon: Users },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'certificates', label: 'Bằng cấp', icon: Award },
  { id: 'documents', label: 'Tài liệu', icon: FileText },
  { id: 'internal', label: 'Công tác nội bộ', icon: Building },
  { id: 'kpi', label: 'KPI / Thu nhập', icon: TrendingUp },
  { id: 'rewards', label: 'Khen thưởng / Kỷ luật', icon: Trophy },
];

const STATUS_COLORS = {
  probation: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Thử việc' },
  official: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Chính thức' },
  collaborator: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'CTV' },
  intern: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Thực tập' },
  resigned: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Đã nghỉ' },
  terminated: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Sa thải' },
};

const ONBOARDING_STATUS = {
  pending: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Chưa bắt đầu' },
  in_progress: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Đang thực hiện' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Hoàn thành' },
  blocked: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Bị chặn' },
};

export default function EmployeeDetailPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await hrApi.getProfile360(profileId);
      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Không thể tải hồ sơ nhân viên');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleUpdateProfile = async (updates) => {
    try {
      await hrApi.updateProfile(profileId, updates);
      toast.success('Cập nhật thành công');
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Cập nhật thất bại');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!profileData || !profileData.profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <p className="text-gray-400">Không tìm thấy hồ sơ nhân viên</p>
          <Link to="/hr" className="text-cyan-400 hover:text-cyan-300 mt-4 inline-block">
            Quay về Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { profile, alerts, onboarding_checklist } = profileData;
  const status = STATUS_COLORS[profile.employment_status] || STATUS_COLORS.probation;
  const onboardingStatus = ONBOARDING_STATUS[profile.onboarding_status] || ONBOARDING_STATUS.pending;
  const completedOnboarding = onboarding_checklist?.filter(item => item.is_completed).length || 0;
  const totalOnboarding = onboarding_checklist?.length || 0;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalInfoTab profile={profile} onUpdate={handleUpdateProfile} />;
      case 'family':
        return <FamilyTab profileId={profileId} family={profileData.family} onRefresh={loadProfile} />;
      case 'timeline':
        return <TimelineTab profileId={profileId} education={profileData.education} workHistory={profileData.work_history} onRefresh={loadProfile} />;
      case 'certificates':
        return <CertificatesTab profileId={profileId} certificates={profileData.certificates} onRefresh={loadProfile} />;
      case 'documents':
        return <DocumentsTab profileId={profileId} documents={profileData.documents} onRefresh={loadProfile} />;
      case 'internal':
        return <InternalHistoryTab profileId={profileId} internalHistory={profileData.internal_history} contracts={profileData.contracts} onRefresh={loadProfile} />;
      case 'kpi':
        return <KPITab profileId={profileId} kpiRecords={profileData.kpi_records} profile={profile} />;
      case 'rewards':
        return <RewardsDisciplineTab profileId={profileId} records={profileData.rewards_discipline} onRefresh={loadProfile} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="employee-detail-page">
      {/* Header */}
      <div className="mb-6">
        <Link to="/hr" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
          <ChevronLeft size={20} />
          Quay lại HR Dashboard
        </Link>
        
        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-[#12121a] to-[#1a1a2e] border border-gray-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {profile.full_name?.charAt(0) || '?'}
              </div>
              <span className={`absolute -bottom-2 -right-2 px-2 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
                  <div className="flex items-center gap-4 mt-2 text-gray-400">
                    <span className="flex items-center gap-1">
                      <CreditCard size={14} />
                      {profile.employee_code}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase size={14} />
                      {profile.current_position || 'Chưa có chức vụ'}
                    </span>
                    {profile.join_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Từ {new Date(profile.join_date).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Quick Contact */}
                <div className="flex items-center gap-3">
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors" title={profile.phone}>
                      <Phone size={18} className="text-gray-400" />
                    </a>
                  )}
                  {profile.email_personal && (
                    <a href={`mailto:${profile.email_personal}`} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors" title={profile.email_personal}>
                      <Mail size={18} className="text-gray-400" />
                    </a>
                  )}
                </div>
              </div>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 mt-4">
                {/* Profile Completeness */}
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-400">Hoàn thiện hồ sơ</div>
                  <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${profile.profile_completeness >= 70 ? 'bg-emerald-500' : profile.profile_completeness >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${profile.profile_completeness}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm font-medium ${profile.profile_completeness >= 70 ? 'text-emerald-400' : profile.profile_completeness >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                    {profile.profile_completeness}%
                  </span>
                </div>
                
                {/* Onboarding Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Onboarding:</span>
                  <span className={`px-2 py-1 rounded-lg text-xs ${onboardingStatus.bg} ${onboardingStatus.text}`}>
                    {onboardingStatus.label}
                  </span>
                  <span className="text-gray-500 text-sm">({completedOnboarding}/{totalOnboarding})</span>
                </div>
                
                {/* KPI Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Deals:</span>
                    <span className="text-white ml-1 font-medium">{profile.total_deals}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Doanh thu:</span>
                    <span className="text-emerald-400 ml-1 font-medium">
                      {(profile.total_revenue / 1000000000).toFixed(1)}B
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Hoa hồng:</span>
                    <span className="text-cyan-400 ml-1 font-medium">
                      {(profile.total_commission / 1000000).toFixed(0)}M
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alerts */}
          {alerts && alerts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertTriangle size={16} />
                <span className="font-medium">{alerts.length} cảnh báo:</span>
                {alerts.slice(0, 3).map((alert, idx) => (
                  <span key={alert.id} className="text-gray-400">
                    {alert.title}{idx < Math.min(alerts.length, 3) - 1 ? ', ' : ''}
                  </span>
                ))}
                {alerts.length > 3 && <span className="text-gray-500">và {alerts.length - 3} cảnh báo khác</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-800 mb-6">
        <div className="flex overflow-x-auto hide-scrollbar gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
