/**
 * SecondaryTransferPage.jsx  
 * Hồ sơ sang nhượng — Checklist pháp lý, tiến độ, upload tài liệu
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2, Circle, Clock, Download, FileText,
  ShieldCheck, Upload, User, AlertTriangle, Info,
} from 'lucide-react';

const DOCUMENT_CHECKLIST = [
  {
    group: '📄 Hồ sơ bên BÁN',
    items: [
      { id: 'seller_id', label: 'CCCD/CMND bên bán (công chứng)', status: 'done', required: true },
      { id: 'seller_reg', label: 'Hộ khẩu/Đăng ký thường trú bên bán', status: 'done', required: true },
      { id: 'marriage_cert', label: 'Giấy đăng ký kết hôn / xác nhận độc thân', status: 'missing', required: true },
      { id: 'pink_book', label: 'Sổ hồng/Sổ đỏ gốc', status: 'done', required: true },
      { id: 'no_debt', label: 'Xác nhận không nợ phí quản lý', status: 'pending', required: true },
    ],
  },
  {
    group: '📄 Hồ sơ bên MUA',
    items: [
      { id: 'buyer_id', label: 'CCCD/CMND bên mua (công chứng)', status: 'done', required: true },
      { id: 'buyer_reg', label: 'Hộ khẩu/Đăng ký thường trú bên mua', status: 'done', required: true },
      { id: 'buyer_marriage', label: 'Giấy đăng ký kết hôn bên mua', status: 'done', required: false },
    ],
  },
  {
    group: '📋 Hợp đồng & Tài liệu giao dịch',
    items: [
      { id: 'deposit_contract', label: 'Hợp đồng đặt cọc (có công chứng)', status: 'done', required: true },
      { id: 'transfer_contract', label: 'Hợp đồng chuyển nhượng (mẫu)', status: 'missing', required: true },
      { id: 'tax_declare', label: 'Tờ khai lệ phí trước bạ', status: 'missing', required: true },
      { id: 'commission_agreement', label: 'Biên bản thỏa thuận hoa hồng', status: 'pending', required: true },
    ],
  },
];

const STATUS_CONFIG = {
  done: { label: 'Đã có', icon: CheckCircle2, color: 'text-emerald-500' },
  missing: { label: 'Chưa có', icon: AlertTriangle, color: 'text-rose-500' },
  pending: { label: 'Đang lấy', icon: Clock, color: 'text-amber-500' },
};

const TIMELINE = [
  { label: 'Xem căn & đồng ý giá', date: '2026-04-10', done: true },
  { label: 'Kiểm tra pháp lý và sổ hồng', date: '2026-04-12', done: true },
  { label: 'Ký HĐ đặt cọc 300 triệu', date: '2026-04-14', done: true },
  { label: 'Thu thập đủ hồ sơ sang nhượng', date: '2026-04-19', done: false, current: true },
  { label: 'Đặt lịch công chứng', date: '2026-04-20', done: false },
  { label: 'Công chứng & sang tên sổ hồng', date: '2026-04-22', done: false },
  { label: 'Bàn giao căn hộ & nhận HH', date: '2026-04-25', done: false },
];

export default function SecondaryTransferPage() {
  const [checklist, setChecklist] = useState(DOCUMENT_CHECKLIST);

  const allItems = DOCUMENT_CHECKLIST.flatMap(g => g.items);
  const doneCount = allItems.filter(i => i.status === 'done').length;
  const missingRequired = allItems.filter(i => i.required && i.status === 'missing').length;
  const progress = Math.round((doneCount / allItems.length) * 100);

  return (
    <div className="space-y-5 max-w-3xl" data-testid="secondary-transfer-page">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500" /> Hồ sơ sang nhượng
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Theo dõi và hoàn thiện bộ hồ sơ pháp lý chuyển nhượng</p>
      </div>

      {/* Deal summary */}
      <Card className="border-[#316585]/20 bg-[#316585]/5">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-bold text-slate-900">3PN Masteri Thảo Điền T3A-22</p>
              <div className="flex gap-3 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> Bán: Anh Thanh Long</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> Mua: Chị Thu Hà</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#316585]">7.800 triệu</p>
              <p className="text-xs text-emerald-600">HH: 93.6 triệu</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Hồ sơ hoàn thiện</span>
              <span className={progress === 100 ? 'text-emerald-600 font-bold' : 'font-medium'}>{progress}%</span>
            </div>
            <div className="w-full bg-white rounded-full h-2 border border-slate-200">
              <div
                className="bg-[#316585] h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {missingRequired > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              Còn {missingRequired} tài liệu bắt buộc chưa có — chưa đặt lịch công chứng được
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#316585]" /> Tiến trình giao dịch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {TIMELINE.map((step, i) => (
              <div key={i} className="flex gap-3 relative">
                {/* Line */}
                {i < TIMELINE.length - 1 && (
                  <div className={`absolute left-3.5 top-7 w-0.5 h-6 ${step.done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                )}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-0.5 ${
                  step.done ? 'bg-emerald-500' : step.current ? 'bg-[#316585] ring-4 ring-[#316585]/20' : 'bg-slate-200'
                }`}>
                  {step.done
                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                    : step.current
                      ? <Circle className="w-3 h-3 text-white fill-white" />
                      : <Circle className="w-3 h-3 text-slate-400" />
                  }
                </div>
                <div className="flex-1 pb-5">
                  <p className={`text-sm font-medium ${step.current ? 'text-[#316585]' : step.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {step.label}
                    {step.current && <Badge className="ml-2 bg-[#316585] text-white text-[10px]">Đang làm</Badge>}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(step.date).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document checklist */}
      {DOCUMENT_CHECKLIST.map(group => (
        <Card key={group.group}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{group.group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.items.map(item => {
              const st = STATUS_CONFIG[item.status];
              const Icon = st.icon;
              return (
                <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${st.color} flex-shrink-0`} />
                    <div>
                      <p className="text-sm text-slate-800">{item.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${st.color}`}>{st.label}</span>
                        {item.required && <span className="text-[10px] text-slate-400">• Bắt buộc</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {item.status !== 'done' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <Upload className="w-3 h-3" /> Tải lên
                      </Button>
                    )}
                    {item.status === 'done' && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-slate-400">
                        <Download className="w-3 h-3" /> Xem
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* CTA */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="gap-2"
          disabled={missingRequired > 0}
        >
          <Calendar className="w-4 h-4" />
          Đặt lịch công chứng
        </Button>
        <Button className="bg-[#316585] hover:bg-[#264f68] gap-2">
          <Download className="w-4 h-4" />
          Xuất hồ sơ PDF
        </Button>
      </div>
    </div>
  );
}
