import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Building2,
  Home,
  MapPin,
  ArrowRight,
} from 'lucide-react';

export default function TrendsPage() {
  return (
    <div className="space-y-6" data-testid="trends-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Xu hướng BĐS 2026</h1>
        <p className="text-slate-500 text-sm mt-1">Dự báo và xu hướng thị trường bất động sản</p>
      </div>

      {/* Key Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: 'Căn hộ cao cấp',
            icon: Building2,
            trend: 'up',
            prediction: '+15-20%',
            description: 'Nhu cầu tăng mạnh tại các đô thị lớn, đặc biệt phân khúc 3-5 tỷ. Người mua ưu tiên tiện ích và vị trí.',
            factors: ['Thu nhập tầng lớp trung lưu tăng', 'Lãi suất cho vay giảm', 'Nguồn cung hạn chế'],
          },
          {
            title: 'Nhà phố liền kề',
            icon: Home,
            trend: 'stable',
            prediction: '+5-8%',
            description: 'Ổn định với nhu cầu từ gia đình trẻ. Giá từ 4-8 tỷ vẫn được ưa chuộng.',
            factors: ['Nhu cầu ở thực ổn định', 'Khả năng sinh lời từ cho thuê', 'Tính thanh khoản cao'],
          },
          {
            title: 'BĐS nghỉ dưỡng',
            icon: MapPin,
            trend: 'down',
            prediction: '-3-5%',
            description: 'Giảm nhẹ do bão hòa nguồn cung tại các vùng ven biển. Cần thận trọng với phân khúc này.',
            factors: ['Nguồn cung dư thừa', 'Pháp lý phức tạp', 'Du lịch nội địa chững lại'],
          },
          {
            title: 'Đất nền vùng ven',
            icon: MapPin,
            trend: 'up',
            prediction: '+10-15%',
            description: 'Tiềm năng tăng giá cao nhờ hạ tầng phát triển. Bình Dương, Long An, Đồng Nai là điểm nóng.',
            factors: ['Hạ tầng giao thông cải thiện', 'Giá vẫn hợp lý', 'Xu hướng dịch chuyển ra ngoại thành'],
          },
          {
            title: 'BĐS công nghiệp',
            icon: Building2,
            trend: 'up',
            prediction: '+20-25%',
            description: 'Tăng mạnh nhờ làn sóng FDI. Nhà xưởng, kho bãi có nhu cầu cao.',
            factors: ['FDI tăng mạnh', 'Chuỗi cung ứng dịch chuyển', 'Chính sách hỗ trợ'],
          },
          {
            title: 'Văn phòng cho thuê',
            icon: Building2,
            trend: 'stable',
            prediction: '+3-5%',
            description: 'Ổn định với xu hướng hybrid work. Văn phòng hạng A tại CBD vẫn giữ giá.',
            factors: ['Hybrid work phổ biến', 'Nhu cầu từ startup', 'Co-working space tăng'],
          },
        ].map((item, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.trend === 'up' ? 'bg-green-100' : 
                    item.trend === 'down' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <item.icon className={`h-5 w-5 ${
                      item.trend === 'up' ? 'text-green-600' : 
                      item.trend === 'down' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <Badge className={
                  item.trend === 'up' ? 'bg-green-100 text-green-700' :
                  item.trend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }>
                  {item.prediction}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mb-4">{item.description}</p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase">Yếu tố chính:</p>
                {item.factors.map((factor, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs text-slate-600">
                    <ArrowRight className="h-3 w-3 text-blue-500" />
                    {factor}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expert Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Nhận định chuyên gia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                expert: 'TS. Nguyễn Văn Đính',
                role: 'Chủ tịch Hội Môi giới BĐS Việt Nam',
                insight: 'Năm 2026 sẽ là năm phục hồi của thị trường BĐS. Các chính sách hỗ trợ từ Chính phủ và lãi suất giảm sẽ tạo động lực tăng trưởng.',
              },
              {
                expert: 'Bà Dương Thùy Dung',
                role: 'Giám đốc CBRE Việt Nam',
                insight: 'Phân khúc căn hộ trung cấp 2-4 tỷ sẽ dẫn dắt thị trường. Người mua ưu tiên sản phẩm có pháp lý rõ ràng và tiện ích đầy đủ.',
              },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-semibold text-blue-600">{item.expert.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{item.expert}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 italic">"{item.insight}"</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
