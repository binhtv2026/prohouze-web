import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  GraduationCap,
  FileText,
  UserPlus,
  MessageSquare,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Building2,
  Network,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HRDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeContracts: 0,
    openRecruitments: 0,
    pendingApplications: 0,
    activeTrainings: 0,
    completedTrainings: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [trainingProgress, setTrainingProgress] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch multiple data
      const [usersRes, contractsRes, recruitmentsRes, applicationsRes, trainingsRes] = await Promise.allSettled([
        api.get('/users'),
        api.get('/hrm-advanced/contracts'),
        api.get('/hrm-advanced/recruitments'),
        api.get('/hrm-advanced/applications'),
        api.get('/hrm-advanced/training/courses'),
      ]);

      // Parse stats
      const users = usersRes.status === 'fulfilled' ? usersRes.value?.data || [] : [];
      const contracts = contractsRes.status === 'fulfilled' ? contractsRes.value?.data || [] : [];
      const recruitments = recruitmentsRes.status === 'fulfilled' ? recruitmentsRes.value?.data || [] : [];
      const applications = applicationsRes.status === 'fulfilled' ? applicationsRes.value?.data || [] : [];
      const trainings = trainingsRes.status === 'fulfilled' ? trainingsRes.value?.data || [] : [];

      setStats({
        totalEmployees: users.length,
        activeContracts: contracts.filter(c => c.status === 'active').length,
        openRecruitments: recruitments.filter(r => r.status === 'open').length,
        pendingApplications: applications.filter(a => a.status === 'submitted').length,
        activeTrainings: trainings.length,
        completedTrainings: 0,
      });

      setRecentApplications(applications.slice(0, 5));

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="hr-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Nhân sự</h1>
          <p className="text-slate-500 text-sm mt-1">Tổng quan quản lý nhân sự</p>
        </div>
        <div className="flex gap-2">
          <Link to="/hrm/recruitment">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Tuyển dụng
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Tổng nhân viên</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">HĐ đang hiệu lực</p>
                <p className="text-2xl font-bold text-green-700">{stats.activeContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Đang tuyển</p>
                <p className="text-2xl font-bold text-purple-700">{stats.openRecruitments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Khóa đào tạo</p>
                <p className="text-2xl font-bold text-amber-700">{stats.activeTrainings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/organization">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Network className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">Sơ đồ tổ chức</p>
                  <p className="text-sm text-slate-500">Cơ cấu công ty</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/hrm/contracts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">Hợp đồng LĐ</p>
                  <p className="text-sm text-slate-500">Quản lý hợp đồng</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/hrm/training">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="font-medium">Đào tạo</p>
                  <p className="text-sm text-slate-500">Khóa học, LMS</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/hrm/culture">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-red-600" />
                <div>
                  <p className="font-medium">Văn hóa DN</p>
                  <p className="text-sm text-slate-500">Giá trị, phúc lợi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Applications */}
      {stats.pendingApplications > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              Ứng viên chờ xử lý
              <Badge variant="destructive">{stats.pendingApplications}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="font-medium text-purple-600">
                        {app.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{app.full_name}</p>
                      <p className="text-sm text-slate-500">{app.recruitment_title}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{app.status}</Badge>
                </div>
              ))}
            </div>
            <Link to="/hrm/recruitment" className="mt-4 flex items-center text-sm text-blue-600 hover:underline">
              Xem tất cả <ChevronRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
