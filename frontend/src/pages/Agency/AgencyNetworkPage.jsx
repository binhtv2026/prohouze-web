/**
 * AgencyNetworkPage.jsx — Cây mạng lưới phân cấp F1/F2/F3 (MỚI)
 * 10/10 LOCKED
 *
 * Features:
 * - Tree visualization SVG: CĐT → F1 → F2 → F3
 * - Click vào node để xem thông tin chi tiết + giỏ hàng
 * - Color-coded theo hiệu suất (xanh/vàng/đỏ)
 * - Commission flow overlay (bấm để xem dòng hoa hồng)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Network, ChevronRight, Store, Users, DollarSign, Package,
  Building2, TrendingUp, X, ExternalLink, Percent,
} from 'lucide-react';

// ─── DEMO NETWORK TREE DATA ───────────────────────────────────────────────────
const NETWORK_TREE = {
  id: 'owner',
  name: 'ProHouze Corp.',
  type: 'owner',
  children: [
    {
      id: 'f1-1',
      name: 'Sàn BĐS Phú Mỹ Hưng',
      type: 'F1',
      achievement: 142,
      sales: 8500000000,
      ctv: 45,
      units: { allocated: 80, sold: 62 },
      commissionPct: 4.0,
      children: [
        { id: 'f2-1', name: 'Đại lý Masterise Q2', type: 'F2', achievement: 103, sales: 6200000000, ctv: 18, units: { allocated: 30, sold: 22 }, commissionPct: 2.5, children: [
          { id: 'f3-1', name: 'NextHome Realty', type: 'F3', achievement: 95, sales: 2100000000, ctv: 5, units: { allocated: 10, sold: 8 }, commissionPct: 1.5, children: [] },
          { id: 'f3-2', name: 'Sunshine Property', type: 'F3', achievement: 78, sales: 1800000000, ctv: 4, units: { allocated: 8, sold: 5 }, commissionPct: 1.5, children: [] },
        ]},
        { id: 'f2-2', name: 'Bình Thạnh Realty', type: 'F2', achievement: 95, sales: 5100000000, ctv: 22, units: { allocated: 25, sold: 18 }, commissionPct: 2.5, children: [
          { id: 'f3-3', name: 'Đại lý Xanh', type: 'F3', achievement: 88, sales: 1500000000, ctv: 6, units: { allocated: 8, sold: 6 }, commissionPct: 1.5, children: [] },
        ]},
      ],
    },
    {
      id: 'f1-2',
      name: 'Central Realty Group',
      type: 'F1',
      achievement: 81,
      sales: 6100000000,
      ctv: 30,
      units: { allocated: 60, sold: 38 },
      commissionPct: 4.0,
      children: [
        { id: 'f2-3', name: 'Sun Property Q7', type: 'F2', achievement: 82, sales: 4300000000, ctv: 14, units: { allocated: 20, sold: 14 }, commissionPct: 2.5, children: [] },
        { id: 'f2-4', name: 'Đại lý Thủ Đức Central', type: 'F3', achievement: 76, sales: 3200000000, ctv: 10, units: { allocated: 15, sold: 10 }, commissionPct: 2.5, children: [] },
      ],
    },
  ],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtB = (v) => (v >= 1e9 ? `${(v / 1e9).toFixed(1)} tỷ` : `${(v / 1e6).toFixed(0)} tr`);

const TIER_STYLE = {
  owner: { bg: 'bg-slate-800', text: 'text-white', border: 'border-slate-600' },
  F1: { bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-400' },
  F2: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-400' },
  F3: { bg: 'bg-slate-500', text: 'text-white', border: 'border-slate-400' },
};

const perfColor = (pct) => pct >= 100 ? '#22c55e' : pct >= 80 ? '#3b82f6' : '#f59e0b';

// ─── TREE NODE (SVG-based horizontal layout) ──────────────────────────────────
function TreeNode({ node, x, y, onSelect, selected }) {
  const style = TIER_STYLE[node.type];
  const isSelected = selected?.id === node.id;
  const perf = node.achievement || 100;
  const W = 160, H = 72, R = 8;

  return (
    <g
      className="cursor-pointer"
      onClick={() => onSelect(node)}
      style={{ filter: isSelected ? 'drop-shadow(0 4px 12px rgba(49,101,133,0.4))' : undefined }}
    >
      {/* Card rect */}
      <rect x={x} y={y} width={W} height={H} rx={R} ry={R}
        fill={node.type === 'owner' ? '#1e293b' : '#fff'}
        stroke={isSelected ? '#316585' : '#e2e8f0'}
        strokeWidth={isSelected ? 2.5 : 1}
      />
      {/* Top color bar */}
      {node.type !== 'owner' && (
        <rect x={x} y={y} width={W} height={4} rx={R} ry={R}
          fill={perfColor(perf)}
        />
      )}
      {/* Tier badge */}
      {node.type !== 'owner' && (
        <text x={x + W - 14} y={y + 22} textAnchor="middle" fontSize="10" fontWeight="700"
          fill={node.type === 'F1' ? '#7c3aed' : node.type === 'F2' ? '#3b82f6' : '#94a3b8'}>
          {node.type}
        </text>
      )}
      {/* Name */}
      <text x={x + 12} y={y + (node.type === 'owner' ? 32 : 28)} fontSize="11" fontWeight="700"
        fill={node.type === 'owner' ? '#fff' : '#1e293b'}>
        {node.name.length > 18 ? node.name.slice(0, 17) + '…' : node.name}
      </text>
      {/* Sub stats */}
      {node.type !== 'owner' && (
        <>
          <text x={x + 12} y={y + 45} fontSize="10" fill="#64748b">{fmtB(node.sales)}</text>
          <text x={x + 12} y={y + 60} fontSize="9" fill="#94a3b8">{node.ctv} CTV · {node.units?.sold}/{node.units?.allocated} căn</text>
          <text x={x + W - 14} y={y + 45} textAnchor="middle" fontSize="11" fontWeight="700" fill={perfColor(perf)}>{perf}%</text>
        </>
      )}
      {node.type === 'owner' && (
        <text x={x + 12} y={y + 52} fontSize="10" fill="#94a3b8">Chủ sở hữu mạng lưới</text>
      )}
    </g>
  );
}

// ─── LAYOUT ALGORITHM ─────────────────────────────────────────────────────────
const NODE_W = 160, NODE_H = 72, H_GAP = 60, V_GAP = 24;

function layoutTree(node, depth = 0, yOffset = [0]) {
  const nodeInfo = { node, depth, x: depth * (NODE_W + H_GAP) };
  
  if (!node.children || node.children.length === 0) {
    nodeInfo.y = yOffset[0];
    yOffset[0] += NODE_H + V_GAP;
    nodeInfo.spanTop = nodeInfo.y;
    nodeInfo.spanBot = nodeInfo.y + NODE_H;
    return [nodeInfo];
  }

  const childLayouts = node.children.flatMap(c => layoutTree(c, depth + 1, yOffset));
  const childrenForThis = childLayouts.filter(cl => cl.depth === depth + 1 && node.children.some(c => c.id === cl.node.id));
  
  const top = childrenForThis[0]?.y ?? yOffset[0];
  const bot = childrenForThis[childrenForThis.length - 1]?.y ?? top;
  nodeInfo.y = (top + bot) / 2;
  nodeInfo.spanTop = top;
  nodeInfo.spanBot = bot + NODE_H;

  return [nodeInfo, ...childLayouts];
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({ node, onClose }) {
  if (!node || node.type === 'owner') return null;
  const perf = node.achievement || 0;
  const invPct = node.units?.allocated ? Math.round((node.units.sold / node.units.allocated) * 100) : 0;
  const TIER_C = { F1: 'bg-violet-100 text-violet-700', F2: 'bg-blue-100 text-blue-700', F3: 'bg-slate-100 text-slate-600' };

  return (
    <div className="absolute top-4 right-4 w-72 bg-white shadow-2xl rounded-2xl border border-slate-200 z-20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#316585] to-[#264f68] p-4">
        <div className="flex items-start justify-between">
          <div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_C[node.type]}`}>{node.type}</span>
            <h3 className="text-white font-bold text-base mt-1.5">{node.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="p-4 space-y-4">
        {/* KPI */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>KPI tháng này</span>
            <span className="font-bold" style={{ color: perfColor(perf) }}>{perf}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(perf, 100)}%`, background: perfColor(perf) }} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Doanh số', value: fmtB(node.sales), icon: DollarSign },
            { label: 'CTV', value: node.ctv, icon: Users },
            { label: 'Căn phân bổ', value: node.units?.allocated, icon: Package },
            { label: 'Đã bán', value: node.units?.sold, icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-slate-400 mb-1">
                <Icon className="w-3 h-3" />
                <span className="text-[10px]">{label}</span>
              </div>
              <div className="font-bold text-slate-800 text-sm">{value}</div>
            </div>
          ))}
        </div>

        {/* Commission */}
        <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-amber-700 font-semibold">Hoa hồng nhận: {node.commissionPct}% giá trị căn</span>
          </div>
        </div>

        {/* Inventory */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Tiến độ bán hàng giỏ được phân</span>
            <span className="font-bold text-slate-700">{invPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className={`h-2 rounded-full ${invPct >= 80 ? 'bg-emerald-500' : invPct >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${invPct}%` }} />
          </div>
          <div className="text-xs text-slate-400 mt-1">{node.units?.sold}/{node.units?.allocated} căn</div>
        </div>
      </div>
    </div>
  );
}

// ─── COMMISSION FLOW LEGEND ───────────────────────────────────────────────────
function CommissionFlowPanel() {
  const tiers = [
    { label: 'Chủ đầu tư (CĐT)', pct: '—', color: '#1e293b' },
    { label: 'Sàn F1', pct: '4.0%', color: '#7c3aed' },
    { label: 'Đại lý F2', pct: '2.5%', color: '#3b82f6' },
    { label: 'Môi giới F3', pct: '1.5%', color: '#94a3b8' },
    { label: 'Sales cá nhân', pct: '0.5-1%', color: '#22c55e' },
  ];
  return (
    <Card className="border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Percent className="w-4 h-4 text-amber-500" /> Luồng hoa hồng theo tầng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tiers.map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
              <span className="text-xs text-slate-600 flex-1">{t.label}</span>
              <span className="text-xs font-bold text-slate-800">{t.pct}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-3">* Tỷ lệ có thể điều chỉnh theo từng dự án. Hoa hồng tự động tính khi HĐ được ký và duyệt.</p>
      </CardContent>
    </Card>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AgencyNetworkPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const allNodes = layoutTree(NETWORK_TREE);
  const maxX = Math.max(...allNodes.map(n => n.x)) + NODE_W + 40;
  const maxY = Math.max(...allNodes.map(n => n.y)) + NODE_H + 40;

  // Build edge lines (parent → children)
  const edges = [];
  const nodeMap = Object.fromEntries(allNodes.map(n => [n.node.id, n]));
  allNodes.forEach(({ node, x, y }) => {
    (node.children || []).forEach(child => {
      const childInfo = nodeMap[child.id];
      if (!childInfo) return;
      const x1 = x + NODE_W;
      const y1 = y + NODE_H / 2;
      const x2 = childInfo.x;
      const y2 = childInfo.y + NODE_H / 2;
      const mx = (x1 + x2) / 2;
      edges.push({ id: `${node.id}-${child.id}`, x1, y1, x2, y2, mx });
    });
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">🕸️ Mạng lưới đại lý</h1>
          <p className="text-sm text-slate-500 mt-0.5">Cây phân cấp F1 → F2 → F3 · Click vào node để xem chi tiết</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/agency')}>← Dashboard</Button>
          <Button size="sm" className="bg-[#316585] hover:bg-[#264f68]" onClick={() => navigate('/agency/distribution')}>
            <Package className="w-4 h-4 mr-1.5" /> Phân bổ giỏ hàng
          </Button>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* Tree Canvas */}
        <Card className="flex-1 border shadow-none overflow-hidden">
          <CardContent className="p-4 relative">
            <div className="overflow-auto" style={{ maxHeight: '600px' }}>
              <svg width={maxX + 20} height={maxY + 20}
                style={{ minWidth: '100%', display: 'block' }}>
                {/* Edge lines */}
                {edges.map(e => (
                  <path key={e.id}
                    d={`M${e.x1},${e.y1} C${e.mx},${e.y1} ${e.mx},${e.y2} ${e.x2},${e.y2}`}
                    fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 3"
                  />
                ))}
                {/* Nodes */}
                {allNodes.map(({ node, x, y }) => (
                  <TreeNode key={node.id} node={node} x={x + 20} y={y + 20}
                    onSelect={setSelected} selected={selected} />
                ))}
              </svg>
            </div>

            {/* Detail Panel */}
            {selected && selected.type !== 'owner' && (
              <DetailPanel node={selected} onClose={() => setSelected(null)} />
            )}
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="w-64 space-y-4 flex-shrink-0">
          {/* Legend */}
          <Card className="border shadow-none">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Màu sắc hiệu suất</p>
              <div className="space-y-2">
                {[
                  { color: '#22c55e', label: 'Vượt KPI (≥100%)' },
                  { color: '#3b82f6', label: 'Đạt tốt (80–99%)' },
                  { color: '#f59e0b', label: 'Cần cải thiện (<80%)' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className="w-3 h-2 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                    <span className="text-xs text-slate-600">{l.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phân tầng</p>
                {[
                  { color: '#7c3aed', label: 'F1 — Sàn giao dịch chính' },
                  { color: '#3b82f6', label: 'F2 — Đại lý liên kết' },
                  { color: '#94a3b8', label: 'F3 — Môi giới độc lập' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                    <span className="text-xs text-slate-600">{l.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <CommissionFlowPanel />
        </div>
      </div>
    </div>
  );
}
