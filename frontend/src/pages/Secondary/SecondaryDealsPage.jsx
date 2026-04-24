/**
 * SecondaryDealsPage.jsx
 * Pipeline giao dịch thứ cấp — Theo dõi trạng thái từng deal mua/bán lại
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight, Calendar, CheckCircle2, Circle, Clock,
  FileText, PlusCircle, RefreshCw, User, Wallet,
} from 'lucide-react';

const PIPELINE_STAGES = [
  { key: 'interest', label: 'Khảo sát', color: 'bg-blue-500', lightBg: 'bg-blue-50' },
  { key: 'negotiation', label: 'Thương lượng', color: 'bg-amber-500', lightBg: 'bg-amber-50' },
  { key: 'deposit', label: 'Đặt cọc', color: 'bg-violet-500', lightBg: 'bg-violet-50' },
  { key: 'notary', label: 'Công chứng', color: 'bg-rose-500', lightBg: 'bg-rose-50' },
  { key: 'completed', label: 'Hoàn tất', color: 'bg-emerald-500', lightBg: 'bg-emerald-50' },
];

const DEALS = [
  {
    id: 1,
    property: '2PN Vinhomes Grand Park B12-18',
    buyer: 'Anh Minh Tuấn', seller: 'Chị Ngọc Hà',
    price: 3200, commission: 48,
    stage: 'negotiation', progress: 45,
    nextAction: 'Gặp mặt 2 bên thứ 6 tới để chốt giá',
    nextDate: '2026-04-22',
    tasks: [
      { label: 'Xem căn lần 1', done: true },
      { label: 'Kiểm tra pháp lý', done: true },
      { label: 'Thương lượng giá', done: false },
      { label: 'Đặt cọc', done: false },
      { label: 'Công chứng sang nhượng', done: false },
    ],
  },
  {
    id: 2,
    property: '3PN Masteri Thảo Điền T3A-22',
    buyer: 'Chị Thu Hà', seller: 'Anh Thanh Long',
    price: 7800, commission: 93.6,
    stage: 'notary', progress: 85,
    nextAction: 'Lịch công chứng: 10:00 sáng thứ 3, Phòng CC Q2',
    nextDate: '2026-04-20',
    tasks: [
      { label: 'Xem căn lần 1', done: true },
      { label: 'Kiểm tra pháp lý', done: true },
      { label: 'Thương lượng giá', done: true },
      { label: 'Đặt cọc 300 triệu', done: true },
      { label: 'Công chứng sang nhượng', done: false },
    ],
  },
  {
    id: 3,
    property: '1PN Celadon City Ruby5-08',
    buyer: 'Anh Phi Long', seller: 'Chị Mai Trang',
    price: 2100, commission: 31.5,
    stage: 'interest', progress: 20,
    nextAction: 'Đặt lịch xem căn lần 2 cho khách',
    nextDate: '2026-04-19',
    tasks: [
      { label: 'Xem căn lần 1', done: true },
      { label: 'Kiểm tra pháp lý', done: false },
      { label: 'Thương lượng giá', done: false },
      { label: 'Đặt cọc', done: false },
      { label: 'Công chứng sang nhượng', done: false },
    ],
  },
];

const stageConfig = Object.fromEntries(PIPELINE_STAGES.map(s => [s.key, s]));

function DealCard({ deal }) {
  const [expanded, setExpanded] = useState(false);
  const stage = stageConfig[deal.stage];
  const doneCount = deal.tasks.filter(t => t.done).length;

  return (
    <Card className={`border-l-4 ${stage.color.replace('bg-', 'border-')} hover:shadow-md transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm leading-tight">{deal.property}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3" /> Mua: {deal.buyer}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3" /> Bán: {deal.seller}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <Badge className={`${stage.lightBg} ${stage.color.replace('bg-', 'text-')} border-0 text-xs`}>
              {stage.label}
            </Badge>
            <p className="text-xs text-slate-400 mt-1">{deal.progress}%</p>
          </div>
        </div>

        {/* Price + Commission */}
        <div className="flex items-center gap-4 mb-3">
          <div>
            <span className="text-xs text-slate-400">Giá sang nhượng</span>
            <p className="font-bold text-slate-900">{deal.price.toLocaleString('vi-VN')} triệu</p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Hoa hồng</span>
            <p className="font-bold text-emerald-600">{deal.commission.toLocaleString('vi-VN')} triệu</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`${stage.color} h-2 rounded-full transition-all`}
              style={{ width: `${deal.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{doneCount}/{deal.tasks.length} bước hoàn thành</span>
            <span>{deal.progress}%</span>
          </div>
        </div>

        {/* Next action */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3">
          <div className="flex items-start gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800">{deal.nextAction}</p>
              <p className="text-[10px] text-amber-600 mt-0.5">{new Date(deal.nextDate).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </div>

        {/* Tasks (expandable) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[#316585] hover:underline w-full text-left"
        >
          {expanded ? '▲ Ẩn các bước' : '▼ Xem tiến độ các bước'}
        </button>
        {expanded && (
          <div className="mt-2 space-y-1.5">
            {deal.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2">
                {task.done
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                <span className={`text-xs ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Link to={`/secondary/deals/${deal.id}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full h-7 text-xs">Chi tiết</Button>
          </Link>
          <Link to={`/secondary/transfer?dealId=${deal.id}`} className="flex-1">
            <Button size="sm" className="w-full h-7 text-xs bg-[#316585] hover:bg-[#264f68] gap-1">
              <FileText className="w-3 h-3" /> Hồ sơ sang nhượng
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SecondaryDealsPage() {
  const [stageFilter, setStageFilter] = useState('all');

  const filtered = DEALS.filter(d => stageFilter === 'all' || d.stage === stageFilter);
  const totalCommission = DEALS.reduce((s, d) => s + d.commission, 0);

  return (
    <div className="space-y-5" data-testid="secondary-deals-page">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-violet-500" /> Deal đang xử lý
          </h1>
          <p className="text-sm text-slate-500">Theo dõi tiến trình từng giao dịch mua/bán lại</p>
        </div>
        <Link to="/secondary/deals/new">
          <Button size="sm" className="bg-[#316585] hover:bg-[#264f68] gap-1.5 text-sm">
            <PlusCircle className="w-4 h-4" /> Tạo deal mới
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-violet-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-violet-600">{DEALS.length}</div>
            <div className="text-xs text-slate-400">Deal đang chạy</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {DEALS.filter(d => d.stage === 'notary').length}
            </div>
            <div className="text-xs text-slate-400">Chờ công chứng</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{totalCommission.toFixed(1)} tr</div>
            <div className="text-xs text-slate-400">Tổng HH chờ nhận</div>
          </CardContent>
        </Card>
      </div>

      {/* Stage filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={stageFilter === 'all' ? 'default' : 'outline'}
          className={stageFilter === 'all' ? 'bg-[#316585] hover:bg-[#264f68]' : ''}
          onClick={() => setStageFilter('all')}
        >Tất cả</Button>
        {PIPELINE_STAGES.map(s => (
          <Button
            key={s.key} size="sm"
            variant={stageFilter === s.key ? 'default' : 'outline'}
            className={stageFilter === s.key ? `${s.color} hover:opacity-90 border-0` : ''}
            onClick={() => setStageFilter(s.key)}
          >{s.label}</Button>
        ))}
      </div>

      {/* Deals */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map(deal => <DealCard key={deal.id} deal={deal} />)}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Không có deal nào ở giai đoạn này</p>
        </div>
      )}
    </div>
  );
}
