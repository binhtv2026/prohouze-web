/**
 * MobileContractSignPage.jsx — Chữ ký điện tử (Base Sign)
 * Ký hợp đồng đặt cọc ngay trên app · Lịch sử hợp đồng
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, CheckCircle2, Clock, Download,
  PenLine, XCircle, Eye, ChevronRight, Shield, Stamp,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const PENDING_CONTRACTS = [
  {
    id: 'hd-001',
    type: 'Hợp đồng đặt cọc',
    project: 'NOBU Residences Danang',
    unit: 'S1-08B · Tầng 8 · 2PN',
    customer: 'Nguyễn Văn An',
    value: '3.800.000.000đ',
    deposit: '380.000.000đ',
    date: '20/04/2026',
    status: 'pending',
    parties: ['Nguyễn Văn An (Bên mua)', 'ANKAPU Real Estate (Sàn phân phối)'],
  },
  {
    id: 'hd-002',
    type: 'Hợp đồng mua bán',
    project: 'Sun Symphony Residence',
    unit: 'T3-12A · Tầng 12 · 3PN',
    customer: 'Lê Thị Bích',
    value: '6.200.000.000đ',
    deposit: '620.000.000đ',
    date: '19/04/2026',
    status: 'pending',
    parties: ['Lê Thị Bích (Bên mua)', 'ANKAPU Real Estate (Sàn phân phối)'],
  },
];

const SIGNED_CONTRACTS = [
  {
    id: 'hd-003',
    type: 'Hợp đồng đặt cọc',
    project: 'NOBU Residences',
    unit: 'S3-12C · Tầng 12',
    customer: 'Trần Văn Nam',
    value: '4.100.000.000đ',
    signedAt: '22/03/2026 · 14:32',
    status: 'signed',
  },
  {
    id: 'hd-004',
    type: 'Hợp đồng đặt cọc',
    project: 'Sun Cosmo',
    unit: 'C1-07B · Tầng 7',
    customer: 'Phạm Minh Tuấn',
    value: '3.400.000.000đ',
    signedAt: '15/03/2026 · 10:15',
    status: 'signed',
  },
];

function SignaturePad({ onSigned, onClear }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);

  const startDraw = (e) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasSig) setHasSig(true);
  };

  const endDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    onClear?.();
  };

  return (
    <div className="border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-500">✍️ Ký tên tại đây</p>
        <button onClick={clear} className="text-xs text-rose-500 font-semibold flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Xoá
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={340}
        height={120}
        className="w-full touch-none cursor-crosshair"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      {hasSig && (
        <div className="px-3 pb-3">
          <button
            onClick={() => { onSigned(true); }}
            className="w-full py-3 bg-[#316585] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <Stamp className="w-4 h-4" />
            Xác nhận chữ ký
          </button>
        </div>
      )}
    </div>
  );
}

function ContractCard({ contract, onSign }) {
  const [expanded, setExpanded] = useState(false);
  const [signed, setSigned] = useState(false);

  const handleSigned = () => {
    setSigned(true);
    toast.success('🖊️ Hợp đồng đã được ký thành công!');
    setExpanded(false);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm mb-3 overflow-hidden border ${signed ? 'border-emerald-200' : 'border-slate-100'}`}>
      <button className="w-full text-left p-4" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 ${signed ? 'bg-emerald-100' : 'bg-blue-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <FileText className={`w-5 h-5 ${signed ? 'text-emerald-600' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-500 mb-0.5">{contract.type}</p>
            <p className="text-sm font-bold text-slate-800">{contract.project}</p>
            <p className="text-xs text-slate-500">{contract.unit} · {contract.customer}</p>
          </div>
          {signed ? (
            <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Đã ký
            </span>
          ) : (
            <span className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-700 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> Chờ ký
            </span>
          )}
        </div>
      </button>

      {expanded && !signed && (
        <div className="border-t border-slate-100 px-4 pb-4">
          {/* Contract info */}
          <div className="bg-slate-50 rounded-xl p-3 my-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Giá trị hợp đồng</span>
              <span className="font-bold text-slate-800">{contract.value}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Số tiền đặt cọc</span>
              <span className="font-bold text-emerald-600">{contract.deposit}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Ngày lập</span>
              <span className="font-medium text-slate-700">{contract.date}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700">Vui lòng đọc kỹ hợp đồng trước khi ký. Chữ ký điện tử có giá trị pháp lý.</p>
          </div>

          <SignaturePad onSigned={handleSigned} onClear={() => {}} />
        </div>
      )}
    </div>
  );
}

export default function MobileContractSignPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      <div className="bg-white border-b border-slate-100 px-4 pt-12 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Chữ ký điện tử</h1>
            <p className="text-xs text-slate-500">{PENDING_CONTRACTS.length} hợp đồng chờ ký</p>
          </div>
        </div>

        <div className="flex gap-2">
          {[['pending','⏳ Chờ ký'], ['signed','✅ Đã ký']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-full text-xs font-semibold ${tab === k ? 'bg-[#316585] text-white' : 'bg-slate-100 text-slate-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Security badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
          <Shield className="w-4 h-4 text-emerald-600" />
          <p className="text-xs text-emerald-700 font-medium">Bảo mật SSL · Tuân thủ Nghị định 130/2018/NĐ-CP về chữ ký điện tử</p>
        </div>

        {tab === 'pending' && (
          <>
            {PENDING_CONTRACTS.map(c => (
              <ContractCard key={c.id} contract={c} />
            ))}
          </>
        )}

        {tab === 'signed' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {SIGNED_CONTRACTS.map((c, i) => (
              <div key={c.id} className="flex items-start gap-3 px-4 py-4 border-b border-slate-50 last:border-0">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">{c.type}</p>
                  <p className="text-sm font-semibold text-slate-800">{c.project} · {c.unit}</p>
                  <p className="text-xs text-slate-500">{c.customer} · {c.value}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">✅ Ký lúc {c.signedAt}</p>
                </div>
                <button className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Download className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="h-24" />
      </div>
    </div>
  );
}
