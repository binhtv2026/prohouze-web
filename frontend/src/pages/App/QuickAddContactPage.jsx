/**
 * QuickAddContactPage.jsx — Thêm khách hàng nhanh (Mobile-native)
 * Route: /crm/contacts/new
 * API: customersAPI.create() → /v2/customers
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Phone, Mail, MapPin, Check, Loader2, ChevronDown } from 'lucide-react';
import { customersAPI } from '@/lib/crmApi';
import { toast } from 'sonner';
import { getProvinces, getWardsByProvince } from '@/data/vietnamLocations';

const SOURCES = [
  { value: 'facebook',   label: '📘 Facebook' },
  { value: 'zalo',       label: '💬 Zalo' },
  { value: 'referral',   label: '🤝 Giới thiệu' },
  { value: 'direct',     label: '🚶 Trực tiếp' },
  { value: 'website',    label: '🌐 Website' },
  { value: 'tiktok',     label: '🎵 TikTok' },
  { value: 'other',      label: '📌 Khác' },
];

const INTENTS = [
  { value: 'hot',    label: '🔥 Nóng — Quan tâm cao, cần gặp ngay' },
  { value: 'warm',   label: '😊 Ấm — Đang tìm hiểu thêm' },
  { value: 'cold',   label: '❄️ Lạnh — Mới tiếp cận lần đầu' },
];

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Input({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
      <input
        {...props}
        className={`w-full border border-slate-200 rounded-xl py-3 pr-4 text-sm text-slate-800 placeholder:text-slate-400 bg-white outline-none focus:border-[#316585] focus:ring-2 focus:ring-[#316585]/15 transition-all ${Icon ? 'pl-10' : 'pl-4'}`}
      />
    </div>
  );
}

export default function QuickAddContactPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name:     '',
    primary_phone: '',
    primary_email: '',
    source_channel:'zalo',
    intent_level:  'warm',
    note_summary:  '',
    province_code: '',
    ward_code:     '',
  });

  const provinces = useMemo(() => getProvinces(), []);
  const wards     = useMemo(() => form.province_code ? getWardsByProvince(form.province_code) : [], [form.province_code]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setProvince = (code) => setForm(f => ({ ...f, province_code: code, ward_code: '' }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast.error('Vui lòng nhập họ tên'); return; }
    if (!form.primary_phone.trim()) { toast.error('Vui lòng nhập số điện thoại'); return; }

    setSaving(true);
    try {
      await customersAPI.create({
        full_name:      form.full_name.trim(),
        primary_phone:  form.primary_phone.trim(),
        primary_email:  form.primary_email.trim() || null,
        source_channel: form.source_channel,
        intent_level:   form.intent_level,
        note_summary:   form.note_summary.trim() || null,
        customer_stage: 'new',
        province_code:  form.province_code || null,
        ward_code:      form.ward_code || null,
      });
      toast.success('Đã thêm khách hàng thành công!');
      navigate('/crm/contacts');
    } catch (err) {
      toast.error('Lỗi khi lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#16314f] via-[#264f68] to-[#316585] px-4 pt-12 pb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-95">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Thêm khách hàng</h1>
            <p className="text-white/60 text-xs">Nhập thông tin cơ bản để bắt đầu</p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-4">

        {/* Thông tin cơ bản */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
          <p className="text-xs font-bold text-[#316585] uppercase tracking-wider">Thông tin cơ bản</p>

          <Field label="Họ và tên" required>
            <Input
              icon={User}
              type="text"
              placeholder="Vd: Nguyễn Thị Lan"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              autoFocus
            />
          </Field>

          <Field label="Số điện thoại" required>
            <Input
              icon={Phone}
              type="tel"
              placeholder="0912 345 678"
              value={form.primary_phone}
              onChange={e => set('primary_phone', e.target.value)}
              inputMode="tel"
            />
          </Field>

          <Field label="Email" hint="Không bắt buộc">
            <Input
              icon={Mail}
              type="email"
              placeholder="example@email.com"
              value={form.primary_email}
              onChange={e => set('primary_email', e.target.value)}
              inputMode="email"
            />
          </Field>
        </div>

        {/* Địa chỉ (2 cấp: Tỉnh/Thành → Xã/Phường) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <p className="text-xs font-bold text-[#316585] uppercase tracking-wider">Địa chỉ <span className="text-slate-400 font-normal normal-case">(không có quận/huyện)</span></p>

          <Field label="Tỉnh / Thành phố">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={form.province_code}
                onChange={e => setProvince(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-8 text-sm text-slate-800 bg-white outline-none focus:border-[#316585] focus:ring-2 focus:ring-[#316585]/15 appearance-none"
              >
                <option value="">-- Chọn tỉnh/thành --</option>
                {provinces.map(p => (
                  <option key={p.ma} value={p.ma}>{p.ten}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </Field>

          <Field label="Xã / Phường">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={form.ward_code}
                onChange={e => set('ward_code', e.target.value)}
                disabled={!form.province_code}
                className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-8 text-sm text-slate-800 bg-white outline-none focus:border-[#316585] focus:ring-2 focus:ring-[#316585]/15 appearance-none disabled:opacity-50"
              >
                <option value="">-- Chọn xã/phường --</option>
                {wards.map(w => (
                  <option key={w.ma} value={w.ma}>{w.ten}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </Field>
        </div>

        {/* Nguồn khách */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-[#316585] uppercase tracking-wider mb-3">Nguồn khách</p>
          <div className="grid grid-cols-4 gap-2">
            {SOURCES.map(s => (
              <button
                key={s.value}
                onClick={() => set('source_channel', s.value)}
                className={`text-[11px] font-semibold py-2 px-1 rounded-xl border transition-all ${
                  form.source_channel === s.value
                    ? 'bg-[#316585] text-white border-[#316585]'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mức độ quan tâm */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
          <p className="text-xs font-bold text-[#316585] uppercase tracking-wider mb-1">Mức độ quan tâm</p>
          {INTENTS.map(i => (
            <button
              key={i.value}
              onClick={() => set('intent_level', i.value)}
              className={`w-full text-left text-sm py-2.5 px-3 rounded-xl border flex items-center gap-2 transition-all ${
                form.intent_level === i.value
                  ? 'bg-[#316585]/8 border-[#316585] font-semibold text-[#316585]'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {form.intent_level === i.value && (
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span>{i.label}</span>
            </button>
          ))}
        </div>

        {/* Ghi chú */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-[#316585] uppercase tracking-wider mb-3">Ghi chú nhanh</p>
          <textarea
            placeholder="Khách quan tâm sản phẩm nào, nhu cầu cụ thể, thông tin thêm..."
            value={form.note_summary}
            onChange={e => set('note_summary', e.target.value)}
            rows={3}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder:text-slate-400 bg-white outline-none focus:border-[#316585] focus:ring-2 focus:ring-[#316585]/15 resize-none transition-all"
          />
        </div>
      </div>

      {/* SUBMIT BUTTON — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-8 bg-white/95 backdrop-blur border-t border-slate-100 z-40">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-[#316585] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...</>
          ) : (
            <><Check className="w-5 h-5" /> Lưu khách hàng</>
          )}
        </button>
      </div>
    </div>
  );
}
