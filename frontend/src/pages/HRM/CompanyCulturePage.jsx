import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart,
  Star,
  Target,
  BookOpen,
  Sparkles,
  Shield,
  Lightbulb,
  Handshake,
  Coffee,
  PartyPopper,
  Gift,
  Plane,
  Stethoscope,
  Baby,
  Smile,
} from 'lucide-react';

const DEMO_CULTURE = {
  company_name: 'ProHouze',
  mission: 'Giup doi ngu kinh doanh bat dong san ban hang nhanh hon, minh bach hon va chuyen nghiep hon.',
  vision: 'Tro thanh nen tang van hanh va ban hang bat dong san so cap hang dau cho chu dau tu, san giao dich va doi ngu sale.',
  core_values: [
    { name: 'Tan tam', description: 'Dat loi ich khach hang va doi ngu len truoc tien ich ngan han.' },
    { name: 'Ky luat', description: 'Lam dung quy trinh, dung cam ket va dung han.' },
    { name: 'Sang tao', description: 'Khuyen khich cach lam moi de tang toc do ban hang.' },
    { name: 'Hop tac', description: 'Phat trien van hoa ho tro nhau trong team va giua cac phong ban.' },
    { name: 'Hieu qua', description: 'Moi hanh dong deu huong den doanh so, uy tin va ket qua that.' }
  ],
  code_of_conduct: [
    'Ung xu chuyen nghiep voi khach hang, doi tac va dong nghiep.',
    'Khong che giau thong tin quan trong lien quan den giao dich.',
    'Khong cam ket vuot qua chinh sach da duoc phe duyet.',
    'Ton trong du lieu, bao mat thong tin va tai san cong ty.'
  ],
  dress_code: 'Trang phuc lich su, phu hop tinh chat tiep khach, su kien mo ban va moi truong cong so.',
  policies: [
    { name: 'Lam viec phoi hop', content: 'Phong ban nghiep vu va kinh doanh phai phan hoi trong ngay lam viec.' },
    { name: 'Van hanh minh bach', content: 'Thong tin du an, bang gia, chinh sach va phap ly phai nhat quan tren he thong.' },
    { name: 'Hoc tap lien tuc', content: 'Nhan su duoc cap nhat kien thuc du an, phap ly va ky nang ban hang dinh ky.' }
  ]
};

const DEMO_BENEFITS = {
  insurance: {
    social: { description: 'Bao hiem xa hoi', employer_rate: 17.5, employee_rate: 8 },
    health: { description: 'Bao hiem y te', employer_rate: 3, employee_rate: 1.5 },
    unemployment: { description: 'Bao hiem that nghiep', employer_rate: 1, employee_rate: 1 }
  },
  allowances: {
    lunch: { description: 'Phu cap an trua', amount: 750000 },
    phone: { description: 'Phu cap dien thoai', amount: 500000 },
    travel: { description: 'Phu cap di chuyen du an', amount: 1200000 }
  },
  bonus: {
    kpi: { description: 'Thuong dat KPI thang', amount: 3000000 },
    campaign: { description: 'Thuong chien dich mo ban', amount: 5000000 },
    referral: { description: 'Thuong gioi thieu ung vien', amount: 2000000 }
  },
  others: {
    healthcheck: { description: 'Kham suc khoe dinh ky hang nam', amount: 0 },
    team_building: { description: 'Team building va company trip', amount: 0 },
    birthday: { description: 'Qua sinh nhat va phuc loi le tet', amount: 1000000 }
  },
  leave: {
    annual_leave: { description: 'Phep nam', days: 12 },
    sick_leave: { description: 'Nghi om', days: 30 },
    maternity_leave: { description: 'Nghi thai san', days: 180 },
    paternity_leave: { description: 'Nghi cham vo sinh', days: 5 },
    wedding_leave: { description: 'Nghi ket hon', days: 3 },
    funeral_leave: { description: 'Nghi huu su', days: 3 }
  }
};

export default function CompanyCulturePage() {
  const [culture, setCulture] = useState(null);
  const [benefits, setBenefits] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cultureRes, benefitsRes] = await Promise.all([
        api.get('/hrm-advanced/company-culture').catch(() => null),
        api.get('/hrm-advanced/benefits-policy').catch(() => null)
      ]);

      setCulture(cultureRes?.data || DEMO_CULTURE);
      setBenefits(benefitsRes?.data || DEMO_BENEFITS);
    } catch (error) {
      console.error('Error:', error);
      setCulture(DEMO_CULTURE);
      setBenefits(DEMO_BENEFITS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const coreValueIcons = [Heart, Star, Lightbulb, Handshake, Target];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="company-culture-page">
      {/* Header */}
      <div className="text-center py-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white">
        <h1 className="text-3xl font-bold mb-2">{culture?.company_name}</h1>
        <p className="text-blue-100 max-w-2xl mx-auto">{culture?.mission}</p>
      </div>

      {/* Vision & Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Target className="h-5 w-5" />
              Sứ mệnh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{culture?.mission}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Sparkles className="h-5 w-5" />
              Tầm nhìn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{culture?.vision}</p>
          </CardContent>
        </Card>
      </div>

      {/* Core Values */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Giá trị Cốt lõi
          </CardTitle>
          <CardDescription>Những giá trị định hình văn hóa doanh nghiệp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {culture?.core_values?.map((value, idx) => {
              const IconComponent = coreValueIcons[idx % coreValueIcons.length];
              const colors = [
                'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
                'from-green-50 to-green-100 border-green-200 text-green-700',
                'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
                'from-amber-50 to-amber-100 border-amber-200 text-amber-700',
                'from-rose-50 to-rose-100 border-rose-200 text-rose-700',
              ];
              const colorClass = colors[idx % colors.length];

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border bg-gradient-to-br ${colorClass} text-center`}
                >
                  <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <p className="font-semibold mb-1">{value.name}</p>
                  <p className="text-sm opacity-80">{value.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Code of Conduct & Benefits */}
      <Tabs defaultValue="conduct">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conduct">Quy tắc Ứng xử</TabsTrigger>
          <TabsTrigger value="benefits">Chính sách Phúc lợi</TabsTrigger>
          <TabsTrigger value="leave">Chế độ Nghỉ phép</TabsTrigger>
        </TabsList>

        <TabsContent value="conduct" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-600" />
                Quy tắc Ứng xử
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {culture?.code_of_conduct?.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-slate-700">{idx + 1}</span>
                    </div>
                    <p className="text-slate-700">{rule}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2">Quy định Trang phục</h4>
                <p className="text-amber-700">{culture?.dress_code}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Insurance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Bảo hiểm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benefits?.insurance && Object.entries(benefits.insurance).map(([key, ins]) => (
                    <div key={key} className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-blue-800">{ins.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-blue-600">Công ty đóng:</span>
                          <span className="ml-1 font-medium">{ins.employer_rate}%</span>
                        </div>
                        <div>
                          <span className="text-blue-600">Nhân viên đóng:</span>
                          <span className="ml-1 font-medium">{ins.employee_rate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Allowances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-600" />
                  Phụ cấp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {benefits?.allowances && Object.entries(benefits.allowances).map(([key, allowance]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                      <span className="text-green-800">{allowance.description}</span>
                      {allowance.amount > 0 && (
                        <span className="font-medium text-green-700">
                          {new Intl.NumberFormat('vi-VN').format(allowance.amount)}đ
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bonus */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PartyPopper className="h-5 w-5 text-amber-600" />
                  Thưởng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {benefits?.bonus && Object.entries(benefits.bonus).map(([key, bonus]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <span className="text-amber-800">{bonus.description}</span>
                      {bonus.amount > 0 && (
                        <span className="font-medium text-amber-700">
                          {new Intl.NumberFormat('vi-VN').format(bonus.amount)}đ
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Others */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="h-5 w-5 text-purple-600" />
                  Phúc lợi khác
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {benefits?.others && Object.entries(benefits.others).map(([key, item]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
                      <span className="text-purple-800">{item.description}</span>
                      {item.amount > 0 && (
                        <span className="font-medium text-purple-700">
                          {new Intl.NumberFormat('vi-VN').format(item.amount)}đ
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-teal-600" />
                Chế độ Nghỉ phép (theo Bộ luật Lao động 2019)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefits?.leave && Object.entries(benefits.leave).map(([key, leave]) => {
                  const icons = {
                    annual_leave: Plane,
                    sick_leave: Stethoscope,
                    maternity_leave: Baby,
                    paternity_leave: Baby,
                    wedding_leave: Heart,
                    funeral_leave: Heart,
                  };
                  const IconComponent = icons[key] || Coffee;
                  const colors = {
                    annual_leave: 'bg-blue-100 text-blue-700 border-blue-200',
                    sick_leave: 'bg-red-100 text-red-700 border-red-200',
                    maternity_leave: 'bg-pink-100 text-pink-700 border-pink-200',
                    paternity_leave: 'bg-cyan-100 text-cyan-700 border-cyan-200',
                    wedding_leave: 'bg-rose-100 text-rose-700 border-rose-200',
                    funeral_leave: 'bg-slate-100 text-slate-700 border-slate-200',
                  };
                  const colorClass = colors[key] || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <div key={key} className={`p-4 rounded-xl border ${colorClass}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{leave.description}</p>
                          <p className="text-2xl font-bold">{leave.days} ngày</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Lưu ý theo Luật Lao động</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Phép năm tăng 1 ngày sau mỗi 5 năm làm việc (Điều 113)</li>
                  <li>Ngày nghỉ lễ, Tết được nghỉ nguyên lương (Điều 112)</li>
                  <li>Nghỉ ốm được BHXH chi trả 75% lương (có xác nhận y tế)</li>
                  <li>Phép năm chưa sử dụng được chuyển sang năm sau hoặc thanh toán</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Policies */}
      {culture?.policies?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Chính sách Công ty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {culture.policies.map((policy, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                  <p className="font-medium text-indigo-800 mb-2">{policy.name}</p>
                  <p className="text-sm text-indigo-700">{policy.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
