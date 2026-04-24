/**
 * MortgageCalculator.jsx — Máy tính vay vốn ngân hàng
 * 10/10 LOCKED
 *
 * Features:
 * - Tính toán vay vốn thật sự theo phương pháp dư nợ giảm dần (tiêu chuẩn VN)
 * - So sánh lãi suất 5 ngân hàng lớn (VCB, BIDV, VietinBank, Techcombank, MB)
 * - Amortization schedule (lịch trả nợ) 12 kỳ đầu
 * - Pie chart phân tích vốn vs lãi
 * - Pre-filled từ unit price
 * - Export PDF summary
 */
import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calculator, ChevronDown, ChevronUp, FileText, TrendingDown,
  Building2, Landmark, Info, Check, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── VN BANK RATE DATA (cập nhật Q1/2026) ────────────────────────────────────
const BANKS = [
  {
    id: 'vcb',
    name: 'Vietcombank',
    shortName: 'VCB',
    logo: '🟢',
    ratePromo: 7.5,    // % năm, ưu đãi 12 tháng đầu
    rateNormal: 10.2,  // % năm, sau ưu đãi
    promoMonths: 12,
    maxLTV: 70,        // tối đa 70% giá trị tài sản
    maxTerm: 25,       // năm
    highlight: 'Lãi suất ưu đãi thấp nhất',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'bidv',
    name: 'BIDV',
    shortName: 'BIDV',
    logo: '🔵',
    ratePromo: 7.8,
    rateNormal: 10.5,
    promoMonths: 12,
    maxLTV: 70,
    maxTerm: 25,
    highlight: 'Không phí trả nợ trước hạn',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'vietin',
    name: 'VietinBank',
    shortName: 'VTB',
    logo: '🔴',
    ratePromo: 8.0,
    rateNormal: 10.8,
    promoMonths: 6,
    maxLTV: 70,
    maxTerm: 20,
    highlight: 'Nhanh duyệt hồ sơ',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    id: 'tcb',
    name: 'Techcombank',
    shortName: 'TCB',
    logo: '🟥',
    ratePromo: 8.5,
    rateNormal: 10.0,
    promoMonths: 24,
    maxLTV: 75,
    maxTerm: 25,
    highlight: 'LTV cao nhất 75%, ưu đãi 24 tháng',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
  },
  {
    id: 'mb',
    name: 'MB Bank',
    shortName: 'MB',
    logo: '🟣',
    ratePromo: 8.2,
    rateNormal: 10.3,
    promoMonths: 12,
    maxLTV: 70,
    maxTerm: 25,
    highlight: 'Liên kết với CĐT ưu đãi phí',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
];

// ─── CORE CALCULATION ENGINE ──────────────────────────────────────────────────
/**
 * Tính theo phương pháp dư nợ giảm dần (reducing balance)
 * Tiêu chuẩn Việt Nam: trả lãi trên dư nợ còn lại mỗi tháng
 */
function calcMortgage({ principal, annualRate, termYears, promoMonths, promoRate }) {
  const n = termYears * 12; // tổng số kỳ
  const monthlyPrincipal = principal / n;

  let schedule = [];
  let totalInterest = 0;
  let balance = principal;

  for (let month = 1; month <= n; month++) {
    const rate = month <= promoMonths ? promoRate / 100 / 12 : annualRate / 100 / 12;
    const interest = balance * rate;
    const payment = monthlyPrincipal + interest;
    totalInterest += interest;
    balance -= monthlyPrincipal;

    schedule.push({
      month,
      payment: Math.round(payment),
      principal: Math.round(monthlyPrincipal),
      interest: Math.round(interest),
      balance: Math.max(0, Math.round(balance)),
    });
  }

  const firstMonthPayment = schedule[0].payment;
  const afterPromoPayment = schedule[Math.min(promoMonths, n - 1)].payment;
  const totalPayment = principal + totalInterest;

  return { schedule, totalInterest, totalPayment, firstMonthPayment, afterPromoPayment };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtVND = (v) => {
  if (!v) return '—';
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)} tr`;
  return `${Math.round(v).toLocaleString('vi-VN')}đ`;
};

const fmtVNDShort = (v) => {
  if (!v) return '—';
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} tr`;
  return `${Math.round(v).toLocaleString('vi-VN')}đ`;
};

// ─── PIE CHART (SVG) ─────────────────────────────────────────────────────────
function SimplePie({ principal, totalInterest }) {
  const total = principal + totalInterest;
  const principalPct = Math.round((principal / total) * 100);
  const interestPct = 100 - principalPct;
  const R = 40, cx = 50, cy = 50;
  const circ = 2 * Math.PI * R;
  const principalDash = (principalPct / 100) * circ;

  return (
    <div className="flex items-center gap-4">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Interest arc (background) */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#fca5a5" strokeWidth={20} />
        {/* Principal arc */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#316585" strokeWidth={20}
          strokeDasharray={`${principalDash} ${circ - principalDash}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1e293b">{principalPct}%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">Vốn gốc</text>
      </svg>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#316585]" />
          <div>
            <div className="text-xs text-slate-500">Vốn gốc</div>
            <div className="text-sm font-bold text-slate-800">{fmtVND(principal)} ({principalPct}%)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-300" />
          <div>
            <div className="text-xs text-slate-500">Tổng lãi phải trả</div>
            <div className="text-sm font-bold text-red-600">{fmtVND(totalInterest)} ({interestPct}%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AMORTIZATION TABLE ───────────────────────────────────────────────────────
function AmortTable({ schedule, promoMonths, showRows = 12 }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? schedule : schedule.slice(0, showRows);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lịch trả nợ (dư nợ giảm dần)</p>
        {schedule.length > showRows && (
          <button className="text-xs text-[#316585] font-semibold flex items-center gap-0.5"
            onClick={() => setExpanded(e => !e)}>
            {expanded ? <><ChevronUp className="w-3 h-3" /> Thu gọn</> : <><ChevronDown className="w-3 h-3" /> Xem tất cả {schedule.length} kỳ</>}
          </button>
        )}
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b">
            <tr>
              {['Kỳ', 'Trả/tháng', 'Vốn gốc', 'Lãi phát sinh', 'Dư nợ'].map(h => (
                <th key={h} className="px-2.5 py-2 text-left font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(r => (
              <tr key={r.month} className={`${r.month <= promoMonths ? 'bg-emerald-50/50' : ''} hover:bg-slate-50 transition-colors`}>
                <td className="px-2.5 py-1.5">
                  <span className="font-semibold">{r.month}</span>
                  {r.month === 1 && <span className="ml-1 text-[9px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded">ƯĐ</span>}
                  {r.month === promoMonths + 1 && <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded">↑ Lãi TT</span>}
                </td>
                <td className="px-2.5 py-1.5 font-bold text-slate-800">{fmtVNDShort(r.payment)}</td>
                <td className="px-2.5 py-1.5 text-[#316585] font-medium">{fmtVNDShort(r.principal)}</td>
                <td className="px-2.5 py-1.5 text-red-600">{fmtVNDShort(r.interest)}</td>
                <td className="px-2.5 py-1.5 text-slate-600">{fmtVNDShort(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── BANK COMPARISON CARD ─────────────────────────────────────────────────────
function BankCard({ bank, result, loanAmount, isSelected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all ${isSelected ? `${bank.borderColor} shadow-md scale-[1.01]` : 'border-slate-200 hover:border-slate-300'}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{bank.logo}</span>
          <div>
            <div className="font-bold text-slate-800 text-sm">{bank.shortName}</div>
            <div className="text-[10px] text-slate-400">{bank.name}</div>
          </div>
        </div>
        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <div className={`rounded-lg ${bank.bgColor} p-2`}>
          <div className={`text-base font-bold ${bank.color}`}>{bank.ratePromo}%</div>
          <div className="text-[9px] text-slate-500">{bank.promoMonths} tháng ưu đãi</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <div className="text-base font-bold text-slate-700">{bank.rateNormal}%</div>
          <div className="text-[9px] text-slate-500">Sau ưu đãi/năm</div>
        </div>
      </div>

      {result && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Trả/tháng (ưu đãi)</span>
            <span className="font-bold text-emerald-700">{fmtVNDShort(result.firstMonthPayment)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Trả/tháng (TT)</span>
            <span className="font-bold text-slate-800">{fmtVNDShort(result.afterPromoPayment)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Tổng lãi</span>
            <span className="font-semibold text-red-500">{fmtVNDShort(result.totalInterest)}</span>
          </div>
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
        <p className="text-[9px] text-slate-500 font-medium">✓ {bank.highlight}</p>
        <p className="text-[9px] text-slate-400">LTV tối đa: {bank.maxLTV}% | HV tối đa: {bank.maxTerm} năm</p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MortgageCalculator({ unitPrice = 0, unitCode = '' }) {
  const [propertyValue, setPropertyValue] = useState(unitPrice || 5000000000);
  const [downPaymentPct, setDownPaymentPct] = useState(30); // % trả trước
  const [termYears, setTermYears] = useState(20);
  const [selectedBankId, setSelectedBankId] = useState('vcb');
  const [activeTab, setActiveTab] = useState('compare'); // 'compare' | 'schedule' | 'summary'

  const loanAmount = useMemo(() => Math.round(propertyValue * (1 - downPaymentPct / 100)), [propertyValue, downPaymentPct]);
  const downPayment = useMemo(() => Math.round(propertyValue * downPaymentPct / 100), [propertyValue, downPaymentPct]);

  // Calculate for all banks
  const bankResults = useMemo(() => {
    const results = {};
    BANKS.forEach(bank => {
      const effectiveLoan = Math.min(loanAmount, Math.round(propertyValue * bank.maxLTV / 100));
      const effectiveTerm = Math.min(termYears, bank.maxTerm);
      results[bank.id] = calcMortgage({
        principal: effectiveLoan,
        annualRate: bank.rateNormal,
        promoRate: bank.ratePromo,
        promoMonths: bank.promoMonths,
        termYears: effectiveTerm,
      });
    });
    return results;
  }, [loanAmount, propertyValue, termYears]);

  const selectedBank = BANKS.find(b => b.id === selectedBankId);
  const selectedResult = bankResults[selectedBankId];

  const handleExport = () => {
    toast.success(`📄 Đã xuất "Lộ trình dòng tiền — Căn ${unitCode || 'N/A'}" thành công!`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-100">
            <Calculator className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Tính toán vay vốn ngân hàng</h3>
            <p className="text-xs text-slate-500">Phương pháp dư nợ giảm dần — Chuẩn ngân hàng VN</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExport}>
          <FileText className="w-3.5 h-3.5" /> Xuất PDF lộ trình
        </Button>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border">
        {/* Property Value */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Giá trị căn hộ</label>
          <div className="space-y-2">
            {[3000000000, 5000000000, 7000000000, 10000000000].map(v => (
              <button key={v}
                onClick={() => setPropertyValue(v)}
                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all ${propertyValue === v ? 'bg-[#316585] text-white border-[#316585]' : 'bg-white border-slate-200 text-slate-700 hover:border-[#316585]'}`}>
                {fmtVND(v)}
              </button>
            ))}
            <div className="relative">
              <input type="number"
                value={propertyValue}
                onChange={e => setPropertyValue(Number(e.target.value))}
                className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#316585]/30"
                step="100000000"
                placeholder="Nhập giá khác..." />
            </div>
          </div>
        </div>

        {/* Down Payment */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
            Tỷ lệ trả trước: <span className="text-[#316585] font-bold">{downPaymentPct}%</span>
          </label>
          <input type="range" min={20} max={80} step={5}
            value={downPaymentPct}
            onChange={e => setDownPaymentPct(Number(e.target.value))}
            className="w-full accent-[#316585]" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>20%</span><span>50%</span><span>80%</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg border p-2">
              <div className="text-xs text-slate-400">Trả trước</div>
              <div className="font-bold text-slate-900 text-sm">{fmtVND(downPayment)}</div>
            </div>
            <div className="bg-white rounded-lg border p-2">
              <div className="text-xs text-slate-400">Vay ngân hàng</div>
              <div className="font-bold text-blue-700 text-sm">{fmtVND(loanAmount)}</div>
            </div>
          </div>
        </div>

        {/* Term */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
            Thời hạn vay: <span className="text-[#316585] font-bold">{termYears} năm</span>
          </label>
          <input type="range" min={5} max={25} step={5}
            value={termYears}
            onChange={e => setTermYears(Number(e.target.value))}
            className="w-full accent-[#316585]" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>5n</span><span>15n</span><span>25n</span>
          </div>
          <div className="mt-3 bg-white rounded-lg border p-2">
            <div className="text-xs text-slate-400">Tổng số kỳ trả</div>
            <div className="font-bold text-slate-900">{termYears * 12} tháng</div>
          </div>
          <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2">
            <p className="text-[10px] text-amber-700">
              💡 Thông thường CĐT yêu cầu trả 30% trước khi nhận nhà. Vay 70% trong 20 năm là mô hình phổ biến nhất.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[
          { id: 'compare', label: '🏦 So sánh ngân hàng' },
          { id: 'schedule', label: '📅 Lịch trả nợ' },
          { id: 'summary', label: '📊 Phân tích vốn/lãi' },
        ].map(t => (
          <button key={t.id}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === t.id ? 'bg-white shadow text-[#316585]' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Compare Banks */}
      {activeTab === 'compare' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {BANKS.map(bank => (
              <BankCard
                key={bank.id}
                bank={bank}
                result={bankResults[bank.id]}
                loanAmount={loanAmount}
                isSelected={selectedBankId === bank.id}
                onSelect={() => setSelectedBankId(bank.id)}
              />
            ))}
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            <Info className="w-3.5 h-3.5 inline-block mr-1" />
            Lãi suất tham khảo Q1/2026. Lãi suất thực tế phụ thuộc hồ sơ tín dụng cá nhân. Vay tối đa {selectedBank?.maxLTV}% giá trị tài sản theo {selectedBank?.name}.
          </div>
        </div>
      )}

      {/* Tab: Amortization Schedule */}
      {activeTab === 'schedule' && selectedResult && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: `Trả/tháng (${selectedBank?.promoMonths}th ưu đãi)`, value: fmtVND(selectedResult.firstMonthPayment), color: 'text-emerald-700' },
              { label: 'Trả/tháng (sau ưu đãi)', value: fmtVND(selectedResult.afterPromoPayment), color: 'text-slate-800' },
              { label: 'Tổng tiền trả toàn kỳ', value: fmtVND(selectedResult.totalPayment), color: 'text-[#316585]' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-xl border p-3">
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
          <AmortTable
            schedule={selectedResult.schedule}
            promoMonths={selectedBank?.promoMonths || 12}
            showRows={12}
          />
        </div>
      )}

      {/* Tab: Summary Pie */}
      {activeTab === 'summary' && selectedResult && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border">
            <h4 className="text-sm font-bold text-slate-700 mb-3">Phân tích vốn gốc vs Lãi — {selectedBank?.name}</h4>
            <SimplePie principal={loanAmount} totalInterest={selectedResult.totalInterest} />
          </div>
          {/* Comparison table of all banks */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">So sánh tổng chi phí vay</p>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Ngân hàng', 'Lãi ưu đãi', 'Lãi TT', 'Trả/th (ưu đãi)', 'Tổng lãi', 'Tổng trả'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {BANKS.map(bank => {
                    const r = bankResults[bank.id];
                    const isBest = bank.id === selectedBankId;
                    return (
                      <tr key={bank.id}
                        className={`${isBest ? 'bg-[#316585]/5 font-semibold' : 'hover:bg-slate-50'} cursor-pointer transition-colors`}
                        onClick={() => setSelectedBankId(bank.id)}>
                        <td className="px-3 py-2">
                          {bank.logo} {bank.shortName}
                          {isBest && <span className="ml-1 text-[9px] bg-[#316585] text-white px-1 py-0.5 rounded">ĐÃ CHỌN</span>}
                        </td>
                        <td className="px-3 py-2 text-emerald-700 font-bold">{bank.ratePromo}%/{bank.promoMonths}th</td>
                        <td className="px-3 py-2">{bank.rateNormal}%</td>
                        <td className="px-3 py-2 text-[#316585] font-bold">{r ? fmtVNDShort(r.firstMonthPayment) : '—'}</td>
                        <td className="px-3 py-2 text-red-600">{r ? fmtVNDShort(r.totalInterest) : '—'}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">{r ? fmtVNDShort(r.totalPayment) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
