import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  GraduationCap,
  Video,
  FileText,
  BookOpen,
  Play,
  CheckCircle2,
  Clock,
  Award,
  Users,
  Target,
  Brain,
  Sparkles,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const trainingTypeLabels = {
  onboarding: { label: 'Hội nhập', color: 'bg-blue-100 text-blue-700', icon: Users },
  skill: { label: 'Kỹ năng', color: 'bg-green-100 text-green-700', icon: Target },
  product: { label: 'Sản phẩm', color: 'bg-purple-100 text-purple-700', icon: BookOpen },
  compliance: { label: 'Tuân thủ', color: 'bg-red-100 text-red-700', icon: FileText },
  leadership: { label: 'Lãnh đạo', color: 'bg-amber-100 text-amber-700', icon: Award },
  certification: { label: 'Chứng chỉ', color: 'bg-indigo-100 text-indigo-700', icon: GraduationCap },
};

const statusLabels = {
  not_started: { label: 'Chưa bắt đầu', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'Đang học', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Không đạt', color: 'bg-red-100 text-red-700' },
  expired: { label: 'Hết hạn', color: 'bg-slate-100 text-slate-700' },
};

const DEMO_COURSES = [
  { id: 'course-1', title: 'Hội nhập sale mới', code: 'ONB-001', type: 'onboarding', total_hours: 4, passing_score: 70, is_mandatory: true },
  { id: 'course-2', title: 'Kỹ năng chốt khách BĐS sơ cấp', code: 'SKL-014', type: 'skill', total_hours: 3, passing_score: 75, is_mandatory: false },
  { id: 'course-3', title: 'Pháp lý dự án và hồ sơ gửi khách', code: 'PRD-006', type: 'product', total_hours: 2, passing_score: 80, is_mandatory: true },
];

const DEMO_MY_COURSES = [
  { id: 'my-1', course_id: 'course-1', course_title: 'Hội nhập sale mới', type: 'onboarding', status: 'completed', progress_percent: 100, score: 92 },
  { id: 'my-2', course_id: 'course-2', course_title: 'Kỹ năng chốt khách BĐS sơ cấp', type: 'skill', status: 'in_progress', progress_percent: 58, score: null },
  { id: 'my-3', course_id: 'course-3', course_title: 'Pháp lý dự án và hồ sơ gửi khách', type: 'product', status: 'not_started', progress_percent: 0, score: null },
];

const DEMO_EMPLOYEES = [
  { id: 'emp-1', full_name: 'Nguyễn Hoàng Phúc', role: 'sales' },
  { id: 'emp-2', full_name: 'Lê Mỹ Linh', role: 'hr' },
  { id: 'emp-3', full_name: 'Trần Gia Bảo', role: 'manager' },
];

export default function TrainingPage() {
  const { token, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('my-courses');

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    type: 'onboarding',
    description: '',
    modules: '',
    total_hours: 2,
    passing_score: 70,
    is_mandatory: false,
  });

  const [enrollForm, setEnrollForm] = useState({
    employee_id: '',
    due_date: '',
  });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hrm-advanced/training/courses');
      const items = res.data || [];
      setCourses(items.length > 0 ? items : DEMO_COURSES);
    } catch (error) {
      console.error('Error:', error);
      setCourses(DEMO_COURSES);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyCourses = useCallback(async () => {
    try {
      const res = await api.get('/hrm-advanced/training/my-courses');
      const items = res.data || [];
      setMyCourses(items.length > 0 ? items : DEMO_MY_COURSES);
    } catch (error) {
      console.error('Error:', error);
      setMyCourses(DEMO_MY_COURSES);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get('/users');
      const items = res.data || [];
      setEmployees(items.length > 0 ? items : DEMO_EMPLOYEES);
    } catch (error) {
      console.error('Error:', error);
      setEmployees(DEMO_EMPLOYEES);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    fetchMyCourses();
    fetchEmployees();
  }, [fetchCourses, fetchMyCourses, fetchEmployees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const modules = formData.modules.split('\n').filter(m => m.trim()).map((m, idx) => ({
        id: `module-${idx + 1}`,
        title: m.trim(),
        order: idx + 1,
      }));

      await api.post('/hrm-advanced/training/courses', {
        ...formData,
        modules,
        total_hours: parseFloat(formData.total_hours),
        passing_score: parseFloat(formData.passing_score),
      });
      toast.success('Đã tạo khóa đào tạo');
      setShowDialog(false);
      fetchCourses();
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Không thể tạo khóa đào tạo');
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hrm-advanced/training/enroll', {
        ...enrollForm,
        course_id: selectedCourse.id,
      });
      toast.success('Đã ghi danh nhân viên');
      setShowEnrollDialog(false);
      setEnrollForm({ employee_id: '', due_date: '' });
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Không thể ghi danh');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      type: 'onboarding',
      description: '',
      modules: '',
      total_hours: 2,
      passing_score: 70,
      is_mandatory: false,
    });
  };

  // Stats
  const totalCourses = courses.length;
  const completedCourses = myCourses.filter(c => c.status === 'completed').length;
  const inProgressCourses = myCourses.filter(c => c.status === 'in_progress').length;
  const avgProgress = myCourses.length > 0
    ? myCourses.reduce((sum, c) => sum + c.progress_percent, 0) / myCourses.length
    : 0;

  const isAdmin = user?.role && ['bod', 'admin', 'hr'].includes(user.role);

  return (
    <div className="space-y-6" data-testid="training-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Đào tạo</h1>
          <p className="text-slate-500 text-sm mt-1">Hệ thống quản lý đào tạo nhân viên (LMS)</p>
        </div>
        {isAdmin && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-course-btn">
                <Plus className="h-4 w-4 mr-2" />
                Tạo khóa học
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Tạo Khóa Đào tạo
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mã khóa học *</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="VD: ONB-001"
                      required
                    />
                  </div>
                  <div>
                    <Label>Loại</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(trainingTypeLabels).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Tên khóa học *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Đào tạo hội nhập nhân viên mới"
                    required
                  />
                </div>
                <div>
                  <Label>Mô tả</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả nội dung khóa học..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Nội dung (mỗi dòng 1 module)</Label>
                  <Textarea
                    value={formData.modules}
                    onChange={(e) => setFormData({ ...formData, modules: e.target.value })}
                    placeholder="- Giới thiệu công ty&#10;- Văn hóa doanh nghiệp&#10;- Quy trình làm việc&#10;- Sản phẩm BĐS"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Thời lượng (giờ)</Label>
                    <Input
                      type="number"
                      value={formData.total_hours}
                      onChange={(e) => setFormData({ ...formData, total_hours: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Điểm đạt (%)</Label>
                    <Input
                      type="number"
                      value={formData.passing_score}
                      onChange={(e) => setFormData({ ...formData, passing_score: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Huỷ
                  </Button>
                  <Button type="submit">Tạo khóa học</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Tổng khóa học</p>
                <p className="text-2xl font-bold text-blue-700">{totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Đang học</p>
                <p className="text-2xl font-bold text-amber-700">{inProgressCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-700">{completedCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Tiến độ TB</p>
                <p className="text-2xl font-bold text-purple-700">{avgProgress.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-courses">Khóa học của tôi</TabsTrigger>
          <TabsTrigger value="all-courses">Tất cả khóa học</TabsTrigger>
        </TabsList>

        <TabsContent value="my-courses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Khóa học đang tham gia</CardTitle>
              <CardDescription>Tiến độ học tập của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              {myCourses.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Bạn chưa tham gia khóa học nào</p>
                  <p className="text-sm mt-1">Xem danh sách khóa học để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myCourses.map((enrollment) => {
                    const typeInfo = trainingTypeLabels[enrollment.course_type] || trainingTypeLabels.skill;
                    const statusInfo = statusLabels[enrollment.status] || statusLabels.not_started;
                    const TypeIcon = typeInfo.icon;

                    return (
                      <div key={enrollment.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${typeInfo.color.split(' ')[0]}`}>
                            <TypeIcon className={`h-6 w-6 ${typeInfo.color.split(' ')[1]}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-slate-900">{enrollment.course_title}</p>
                                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                                </div>
                                <p className="text-sm text-slate-500">{typeInfo.label}</p>
                              </div>
                              {enrollment.status === 'completed' && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Award className="h-5 w-5" />
                                  <span className="text-sm font-medium">Đạt</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Tiến độ</span>
                                <span className="font-medium">{enrollment.progress_percent.toFixed(0)}%</span>
                              </div>
                              <Progress value={enrollment.progress_percent} className="h-2" />
                            </div>
                            {enrollment.quiz_score !== null && (
                              <div className="mt-2 flex items-center justify-between text-sm">
                                <span className="text-slate-500">Điểm bài test</span>
                                <span className={`font-medium ${enrollment.quiz_passed ? 'text-green-600' : 'text-red-600'}`}>
                                  {enrollment.quiz_score}%
                                </span>
                              </div>
                            )}
                            {enrollment.due_date && (
                              <div className="mt-2 text-xs text-slate-500">
                                Hạn hoàn thành: {new Date(enrollment.due_date).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-end">
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            {enrollment.status === 'not_started' ? 'Bắt đầu' : 'Tiếp tục'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-courses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Khóa học</CardTitle>
              <CardDescription>Tất cả khóa đào tạo trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-500">Đang tải...</div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Chưa có khóa học nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => {
                    const typeInfo = trainingTypeLabels[course.type] || trainingTypeLabels.skill;
                    const TypeIcon = typeInfo.icon;

                    return (
                      <div key={course.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${typeInfo.color.split(' ')[0]}`}>
                            <TypeIcon className={`h-5 w-5 ${typeInfo.color.split(' ')[1]}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <p className="font-medium text-slate-900 line-clamp-2">{course.title}</p>
                              {course.is_mandatory && (
                                <Badge variant="destructive" className="ml-2 flex-shrink-0">Bắt buộc</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{course.code}</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{course.description}</p>
                        <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {course.total_hours}h
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {course.total_enrolled} học viên
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {course.passing_score}%
                          </span>
                        </div>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSelectedCourse(course);
                              setShowEnrollDialog(true);
                            }}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Ghi danh học viên
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enroll Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi danh Học viên</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50">
              <p className="font-medium">{selectedCourse?.title}</p>
              <p className="text-sm text-slate-500">{selectedCourse?.code}</p>
            </div>
            <div>
              <Label>Nhân viên *</Label>
              <Select value={enrollForm.employee_id} onValueChange={(v) => setEnrollForm({ ...enrollForm, employee_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hạn hoàn thành</Label>
              <Input
                type="date"
                value={enrollForm.due_date}
                onChange={(e) => setEnrollForm({ ...enrollForm, due_date: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowEnrollDialog(false)}>
                Huỷ
              </Button>
              <Button type="submit">Ghi danh</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Training Path Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Lộ trình Đào tạo
          </CardTitle>
          <CardDescription>Quy trình đào tạo nhân viên mới</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: 1, title: 'Hội nhập', desc: 'Giới thiệu công ty, văn hóa', icon: Users, color: 'bg-blue-100 text-blue-700' },
              { step: 2, title: 'Sản phẩm', desc: 'Kiến thức BĐS, dự án', icon: BookOpen, color: 'bg-purple-100 text-purple-700' },
              { step: 3, title: 'Kỹ năng', desc: 'Sales, tư vấn, chốt deal', icon: Target, color: 'bg-green-100 text-green-700' },
              { step: 4, title: 'Thực hành', desc: 'Làm việc có mentor', icon: Award, color: 'bg-amber-100 text-amber-700' },
            ].map((item) => (
              <div key={item.step} className="relative p-4 rounded-lg border bg-gradient-to-br from-white to-slate-50">
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-3 ${item.color.split(' ')[0]}`}>
                  <item.icon className={`h-6 w-6 ${item.color.split(' ')[1]}`} />
                </div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
